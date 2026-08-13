(function () {
  "use strict";

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
  var asciiSymbols =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
    "0123456789!@#$%^&*()-_=+[]{};:,.<>/?\\|~";
  var hanSymbols =
    "天地人山水风云海光影白灰蓝绿静脉琥珀她我你之间心空星" +
    "春夜梦雨花时间名字生活城市画布波浪河流透明温柔沉默" +
    "天空另一种项链夏天孤独飞翔字符串完整一半";
  var settings = {
    initialDelay: 280,
    stagger: 5,
    cycleDelay: 40
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
    var width = item.glyph.getBoundingClientRect().width;

    item.glyph.style.width = width + "px";
    item.element.addEventListener("pointerenter", function () {
      activateCharacter(item.element);
    });
    item.element.addEventListener("pointerleave", function () {
      if (activeCharacter === item.element) {
        clearActiveCharacter();
      }
    });
  });

  target.addEventListener("pointerleave", clearActiveCharacter);
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
    window.removeEventListener("pointerdown", revealAll);
    window.removeEventListener("keydown", handleKeydown);
  }

  function activateInteraction() {
    interactive = true;
    finished = true;
    target.classList.remove("is-part7-decoding");
    target.classList.add("is-part7-interactive");
    removeRevealListeners();
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
  window.addEventListener("pointerdown", revealAll);
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
