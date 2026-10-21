#!/usr/bin/env bash
# Hermes Motion Kit — one-time setup on a Debian/Ubuntu VPS (no GPU needed). Run from the kit folder: bash setup.sh
set -euo pipefail
cd "$(dirname "$0")"
echo "== system packages (ffmpeg, python venv, chrome libs, emoji font)"
sudo apt-get update -y
sudo apt-get install -y ffmpeg python3-venv python3-pip git curl ca-certificates fonts-noto-color-emoji \
  libnss3 libatk-bridge2.0-0 libgbm1 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libpango-1.0-0 libcairo2 libcups2 libdrm2 libxshmfence1 \
  || true
sudo apt-get install -y libasound2t64 2>/dev/null || sudo apt-get install -y libasound2 || true
command -v node >/dev/null || { echo "Node.js >= 20 is required (e.g. curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"; exit 1; }

echo "== node deps + headless chrome"
[ -f package.json ] || echo '{"name":"hermes-motion-kit","private":true,"type":"module","dependencies":{"puppeteer-core":"25.12.0"}}' > package.json
npm install --silent
CHROME_DIR="$PWD/.chrome"
npx --yes @puppeteer/browsers install chrome-headless-shell@stable --path "$CHROME_DIR" >/tmp/chrome-install.log
CHROME=$(find "$CHROME_DIR" -type f -name 'chrome-headless-shell' | head -1)
echo "MG_CHROME=$CHROME" > .env.motion
echo "chrome: $CHROME"

echo "== mg-styles-15 (MIT): sound library + 15 reference films and their style prompts (no videos)"
if [ ! -d .mgsrc/lib/audio ]; then
  rm -rf .mgsrc && git clone --depth 1 --filter=blob:none --sparse https://github.com/Vincentwei1021/mg-styles-15.git .mgsrc
  (cd .mgsrc && git sparse-checkout set lib prompts demos)
fi
rm -rf lib/audio && cp -r .mgsrc/lib/audio lib/audio
cp patches/samples.py lib/audio/mgaudio/samples.py   # fix: upstream index lists samples it does not ship

echo "== python venv"
python3 -m venv .venv
.venv/bin/pip install -q numpy scipy soundfile numba pedalboard pyloudnorm matplotlib pillow fonttools

echo "== smoke test (3 s): soundtrack + stills + full render"
set -a; . ./.env.motion; set +a
export PYTHONIOENCODING=utf-8
.venv/bin/python tests/smoke/audio.py | tail -1
node harness/render.mjs tests/smoke --stills 0.5,2 --scale 0.5 | tail -3
node harness/render.mjs tests/smoke | tail -1
echo "OK. Now read MOTION.md (craft) and the task file you were given."
