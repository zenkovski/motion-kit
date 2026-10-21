#!/usr/bin/env bash
# Create an empty film folder:  bash tools/new_film.sh <slug>
# You write index.html, cues.json and audio.py yourself (see MOTION.md §5 for the contract).
set -euo pipefail
cd "$(dirname "$0")/.."
slug=${1:?slug}
[ -e films/$slug ] && { echo "films/$slug exists"; exit 1; }
mkdir -p films/$slug/assets
printf '# BRIEF — %s\n\n(see PROMO-TASK.md step 3)\n' "$slug" > films/$slug/BRIEF.md
echo "films/$slug created. Write BRIEF.md first, then cues.json, index.html, audio.py."
