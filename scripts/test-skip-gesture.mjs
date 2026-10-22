import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../log/responsive.js", import.meta.url), "utf8");
function page({ width = 390, advance = true, type = "touch" } = {}) {
  let now = 1000;
  const listeners = new Map();
  const calls = [];
  const window = {
    scrollX: 0, scrollY: 0,
    matchMedia: () => ({ matches: width <= 919 }),
    PoemView: { isFlow: () => width <= 919 },
    addEventListener(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
    },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn); }
  };
  const document = {
    documentElement: { clientWidth: width, classList: { contains: () => false } },
    querySelector: () => null, querySelectorAll: () => []
  };
  runInNewContext(source, { window, document, Date: { now: () => now } });
  const stop = window.PoemLayout[advance ? "onAdvance" : "onTap"](event => calls.push(event));
  function emit(name, options = {}) {
    const event = {
      pointerType: type, pointerId: 1, isPrimary: true,
      button: 0, clientX: 100, clientY: 100,
      target: { closest: () => null }, ...options
    };
    for (const fn of [...(listeners.get(name) || [])]) fn(event);
  }
  return {
    calls, emit, stop, window,
    wait(ms) { now += ms; },
    tap(options = {}) {
      emit("pointerdown", options); now += 60; emit("pointerup", options);
    }
  };
}

test("one touch does not skip; two quick nearby taps skip once", () => {
  const p = page();
  p.tap(); assert.equal(p.calls.length, 0);
  p.wait(100); p.tap({ clientX: 112 }); assert.equal(p.calls.length, 1);
  p.tap(); p.tap(); assert.equal(p.calls.length, 1, "repeated taps must not skip the next section");
  p.wait(901); p.tap(); p.wait(90); p.tap(); assert.equal(p.calls.length, 2);
});

test("slow or distant taps are not double taps", () => {
  for (const kind of ["slow", "distant"]) {
    const p = page(); p.tap();
    if (kind === "slow") p.wait(351);
    p.tap(kind === "distant" ? { clientX: 160 } : {});
    assert.equal(p.calls.length, 0);
  }
});

test("scrolling, dragging, long presses, pinches and cancellation reset confirmation", () => {
  for (const kind of ["scroll", "drag", "hold", "pinch", "pointercancel", "blur", "contextmenu"]) {
    const p = page(); p.tap();
    p.emit("pointerdown");
    if (kind === "drag") p.emit("pointermove", { clientX: 125 });
    else if (kind === "hold") p.wait(501);
    else if (kind === "pinch") p.emit("pointerdown", { pointerId: 2, isPrimary: false });
    else p.emit(kind);
    p.emit("pointerup"); p.tap();
    assert.equal(p.calls.length, 0, kind);
  }
  const p = page(); p.emit("pointerdown"); p.window.scrollY = 20; p.emit("pointerup"); p.tap();
  assert.equal(p.calls.length, 0, "scroll position changed even without a scroll event");
});

test("buttons and links never confirm or prime a skip", () => {
  const control = { target: { closest: () => ({ tagName: "BUTTON" }) } };
  const p = page(); p.tap(); p.tap(control); p.tap();
  assert.equal(p.calls.length, 0);
  p.tap(control); p.tap(control);
  assert.equal(p.calls.length, 0);
});

test("touch and pen require confirmation on wide devices too", () => {
  for (const type of ["touch", "pen"]) {
    const p = page({ type, width: 1280 });
    p.tap(); assert.equal(p.calls.length, 0);
    p.tap(); assert.equal(p.calls.length, 1);
  }
});

test("desktop mouse is unchanged; narrow mouse previews follow mobile rules", () => {
  const desktop = page({ type: "mouse", width: 1280 });
  desktop.tap(); assert.equal(desktop.calls.length, 1);
  desktop.tap({ button: 2 }); assert.equal(desktop.calls.length, 1);
  const mobile = page({ type: "mouse" });
  mobile.tap(); assert.equal(mobile.calls.length, 0);
  mobile.tap(); assert.equal(mobile.calls.length, 1);
});

test("the sky poem's ordinary word interaction still activates on a single touch", () => {
  const p = page({ advance: false });
  p.tap(); assert.equal(p.calls.length, 1);
});

test("removing listeners also discards a pending first tap", () => {
  const p = page(); p.tap(); p.stop(); p.tap(); p.tap();
  assert.equal(p.calls.length, 0);
});

test("every animation skip uses confirmation, but sky word taps do not", () => {
  for (const name of ["typewriter.js", "decode.js", "part-7.js", "part-question.js"]) {
    const script = readFileSync(new URL(`../log/${name}`, import.meta.url), "utf8");
    assert.match(script, /stopAdvanceTap = window\.PoemLayout\.onAdvance\(/, name);
  }
  assert.match(readFileSync(new URL("../log/part-7.js", import.meta.url), "utf8"), /window\.PoemLayout\.onTap\(/);
});
