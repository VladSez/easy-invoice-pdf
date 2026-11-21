# Screen atlas

An internal map of every screen, state and user flow of the invoice generator, at desktop (1440×900) and phone (390×844) width. It has two views: **Pages**, a gallery of every state grouped by page, and **Flows**, a pan-and-zoom canvas of step-by-step flows with their branches.

## Use it

Everything runs on your machine; Claude Code is optional.

```bash
pnpm atlas
```

Captures every state and builds `output/index.html`, in about three minutes. It starts `pnpm dev` itself when nothing answers on port 3000 and stops it afterwards; when a server is already running there, it reuses it, so make sure that server belongs to this checkout. Set `BASE_URL` to capture another server instead.

```bash
pnpm atlas:view
```

Serves the last capture on http://localhost:6007 and opens it, like Storybook (`ATLAS_PORT` changes the port). `output/index.html` also opens straight from disk.

To recapture one flow, filter by test name (`pnpm atlas --list` prints them):

```bash
pnpm atlas -g "manage a saved seller"
```

The build runs after every capture, including a partial or failed one. A state without a screenshot shows as "Not captured" in the viewer and is listed in the terminal. `output/` is gitignored.

## What changed

Every capture compares each new screenshot with the one it replaces, pixel by pixel, and records when the screen last looked different in `output/history/`. Recapturing an unchanged screen doesn't count: only differences above the JPEG and anti-aliasing noise do (thresholds in `shot-history.ts`).

In the viewer, the **Changes** filter narrows both views:

- **Latest changes**: the screens changed by the most recent capture that changed anything. Pages lists only those; Flows lists only the flows that contain one, with the unchanged steps dimmed.
- **Changed in the last 7 days**: counted back from when the atlas was built.

Shots from the latest changes also carry a **Changed** (or **New**) badge whatever the filter, and the state dialog shows when each one last changed. History starts with the first capture that has it: that capture records a baseline, not a change, so the filter has something to show from the capture after.

## Shared copy (optional)

A copy is published as a private claude.ai artifact, for viewing away from this machine. Claude Code keeps it current with the `update-screen-atlas` skill (`.claude/skills/update-screen-atlas/`), which republishes only the shots listed in `output/publish.json`. Nothing in the local workflow depends on it.

## Files

| File                    | What it holds                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `atlas-model.ts`        | Pages, states and flows. Flows are trees of state ids, and each branch is labelled with the action that leads to it.                                                                                                                                   |
| `capture/*.atlas.ts`    | The Playwright specs that drive the app and call `atlas.snap("<state id>")`. Each state is captured by exactly one test.                                                                                                                               |
| `capture/atlas-test.ts` | The `atlas` fixture: fixed clock (2026-11-02), seeded `Math.random`, popups and analytics off, YouTube blocked, and the snap and PDF-wait helpers. Snaps freeze animations and pause videos on one frame, so an unchanged screen captures identically. |
| `shot-history.ts`       | Compares each new shot with the old one and records when it last changed, in `output/history/`.                                                                                                                                                        |
| `build-atlas.ts`        | Playwright global teardown. It joins the screenshots with the model and writes `output/index.html`.                                                                                                                                                    |
| `view-atlas.ts`         | `pnpm atlas:view`: a static server for `output/` on port 6007.                                                                                                                                                                                         |
| `viewer.html`           | The viewer template. The build inlines the data in place of its placeholder.                                                                                                                                                                           |

## Add a state or a flow

1. Add the state to `APP_STATES` in `atlas-model.ts`, and add it to a flow in `FLOWS` if it is part of one.
2. Capture it in a spec with `await atlas.snap("page/variant")`. The id is type-checked against the model.
3. Run `pnpm atlas -g "<test name>"`.
