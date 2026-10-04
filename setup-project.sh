#!/usr/bin/env bash
# Adapts this template project to a new extension: renames the extension
# directory, UUID, schema, settings and all references.
#
# Usage:
#   ./setup-project.sh <slug> <name> <description> [github-url] [developer]
#
#   slug        short lowercase identifier (letters, digits, dashes),
#               used in the UUID and GSettings schema, e.g. "my-extension"
#   name        human-readable extension name, e.g. "My Extension"
#   description one-line description for metadata.json and README
#   github-url  optional repository URL (default: generated from the slug)
#   developer   optional developer name (default: "Romain Loutrel")
#
# Example:
#   ./setup-project.sh nvme-monitor "NVMe Monitor" \
#       "Monitors NVMe device status in the top bar"
#
# After running, review the diff (git diff), remove sampleModule.js /
# sampleModule.test.js if not needed, and commit.
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ] || [ $# -lt 3 ]; then
    grep '^#' "$0" | sed 's/^# \?//'
    exit 1
fi

SLUG="$1"
NAME="$2"
DESCRIPTION="$3"
URL="${4:-https://github.com/rloutrel/gnome-extension-${SLUG}}"
DEVELOPER="${5:-Romain Loutrel}"

if ! [[ "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    echo "error: slug must be lowercase letters, digits and dashes: $SLUG" >&2
    exit 1
fi

OLD_UUID="template@rloutrel.github.com"
NEW_UUID="${SLUG}@rloutrel.github.com"
OLD_SCHEMA="org.gnome.shell.extensions.template"
NEW_SCHEMA="org.gnome.shell.extensions.${SLUG}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -d "$ROOT/$NEW_UUID" ]; then
    echo "error: target directory already exists: $NEW_UUID" >&2
    exit 1
fi

echo "→ Adapting template to: $NAME ($NEW_UUID)"

# 1. Rename the extension directory and schema file.
mv "$ROOT/$OLD_UUID" "$ROOT/$NEW_UUID"
mv "$ROOT/$NEW_UUID/schemas/${OLD_SCHEMA}.gschema.xml" \
   "$ROOT/$NEW_UUID/schemas/${NEW_SCHEMA}.gschema.xml"

# 2. Rewrite UUID, schema, URL and project references in every text file.
#    CamelCase identifier (nvme-monitor -> NvmeMonitor) for class names and
#    the log prefix.
CAMEL=$(echo "$SLUG" | sed -r 's/(^|-)([a-z])/\U\2/g')
FILES=$(find "$ROOT" -type f \
    -not -path '*/.git/*' -not -path '*/node_modules/*' \
    -not -name 'setup-project.sh' -not -name 'LICENSE')
for f in $FILES; do
    sed -i \
        -e "s|$OLD_UUID|$NEW_UUID|g" \
        -e "s|$OLD_SCHEMA|$NEW_SCHEMA|g" \
        -e "s|https://github.com/rloutrel/gnome-extension-template|$URL|g" \
        -e "s|rloutrel_gnome-extension-template|rloutrel_gnome-extension-${SLUG}|g" \
        -e "s|gnome-extension-template|gnome-extension-${SLUG}|g" \
        -e "s|sonar.projectName=.*|sonar.projectName=gnome-extension-${SLUG}|" \
        "$f"
done

# 3. CamelCase class names, log prefix and CSS classes live only in the
#    extension sources; rewrite them there (avoiding eslint.config.js where
#    "template strings" is a rule message).
EXT_FILES=$(find "$ROOT/$NEW_UUID" "$ROOT/test" -type f \
    \( -name '*.js' -o -name '*.css' \))
for f in $EXT_FILES; do
    sed -i \
        -e "s|Template|$CAMEL|g" \
        -e "s|template-|${SLUG}-|g" \
        "$f"
done

# 4. metadata.json: name, description and developer cannot be derived by
#    sed safely (JSON quoting), so patch them with a dedicated pass.
META="$ROOT/$NEW_UUID/metadata.json"
python3 - "$META" "$NAME" "$DESCRIPTION" "$URL" "$DEVELOPER" <<'EOF'
import json
import sys

path, name, description, url, developer = sys.argv[1:6]
with open(path, encoding='utf-8') as fh:
    metadata = json.load(fh)
metadata['name'] = name
metadata['description'] = description
metadata['url'] = url
metadata['developer'] = developer
with open(path, 'w', encoding='utf-8') as fh:
    json.dump(metadata, fh, indent=4, ensure_ascii=False)
    fh.write('\n')
EOF

echo "✓ Done."
echo "  Extension directory: $NEW_UUID/"
echo "  Next steps:"
echo "    1. git diff  # review the renaming"
echo "    2. Edit README.md features and extension.js to taste"
echo "    3. Remove ${NEW_UUID}/sampleModule.js and test/sampleModule.test.js if unused"
echo "    4. Commit: git commit -am 'Adapt template to ${SLUG}'"
