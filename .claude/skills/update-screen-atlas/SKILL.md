---
name: update-screen-atlas
description: Recapture and republish the Screen Atlas, the internal artifact of every screen, state and flow of the invoice generator. Use after any change to what `/`, `/stripe-template` or `/[locale]/about` shows (layout, copy, a dialog, a toast, a new or removed state), or when the user asks to update, refresh or republish the atlas.
---

# Update the Screen Atlas

The atlas is local-first: the user views it with `pnpm atlas:view`, and the steps below also keep their local copy current. Publishing the shared copy is the last step.

The atlas lives at **https://claude.ai/artifact/3RSwfQhmcoDq7aZVSreHak** (private). The source is `scripts/page-atlas/`; read its `README.md` for the file layout. This skill keeps the published copy in step with the app.

## 1. Bring the model in line with the change

The model is `scripts/page-atlas/atlas-model.ts` and the capture specs are `scripts/page-atlas/capture/*.atlas.ts`.

- **New UI** (a dialog, toast, error, branch): add the state to `APP_STATES`, add it to the right flow in `FLOWS` with a `via` label naming the user's action, and screenshot it with `atlas.snap("<page>/<variant>")` in the test that walks that flow. If it starts a new flow, add a test for it.
- **Removed UI**: delete the state and every flow step that uses it. `pnpm type-check:fast` flags any `snap()` call left pointing at it.
- **Changed UI** only: no model change.

Each state is captured by exactly one test, so don't `snap()` a state a second time in another flow.

## 2. Check which dev server the capture will use

`pnpm atlas` starts `pnpm dev` itself when nothing answers on port 3000, and stops it afterwards. When a server is already running there, it reuses it, so first check that the server on port 3000 belongs to this checkout: `lsof -iTCP:3000 -sTCP:LISTEN -n -P`, then compare the process's working directory. If it belongs to another session or worktree, start this checkout's server on another port and prefix the capture with `BASE_URL=http://localhost:<port>`.

## 3. Capture

Capture as little as the change needs. `pnpm atlas --list` prints the test names.

- **A change confined to one flow** (one dialog, one section): capture only that test.

  ```bash
  pnpm atlas -g "manage a saved seller"
  ```

- **A change to anything every screenshot shows** (header, editor shell, PDF preview pane, global styles, fonts, a shared component), or **you are unsure what it touches**: run the full capture, which takes about 3 minutes.

  ```bash
  pnpm atlas
  ```

Run it in the background if it may exceed two minutes. When it finishes:

- Every test passes, and no line reads `Not captured`. A failing test still rebuilds `output/index.html`, so check the terminal, not just the file. Fix a failing selector in the spec rather than publishing a gap.
- Open one or two of the changed screenshots under `scripts/page-atlas/output/shots/` with Read, to confirm they show the change.

## 4. Republish

`scripts/page-atlas/output/publish.json` lists what to send:

| Key       | Contents                            |
| --------- | ----------------------------------- |
| `changed` | Shots written by this run           |
| `removed` | Shots of states that left the model |
| `all`     | Every shot the model uses           |

1. If this conversation has not published or read the atlas yet, read it first: Artifact `action: "read"` with the URL above. A publish without that read is refused.
2. Publish with Artifact:
   - `url`: the atlas URL.
   - `file_path`: the absolute path of `scripts/page-atlas/output/index.html`.
   - `root`: the absolute path of `scripts/page-atlas/output`.
   - `files`: a map from each path in `changed` to itself, and from each path in `removed` to `null`. Files left out keep their published version, so a partial run sends only what it changed.
   - Omit `icon`.

   Send `all` instead of `changed` only when the artifact is missing shots, for example after the URL was recreated. A publish takes at most 255 files, and `all` is 139 today.

3. Tell the user what changed in the atlas (states added, removed or recaptured) and give the URL.

Do not stage or commit anything; see `CLAUDE.md`.
