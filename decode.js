(function () {
  "use strict";

  var target = document.querySelector(".map");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!target || reduceMotion.matches) {
    return;
  }

  var segmenter = "Segmenter" in Intl
    ? new Intl.Segmenter("zh-Hans", { granularity: "grapheme" })
    : null;
  var walker = document.createTreeWalker(
    target,
    NodeFilter.SHOW_TEXT
  );
  var nodes = [];
  var currentNode;

  while ((currentNode = walker.nextNode())) {
    if (currentNode.data) {
      nodes.push(currentNode);
    }
  }

  var characters = [];

  nodes.forEach(function (node) {
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

      var span = document.createElement("span");
      span.className = "decode-character";
      span.textContent = character;
      fragment.appendChild(span);
      characters.push({
        element: span,
        finalCharacter: character
      });
    });

    node.parentNode.replaceChild(fragment, node);
  });

  if (!characters.length) {
    return;
  }

  characters.forEach(function (item) {
    var width = item.element.getBoundingClientRect().width;
    item.element.style.width = width + "px";
    item.element.style.visibility = "hidden";
  });

  var settings = {
    initialDelay: 650,
    stagger: 46,
    cycleDelay: 48
  };
  var asciiSymbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>/?\\|~";
  var hanSymbols = "天地人山水风云海光影白灰蓝绿静脉琥珀她我你之间心空星春夜梦雨花时间名字生活城市画布波浪河流透明温柔沉默天空另一种";
  var timeouts = [];
  var intervals = [];
  var completed = 0;
  var finished = false;

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
    var symbols = canUseHan && Math.random() < 0.32
      ? hanSymbols
      : asciiSymbols;

    return symbols.charAt(Math.floor(Math.random() * symbols.length));
  }

  function removeListeners() {
    window.removeEventListener("pointerdown", revealAll);
    window.removeEventListener("keydown", handleKeydown);
  }

  function markComplete() {
    completed += 1;

    if (completed === characters.length) {
      finished = true;
      target.classList.remove("is-decoding");
      removeListeners();
    }
  }

  function revealAll() {
    if (finished) {
      return;
    }

    timeouts.forEach(window.clearTimeout);
    intervals.forEach(window.clearInterval);

    characters.forEach(function (item) {
      item.element.textContent = item.finalCharacter;
      item.element.style.visibility = "visible";
    });

    finished = true;
    target.classList.remove("is-decoding");
    removeListeners();
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

  target.classList.add("is-decoding");
  window.addEventListener("pointerdown", revealAll);
  window.addEventListener("keydown", handleKeydown);

  characters.forEach(function (item, index) {
    later(function () {
      var cycle = 0;
      var cycles = 4 + index % 4;

      item.element.style.visibility = "visible";

      var interval = repeat(function () {
        cycle += 1;

        if (cycle >= cycles) {
          window.clearInterval(interval);
          item.element.textContent = item.finalCharacter;
          markComplete();
          return;
        }

        item.element.textContent = randomDecodeCharacter(
          item.finalCharacter
        );
      }, settings.cycleDelay);
    }, settings.initialDelay + index * settings.stagger);
  });
})();
