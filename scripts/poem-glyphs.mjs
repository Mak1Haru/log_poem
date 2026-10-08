import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Emit the shared browser script to stdout. --check verifies the saved copy.
// No browser fetches are needed, so decoding also works on local file:// pages.
const logDirectory = new URL("../log/", import.meta.url);
const read = (name) => readFile(new URL(name, logDirectory), "utf8");

function textContent(html) {
  return html.replace(/<[^>]*>/g, "").replace(
    /&#(x[\da-f]+|\d+);/gi,
    (_, value) => String.fromCodePoint(
      value[0].toLowerCase() === "x"
        ? Number.parseInt(value.slice(1), 16)
        : Number(value)
    )
  );
}

function requiredMatch(source, pattern, name) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Missing poem text: ${name}`);
  return match[1];
}

const index = await read("index.html");
const texts = [
  requiredMatch(index, /<H1[^>]*>([\s\S]*?)<\/H1>/i, "index title"),
  requiredMatch(index, /<DIV CLASS="map">([\s\S]*?)<\/DIV>/i, "index map")
];

for (const name of [
  "part-1.html", "part-2.html", "part-3.html", "part-4.html",
  "part-5.html", "part-7.html", "part-question.html"
]) {
  texts.push(requiredMatch(
    await read(name), /<PRE CLASS="work\b[^>]*>([\s\S]*?)<\/PRE>/i, name
  ));
}

// Poem (vi) stores its copy in the terminal script instead of HTML.
const terminalCopy = requiredMatch(
  await read("part-6.js"), /\bvar fileCopy\s*=\s*([\s\S]*?);/, "part-6.js"
);
texts.push(Array.from(terminalCopy.matchAll(/"(?:[^"\\]|\\.)*"/g),
  (match) => JSON.parse(match[0])).join(""));

// Deduplicate to give every Han character the same chance, including rare ones.
const han = Array.from(new Set(
  texts.flatMap((text) => Array.from(textContent(text)))
    .filter((character) => /\p{Script=Han}/u.test(character))
));
if (!han.length) throw new Error("The poem character pool is empty");

const output = `// Generated from the index and all eight poems.\n` +
  `// Regenerate: node scripts/poem-glyphs.mjs\n` +
  `// Check: node scripts/poem-glyphs.mjs --check\n` +
  `(function () {\n  "use strict";\n\n` +
  `  window.PoemGlyphs = Object.freeze({\n` +
  `    han: Object.freeze(Array.from(${JSON.stringify(han.join(""))}))\n` +
  `  });\n})();\n`;

if (process.argv.includes("--check")) {
  const saved = await read("poem-glyphs.js");
  if (saved !== output) {
    throw new Error(`Stale character pool: ${fileURLToPath(logDirectory)}poem-glyphs.js`);
  }
  console.log(`Character pool verified: ${han.length} unique Han characters.`);
} else {
  process.stdout.write(output);
}
