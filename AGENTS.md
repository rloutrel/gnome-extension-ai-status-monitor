# AGENTS.md

Guidance for AI coding agents (Claude, Cursor, Copilot, etc.) working on this
repository. Read this before editing anything.

## Project

Template for a GNOME Shell top-bar extension. Targets **GNOME Shell 50/51**
(ESM imports `resource:///org/gnome/shell/...`).

- UUID / extension dir: `ai-status-monitor@rloutrel.github.com/` (adapt with
  `./setup-project.sh` before starting real development)
- Language: JavaScript (ESM modules)
- Runtime: GJS (SpiderMonkey) inside GNOME Shell
- No build step, no bundler, no transpiler. Source files are shipped as-is.

## Architecture

```text
setup-project.sh     # Adapts the template to a new project (renames the
                     #   extension dir, UUID, schema, references).
test/                # Unit tests (Node built-in runner), repo root.
po/                  # Translation sources (gettext), repo root.
ai-status-monitor@rloutrel.github.com/
  extension.js       # GNOME Shell entry point: enable/disable lifecycle only.
  indicator.js       # Panel indicator: menu construction, polling.
  logger.js          # Unified debug/warn/error + notification helpers.
  prefs.js           # Preferences window (GTK4/Adwaita process).
  sampleModule.js    # PURE: example Node-testable module.
  stylesheet.css     # Theme-aware styles (no hardcoded colors).
  metadata.json      # Shell version, UUID, version.
  schemas/           # GSettings schema.
```

### Pure vs GJS modules

A hard rule: **`sampleModule.js` (and any module you add like it) is a pure
module with zero GJS/GObject imports.** Pure modules run under plain Node and
are unit-tested there. Do **not** add `gi://` or `resource:///` imports to
them. Anything that touches `Gio`, `GLib`, `St`, `Clutter`, `Main`, or
GObject belongs in a GJS-only module (`extension.js`, `indicator.js`,
`prefs.js`, `logger.js`), never in a pure module.

Keep this split when the template grows: move domain logic (parsing,
formatting, state) into pure modules so it stays unit-testable.

### Lifecycle

1. `enable()` builds the `Indicator`, adds it to the panel and loads the
   stylesheet.
2. `disable()` unloads the stylesheet, destroys the indicator and disconnects
   everything. `disable()` must be synchronous and complete.
3. Every signal, timeout, source or resource is cleaned up in the owner that
   created it. Never leak across enable/disable cycles.

### GJS specifics (Shell 50/51)

- ESM imports only: `gi://` for GObject introspection, `resource:///` for
  Shell modules. No legacy `imports.*` for Shell code.
- Shell code (extension/indicator) must never use synchronous file IO; use
  `Gio.File` async APIs.
- GTK4 is for the prefs process only; Shell UI is built with `St`/`Clutter`.
  Never import GTK widgets into `extension.js`.
- Use `console.debug/warn/error` (see `logger.js`), not `log()/logError()`.

## Data flow

`enable()` creates the `Indicator` → `Indicator.setup()` builds the menu and
starts the polling timeout → pure modules provide the data logic →
`disable()` tears everything down.

## Testing

Pure modules are unit-tested with Node's built-in test runner:

```bash
node --test "test/"*.test.js
node test/validateMetadata.js
```

GJS-only modules are syntax-checked only:

```bash
node --check ai-status-monitor@rloutrel.github.com/extension.js
```

CI (`.github/workflows/test.yml`) also runs ESLint with the flat config at
the repo root (`eslint.config.js`), which declares the GJS global set
(`global`, `_`, `C_`, `ngettext`, ...) and GJS restriction rules
(no `log()`, no `Lang.*`, use `constructor()`/`super()`).

## Translations

- Domain: the extension UUID (`gettext-domain` in `metadata.json`).
- List translatable files in `po/POTFILES`; language list in `po/LINGUAS`.
- `.po` files are compiled to `.mo` and packaged only at release time
  (`release.yml`); compiled artifacts are never committed.

## Packaging

`release.yml` runs on `v*` tags: validates the GSettings schema, compiles
translations, zips the extension dir (compiled schemas excluded — Shell
recompiles them since GNOME 45), validates the zip structure and attaches it
to the GitHub release. Do not ship `schemas/gschemas.compiled` or a
`locale/` directory in normal commits.

## Conventions

- 4-space indent, single quotes in JS (`.editorconfig`).
- No comments explaining obvious code; document only non-obvious decisions.
- Keep `enable()`/`disable()` minimal; logic goes to pure modules.
- Follow the existing file naming and test style when adding modules.
