# source me: . tools/env.sh   (sets MG_CHROME for the renderer, PYTHONIOENCODING for audio scripts)
set -a; . "$(dirname "${BASH_SOURCE[0]}")/../.env.motion"; set +a
export PYTHONIOENCODING=utf-8
