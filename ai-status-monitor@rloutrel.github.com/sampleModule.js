// PURE module: zero GJS/GObject imports, unit-tested under plain Node.
// This is the sample pure module demonstrating the template architecture;
// keep domain logic here, never in extension.js / indicator.js (see AGENTS.md).

export function greet(name) {
    return `Hello, ${name}!`;
}
