#!/usr/bin/env bash
# Full pipeline for one film: soundtrack -> QA stills (+contact sheet) -> full render -> Discord-size copy.
#   bash tools/render_all.sh films/<slug> [stills]   e.g. stills="1,3,6,10,15,20,25,29"
set -euo pipefail
cd "$(dirname "$0")/.."
. tools/env.sh
F=${1:?films/<slug>}; ST=${2:-1,3,6,10,15,20,25,29}
.venv/bin/python "$F/audio.py"
rm -rf "$F/out/stills"
node harness/render.mjs "$F" --stills "$ST" --scale 0.5 | tee "$F/out/qa.log" | grep -E "QA|error" || true
.venv/bin/python tools/sheet.py "$F" 8
if grep -q "OUT OF FRAME" "$F/out/qa.log"; then echo "STOP: text out of frame, fix it first (see $F/out/qa.log)"; exit 2; fi
node harness/render.mjs "$F" --workers ${WORKERS:-2}
bash tools/discord_encode.sh "$F/out/video.mp4"
