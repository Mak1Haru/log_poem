(function () {
  "use strict";

  var stage = document.querySelector(".part-question .pq-stage");
  var titleElement = stage ? stage.querySelector(".pq-title") : null;
  var openingElement = stage ? stage.querySelector(".pq-opening") : null;
  var paragraphElements = stage
    ? Array.from(stage.querySelectorAll(".pq-paragraph"))
    : [];
  var closingElement = stage ? stage.querySelector(".pq-closing") : null;
  var finalElement = stage ? stage.querySelector(".pq-final") : null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (
    !stage ||
    !titleElement ||
    !openingElement ||
    !paragraphElements.length ||
    !closingElement ||
    !finalElement
  ) {
    return;
  }

  var segmenter = "Segmenter" in Intl
    ? new Intl.Segmenter("zh-Hans", { granularity: "grapheme" })
    : null;
  var settings = {
    initialDelay: 900,
    titleHold: 720,
    openingArrivalHold: 720,
    openingHold: 1500,
    sectionLead: 760,
    paragraphHold: 760,
    closingLead: 1450,
    lineStepPause: 340,
    characterMin: 84,
    characterRange: 28,
    commaDelay: 190,
    sentenceDelay: 360,
    dissolveStart: [0.64, 0.66, 0.64, 0.66],
    dissolveStep: 124,
    dissolveCycle: 92,
    dissolveCycles: 5,
    finalBlankHold: 1050
  };
  var asciiSymbols =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
    "0123456789!@#$%^&*()-_=+[]{};:,.<>/?\\|~";
  var hanSymbols =
    "天地人山水风云海光影白灰蓝绿静脉琥珀她我你之间心空星" +
    "春夜梦雨花时间名字生活城市画布波浪河流透明温柔沉默" +
    "天空石头少女眼睛距离语言注视情书月亮";
  var cursor = document.createElement("span");
  var currentSkip = null;
  var finalStarted = false;

  cursor.className = "typewriter-cursor pq-cursor";
  cursor.setAttribute("aria-hidden", "true");

  function graphemes(text) {
    return segmenter
      ? Array.from(segmenter.segment(text), function (item) {
          return item.segment;
        })
      : Array.from(text);
  }

  function makeState(element) {
    var text = element.textContent;

    element.textContent = "";
    element.setAttribute("aria-label", text);

    return {
      element: element,
      text: text,
      characters: graphemes(text),
      spans: [],
      nextIndex: 0,
      typedDone: false,
      skipRequested: false,
      dissolveQueued: false,
      dissolveStarted: false,
      dissolveDone: false,
      dissolveIndex: 0,
      pendingCorruptions: 0,
      dissolvePromise: null,
      dissolveActivePromise: null,
      dissolveResolve: null
    };
  }

  var titleState = makeState(titleElement);
  var openingState = makeState(openingElement);
  var paragraphStates = paragraphElements.map(makeState);
  var closingState = makeState(closingElement);
  var finalState = makeState(finalElement);

  finalElement.hidden = true;
  stage.classList.remove("is-pending");

  function wait(delay) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, delay);
    });
  }

  function randomSymbol(finalCharacter) {
    var useHan = /[\p{Script=Han}\u3000-\u303f\uff00-\uffef]/u.test(
      finalCharacter
    ) && Math.random() < 0.5;
    var symbols = useHan ? hanSymbols : asciiSymbols;

    return symbols.charAt(Math.floor(Math.random() * symbols.length));
  }

  function showCorruptionSymbol(span) {
    var symbol = randomSymbol(span.dataset.finalCharacter);

    span.textContent = symbol;
    span.classList.toggle(
      "is-ascii-corruption",
      /^[\x00-\x7f]$/u.test(symbol)
    );
  }

  function characterDelay(character) {
    if (/[。！？]/u.test(character)) {
      return settings.sentenceDelay;
    }

    if (/[，、；：]/u.test(character)) {
      return settings.commaDelay;
    }

    if (/\s/u.test(character)) {
      return 28;
    }

    return settings.characterMin + Math.random() * settings.characterRange;
  }

  function appendCharacter(state, character) {
    var span = document.createElement("span");

    if (cursor.parentNode !== state.element) {
      state.element.appendChild(cursor);
    }

    span.className = "pq-character is-visible";
    span.textContent = character;
    span.dataset.finalCharacter = character;
    span.setAttribute("aria-hidden", "true");
    state.element.insertBefore(span, cursor);
    state.spans.push(span);
    state.nextIndex += 1;
    return span;
  }

  function showAll(state) {
    while (state.nextIndex < state.characters.length) {
      appendCharacter(state, state.characters[state.nextIndex]);
    }

    state.typedDone = true;
  }

  function resolveDissolve(state) {
    if (state.dissolveResolve) {
      state.dissolveResolve();
      state.dissolveResolve = null;
    }
  }

  function maybeFinishDissolve(state) {
    if (
      state.typedDone &&
      state.dissolveIndex >= state.characters.length &&
      state.pendingCorruptions === 0
    ) {
      state.dissolveDone = true;
      resolveDissolve(state);
    }
  }

  function fixCharacterWidth(span) {
    if (!span.style.width) {
      span.style.width = span.getBoundingClientRect().width + "px";
    }
  }

  function corruptCharacter(state, span) {
    var cycles = 0;

    fixCharacterWidth(span);
    state.pendingCorruptions += 1;
    span.classList.add("is-corrupting");

    function nextCycle() {
      if (state.dissolveDone) {
        return;
      }

      cycles += 1;
      showCorruptionSymbol(span);

      if (cycles < settings.dissolveCycles) {
        window.setTimeout(nextCycle, settings.dissolveCycle);
        return;
      }

      span.classList.add("is-dissolved");
      span.textContent = span.dataset.finalCharacter;
      span.classList.remove("is-ascii-corruption");
      state.pendingCorruptions -= 1;
      maybeFinishDissolve(state);
    }

    nextCycle();
  }

  function startDissolve(state) {
    if (state.dissolveDone) {
      return Promise.resolve();
    }

    if (state.dissolveActivePromise) {
      return state.dissolveActivePromise;
    }

    state.dissolveStarted = true;
    state.dissolveIndex = 0;
    state.dissolveActivePromise = new Promise(function (resolve) {
      state.dissolveResolve = resolve;
    });

    function dissolveNext() {
      if (state.dissolveDone) {
        resolveDissolve(state);
        return;
      }

      if (state.dissolveIndex < state.spans.length) {
        corruptCharacter(state, state.spans[state.dissolveIndex]);
        state.dissolveIndex += 1;
      }

      maybeFinishDissolve(state);

      if (!state.dissolveDone) {
        window.setTimeout(dissolveNext, settings.dissolveStep);
      }
    }

    dissolveNext();
    return state.dissolveActivePromise;
  }

  function queueDissolve(state, previousDissolve) {
    if (state.dissolvePromise) {
      return state.dissolvePromise;
    }

    state.dissolveQueued = true;
    state.dissolvePromise = Promise.resolve(previousDissolve).then(function () {
      return startDissolve(state);
    });
    return state.dissolvePromise;
  }

  function forceDissolve(state) {
    state.dissolveDone = true;
    state.typedDone = true;
    state.dissolveIndex = state.characters.length;
    state.pendingCorruptions = 0;

    state.spans.forEach(function (span) {
      fixCharacterWidth(span);
      span.textContent = span.dataset.finalCharacter;
      span.classList.remove("is-ascii-corruption");
      span.classList.add("is-corrupting", "is-dissolved");
    });

    resolveDissolve(state);
  }

  async function typeState(state, options) {
    var dissolveAt = options && options.dissolveAt != null
      ? Math.max(1, Math.floor(
          state.characters.length * options.dissolveAt
        ))
      : null;

    state.skipRequested = false;
    currentSkip = function () {
      state.skipRequested = true;
    };
    state.element.appendChild(cursor);
    cursor.hidden = false;

    while (state.nextIndex < state.characters.length) {
      if (state.skipRequested) {
        showAll(state);
        break;
      }

      appendCharacter(state, state.characters[state.nextIndex]);

      if (
        dissolveAt &&
        !state.dissolveQueued &&
        state.nextIndex >= dissolveAt
      ) {
        queueDissolve(state, options.dissolveAfter);
      }

      await wait(characterDelay(state.characters[state.nextIndex - 1]));
    }

    state.typedDone = true;

    if (dissolveAt && !state.dissolveQueued) {
      queueDissolve(state, options.dissolveAfter);
    }

    currentSkip = null;
  }

  function dissolvePersistentState(state) {
    return new Promise(function (resolve) {
      var completed = 0;

      state.spans.forEach(function (span, index) {
        window.setTimeout(function () {
          var cycles = 0;

          fixCharacterWidth(span);
          span.classList.add("is-corrupting");

          function vanishCycle() {
            cycles += 1;
            showCorruptionSymbol(span);

            if (cycles < 3) {
              window.setTimeout(vanishCycle, 72);
              return;
            }

            span.classList.add("is-dissolved");
            span.textContent = span.dataset.finalCharacter;
            span.classList.remove("is-ascii-corruption");
            completed += 1;

            if (completed === state.spans.length) {
              resolve();
            }
          }

          vanishCycle();
        }, index * 54);
      });
    });
  }

  function instantlyHidePersistentState(state) {
    state.spans.forEach(function (span) {
      fixCharacterWidth(span);
      span.classList.add("is-corrupting", "is-dissolved");
    });
  }

  async function revealFinal() {
    if (finalStarted) {
      return;
    }

    finalStarted = true;
    closingElement.disabled = true;
    closingElement.classList.remove("is-ready");
    cursor.hidden = true;

    if (reduceMotion.matches) {
      instantlyHidePersistentState(openingState);
      instantlyHidePersistentState(closingState);
      finalElement.hidden = false;
      showAll(finalState);
      cursor.hidden = true;
      removeSkipListeners();
      return;
    }

    await Promise.all([
      dissolvePersistentState(openingState),
      dissolvePersistentState(closingState)
    ]);

    openingElement.setAttribute("aria-hidden", "true");
    closingElement.setAttribute("aria-hidden", "true");
    await wait(settings.finalBlankHold);
    finalElement.hidden = false;
    await typeState(finalState, {});
    removeSkipListeners();
  }

  function handlePointerDown(event) {
    var enabledTrigger = event.target.closest &&
      event.target.closest(".pq-closing.is-ready");

    if (enabledTrigger || (event.target.closest && event.target.closest("a"))) {
      return;
    }

    if (currentSkip) {
      currentSkip();
    }
  }

  function handleKeydown(event) {
    if (event.target === closingElement && !closingElement.disabled) {
      return;
    }

    if ([" ", "Enter", "Escape"].indexOf(event.key) === -1) {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }

    if (currentSkip) {
      currentSkip();
    }
  }

  function removeSkipListeners() {
    window.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("keydown", handleKeydown);
  }

  async function moveCursorThrough(label) {
    var stops = Array.from(stage.querySelectorAll(
      '.pq-cursor-stop[data-pq-before="' + label + '"]'
    ));
    var index;

    for (index = 0; index < stops.length; index += 1) {
      stops[index].appendChild(cursor);
      cursor.hidden = false;
      await wait(settings.lineStepPause);
    }
  }

  async function play() {
    var index;
    var previousDissolve = Promise.resolve();

    await wait(settings.initialDelay);
    await typeState(titleState);
    await wait(settings.titleHold);
    await moveCursorThrough("opening");
    await wait(settings.openingArrivalHold);
    await typeState(openingState);
    await wait(settings.openingHold);

    for (index = 0; index < paragraphStates.length; index += 1) {
      await moveCursorThrough("paragraph-" + index);
      await wait(settings.sectionLead);
      await typeState(paragraphStates[index], {
        dissolveAt: settings.dissolveStart[index],
        dissolveAfter: previousDissolve
      });
      previousDissolve = paragraphStates[index].dissolvePromise;
      await wait(settings.paragraphHold);
    }

    currentSkip = function () {
      paragraphStates.forEach(forceDissolve);
    };
    await previousDissolve;
    currentSkip = null;

    await wait(settings.closingLead);
    await typeState(closingState);
    closingElement.disabled = false;
    closingElement.classList.add("is-ready");
    closingElement.setAttribute(
      "aria-label",
      closingState.text + "，点击继续"
    );
  }

  closingElement.addEventListener("click", revealFinal);
  window.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", handleKeydown);

  if (reduceMotion.matches) {
    showAll(titleState);
    showAll(openingState);
    showAll(closingState);
    closingElement.disabled = false;
    closingElement.classList.add("is-ready");
    cursor.hidden = true;
    return;
  }

  play();
})();
