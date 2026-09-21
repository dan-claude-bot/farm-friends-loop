#!/usr/bin/env bash
# Replace the audio in out/farm-loop.mp4 with the current music, without re-rendering frames.
# Renders the composition's audio only (seconds), then muxes it over the existing video.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f out/farm-loop.mp4 ] || { echo "out/farm-loop.mp4 not found; run: npm run render:loop"; exit 1; }
npx remotion render FarmLoop out/farm-loop-audio.aac
npx remotion ffmpeg -y -hide_banner -loglevel error \
  -i out/farm-loop.mp4 -i out/farm-loop-audio.aac \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest out/farm-loop-remuxed.mp4
mv out/farm-loop-remuxed.mp4 out/farm-loop.mp4
rm -f out/farm-loop-audio.aac out/farm-hour.mp4
echo "out/farm-loop.mp4 now has the current music; run: npm run hour"
