#!/usr/bin/env node
// Generates the background lullaby: a soft music-box melody over quiet bass notes,
// in C major pentatonic at 60 bpm, exactly LOOP_SECONDS long so it loops with the video.
// The last bars ring out into silence, so the loop seam falls on a quiet breath.
//
// Writes public/music.wav, then (if Remotion's ffmpeg is available) public/music.mp3.
// Usage: node scripts/make-music.mjs

import {writeFileSync, unlinkSync, existsSync} from 'node:fs';
import {execSync} from 'node:child_process';

const LOOP_SECONDS = 180;
const RATE = 44100;
const BPM = 60; // one beat per second; 3/4 time, 8-bar cycles of 24 s
const BEAT = 60 / BPM;
const CYCLES = 7; // 7 x 24 s = 168 s of tune, then a closing chord rings out

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const N = {C3: 48, F2: 41, G2: 43, A2: 45, C4: 60, D4: 62, E4: 64, G4: 67, A4: 69, C5: 72};

// Chords per bar (root for the bass), two 8-bar variations of the tune.
const BARS = ['C', 'C', 'Am', 'Am', 'F', 'F', 'G', 'G'];
const ROOT = {C: N.C3, Am: N.A2, F: N.F2, G: N.G2};
// Each bar: list of [note, beats]. Beats sum to 3 (a rest is a null note).
const TUNE_A = [
  [[N.E4, 2], [N.G4, 1]],
  [[N.A4, 2], [N.G4, 1]],
  [[N.E4, 2], [N.C4, 1]],
  [[N.D4, 3]],
  [[N.C4, 1], [N.D4, 1], [N.E4, 1]],
  [[N.A4, 2], [N.G4, 1]],
  [[N.E4, 1], [N.D4, 1], [N.E4, 1]],
  [[N.D4, 3]],
];
const TUNE_B = [
  [[N.G4, 1], [N.A4, 1], [N.G4, 1]],
  [[N.E4, 3]],
  [[N.C5, 2], [N.A4, 1]],
  [[N.G4, 3]],
  [[N.A4, 1], [N.G4, 1], [N.E4, 1]],
  [[N.D4, 3]],
  [[N.E4, 1], [N.D4, 1], [N.E4, 1]],
  [[N.D4, 2], [null, 1]],
];

const buf = new Float64Array(LOOP_SECONDS * RATE);

// A struck note: quick attack, exponential decay, a little second harmonic for a music-box sparkle.
const box = (t0, freq, gain, decay = 1.6) => {
  const start = Math.floor(t0 * RATE);
  const len = Math.min(buf.length - start, Math.floor(decay * 4 * RATE));
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / decay);
    const s = Math.sin(2 * Math.PI * freq * t) + 0.18 * Math.sin(4 * Math.PI * freq * t) + 0.05 * Math.sin(6 * Math.PI * freq * t);
    buf[start + i] += gain * env * s;
  }
};
// A bass note: slow attack, long soft decay, pure tone with a whisper of octave.
const bass = (t0, freq, gain, decay = 2.6) => {
  const start = Math.floor(t0 * RATE);
  const len = Math.min(buf.length - start, Math.floor(decay * 3.5 * RATE));
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.08) * Math.exp(-t / decay);
    const s = Math.sin(2 * Math.PI * freq * t) + 0.12 * Math.sin(4 * Math.PI * freq * t);
    buf[start + i] += gain * env * s;
  }
};

let t = 0;
for (let c = 0; c < CYCLES; c++) {
  const tune = c % 2 === 0 ? TUNE_A : TUNE_B;
  for (let b = 0; b < 8; b++) {
    bass(t, midi(ROOT[BARS[b]]), 0.16);
    let beat = 0;
    for (const [note, beats] of tune[b]) {
      if (note !== null) box(t + beat * BEAT, midi(note), 0.22);
      beat += beats;
    }
    t += 3 * BEAT;
  }
}
// Closing chord at 168 s: C major, ringing out.
bass(t, midi(N.C3), 0.16, 4);
box(t, midi(N.C4), 0.18, 4);
box(t + 0.4, midi(N.E4), 0.16, 4);
box(t + 0.8, midi(N.G4), 0.16, 4);

// Gentle room: a short feedback echo, then a long fade so the loop ends in silence.
const delay = Math.floor(0.375 * RATE);
for (let i = delay; i < buf.length; i++) buf[i] += 0.22 * buf[i - delay];
const fadeStart = (LOOP_SECONDS - 4) * RATE;
for (let i = fadeStart; i < buf.length; i++) buf[i] *= 1 - (i - fadeStart) / (buf.length - fadeStart);
for (let i = 0; i < 0.05 * RATE; i++) buf[i] *= i / (0.05 * RATE);

// Normalize to a quiet -14 dBFS peak.
let peak = 0;
for (const v of buf) peak = Math.max(peak, Math.abs(v));
const target = Math.pow(10, -14 / 20);
const g = peak > 0 ? target / peak : 1;

// 16-bit mono WAV.
const pcm = Buffer.alloc(44 + buf.length * 2);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + buf.length * 2, 4); pcm.write('WAVE', 8);
pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(RATE, 24); pcm.writeUInt32LE(RATE * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
pcm.write('data', 36); pcm.writeUInt32LE(buf.length * 2, 40);
for (let i = 0; i < buf.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i] * g)) * 32767), 44 + i * 2);
writeFileSync('public/music.wav', pcm);
console.log('wrote public/music.wav');

try {
  execSync('npx remotion ffmpeg -y -hide_banner -loglevel error -i public/music.wav -c:a libmp3lame -b:a 96k public/music.mp3', {stdio: 'inherit'});
  unlinkSync('public/music.wav');
  console.log('wrote public/music.mp3');
} catch {
  console.log('ffmpeg not available; keeping public/music.wav (rename it in src/FarmLoop.tsx)');
}
if (!existsSync('public/music.mp3') && !existsSync('public/music.wav')) process.exit(1);
