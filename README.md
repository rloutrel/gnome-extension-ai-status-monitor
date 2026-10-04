# GNOME Shell Extension Template

A modern template for GNOME Shell extensions, based on the structure and
practices of [gnome-extension-nvme-monitor](https://github.com/rloutrel/gnome-extension-nvme-monitor).
It targets the latest GNOME Shell GJS specifics and ships a full pipeline.

## What's in the box

- **GNOME Shell 50/51 skeleton** — ESM imports (`resource:///org/gnome/shell/...`),
  `extension.js` lifecycle only, `indicator.js` (PanelMenu), `prefs.js`
  (GTK4/Adwaita), GSettings schema, theme-aware `stylesheet.css`, `logger.js`.
- **Pure vs GJS module architecture** — domain logic lives in pure modules
  with zero GJS imports, unit-tested under plain Node (see `AGENTS.md`).
- **No build step** — no bundler, no transpiler; source files are shipped as-is.
- **Test pipeline** — Node built-in test runner (no framework, no runtime
  dependencies), ESLint 9 flat config, `node --check` syntax checks,
  `metadata.json` validation, coverage (lcov).
- **CI (GitHub Actions)**:
  - `test.yml` — lint, syntax, metadata validation, unit tests, coverage artifact.
  - `release.yml` — on `v*` tags: schema validation, translation compilation,
    zip packaging, zip structure validation, attach to the GitHub release.
  - `codeql.yml` — CodeQL JavaScript analysis.
  - SonarCloud-ready via `sonar-project.properties`.
- **i18n scaffolding** — `po/` with `POTFILES` and `LINGUAS`, gettext domain
  wired in `metadata.json`, translations compiled at release time.
- **AI-agent tooling** — `AGENTS.md`, `.github/agents/`, `.github/skills/`
  (GJS/GTK4 practices, Shell 50/51 migration, knowledge cache, runtime
  validation) and a GJS runtime MCP server (`.github/mcp/`).
- **`setup-project.sh`** — adapts this template to a new project in one
  command (see below).

## Getting started

Adapt the template to your extension (renames the extension directory, UUID,
GSettings schema, repository references, `metadata.json`, CI, SonarCloud):

```bash
./setup-project.sh <slug> "<Name>" "<Description>" [github-url] [developer]

# Example
./setup-project.sh nvme-monitor "NVMe Monitor" \
    "Monitors NVMe device status in the top bar"
```

Then review `git diff`, adjust `README.md`, `extension.js` and the sample
pure module to taste, and commit.

### Installing (development / manual)

1. Copy or symlink the extension folder into your GNOME Shell extensions
   directory:

   ```bash
   cp -r ai-status-monitor@rloutrel.github.com \
       ~/.local/share/gnome-shell/extensions/
   ```

2. Restart GNOME Shell (`Alt+F2` → `r` → `Enter` on X11, or log out and back
   in on Wayland).
3. Enable the extension:

   ```bash
   gnome-extensions enable ai-status-monitor@rloutrel.github.com
   ```

## Repository layout

```text
setup-project.sh    # Adapts the template to a new project (rename + rewrite)
ai-status-monitor@rloutrel.github.com/
  extension.js       # GNOME Shell entry point: enable/disable lifecycle only
  indicator.js       # Panel indicator: menu construction, polling
  logger.js          # Unified debug/warn/error + notification helpers
  prefs.js           # Preferences window (separate GTK4/Adwaita process)
  sampleModule.js    # PURE: example Node-testable module (remove or replace)
  stylesheet.css     # Theme-aware styles (no hardcoded colors)
  metadata.json      # Shell version, UUID, version
  schemas/           # GSettings schema
po/                  # Translation sources (gettext): POTFILES, LINGUAS
test/                # Unit tests (Node built-in runner) + metadata validation
.github/workflows/   # CI: test, release packaging, CodeQL
.github/agents/      # AI coding-agent definition
.github/skills/      # AI skills (GJS practices, migration, validation)
.github/mcp/         # GJS runtime MCP server
```

## Testing

Pure modules are unit-tested with Node's built-in test runner — no test
framework, no dependencies:

```bash
node --test "test/"*.test.js
```

`extension.js`, `indicator.js` and `prefs.js` run inside GNOME Shell (GJS) and
cannot be unit-tested outside it; check them for syntax only with
`node --check`. The full CI check set is in `.github/workflows/test.yml`.

## License

GPL-2.0 — see [LICENSE](LICENSE).
