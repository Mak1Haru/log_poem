import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../log/layout-mode.js", import.meta.url), "utf8");

function page({ width = 390, search = "", saved = "original", blocked = false,
  scrollbar = 0, legacyMedia = false } = {}) {
  const classes = new Set(search.includes("preview=1") ? ["part-4-preview-root"] : []);
  const values = new Map([["poem-layout-mode", saved], ["unrelated-setting", "keep"]]);
  const events = new Map();
  const root = {
    clientWidth: width - scrollbar,
    classList: {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
    }
  };
  const media = {
    get matches() { return width <= 919; }
  };
  if (legacyMedia) media.addListener = callback => events.set("media", callback);
  else media.addEventListener = (_, callback) => events.set("media", callback);
  const window = {
    innerWidth: width, innerHeight: 844, location: { search },
    matchMedia(query) {
      assert.equal(query, "(max-width: 919px)");
      return media;
    },
    addEventListener: (name, callback) => events.set(name, callback)
  };
  const document = {
    documentElement: root,
    addEventListener: (name, callback) => events.set(name, callback),
    // No selector controls or link rewriting should be created at DOM ready.
    createElement() { assert.fail("Layout selection must not create UI"); },
    querySelectorAll() { assert.fail("Layout selection must not rewrite links"); }
  };
  runInNewContext(source, {
    document, window, URLSearchParams,
    localStorage: {
      getItem() { assert.fail("Old preferences must not select the layout"); },
      removeItem(key) {
        if (blocked) throw new Error("Storage unavailable");
        values.delete(key);
      }
    }
  });
  events.get("DOMContentLoaded")();
  return {
    classes, values, view: window.PoemView,
    resize(nextWidth, event = "resize") {
      width = nextWidth;
      window.innerWidth = width;
      root.clientWidth = width - scrollbar;
      events.get(event)();
    }
  };
}

test("phones always use flow regardless of legacy links or preferences", () => {
  for (const width of [320, 390, 430, 844, 919]) {
    for (const search of ["", "?layout=original", "?layout=flow"]) {
      for (const saved of ["original", "flow"]) {
        const result = page({ width, search, saved });
        assert.ok(result.classes.has("poem-layout-flow"));
        assert.ok(!result.classes.has("poem-layout-original"));
        assert.equal(result.view.isFlow(), true);
        assert.equal(result.view.scale(), 1);
        assert.equal(result.view.viewport().height, 844);
        assert.equal(result.values.has("poem-layout-mode"), false);
        assert.equal(result.values.get("unrelated-setting"), "keep");
      }
    }
  }
});

test("desktop keeps its composition, matching CSS even with a scrollbar", () => {
  for (const width of [920, 1280]) {
    const result = page({ width, search: "?layout=flow", saved: "flow", scrollbar: 15 });
    assert.ok(result.classes.has("poem-layout-original"));
    assert.ok(!result.classes.has("poem-layout-flow"));
    assert.equal(result.view.isFlow(), false);
    assert.equal(result.view.viewport().width, width - 15);
  }
});

test("rotation and breakpoint changes update automatically without reload", () => {
  for (const legacyMedia of [false, true]) {
    const result = page({ legacyMedia });
    result.resize(1280);
    assert.equal(result.view.isFlow(), false);
    assert.ok(result.classes.has("poem-layout-original"));
    result.resize(390, "media");
    assert.equal(result.view.isFlow(), true);
    assert.ok(result.classes.has("poem-layout-flow"));
  }
});

test("the poem (4) embedded preview keeps its own layout", () => {
  const result = page({ search: "?preview=1&layout=flow" });
  assert.deepEqual([...result.classes], ["part-4-preview-root"]);
  assert.equal(result.view.isFlow(), false);
  result.resize(1280);
  assert.deepEqual([...result.classes], ["part-4-preview-root"]);
});

test("restricted storage and geometry work without a layout selector", () => {
  const result = page({ blocked: true });
  assert.equal(result.view.isFlow(), true);
  const bounds = { x: 20, y: 30, left: 20, right: 120, top: 30, bottom: 50, width: 100, height: 20 };
  const measured = result.view.rect({ getBoundingClientRect: () => bounds });
  assert.equal(JSON.stringify(measured), JSON.stringify(bounds));
});

test("every poem and index load the new uncached automatic layout assets", () => {
  for (const name of ["index", "part-1", "part-2", "part-3", "part-4", "part-5", "part-6", "part-7", "part-question"]) {
    const html = readFileSync(new URL(`../log/${name}.html`, import.meta.url), "utf8");
    for (const [asset, version] of [["layout-mode.js", "auto-mobile-1"], ["responsive.js", "touch-skip-1"], ["style.css", "mobile-caret-5"]]) {
      assert.ok(html.includes(`${asset}?v=${version}`), `${name}: ${asset}`);
    }
  }
  for (const name of ["layout-mode.js", "responsive.js", "style.css"]) {
    assert.ok(!readFileSync(new URL(`../log/${name}`, import.meta.url), "utf8").includes("layout-mode-control"));
  }
});
