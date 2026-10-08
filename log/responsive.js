(function () {
  "use strict";

  var narrow = window.matchMedia("(max-width: 919px)");
  var preview = document.documentElement.classList.contains("part-4-preview-root");
  function isNarrow() { return narrow.matches && window.PoemView.isFlow(); }

  // A scroll, long press, or pinch must never be mistaken for advancing a poem.
  function onTap(callback, surface) {
    surface = surface || window;
    var contact = null;
    function cancel() { contact = null; }
    function down(event) {
      if (event.target.closest && event.target.closest(".layout-mode-control")) {
        cancel();
        return;
      }
      if (event.pointerType === "mouse" || !event.pointerType) {
        if (event.button === 0) callback(event);
        return;
      }
      if (event.isPrimary === false) { cancel(); return; }
      contact = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        time: Date.now(), target: event.target,
        scrollX: window.scrollX, scrollY: window.scrollY
      };
    }
    function move(event) {
      if (contact && (Math.abs(event.clientX - contact.x) > 10 ||
          Math.abs(event.clientY - contact.y) > 10)) cancel();
    }
    function up(event) {
      var start = contact;
      cancel();
      if (!start || start.id !== event.pointerId ||
          Date.now() - start.time > 500 ||
          Math.abs(event.clientX - start.x) > 10 ||
          Math.abs(event.clientY - start.y) > 10 ||
          Math.abs(window.scrollY - start.scrollY) > 4 ||
          Math.abs(window.scrollX - start.scrollX) > 4) return;
      callback(event);
    }
    surface.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", cancel, { passive: true });
    window.addEventListener("scroll", cancel, { passive: true });
    window.addEventListener("blur", cancel);
    return function () {
      surface.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("scroll", cancel);
      window.removeEventListener("blur", cancel);
      cancel();
    };
  }

  var map = document.querySelector(".map");
  var mapItems = map ? Array.from(map.querySelectorAll(".map-item")).map(function (item) {
    return { element: item, left: item.style.left, x: parseFloat(item.style.left) || 0 };
  }) : [];
  var coda = map && map.querySelector('.map-item[href="part-question.html"]:last-child');
  if (coda) coda.classList.add("map-coda");

  var part2 = document.querySelector(".part-2-layout");
  var part2First = document.querySelector(".part-2-first-section");
  var part2Lead = part2First && part2First.querySelector(".part-2-line");
  var part2Lines = part2 ? Array.from(part2.querySelectorAll(".part-2-line")).map(function (line) {
    return {
      element: line, text: line.textContent,
      x: line.style.getPropertyValue("--x"), y: line.style.getPropertyValue("--y")
    };
  }) : [];
  // Capture unwrapped geometry before the animation clears the text. Rotation
  // can then update zoom/alignment without measuring a half-typed sentence.
  function fullWidth(element) {
    var copy = element.cloneNode(true);
    copy.style.cssText = "position:absolute;left:0;top:0;display:inline-block;" +
      "visibility:hidden;pointer-events:none;width:max-content;height:auto;white-space:pre;";
    part2.appendChild(copy);
    var width = window.PoemView.rect(copy).width;
    copy.remove();
    return width;
  }
  var lipsLine = part2 && part2.querySelector(".part-2-lips-line");
  var lipsWidth = lipsLine ? fullWidth(lipsLine) : 0;
  var blockWidth = part2 ? Array.from(part2.querySelectorAll(".part-2-block-line")).reduce(function (width, line) {
    return Math.max(width, fullWidth(line));
  }, 0) : 0;

  function part2Metrics() {
    var mobileWidth = part2 ? (part2.clientWidth - 8) / 1.075 : 0;
    var aligned = Math.max(0, (isNarrow() ? mobileWidth : blockWidth) - lipsWidth);
    var original = part2Lines.find(function (item) { return item.element === lipsLine; });
    return {
      scale: isNarrow() ? 1.75 : Math.min(1.75, Math.max(1, part2.clientWidth / blockWidth)),
      alignedX: aligned,
      finalX: isNarrow() ? aligned * .55 : parseFloat(original.x)
    };
  }
  var part3Groups = Array.from(document.querySelectorAll(".part-3-group")).map(function (group) {
    return { element: group, x: group.style.getPropertyValue("--sx"), y: group.style.getPropertyValue("--sy") };
  });

  function measureHeight(element, text, width) {
    var copy = element.cloneNode(false);
    copy.textContent = text;
    copy.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;" +
      "height:auto;min-height:0;width:" + width + "px;white-space:pre-wrap;";
    element.parentNode.appendChild(copy);
    var height = copy.offsetHeight;
    copy.remove();
    return height;
  }

  function layoutPart2() {
    if (!part2 || !part2First) return;
    if (!isNarrow()) {
      part2Lines.forEach(function (item) {
        item.element.style.setProperty("--x", item.x);
        item.element.style.setProperty("--y", item.y);
        item.element.style.removeProperty("--mobile-line-height");
      });
      return;
    }
    var width = part2.clientWidth;
    var blockWidth = (width - 8) / 1.075;
    part2.style.setProperty("--mobile-block-width", blockWidth + "px");
    var leadItem = part2Lines.find(function (item) { return item.element === part2Lead; });
    var leadHeight = measureHeight(part2Lead, leadItem.text, width);
    part2Lead.style.setProperty("--mobile-line-height", leadHeight + "px");
    var y = 35.5 + leadHeight + 22;
    part2.style.setProperty("--mobile-zoom-origin", y + "px");
    part2Lines.forEach(function (item) {
      var line = item.element;
      if (!part2First.contains(line) || line === part2Lead) return;
      var lips = line.classList.contains("part-2-lips-line");
      var height = measureHeight(line, item.text, blockWidth);
      if (lips) y += 14;
      // The desktop scene subtracts 110px once the heading is moved out.
      line.style.setProperty("--y", (y + 110) + "px");
      line.style.setProperty("--mobile-line-height", height + "px");
      if (lips) line.style.setProperty("--x", part2Metrics().finalX + "px");
      y += height + (lips ? 18 : 7);
    });
    var secondTop = y * .56 + 34;
    part2.style.setProperty("--mobile-second-shift", (secondTop - 355.5) + "px");
    part2.style.setProperty("--mobile-part2-height", (secondTop + 416) + "px");
    part2Lines.forEach(function (item) {
      if (item.element.closest(".part-2-second-section")) {
        item.element.style.setProperty("--x", (parseFloat(item.x) * Math.min(1, width / 410)) + "px");
      }
    });
  }

  function layoutPart3() {
    var ys = [120, 192, 268, 324, 382, 458, 532, 610];
    var fractions = [.05, .9, .15, .85, .02, .8, .05, .65];
    part3Groups.forEach(function (item, index) {
      var group = item.element;
      // Measure full fragments once, before typewriter clears their text.
      if (!item.width) {
        item.width = Array.from(group.querySelectorAll(".part-3-fragment")).reduce(function (right, fragment) {
          return Math.max(right, (parseFloat(fragment.style.getPropertyValue("--gx")) || 0) + window.PoemView.rect(fragment).width);
        }, 0);
      }
      group.style.setProperty("--mobile-group-width", item.width + "px");
      var width = group.parentNode.clientWidth;
      group.style.setProperty("--sx", isNarrow() ? Math.max(0, width - item.width - 8) * fractions[index] + "px" : item.x);
      group.style.setProperty("--sy", isNarrow() ? ys[index] + "px" : item.y);
    });
  }

  function staticLayout() {
    if (part2 && part2Lead) {
      part2First.parentNode.insertBefore(part2Lead, part2First);
      part2Lead.classList.add("part-2-heading-line");
      part2First.classList.add("is-part2-zoom-body");
      layoutPart2();
      part2First.parentNode.style.setProperty("--part-2-exit-scale", ".56");
    }
    if (part3Groups.length) {
      var rows = [
        [[0, 0], [1, 0]], [[0, 1], [1, 1]], [[0, 2], [1, 2]],
        [[2, 0], [3, 0]], [[2, 1], [3, 1]], [[4, 0], [5, 0]],
        [[4, 1], [5, 1]], [[4, 2], [5, 2]], [[4, 3], [6, 0]],
        [[6, 2], [7, 0]]
      ];
      rows.forEach(function (row) {
        var x = 0;
        row.forEach(function (address) {
          var fragment = part3Groups[address[0]].element.querySelectorAll(".part-3-fragment")[address[1]];
          fragment.style.setProperty("--gx", x + "px");
          x += window.PoemView.rect(fragment).width;
        });
      });
      layoutPart3();
      part3Groups.forEach(function (item) {
        item.element.style.setProperty("--part-3-x", item.element.style.getPropertyValue("--fx"));
        item.element.style.setProperty("--part-3-y", item.element.style.getPropertyValue("--fy"));
      });
    }
  }

  function update() {
    if (preview) return;
    if (map) {
      var width = map.clientWidth;
      var ratio = Math.min(1, (width - 28) / 440);
      mapItems.forEach(function (item) {
        item.element.style.left = isNarrow() && width < 480 ? (14 + item.x * ratio) + "px" : item.left;
      });
    }
    layoutPart2();
    // Part 3's fragment offsets are assigned by typewriter before this hook runs.
    if (part3Groups.some(function (item) { return item.width; })) layoutPart3();
  }

  window.PoemLayout = {
    onTap: onTap,
    staticLayout: staticLayout,
    isNarrow: function () { return isNarrow() && !preview; },
    part2: layoutPart2,
    part2Metrics: part2Metrics,
    part3: layoutPart3
  };
  if (map) update();
  var lastWidth = document.documentElement.clientWidth;
  window.addEventListener("resize", function () {
    var width = document.documentElement.clientWidth;
    if (width !== lastWidth) {
      lastWidth = width;
      update();
    }
  });
})();
