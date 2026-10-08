(function () {
  "use strict";

  var stopAdvanceTap = function () {};

  var target = document.querySelector(".part-7 .work");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!target) {
    return;
  }

  var segmenter = "Segmenter" in Intl
    ? new Intl.Segmenter("zh-Hans", { granularity: "grapheme" })
    : null;
  var walker = document.createTreeWalker(
    target,
    NodeFilter.SHOW_TEXT
  );
  var textNodes = [];
  var currentNode;
  var characters = [];
  var activeCharacter = null;
  var interactive = false;
  var completed = 0;
  var finished = false;
  var timeouts = [];
  var intervals = [];
  var headingLength = Array.from(target.textContent.split("\n")[0])
    .filter(function (character) { return !/\s/u.test(character); }).length;
  var breathingCharacters = [];
  var activeBreaths = new Set();
  var previousBreaths = [];
  var breathingTimer = 0;
  var breathRowOrder = [];
  var breathRowLayout = "";
  var lastBreathRow = null;
  var asciiSymbols =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
    "0123456789!@#$%^&*()-_=+[]{};:,.<>/?\\|~";
  var hanSymbols =
    "天地人山水风云海光影白灰蓝绿静脉琥珀她我你之间心空星" +
    "春夜梦雨花时间名字生活城市画布波浪河流透明温柔沉默" +
    "天空另一种项链夏天孤独飞翔字符串完整一半";
  var settings = {
    initialDelay: 280,
    stagger: 12,
    cycleDelay: 80,
    breathStartPause: 1200,
    breathDurationMin: 10500,
    breathDurationRange: 4000,
    breathIntervalMin: 2100,
    breathIntervalRange: 900,
    breathWaveStepMin: 1400,
    breathWaveStepRange: 350,
    breathClusterSize: 4,
    breathRadius: 3,
    breathMinSeparation: 4
  };

  while ((currentNode = walker.nextNode())) {
    if (currentNode.data) {
      textNodes.push(currentNode);
    }
  }

  textNodes.forEach(function (node) {
    var fragment = document.createDocumentFragment();
    var parts = segmenter
      ? Array.from(segmenter.segment(node.data), function (item) {
          return item.segment;
        })
      : Array.from(node.data);

    parts.forEach(function (character) {
      if (/\s/u.test(character)) {
        fragment.appendChild(document.createTextNode(character));
        return;
      }

      var anchor = document.createElement("span");
      var gap = document.createElement("span");
      var glyph = document.createElement("span");

      anchor.className = "part-7-character";
      gap.className = "part-7-gap";
      gap.textContent = "    ";
      gap.setAttribute("aria-hidden", "true");
      glyph.className = "part-7-glyph";
      glyph.textContent = character;
      anchor.appendChild(gap);
      anchor.appendChild(glyph);
      fragment.appendChild(anchor);
      characters.push({
        element: anchor,
        glyph: glyph,
        finalCharacter: character
      });
    });

    node.parentNode.replaceChild(fragment, node);
  });

  if (!characters.length) {
    return;
  }

  // Keep the heading and punctuation steady; only the poem's Han glyphs breathe.
  breathingCharacters = characters.filter(function (item, index) {
    return index >= headingLength && /\p{Script=Han}/u.test(item.finalCharacter);
  });

  function clearBreath(glyph) {
    glyph.classList.remove("is-breathing");
    glyph.style.removeProperty("--part7-breath-duration");
    glyph.style.removeProperty("--part7-breath-delay");
    activeBreaths.delete(glyph);
  }

  function stopBreathing() {
    window.clearTimeout(breathingTimer);
    breathingTimer = 0;
    activeBreaths.forEach(clearBreath);
    previousBreaths = [];
    breathRowOrder = [];
    breathRowLayout = "";
    lastBreathRow = null;
  }

  function canBreathe() {
    return interactive && !reduceMotion.matches && !document.hidden;
  }

  function breatheNext() {
    breathingTimer = 0;

    if (!canBreathe()) {
      stopBreathing();
      return;
    }

    var rows = [];
    var candidates = [];
    breathingCharacters.forEach(function (item, index) {
      var bounds = window.PoemView.rect(item.glyph);
      var row = rows[rows.length - 1];

      if (!row || Math.abs(bounds.y - row.y) > 2) {
        row = { key: index, y: bounds.y, length: 0, occupied: [], candidates: [] };
        rows.push(row);
      }

      row.length += 1;
      if (activeBreaths.has(item.glyph)) {
        row.occupied.push(index);
      } else if (previousBreaths.indexOf(item.glyph) === -1) {
        var candidate = { item: item, index: index, bounds: bounds };
        row.candidates.push(candidate);
        candidates.push(candidate);
      }
    });
    var selected = [];
    var chosen = null;
    var layout = rows.map(function (row) { return row.key + ":" + row.length; }).join("|");

    // Rebuild the row rotation when resizing or hover gaps change actual wrapping.
    if (layout !== breathRowLayout) {
      breathRowLayout = layout;
      breathRowOrder = [];
      lastBreathRow = null;
    }

    var availableRows = rows.filter(function (row) {
      row.origins = row.candidates.filter(function (candidate) {
        return row.occupied.every(function (occupiedIndex) {
          return Math.abs(candidate.index - occupiedIndex) >= settings.breathMinSeparation;
        });
      });
      return row.origins.length > 0;
    });

    function rowIsAvailable(key) {
      return availableRows.some(function (row) { return row.key === key; });
    }

    // Give each rendered row a turn in shuffled order. Busy rows keep their place.
    if (!breathRowOrder.some(rowIsAvailable)) {
      var newOrder = rows.map(function (row) { return row.key; }).filter(function (key) {
        return breathRowOrder.indexOf(key) === -1;
      });

      for (var index = newOrder.length - 1; index > 0; index -= 1) {
        var swapIndex = Math.floor(Math.random() * (index + 1));
        var swapKey = newOrder[index];
        newOrder[index] = newOrder[swapIndex];
        newOrder[swapIndex] = swapKey;
      }

      breathRowOrder = breathRowOrder.concat(newOrder);
    }

    var nextRowIndex = breathRowOrder.findIndex(function (key) {
      return key !== lastBreathRow && rowIsAvailable(key);
    });
    if (nextRowIndex === -1) {
      nextRowIndex = breathRowOrder.findIndex(rowIsAvailable);
    }
    if (nextRowIndex !== -1) {
      lastBreathRow = breathRowOrder.splice(nextRowIndex, 1)[0];
      var chosenRow = availableRows.find(function (row) { return row.key === lastBreathRow; });
      chosen = chosenRow.origins[Math.floor(Math.random() * chosenRow.origins.length)];
    }

    if (chosen) {
      var origin = chosen.bounds;
      var neighbors = candidates.filter(function (candidate) {
        if (candidate === chosen || Math.abs(candidate.index - chosen.index) > settings.breathRadius) {
          return false;
        }

        var bounds = candidate.bounds;
        // Do not carry a breath across a line break or an opened hover gap.
        return Math.abs(bounds.y - origin.y) < origin.height * .5 &&
          Math.abs(bounds.x - origin.x) <= origin.width * (settings.breathRadius + .6);
      });
      var cluster = [chosen];
      var leadingSide = Math.random() < .5 ? -1 : 1;

      // Reach the nearest letters first, then spread a little farther to either side.
      neighbors.sort(function (left, right) {
        var leftDistance = left.index - chosen.index;
        var rightDistance = right.index - chosen.index;

        return Math.abs(leftDistance) - Math.abs(rightDistance) ||
          (leftDistance - rightDistance) * leadingSide;
      });

      while (cluster.length < settings.breathClusterSize && neighbors.length) {
        cluster.push(neighbors.shift());
      }

      cluster.sort(function (left, right) {
        return Math.abs(left.index - chosen.index) - Math.abs(right.index - chosen.index);
      });

      var duration = settings.breathDurationMin + Math.random() * settings.breathDurationRange;
      var waveStep = settings.breathWaveStepMin + Math.random() * settings.breathWaveStepRange;
      var previousDelay = 0;

      cluster.forEach(function (candidate) {
        var item = candidate.item;
        // Let the opacity wave travel outward; even equidistant neighbors are staggered.
        var delay = candidate === chosen ? 0 : Math.max(
          Math.abs(candidate.index - chosen.index) * waveStep,
          previousDelay + waveStep * .85
        );
        previousDelay = delay;

        item.glyph.style.setProperty("--part7-breath-duration", duration + "ms");
        item.glyph.style.setProperty("--part7-breath-delay", delay + "ms");
        activeBreaths.add(item.glyph);
        selected.push(item.glyph);
        item.glyph.classList.add("is-breathing");
      });
    }

    previousBreaths = selected;
    breathingTimer = window.setTimeout(breatheNext,
      settings.breathIntervalMin + Math.random() * settings.breathIntervalRange);
  }

  function startBreathing() {
    if (!canBreathe() || breathingTimer || !breathingCharacters.length) {
      return;
    }

    breathingTimer = window.setTimeout(breatheNext, settings.breathStartPause);
  }

  function syncBreathing() {
    if (canBreathe()) {
      startBreathing();
    } else {
      stopBreathing();
    }
  }

  target.addEventListener("animationend", function (event) {
    if (event.animationName === "part7-glyph-breathe" && activeBreaths.has(event.target)) {
      clearBreath(event.target);
    }
  });
  document.addEventListener("visibilitychange", syncBreathing);
  window.addEventListener("pagehide", stopBreathing);
  window.addEventListener("pageshow", syncBreathing);
  reduceMotion.addEventListener("change", function () {
    if (reduceMotion.matches && !finished) {
      revealAll();
    }
    syncBreathing();
  });

  function clearActiveCharacter() {
    if (!activeCharacter) {
      return;
    }

    activeCharacter.classList.remove("is-split");
    activeCharacter = null;
  }

  function activateCharacter(element) {
    if (!interactive || activeCharacter === element) {
      return;
    }

    clearActiveCharacter();
    activeCharacter = element;
    activeCharacter.classList.add("is-split");
  }

  characters.forEach(function (item) {
    var width = window.PoemView.rect(item.glyph).width;

    item.glyph.style.width = width + "px";
    item.element.addEventListener("pointerenter", function (event) {
      if (event.pointerType !== "touch") activateCharacter(item.element);
    });
    item.element.addEventListener("pointerleave", function (event) {
      if (event.pointerType !== "touch" && activeCharacter === item.element) {
        clearActiveCharacter();
      }
    });
  });

  target.addEventListener("pointerleave", function (event) {
    if (event.pointerType !== "touch") clearActiveCharacter();
  });
  window.PoemLayout.onTap(function (event) {
    if (event.pointerType !== "touch" || !interactive) return;
    var character = event.target.closest && event.target.closest(".part-7-character");
    if (!character || activeCharacter === character) clearActiveCharacter();
    else activateCharacter(character);
  });
  window.addEventListener("scroll", clearActiveCharacter, { passive: true });
  window.addEventListener("blur", clearActiveCharacter);

  function later(callback, delay) {
    var id = window.setTimeout(callback, delay);
    timeouts.push(id);
    return id;
  }

  function repeat(callback, delay) {
    var id = window.setInterval(callback, delay);
    intervals.push(id);
    return id;
  }

  function randomDecodeCharacter(finalCharacter) {
    var canUseHan = /[\p{Script=Han}\u3000-\u303f\uff00-\uffef]/u.test(
      finalCharacter
    );
    var symbols = canUseHan && Math.random() < .3
      ? hanSymbols
      : asciiSymbols;

    return symbols.charAt(Math.floor(Math.random() * symbols.length));
  }

  function removeRevealListeners() {
    stopAdvanceTap();
    window.removeEventListener("keydown", handleKeydown);
  }

  function activateInteraction() {
    interactive = true;
    finished = true;
    target.classList.remove("is-part7-decoding");
    target.classList.add("is-part7-interactive");
    removeRevealListeners();
    startBreathing();
  }

  function markComplete() {
    completed += 1;

    if (completed === characters.length) {
      activateInteraction();
    }
  }

  function revealAll() {
    if (finished) {
      return;
    }

    timeouts.forEach(window.clearTimeout);
    intervals.forEach(window.clearInterval);
    characters.forEach(function (item) {
      item.glyph.textContent = item.finalCharacter;
      item.glyph.style.visibility = "visible";
    });
    activateInteraction();
  }

  function handleKeydown(event) {
    if ([" ", "Enter", "Escape"].indexOf(event.key) === -1) {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }

    revealAll();
  }

  if (reduceMotion.matches) {
    activateInteraction();
    return;
  }

  characters.forEach(function (item) {
    item.glyph.style.visibility = "hidden";
  });

  target.classList.add("is-part7-decoding");
  stopAdvanceTap = window.PoemLayout.onTap(revealAll);
  window.addEventListener("keydown", handleKeydown);

  characters.forEach(function (item, index) {
    later(function () {
      var cycle = 1;
      var cycles = 3 + index % 3;

      item.glyph.style.visibility = "visible";
      item.glyph.textContent = randomDecodeCharacter(
        item.finalCharacter
      );

      var interval = repeat(function () {
        cycle += 1;

        if (cycle >= cycles) {
          window.clearInterval(interval);
          item.glyph.textContent = item.finalCharacter;
          markComplete();
          return;
        }

        item.glyph.textContent = randomDecodeCharacter(
          item.finalCharacter
        );
      }, settings.cycleDelay);
    }, settings.initialDelay + index * settings.stagger);
  });
})();
