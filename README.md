# AI Status Monitor

A GNOME Shell extension to follow your AI subscriptions from the top bar:
it polls the public status pages of your AI providers (OpenAI, Anthropic,
Groq, Perplexity, ...) at a configurable interval and shows a color-coded,
normalized status per provider. The panel icon reflects the worst status
observed across the enabled providers.

No API keys, no accounts: the extension only reads public, anonymous status
feeds.

Inspired by [3389ro/ai-status-monitor](https://github.com/3389ro/ai-status-monitor)
and [montanhes/claude-status](https://github.com/montanhes/claude-status).

## Features

- Top-bar icon colored by the worst status across enabled providers
- Dropdown menu with one row per provider and its normalized status
- Clicking a provider opens its status page in the browser
- Configurable poll interval and provider selection in the preferences

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
ai-status-monitor@rloutrel.github.com/
  extension.js       # GNOME Shell entry point: enable/disable lifecycle only
  indicator.js       # Panel indicator: menu construction, polling
  logger.js          # Unified debug/warn/error + notification helpers
  prefs.js           # Preferences window (separate GTK4/Adwaita process)
  providers.js       # PURE: catalog of AI providers with a status feed
  statusModel.js     # PURE: status normalization and aggregation
  statusFetcher.js   # GJS: libsoup fetch of status feeds
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
