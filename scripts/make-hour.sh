#!/usr/bin/env bash
# Render the 3-minute loop once, then repeat it 20 times without re-encoding.
# Uses the ffmpeg that ships with Remotion, so nothing else needs installing.
set -euo pipefail
cd "$(dirname "$0")/.."
LOOPS="${HOUR_LOOPS:-20}"
mkdir -p out
if [ ! -f out/farm-loop.mp4 ]; then
  npx remotion render FarmLoop out/farm-loop.mp4 --codec h264 --crf 18
fi
npx remotion ffmpeg -y -stream_loop "$((LOOPS - 1))" -i out/farm-loop.mp4 -c copy out/farm-hour.mp4
echo "wrote out/farm-hour.mp4 ($LOOPS loops)"
