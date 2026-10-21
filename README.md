# motion-kit

Tools for making motion-design films **as code** on a Linux VPS (no GPU): a web page draws each frame as a function of time,
headless Chrome captures it, a Python sound toolkit composes music and SFX on the same cues, ffmpeg joins them.

- `MOTION.md` — the craft manual (rules, three styles, techniques, QA). **Read first.**
- The job itself (e.g. `PROMO-TASK.md`) is given to the agent separately.

```bash
bash setup.sh      # one-time: deps, headless Chrome, sound library, smoke test
. tools/env.sh     # every shell
bash tools/new_film.sh my-film
bash tools/render_all.sh films/my-film
```

Built on [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) (MIT): the renderer `harness/render.mjs` (patched for Windows and GPU-less Linux, plus text QA) and the `mgaudio` sound toolkit (fetched by `setup.sh`). Fonts: Google Fonts (OFL / Apache).
