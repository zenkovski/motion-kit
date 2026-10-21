#!/usr/bin/env bash
# Make a copy that fits Discord's 10 MB upload limit (2-pass x264, bitrate from duration) + a poster frame.
#   bash tools/discord_encode.sh films/<slug>/out/video.mp4 [maxMB=9.5]
set -euo pipefail
IN=${1:?video}; MAX=${2:-9.5}
OUT="${IN%.mp4}-discord.mp4"; POSTER="${IN%.mp4}-poster.jpg"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
VK=$(python3 -c "print(int(($MAX*8192)/$DUR - 160))")   # kbit/s for video, 160k left for audio
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v ${VK}k -pass 1 -an -f mp4 /dev/null
ffmpeg -v error -y -i "$IN" -c:v libx264 -preset slow -b:v ${VK}k -pass 2 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$OUT"
rm -f ffmpeg2pass-0.log ffmpeg2pass-0.log.mbtree
ffmpeg -v error -y -ss $(python3 -c "print($DUR*0.85)") -i "$IN" -frames:v 1 -vf scale=540:-1 -q:v 3 "$POSTER"
ls -la "$OUT" "$POSTER"
