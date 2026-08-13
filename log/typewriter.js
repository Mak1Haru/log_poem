(function () {
  "use strict";

  var target = document.querySelector(".work");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var roomSection = target
    ? target.querySelector(".room-section")
    : null;
  var roomWindow = document.querySelector(".room-window");
  var roomWindowClose = document.querySelector(".room-window-close");
  var soundButton = document.querySelector(".sound-toggle");
  var audioContext = null;
  var soundEnabled = false;
  var toneReached = false;
  var tonePlayed = false;
  var windowTimer = 0;
  var roomWindowContinue = null;

  function stopEvent(event) {
    event.stopPropagation();
  }

  function hideRoomWindow() {
    if (!roomWindow || roomWindow.hidden) {
      return;
    }

    roomWindow.classList.remove("is-visible");
    window.clearTimeout(windowTimer);
    windowTimer = window.setTimeout(function () {
      roomWindow.hidden = true;
      var continueAnimation = roomWindowContinue;
      roomWindowContinue = null;

      if (continueAnimation && !finished) {
        continueAnimation();
      }
    }, 260);
  }

  function showRoomWindow(continueAnimation) {
    if (!roomWindow) {
      if (continueAnimation) {
        continueAnimation();
      }

      return;
    }

    window.clearTimeout(windowTimer);
    roomWindowContinue = continueAnimation || null;
    roomWindow.hidden = false;
    window.requestAnimationFrame(function () {
      roomWindow.classList.add("is-visible");

      if (roomWindowClose) {
        roomWindowClose.focus({ preventScroll: true });
      }
    });
  }

  function handleRoomWindowKeydown(event) {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      hideRoomWindow();
    }
  }

  function soundContext() {
    if (!audioContext) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;

      if (AudioContext) {
        audioContext = new AudioContext();
      }
    }

    return audioContext;
  }

  function playA440() {
    var context = soundContext();

    if (!context || !soundEnabled || tonePlayed) {
      return;
    }

    function startTone() {
      if (tonePlayed) {
        return;
      }

      tonePlayed = true;

      var oscillator = context.createOscillator();
      var gain = context.createGain();
      var now = context.currentTime;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 1.7);

      if (soundButton) {
        soundButton.textContent = "A · 440 Hz";
        soundButton.classList.remove("is-waiting");
      }
    }

    if (context.state === "suspended") {
      context.resume().then(startTone);
    } else {
      startTone();
    }
  }

  function reachA440() {
    if (toneReached) {
      return;
    }

    toneReached = true;

    if (soundEnabled) {
      playA440();
    } else if (soundButton) {
      soundButton.textContent = "播放 A · 440 Hz";
      soundButton.classList.add("is-waiting");
    }
  }

  function enableSound(event) {
    event.preventDefault();
    event.stopPropagation();

    var context = soundContext();

    if (!context) {
      soundButton.textContent = "声音不可用";
      soundButton.disabled = true;
      return;
    }

    context.resume();
    soundEnabled = true;
    soundButton.setAttribute("aria-pressed", "true");
    soundButton.textContent = toneReached
      ? "A · 440 Hz"
      : "声音：开";
    soundButton.classList.remove("is-waiting");

    if (toneReached) {
      playA440();
    }
  }

  if (soundButton) {
    soundButton.addEventListener("pointerdown", stopEvent);
    soundButton.addEventListener("keydown", stopEvent);
    soundButton.addEventListener("click", enableSound);
  }

  if (roomWindow) {
    roomWindow.addEventListener("pointerdown", stopEvent);
    roomWindow.addEventListener("keydown", handleRoomWindowKeydown);
  }

  if (roomWindowClose) {
    roomWindowClose.addEventListener("click", hideRoomWindow);
  }

  if (!target) {
    return;
  }

  if (reduceMotion.matches) {
    if (soundButton && target.textContent.indexOf("(=440)") !== -1) {
      toneReached = true;
      soundButton.textContent = "播放 A · 440 Hz";
    }

    return;
  }

  var settings = {
    initialDelay: 900,
    characterMin: 64,
    characterRange: 24,
    part2CharacterMin: 82,
    part2CharacterRange: 28,
    part2PhrasePause: 620,
    spaceDelay: 22,
    lineDelay: 230,
    sectionDelay: 1500,
    largeGapStep: 180,
    lineStartHold: 420,
    phraseLeadDelay: 1050,
    toneHold: 1950,
    waveSplitDelay: 900,
    waveFrameDelay: 88,
    beforeAnyTwoDelay: 1300,
    movementPause: 1800,
    movementFade: 580,
    movementBlankHold: 850,
    parallelGroupHold: 420,
    afterExpectationDelay: 1200,
    afterEyesDelay: 1200,
    beforeHerNameDelay: 1700,
    part2LeadBlinkPause: 650,
    part2FocusPause: 1000,
    part2LipsTabPause: 1250,
    part2PullPause: 650,
    part2PullCursorPause: 420,
    part2BeforePullPause: 750,
    part2AfterPullPause: 1450,
    part2ExitScale: .56,
    part2SecondEntrancePause: 2200,
    part2SecondBeforeResizePause: 520,
    part2SecondAfterResizePause: 480,
    part2SecondCharacterMin: 90,
    part2SecondCharacterRange: 28,
    part3IntroHold: 650,
    part3GroupLineHold: 360,
    part3GroupHold: 680,
    part3BeforeAssemble: 1350,
    part3AfterAssemble: 1300,
    part3EndingLinePause: 1650,
    part3BeforeBrightPause: 1800,
    part3AfterEndingPause: 1650,
    part4CharacterMin: 98,
    part4CharacterRange: 28,
    part4LinePause: 920,
    part4BeforeLipsPause: 1250,
    part4ButtonCharacterDelay: 150,
    part4BeforeFinalPause: 720,
    part4CursorStepDelays: [120, 145, 105, 170, 125, 110, 135],
    part4CursorArrivalPause: 420,
    part5CharacterMin: 78,
    part5CharacterRange: 26,
    part5AfterMelancholyPause: 1000,
    part5SpinnerDiagonalDelay: 135,
    part5SpinnerAxisDelay: 340,
    part5BeforeVanishPause: 2200,
    commaDelay: 180,
    sentenceDelay: 340
  };
  var roomFragments = roomSection
    ? Array.from(roomSection.querySelectorAll(".room-fragment"))
    : [];
  var roomBaselineStrut = "\u2060";
  var firstMovement = target.querySelector(".first-movement");
  var secondMovement = target.querySelector(".second-movement");
  var parallelGroups = Array.from(
    target.querySelectorAll(".parallel-group")
  );
  var parallelFragments = Array.from(
    target.querySelectorAll(".parallel-fragment")
  );
  var footnoteMarkers = Array.from(
    target.querySelectorAll(".footnote-marker")
  );
  var footnoteLines = Array.from(
    target.querySelectorAll(".footnote-line")
  );
  var footnoteRule = target.querySelector(".footnote-rule");
  var footnoteBlock = target.querySelector(".footnote-block");
  var footnoteStates = {};
  var waveDecodeElements = roomSection
    ? Array.from(target.querySelectorAll(".wave-decode"))
    : [];
  var part2FirstComposition = target.querySelector(
    ".part-2-first-composition"
  );
  var part2TitleLine = target.querySelector(".part-2-title-line");
  var part2FirstSection = target.querySelector(".part-2-first-section");
  var part2SecondSection = target.querySelector(".part-2-second-section");
  var part2LeadLine = part2FirstSection
    ? Array.from(part2FirstSection.children).find(function (element) {
        return element.classList.contains("part-2-line");
      })
    : null;
  var part2LipsLine = target.querySelector(".part-2-lips-line");
  var part2FirstState = [];
  var part2SecondState = [];
  var part2InitialScale = 1;
  var part2LipsFinalX = 0;
  var part2LipsAlignedX = 0;
  var part3Layout = target.classList.contains("part-3-layout")
    ? target
    : target.querySelector(".part-3-layout");
  var part3IntroElements = part3Layout
    ? Array.from(part3Layout.querySelectorAll(".part-3-line"))
    : [];
  var part3Groups = part3Layout
    ? Array.from(part3Layout.querySelectorAll(".part-3-group"))
    : [];
  var part3EndingLines = part3Layout
    ? Array.from(part3Layout.querySelectorAll(".part-3-ending-line"))
    : [];
  var part3SecondSection = part3Layout
    ? part3Layout.querySelector(".part-3-second-section")
    : null;
  var part3IntroState = [];
  var part3GroupState = [];
  var part3EndingState = [];
  var part3SecondState = null;
  var part4Prompt = target.querySelector(".part-4-prompt");
  var part4Trigger = target.querySelector(".part-4-trigger");
  var part4Previews = Array.from(
    target.querySelectorAll(".part-4-preview")
  );
  var part4Continuation = target.querySelector(
    ".part-4-continuation"
  );
  var part4FirstText = target.querySelector(".part-4-first-text");
  var part4LipsPrompt = target.querySelector(".part-4-lips-prompt");
  var part4LipsTrigger = target.querySelector(".part-4-lips-trigger");
  var part4Final = target.querySelector(".part-4-final");
  var part4ContinuationState = null;
  var part4LipsState = null;
  var part4FinalState = null;
  var part4TriggerHandler = null;
  var part4LipsHandler = null;
  var isPart5 = document.body.classList.contains("part-5");
  var part5SpinnerWord = target.querySelector(".part-5-spinner-word");
  var part5Spinner = target.querySelector(".part-5-spinner");
  var part5SpinnerRunning = false;
  var part5SpinnerTimer = 0;
  var part5SpinnerFrame = 0;
  var part5VanishTimer = 0;

  if (isPart5) {
    document.documentElement.classList.add("part-5-root");
  }

  if (part2LeadLine) {
    part2FirstSection.parentNode.insertBefore(
      part2LeadLine,
      part2FirstSection
    );
    part2LeadLine.classList.add("part-2-heading-line");
    part2FirstSection.classList.add("is-part2-zoom-body");
  }

  if (part2FirstSection) {
    var part2BlockLines = Array.from(
      part2FirstSection.querySelectorAll(".part-2-block-line")
    );
    var part2BlockWidth = part2BlockLines.reduce(function (width, element) {
      return Math.max(
        width,
        element.offsetLeft + element.getBoundingClientRect().width
      );
    }, 0);

    if (part2BlockWidth > 0) {
      part2InitialScale = Math.min(
        1.75,
        Math.max(1, target.clientWidth / part2BlockWidth)
      );
    }

    if (part2LipsLine) {
      part2LipsFinalX = parseFloat(
        part2LipsLine.style.getPropertyValue("--x")
      ) || 0;
      part2LipsAlignedX = Math.max(
        0,
        part2BlockWidth - part2LipsLine.getBoundingClientRect().width
      );
    }
  }

  roomFragments.forEach(function (element) {
    var width = element.getBoundingClientRect().width;
    var finalText = element.textContent;

    element.setAttribute("data-room-final", finalText);
    element.style.width = width + "px";
    element.textContent = roomBaselineStrut;
  });

  parallelFragments.forEach(function (element) {
    var width = element.getBoundingClientRect().width;
    var finalText = element.textContent;

    element.setAttribute("data-parallel-final", finalText);
    element.style.width = width + "px";
    element.textContent = roomBaselineStrut;
  });

  footnoteMarkers.forEach(function (element) {
    var width = element.getBoundingClientRect().width;
    var finalText = element.textContent;

    element.setAttribute("data-footnote-final", finalText);
    element.style.width = width + "px";
    element.textContent = roomBaselineStrut;
  });

  footnoteLines.forEach(function (element) {
    var id = element.getAttribute("data-footnote");
    var lineWalker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT
    );
    var textNodes = [];
    var lineNode;

    while ((lineNode = lineWalker.nextNode())) {
      if (lineNode.data) {
        textNodes.push({
          node: lineNode,
          text: lineNode.data
        });
        lineNode.data = "";
      }
    }

    footnoteStates[id] = {
      element: element,
      textNodes: textNodes
    };
  });

  if (footnoteRule) {
    footnoteRule.setAttribute("data-footnote-final", footnoteRule.textContent);
    footnoteRule.textContent = "";
  }

  if (parallelFragments.length) {
    target.classList.add("has-parallel-animation");
  }

  if (footnoteMarkers.length) {
    target.classList.add("has-footnote-animation");
  }

  if (secondMovement) {
    secondMovement.style.display = "none";
  }

  waveDecodeElements.forEach(function (element) {
    var width = element.getBoundingClientRect().width;

    element.style.width = width + "px";
    element.textContent = roomBaselineStrut;
  });

  var walker = document.createTreeWalker(
    target,
    NodeFilter.SHOW_TEXT
  );
  var nodes = [];
  var currentNode;
  var roomSceneQueued = false;
  var waveScenesQueued = [];
  var parallelScenesQueued = [];
  var secondMovementQueued = false;
  var footnoteScenesQueued = [];
  var part3FirstQueued = false;
  var part4ContinuationQueued = false;

  while ((currentNode = walker.nextNode())) {
    if (currentNode.data) {
      nodes.push(currentNode);
    }
  }

  var segmenter = "Segmenter" in Intl
    ? new Intl.Segmenter("zh-Hans", { granularity: "grapheme" })
    : null;
  var characters = [];

  if (part2FirstSection) {
    var part2TypingElements = part2TitleLine
      ? [part2TitleLine]
      : [];

    if (part2LeadLine) {
      part2TypingElements.push(part2LeadLine);
    }

    part2TypingElements = part2TypingElements.concat(Array.from(
      part2FirstSection.querySelectorAll(
        ".part-2-line, .part-2-block-line, .part-2-pull-word"
      )
    ));

    part2TypingElements.forEach(function (element) {
      var lineNode = Array.from(element.childNodes).find(function (node) {
        return node.nodeType === Node.TEXT_NODE;
      });

      if (!lineNode) {
        return;
      }

      part2FirstState.push({
        element: element,
        node: lineNode,
        text: lineNode.data
      });
      lineNode.data = "";
    });

    if (part2FirstState.length) {
      characters.push({
        scene: "part-2-first",
        element: part2FirstSection
      });
    }
  }

  if (part2SecondSection) {
    var part2SecondSizeOffsets = [
      -1.2,
      -.8,
      -.4,
      .5,
      .9,
      1.3
    ];

    Array.from(
      part2SecondSection.querySelectorAll(".part-2-line")
    ).forEach(function (element) {
      var lineNode = Array.from(element.childNodes).find(function (node) {
        return node.nodeType === Node.TEXT_NODE;
      });

      if (!lineNode) {
        return;
      }

      part2SecondState.push({
        element: element,
        node: lineNode,
        text: lineNode.data,
        fontSize: 16 + part2SecondSizeOffsets[
          Math.floor(Math.random() * part2SecondSizeOffsets.length)
        ]
      });
      lineNode.data = "";
    });

    if (part2SecondState.length) {
      part2SecondSection.style.visibility = "hidden";
      characters.push({
        scene: "part-2-second",
        element: part2SecondSection
      });
    }
  }

  if (part3Layout) {
    var part3FinalRows = [
      [[0, 0], [1, 0]],
      [[0, 1], [1, 1]],
      [[0, 2], [1, 2]],
      [[2, 0], [3, 0]],
      [[2, 1], [3, 1]],
      [[4, 0], [5, 0]],
      [[4, 1], [5, 1]],
      [[4, 2], [5, 2]],
      [[4, 3], [6, 0]],
      [[6, 2], [7, 0]]
    ];

    part3FinalRows.forEach(function (row) {
      var rowX = 0;

      row.forEach(function (address) {
        var group = part3Groups[address[0]];
        var fragments = group
          ? group.querySelectorAll(".part-3-fragment")
          : [];
        var fragment = fragments[address[1]];

        if (!fragment) {
          return;
        }

        fragment.style.setProperty("--gx", rowX.toFixed(2) + "px");
        rowX += fragment.getBoundingClientRect().width;
      });
    });

    part3IntroElements.forEach(function (element) {
      var lineNode = Array.from(element.childNodes).find(function (node) {
        return node.nodeType === Node.TEXT_NODE;
      });

      if (!lineNode) {
        return;
      }

      part3IntroState.push({
        element: element,
        node: lineNode,
        text: lineNode.data
      });
      lineNode.data = "";
    });

    part3Groups.forEach(function (group) {
      var groupState = {
        element: group,
        fragments: []
      };

      Array.from(group.querySelectorAll(".part-3-fragment")).forEach(
        function (element) {
          var lineNode = Array.from(element.childNodes).find(function (node) {
            return node.nodeType === Node.TEXT_NODE;
          });

          if (!lineNode) {
            return;
          }

          groupState.fragments.push({
            element: element,
            node: lineNode,
            text: lineNode.data
          });
          lineNode.data = "";
        }
      );
      part3GroupState.push(groupState);
    });

    part3EndingLines.forEach(function (element) {
      var lineNode = Array.from(element.childNodes).find(function (node) {
        return node.nodeType === Node.TEXT_NODE;
      });

      if (!lineNode) {
        return;
      }

      part3EndingState.push({
        element: element,
        node: lineNode,
        text: lineNode.data
      });
      lineNode.data = "";
      element.style.visibility = "hidden";
    });

    if (part3SecondSection) {
      var part3SecondNode = Array.from(
        part3SecondSection.childNodes
      ).find(function (node) {
        return node.nodeType === Node.TEXT_NODE;
      });

      if (part3SecondNode) {
        part3SecondState = {
          element: part3SecondSection,
          node: part3SecondNode,
          text: part3SecondNode.data
        };
        part3SecondNode.data = "";
        part3SecondSection.style.visibility = "hidden";
      }
    }
  }

  if (part4FirstText) {
    var part4ContinuationNode = Array.from(
      part4FirstText.childNodes
    ).find(function (node) {
      return node.nodeType === Node.TEXT_NODE;
    });

    if (part4ContinuationNode) {
      part4ContinuationState = {
        element: part4FirstText,
        node: part4ContinuationNode,
        text: part4ContinuationNode.data
      };
      part4ContinuationNode.data = "";
    }
  }

  if (part4LipsTrigger) {
    var part4LipsNode = Array.from(part4LipsTrigger.childNodes).find(
      function (node) {
        return node.nodeType === Node.TEXT_NODE;
      }
    );

    if (part4LipsNode) {
      part4LipsState = {
        element: part4LipsTrigger,
        node: part4LipsNode,
        text: part4LipsNode.data
      };
      part4LipsNode.data = "";
      part4LipsPrompt.style.visibility = "hidden";
    }
  }

  if (part4Final) {
    var part4FinalNode = Array.from(part4Final.childNodes).find(
      function (node) {
        return node.nodeType === Node.TEXT_NODE;
      }
    );

    if (part4FinalNode) {
      part4FinalState = {
        element: part4Final,
        node: part4FinalNode,
        text: part4FinalNode.data
      };
      part4FinalNode.data = "";
      part4Final.style.visibility = "hidden";
    }
  }

  nodes.forEach(function (node) {
    if (part4Previews.some(function (preview) {
      return preview.contains(node);
    })) {
      return;
    }

    if (
      (part4Continuation && part4Continuation.contains(node)) ||
      (part4Final && part4Final.contains(node))
    ) {
      if (!part4ContinuationQueued) {
        characters.push({
          scene: "part-4-continuation",
          element: part4Continuation
        });
        part4ContinuationQueued = true;
      }

      return;
    }

    if (part3SecondSection && part3SecondSection.contains(node)) {
      return;
    }

    if (part3Layout && part3Layout.contains(node)) {
      if (!part3FirstQueued) {
        characters.push({
          scene: "part-3-groups",
          element: part3Layout
        });
        part3FirstQueued = true;
      }

      return;
    }

    if (
      (part2TitleLine && part2TitleLine.contains(node)) ||
      (part2LeadLine && part2LeadLine.contains(node)) ||
      (part2FirstSection && part2FirstSection.contains(node)) ||
      (part2SecondSection && part2SecondSection.contains(node))
    ) {
      return;
    }

    if (
      secondMovement &&
      secondMovement.contains(node) &&
      !secondMovementQueued
    ) {
      characters.push({
        scene: "second-movement",
        element: secondMovement
      });
      secondMovementQueued = true;
    }

    if (footnoteBlock && footnoteBlock.contains(node)) {
      return;
    }

    if (roomSection && roomSection.contains(node)) {
      if (!roomSceneQueued) {
        characters.push({
          scene: "room",
          element: roomSection
        });
        roomSceneQueued = true;
        roomSection.style.visibility = "hidden";
        roomSection.classList.add("is-animating");
      }

      return;
    }

    var parallelGroup = node.parentElement &&
      node.parentElement.closest
      ? node.parentElement.closest(".parallel-group")
      : null;

    if (parallelGroup) {
      if (parallelScenesQueued.indexOf(parallelGroup) === -1) {
        characters.push({
          scene: "parallel",
          element: parallelGroup
        });
        parallelScenesQueued.push(parallelGroup);
      }

      return;
    }

    var footnoteMarker = node.parentElement &&
      node.parentElement.closest
      ? node.parentElement.closest(".footnote-marker")
      : null;

    if (footnoteMarker) {
      if (footnoteScenesQueued.indexOf(footnoteMarker) === -1) {
        var footnoteId = footnoteMarker.getAttribute("data-footnote");

        characters.push({
          scene: "footnote",
          marker: footnoteMarker,
          footnote: footnoteStates[footnoteId]
        });
        footnoteScenesQueued.push(footnoteMarker);
      }

      return;
    }

    var waveElement = node.parentNode &&
      node.parentNode.classList &&
      node.parentNode.classList.contains("wave-decode")
      ? node.parentNode
      : null;

    if (waveElement) {
      if (waveScenesQueued.indexOf(waveElement) === -1) {
        characters.push({
          scene: "wave",
          element: waveElement
        });
        waveScenesQueued.push(waveElement);
      }

      return;
    }

    var parts = segmenter
      ? Array.from(segmenter.segment(node.data), function (item) {
          return item.segment;
        })
      : Array.from(node.data);

    parts.forEach(function (character) {
      characters.push({
        node: node,
        character: character
      });
    });

    node.data = "";
  });

  if (!characters.length) {
    return;
  }

  var cursor = document.createElement("span");
  cursor.className = "typewriter-cursor";
  cursor.setAttribute("aria-hidden", "true");

  var firstTextItem = characters.find(function (item) {
    return item.node;
  });

  if (
    part2FirstState.length &&
    part2FirstState[0].node.parentNode
  ) {
    part2FirstState[0].node.parentNode.insertBefore(
      cursor,
      part2FirstState[0].node.nextSibling
    );
  } else if (
    part3IntroState.length &&
    part3IntroState[0].node.parentNode
  ) {
    part3IntroState[0].node.parentNode.insertBefore(
      cursor,
      part3IntroState[0].node.nextSibling
    );
  } else if (firstTextItem && firstTextItem.node.parentNode) {
    firstTextItem.node.parentNode.insertBefore(
      cursor,
      firstTextItem.node.nextSibling
    );
  } else {
    target.appendChild(cursor);
  }

  target.classList.add("is-typing");

  if (isPart5) {
    target.classList.add("is-part5-coloring");
  }

  var position = 0;
  var timer = 0;
  var finished = false;
  var newline = "\n";
  var atLineStart = true;
  var typedTail = "";
  var sceneTimers = [];
  var backgroundTimers = [];
  var heldBeforeEveryKindIAm = false;
  var heldBeforeAnyTwo = false;
  var heldBeforeHerName = false;
  var heldAfterPart5Melancholy = false;
  var inSecondMovement = false;
  var activeSceneSkip = null;

  function placeCursorAfter(node) {
    if (!node || !node.parentNode) {
      return;
    }

    var part4Button = [part4Trigger, part4LipsTrigger].find(
      function (button) {
        return button && button.contains(node);
      }
    );

    if (part4Button) {
      part4Button.parentNode.insertBefore(
        cursor,
        part4Button.nextSibling
      );
      return;
    }

    node.parentNode.insertBefore(cursor, node.nextSibling);
  }

  function laterInScene(callback, delay) {
    var id = window.setTimeout(callback, delay);
    sceneTimers.push(id);
    return id;
  }

  function clearSceneTimers() {
    sceneTimers.forEach(window.clearTimeout);
    sceneTimers = [];
  }

  function laterInBackground(callback, delay) {
    var id = window.setTimeout(function () {
      var timerIndex = backgroundTimers.indexOf(id);

      if (timerIndex !== -1) {
        backgroundTimers.splice(timerIndex, 1);
      }

      callback();
    }, delay);
    backgroundTimers.push(id);
    return id;
  }

  function clearBackgroundTimers() {
    backgroundTimers.forEach(window.clearTimeout);
    backgroundTimers = [];
  }

  function stopWaveDecodes() {
    clearBackgroundTimers();
    waveDecodeElements.forEach(function (element) {
      element.textContent = element.getAttribute("data-wave-final") || "";
      element.classList.remove("is-decoding");
    });
  }

  function skipActiveScene() {
    if (!activeSceneSkip) {
      return false;
    }

    var skip = activeSceneSkip;
    activeSceneSkip = null;
    clearSceneTimers();
    skip();
    return true;
  }

  function shuffled(items) {
    var result = items.slice();

    for (var index = result.length - 1; index > 0; index -= 1) {
      var randomIndex = Math.floor(Math.random() * (index + 1));
      var temporary = result[index];
      result[index] = result[randomIndex];
      result[randomIndex] = temporary;
    }

    return result;
  }

  function restorePart2FirstSection() {
    if (!part2FirstSection) {
      return;
    }

    part2FirstState.forEach(function (item) {
      item.node.data = item.text;
    });
    part2FirstSection.style.setProperty("--part-2-scale", "1");

    if (part2FirstComposition) {
      part2FirstComposition.style.setProperty(
        "--part-2-exit-scale",
        settings.part2ExitScale.toFixed(2)
      );
    }

    if (part2LipsLine) {
      part2LipsLine.style.setProperty(
        "--x",
        part2LipsFinalX.toFixed(1) + "px"
      );
    }
  }

  function restorePart2SecondSection() {
    if (!part2SecondSection) {
      return;
    }

    part2SecondState.forEach(function (item) {
      item.node.data = item.text;
      item.element.style.fontSize = item.fontSize.toFixed(1) + "px";
    });
    part2SecondSection.style.visibility = "visible";
  }

  function restorePart3FirstSection() {
    cursor.classList.remove("is-part3-parallel-scene");
    part3IntroState.forEach(function (item) {
      item.node.data = item.text;
    });

    part3GroupState.forEach(function (groupState) {
      var finalX = groupState.element.style.getPropertyValue("--fx");
      var finalY = groupState.element.style.getPropertyValue("--fy");

      groupState.element.style.setProperty("--part-3-x", finalX);
      groupState.element.style.setProperty("--part-3-y", finalY);
      groupState.fragments.forEach(function (item) {
        item.node.data = item.text;
        item.element.classList.remove("is-part3-parallel-typing");
      });
    });

    part3EndingState.forEach(function (item) {
      item.node.data = item.text;
      item.element.style.visibility = "visible";
    });
  }

  function restorePart3SecondSection() {
    if (!part3SecondState) {
      return;
    }

    part3SecondState.node.data = part3SecondState.text;
    part3SecondState.element.style.visibility = "visible";
    part3SecondState.element.classList.remove(
      "is-part3-concurrent-typing"
    );
  }

  function restorePart4Continuation() {
    if (
      !part4ContinuationState ||
      !part4LipsState ||
      !part4FinalState
    ) {
      return;
    }

    if (part4TriggerHandler && part4Trigger) {
      part4Trigger.removeEventListener("click", part4TriggerHandler);
      part4TriggerHandler = null;
    }

    if (part4LipsHandler && part4LipsTrigger) {
      part4LipsTrigger.removeEventListener("click", part4LipsHandler);
      part4LipsHandler = null;
    }

    part4ContinuationState.node.data = part4ContinuationState.text;
    part4ContinuationState.element.style.visibility = "visible";
    part4LipsState.node.data = part4LipsState.text;
    part4LipsPrompt.style.visibility = "visible";
    part4FinalState.node.data = part4FinalState.text;
    part4FinalState.element.style.visibility = "visible";

    if (cursor) {
      cursor.classList.remove("is-part4-moving");
      cursor.style.removeProperty("left");
      cursor.style.removeProperty("top");
    }

    if (part4Prompt) {
      part4Prompt.classList.remove("is-ready");
      part4Prompt.classList.add("is-activated");
    }

    if (part4LipsPrompt) {
      part4LipsPrompt.classList.remove("is-ready");
      part4LipsPrompt.classList.add("is-activated");
    }

    if (part4Trigger) {
      part4Trigger.disabled = true;
      part4Trigger.setAttribute("aria-expanded", "true");
    }

    if (part4LipsTrigger) {
      part4LipsTrigger.disabled = true;
      part4LipsTrigger.setAttribute("aria-expanded", "true");
    }
  }

  function animatePart2FirstSection(done) {
    var focusText = "一开一合";
    var lipsItem = part2FirstState.find(function (item) {
      return item.element.classList.contains("part-2-lips-line");
    });
    var pullItem = part2FirstState.find(function (item) {
      return item.element.classList.contains("part-2-pull-word");
    });
    var sequence = [];
    var part2SceneFinished = false;
    var pullSpaces = pullItem
      ? (pullItem.text.match(/^\s*/u) || [""])[0]
      : "";

    if (part2LipsLine) {
      part2LipsLine.style.setProperty(
        "--x",
        part2LipsAlignedX.toFixed(1) + "px"
      );
    }

    function runPart2Zoom(completeZoom) {
      var scaleRange = part2InitialScale - 1;
      var zoomSteps = [
        { fraction: .10, delay: 220 },
        { fraction: .24, delay: 360 },
        { fraction: .38, delay: 180 },
        { fraction: .55, delay: 440 },
        { fraction: .68, delay: 250 },
        { fraction: .85, delay: 390 },
        { fraction: 1, delay: 270 }
      ];

      function applyZoomStep(stepIndex) {
        if (finished || part2SceneFinished) {
          return;
        }

        if (stepIndex >= zoomSteps.length) {
          completeZoom();
          return;
        }

        var step = zoomSteps[stepIndex];
        var scale = 1 + scaleRange * step.fraction;

        part2FirstSection.style.setProperty(
          "--part-2-scale",
          scale.toFixed(3)
        );
        laterInScene(function () {
          applyZoomStep(stepIndex + 1);
        }, step.delay);
      }

      applyZoomStep(0);
    }

    function runPart2ExitZoom(completeZoom) {
      var zoomSteps = [
        { fraction: .10, delay: 210 },
        { fraction: .24, delay: 340 },
        { fraction: .39, delay: 170 },
        { fraction: .56, delay: 430 },
        { fraction: .70, delay: 230 },
        { fraction: .87, delay: 370 },
        { fraction: 1, delay: 290 }
      ];

      function applyZoomStep(stepIndex) {
        if (finished || part2SceneFinished) {
          return;
        }

        if (stepIndex >= zoomSteps.length) {
          completeZoom();
          return;
        }

        var step = zoomSteps[stepIndex];
        var compositionScale = 1 -
          (1 - settings.part2ExitScale) * step.fraction;
        var bodyScale = 1 +
          (part2InitialScale - 1) * (1 - step.fraction);

        if (part2FirstComposition) {
          part2FirstComposition.style.setProperty(
            "--part-2-exit-scale",
            compositionScale.toFixed(3)
          );
        }
        part2FirstSection.style.setProperty(
          "--part-2-scale",
          bodyScale.toFixed(3)
        );
        laterInScene(function () {
          applyZoomStep(stepIndex + 1);
        }, step.delay);
      }

      applyZoomStep(0);
    }

    function adjustPart2LipsLine(completeAdjustment) {
      if (!lipsItem || !part2LipsLine) {
        completeAdjustment();
        return;
      }

      var distance = part2LipsFinalX - part2LipsAlignedX;
      var fontSize = parseFloat(
        window.getComputedStyle(part2LipsLine).fontSize
      ) || 14;
      var spaceWidth = fontSize * .28;
      var stepCount = Math.max(
        1,
        Math.round(Math.abs(distance) / spaceWidth)
      );
      var stepIndex = 0;

      lipsItem.node.parentNode.insertBefore(cursor, lipsItem.node);
      cursor.classList.add("is-part2-line-start");

      function insertNextSpace() {
        if (finished || part2SceneFinished) {
          return;
        }

        if (stepIndex > stepCount) {
          cursor.classList.remove("is-part2-line-start");
          placeCursorAfter(lipsItem.node);
          completeAdjustment();
          return;
        }

        var currentX = part2LipsAlignedX +
          distance * (stepIndex / stepCount);

        part2LipsLine.style.setProperty(
          "--x",
          currentX.toFixed(1) + "px"
        );
        stepIndex += 1;
        laterInScene(insertNextSpace, 88);
      }

      laterInScene(insertNextSpace, 220);
    }

    function insertPart2PullSpaces(sequenceItem, completeInsertion) {
      var pullElement = sequenceItem.item.element;
      var spaceParts = Array.from(pullSpaces);
      var fontSize = parseFloat(
        window.getComputedStyle(pullElement).fontSize
      ) || 14;
      var spaceWidth = fontSize * .28;
      var spacePosition = 0;

      pullElement.insertBefore(cursor, sequenceItem.item.node);
      pullElement.style.setProperty("--part-2-pull-cursor-x", "0px");
      cursor.classList.add("is-part2-pull-insert");

      function insertNextPullSpace() {
        if (finished || part2SceneFinished) {
          return;
        }

        if (spacePosition >= spaceParts.length) {
          cursor.classList.remove("is-part2-pull-insert");
          placeCursorAfter(sequenceItem.item.node);
          completeInsertion();
          return;
        }

        sequenceItem.item.node.insertData(0, spaceParts[spacePosition]);
        spacePosition += 1;
        pullElement.style.setProperty(
          "--part-2-pull-cursor-x",
          (spacePosition * spaceWidth).toFixed(1) + "px"
        );
        laterInScene(insertNextPullSpace, 230);
      }

      laterInScene(
        insertNextPullSpace,
        settings.part2PullCursorPause
      );
    }

    function standardDelay(index) {
      if (index === 0) {
        return 650;
      }

      if (index === 1) {
        return 240;
      }

      if (index === 5) {
        return 650;
      }

      if (index === 7) {
        return 180;
      }

      if (index === 8) {
        return 80;
      }

      return 160;
    }

    part2FirstState.forEach(function (item, index) {
      if (item === lipsItem) {
        var focusPosition = item.text.lastIndexOf(focusText);

        sequence.push({
          item: item,
          text: focusPosition === -1
            ? item.text
            : item.text.slice(0, focusPosition),
          afterDelay: 0
        });

        if (focusPosition !== -1) {
          sequence.push({
            item: item,
            text: focusText,
            beforeDelay: settings.part2FocusPause,
            adjustLipsAfter: true,
            afterDelay: 650
          });
        }

        return;
      }

      sequence.push({
        item: item,
        text: item === pullItem
          ? item.text.slice(pullSpaces.length)
          : item.text,
        beforeDelay: item === pullItem
          ? settings.part2BeforePullPause
          : 0,
        afterDelay: standardDelay(index),
        prepareBody: index === 2,
        isPull: item === pullItem
      });
    });

    function finishPart2FirstScene() {
      if (part2SceneFinished) {
        return;
      }

      part2SceneFinished = true;
      cursor.classList.remove(
        "is-part2-line-start",
        "is-part2-pull-insert"
      );
      restorePart2FirstSection();

      if (pullItem) {
        placeCursorAfter(pullItem.node);
      }

      activeSceneSkip = null;
      done();
    }

    activeSceneSkip = finishPart2FirstScene;

    function typeSequenceItem(sequenceIndex) {
      if (finished || part2SceneFinished) {
        return;
      }

      if (sequenceIndex >= sequence.length) {
        finishPart2FirstScene();
        return;
      }

      var sequenceItem = sequence[sequenceIndex];
      var parts = segmenter
        ? Array.from(
            segmenter.segment(sequenceItem.text),
            function (part) {
              return part.segment;
            }
          )
        : Array.from(sequenceItem.text);
      var characterPosition = 0;

      function beginItem() {
        function typeCharacter() {
          if (finished || part2SceneFinished) {
            return;
          }

          if (characterPosition >= parts.length) {
            if (sequenceItem.adjustLipsAfter) {
              laterInScene(function () {
                adjustPart2LipsLine(function () {
                  laterInScene(function () {
                    typeSequenceItem(sequenceIndex + 1);
                  }, sequenceItem.afterDelay || 0);
                });
              }, settings.part2LipsTabPause);
              return;
            }

            if (sequenceItem.isPull) {
              laterInScene(function () {
                insertPart2PullSpaces(sequenceItem, function () {
                  laterInScene(
                    function () {
                      runPart2ExitZoom(finishPart2FirstScene);
                    },
                    settings.part2AfterPullPause
                  );
                });
              }, settings.part2PullPause);
              return;
            }

            laterInScene(function () {
              typeSequenceItem(sequenceIndex + 1);
            }, sequenceItem.afterDelay || 0);
            return;
          }

          var character = parts[characterPosition];
          sequenceItem.item.node.appendData(character);
          placeCursorAfter(sequenceItem.item.node);
          characterPosition += 1;

          var visibleText = sequenceItem.item.node.data;
          var remainingText = parts.slice(characterPosition).join("");
          var phrasePause = 0;

          if (
            visibleText.endsWith("亲吻空白") ||
            visibleText.endsWith("手指轻轻压上去") ||
            remainingText === "河流"
          ) {
            phrasePause = settings.part2PhrasePause;
          }

          laterInScene(
            typeCharacter,
            phrasePause || (/\s/u.test(character)
              ? 0
              : settings.part2CharacterMin +
                Math.random() * settings.part2CharacterRange)
          );
        }

        typeCharacter();
      }

      if (sequenceItem.prepareBody) {
        placeCursorAfter(sequenceItem.item.node);
        laterInScene(function () {
          runPart2Zoom(beginItem);
        }, settings.part2LeadBlinkPause);
      } else if (sequenceItem.beforeDelay) {
        laterInScene(beginItem, sequenceItem.beforeDelay);
      } else {
        beginItem();
      }
    }

    typeSequenceItem(0);
  }

  function animatePart2SecondSection(done) {
    var authoredSequence = [
      { text: "轻", hold: 1050 },
      { text: "悄悄", hold: 1250 },
      { text: "垂在过去", hold: 1500 },
      { text: "编成", hold: 720 },
      { text: "辫子", hold: 1150 },
      { text: "垂在", hold: 850 },
      { text: "蝴蝶骨", hold: 680 },
      { text: "与蝴蝶骨之间", hold: 1450 },
      { text: "(一小块空白)", hold: 1750 },
      { text: "错失良机的/错过春天的", hold: 1900 },
      { text: "翅膀", hold: 820 },
      { text: "或尾巴", hold: 0 }
    ];
    var sequence = authoredSequence.map(function (sequenceItem) {
      var state = part2SecondState.find(function (item) {
        return item.text === sequenceItem.text;
      });

      return state
        ? {
            state: state,
            hold: sequenceItem.hold
          }
        : null;
    }).filter(Boolean);
    var secondSceneFinished = false;

    function finishPart2SecondScene() {
      if (secondSceneFinished || finished) {
        return;
      }

      secondSceneFinished = true;
      restorePart2SecondSection();

      if (sequence.length) {
        placeCursorAfter(sequence[sequence.length - 1].state.node);
      }

      activeSceneSkip = null;
      done();
    }

    activeSceneSkip = finishPart2SecondScene;
    part2SecondSection.style.visibility = "visible";

    if (!sequence.length) {
      finishPart2SecondScene();
      return;
    }

    placeCursorAfter(sequence[0].state.node);

    function typeSequenceItem(sequenceIndex) {
      if (finished || secondSceneFinished) {
        return;
      }

      if (sequenceIndex >= sequence.length) {
        finishPart2SecondScene();
        return;
      }

      var sequenceItem = sequence[sequenceIndex];
      var state = sequenceItem.state;
      var parts = segmenter
        ? Array.from(segmenter.segment(state.text), function (part) {
            return part.segment;
          })
        : Array.from(state.text);
      var characterPosition = 0;

      placeCursorAfter(state.node);

      function typeCharacter() {
        if (finished || secondSceneFinished) {
          return;
        }

        if (characterPosition >= parts.length) {
          laterInScene(function () {
            typeSequenceItem(sequenceIndex + 1);
          }, sequenceItem.hold);
          return;
        }

        var character = parts[characterPosition];
        state.node.appendData(character);
        placeCursorAfter(state.node);
        characterPosition += 1;
        laterInScene(
          typeCharacter,
          settings.part2SecondCharacterMin +
            Math.random() * settings.part2SecondCharacterRange
        );
      }

      laterInScene(function () {
        state.element.style.fontSize = state.fontSize.toFixed(1) + "px";
        placeCursorAfter(state.node);
        laterInScene(
          typeCharacter,
          settings.part2SecondAfterResizePause
        );
      }, settings.part2SecondBeforeResizePause);
    }

    laterInScene(function () {
      typeSequenceItem(0);
    }, settings.part2SecondEntrancePause);
  }

  function animatePart3Groups(done) {
    var part3SceneFinished = false;
    var part3ConcurrentStarted = false;
    var part3ConcurrentFinished = !part3SecondState;
    var part3AssemblyReady = false;
    var part3EndingStarted = false;
    var part3BaseCharacterDelay =
      settings.characterMin + settings.characterRange / 2;
    var horizontalSteps = [
      { fraction: .14, delay: 160 },
      { fraction: .3, delay: 230 },
      { fraction: .47, delay: 170 },
      { fraction: .64, delay: 250 },
      { fraction: .82, delay: 190 },
      { fraction: 1, delay: 300 }
    ];
    var verticalSteps = [
      { fraction: .22, delay: 190 },
      { fraction: .48, delay: 260 },
      { fraction: .76, delay: 180 },
      { fraction: 1, delay: 320 }
    ];

    function totalStepDelay(steps) {
      return steps.reduce(function (total, step) {
        return total + step.delay;
      }, 0);
    }

    var part3GroupTravelDuration =
      480 +
      totalStepDelay(horizontalSteps) +
      330 +
      totalStepDelay(verticalSteps) +
      420;
    var part3AssemblyDuration =
      part3GroupState.length * part3GroupTravelDuration +
      settings.part3AfterAssemble;

    function visibleCharacterCount(text) {
      var parts = segmenter
        ? Array.from(segmenter.segment(text), function (part) {
            return part.segment;
          })
        : Array.from(text);

      return parts.reduce(function (count, part) {
        return count + (/\s/u.test(part) ? 0 : 1);
      }, 0);
    }

    function getBatchSchedule(groupIndexes) {
      var groupStates = groupIndexes.map(function (groupIndex) {
        return part3GroupState[groupIndex];
      });
      var lineCount = groupStates.reduce(function (count, groupState) {
        return Math.max(
          count,
          groupState ? groupState.fragments.length : 0
        );
      }, 0);
      var lineDurations = [];
      var delays = {};

      for (var lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
        var longestLine = groupStates.reduce(function (count, groupState) {
          var fragment = groupState && groupState.fragments[lineIndex];

          return Math.max(
            count,
            fragment ? visibleCharacterCount(fragment.text) : 0
          );
        }, 0);

        lineDurations[lineIndex] =
          longestLine * part3BaseCharacterDelay;
      }

      groupIndexes.forEach(function (groupIndex) {
        var groupState = part3GroupState[groupIndex];

        delays[groupIndex] = groupState
          ? groupState.fragments.map(function (fragment, lineIndex) {
              var characterCount = visibleCharacterCount(fragment.text);

              return characterCount
                ? lineDurations[lineIndex] / characterCount
                : 0;
            })
          : [];
      });

      return {
        delays: delays,
        lineDurations: lineDurations,
        duration: lineDurations.reduce(function (duration, lineDuration) {
          return duration +
            320 +
            lineDuration +
            settings.part3GroupLineHold;
        }, 0)
      };
    }

    function getPart3ConcurrentDuration() {
      var groupTypingDuration = groupBatches.reduce(
        function (duration, groupIndexes) {
          return duration +
            getBatchSchedule(groupIndexes).duration +
            settings.part3GroupHold;
        },
        0
      );

      return Math.max(
        1,
        groupTypingDuration -
          320 +
          settings.part3BeforeAssemble +
          part3AssemblyDuration -
          180
      );
    }

    function maybeBeginPart3Ending() {
      if (
        finished ||
        part3SceneFinished ||
        part3EndingStarted ||
        !part3AssemblyReady ||
        !part3ConcurrentFinished
      ) {
        return;
      }

      part3EndingStarted = true;
      typeEnding(0);
    }

    function startPart3ConcurrentParagraph() {
      if (part3ConcurrentStarted || !part3SecondState) {
        return;
      }

      part3ConcurrentStarted = true;
      part3SecondState.element.style.visibility = "visible";
      part3SecondState.element.classList.add(
        "is-part3-concurrent-typing"
      );

      var parts = segmenter
        ? Array.from(
            segmenter.segment(part3SecondState.text),
            function (part) {
              return part.segment;
            }
          )
        : Array.from(part3SecondState.text);
      var units = [];

      parts.forEach(function (part) {
        if (
          /\s/u.test(part) &&
          units.length &&
          /\s/u.test(units[units.length - 1])
        ) {
          units[units.length - 1] += part;
        } else {
          units.push(part);
        }
      });

      var unitPosition = 0;
      var unitDelay = getPart3ConcurrentDuration() /
        Math.max(units.length, 1);

      function typeConcurrentUnit() {
        if (finished || part3SceneFinished) {
          return;
        }

        if (unitPosition >= units.length) {
          part3SecondState.element.classList.remove(
            "is-part3-concurrent-typing"
          );
          part3ConcurrentFinished = true;
          maybeBeginPart3Ending();
          return;
        }

        part3SecondState.node.appendData(units[unitPosition]);
        unitPosition += 1;
        laterInScene(typeConcurrentUnit, unitDelay);
      }

      typeConcurrentUnit();
    }

    function typeState(item, completeState, options) {
      options = options || {};
      var parts = segmenter
        ? Array.from(segmenter.segment(item.text), function (part) {
            return part.segment;
          })
        : Array.from(item.text);
      var characterPosition = 0;

      if (options.localCursor) {
        item.element.classList.add("is-part3-parallel-typing");
      } else {
        placeCursorAfter(item.node);
      }

      function typeCharacter() {
        if (finished || part3SceneFinished) {
          return;
        }

        if (characterPosition >= parts.length) {
          item.element.classList.remove("is-part3-parallel-typing");
          completeState();
          return;
        }

        var character = parts[characterPosition];
        item.node.appendData(character);
        characterPosition += 1;

        if (/\s/u.test(character)) {
          while (
            characterPosition < parts.length &&
            /\s/u.test(parts[characterPosition])
          ) {
            item.node.appendData(parts[characterPosition]);
            characterPosition += 1;
          }
        }

        if (!options.localCursor) {
          placeCursorAfter(item.node);
        }

        var pauseBeforeBright =
          options.pauseBeforeBright &&
          parts.slice(characterPosition).join("") === "明亮。";

        laterInScene(
          typeCharacter,
          pauseBeforeBright
            ? settings.part3BeforeBrightPause
            : /\s/u.test(character)
              ? 0
              : options.characterDelay != null
                ? options.characterDelay
                : settings.characterMin +
                  Math.random() * settings.characterRange
        );
      }

      typeCharacter();
    }

    function finishPart3Groups() {
      if (part3SceneFinished || finished) {
        return;
      }

      part3SceneFinished = true;
      cursor.classList.remove("is-part3-parallel-scene");
      restorePart3FirstSection();
      restorePart3SecondSection();

      if (part3EndingState.length) {
        placeCursorAfter(
          part3EndingState[part3EndingState.length - 1].node
        );
      }

      activeSceneSkip = null;
      done();
    }

    activeSceneSkip = finishPart3Groups;

    function typeIntro(introIndex) {
      if (finished || part3SceneFinished) {
        return;
      }

      if (introIndex >= part3IntroState.length) {
        laterInScene(function () {
          typeGroupBatch(0);
        }, 950);
        return;
      }

      typeState(part3IntroState[introIndex], function () {
        laterInScene(function () {
          typeIntro(introIndex + 1);
        }, settings.part3IntroHold);
      });
    }

    var groupBatches = [[0, 1], [2, 3], [4], [5, 6], [7]];

    function typeWholeGroup(
      groupIndex,
      useLocalCursor,
      lineDelays,
      completeGroup
    ) {
      if (finished || part3SceneFinished) {
        return;
      }

      var groupState = part3GroupState[groupIndex];

      if (!groupState) {
        completeGroup();
        return;
      }

      function typeFragment(fragmentIndex) {
        if (finished || part3SceneFinished) {
          return;
        }

        if (fragmentIndex >= groupState.fragments.length) {
          completeGroup();
          return;
        }

        var fragment = groupState.fragments[fragmentIndex];

        if (!useLocalCursor) {
          placeCursorAfter(fragment.node);
        }
        laterInScene(function () {
          typeState(fragment, function () {
            laterInScene(function () {
              typeFragment(fragmentIndex + 1);
            }, settings.part3GroupLineHold);
          }, {
            localCursor: useLocalCursor,
            characterDelay: lineDelays[fragmentIndex]
          });
        }, 320);
      }

      typeFragment(0);
    }

    function typeParallelGroupBatch(
      groupIndexes,
      batchSchedule,
      completeBatch
    ) {
      var groupStates = groupIndexes.map(function (groupIndex) {
        return part3GroupState[groupIndex];
      });
      var lineCount = batchSchedule.lineDurations.length;

      function typeParallelLine(lineIndex) {
        if (finished || part3SceneFinished) {
          return;
        }

        if (lineIndex >= lineCount) {
          completeBatch();
          return;
        }

        var entries = groupStates.map(function (groupState) {
          var fragment = groupState.fragments[lineIndex];
          var parts = segmenter
            ? Array.from(
                segmenter.segment(fragment.text),
                function (part) {
                  return part.segment;
                }
              )
            : Array.from(fragment.text);

          fragment.element.classList.add("is-part3-parallel-typing");
          return {
            item: fragment,
            parts: parts
          };
        });

        laterInScene(function () {
          if (lineIndex === 0 && groupIndexes[0] === 0) {
            startPart3ConcurrentParagraph();
          }

          var lineDuration = batchSchedule.lineDurations[lineIndex];
          var startedAt = Date.now();

          function typeParallelFrame() {
            if (finished || part3SceneFinished) {
              return;
            }

            var elapsed = Date.now() - startedAt;
            var progress = lineDuration
              ? Math.min(1, elapsed / lineDuration)
              : 1;

            entries.forEach(function (entry) {
              var visibleCount = progress >= 1
                ? entry.parts.length
                : Math.max(
                    1,
                    Math.floor(progress * entry.parts.length)
                  );

              entry.item.node.data = entry.parts
                .slice(0, visibleCount)
                .join("");
            });

            if (progress >= 1) {
              entries.forEach(function (entry) {
                entry.item.node.data = entry.item.text;
                entry.item.element.classList.remove(
                  "is-part3-parallel-typing"
                );
              });
              laterInScene(function () {
                typeParallelLine(lineIndex + 1);
              }, settings.part3GroupLineHold);
              return;
            }

            laterInScene(typeParallelFrame, 24);
          }

          typeParallelFrame();
        }, 320);
      }

      typeParallelLine(0);
    }

    function typeGroupBatch(batchIndex) {
      if (finished || part3SceneFinished) {
        return;
      }

      if (batchIndex >= groupBatches.length) {
        cursor.classList.remove("is-part3-parallel-scene");
        laterInScene(function () {
          assembleGroup(0);
        }, settings.part3BeforeAssemble);
        return;
      }

      var groupIndexes = groupBatches[batchIndex];
      var useLocalCursor = groupIndexes.length > 1;
      var batchSchedule = getBatchSchedule(groupIndexes);

      if (useLocalCursor) {
        cursor.classList.add("is-part3-parallel-scene");
      }

      function completeBatch() {
        if (finished || part3SceneFinished) {
          return;
        }

        cursor.classList.remove("is-part3-parallel-scene");
        var lastGroup = part3GroupState[
          groupIndexes[groupIndexes.length - 1]
        ];
        var lastFragment = lastGroup && lastGroup.fragments[
          lastGroup.fragments.length - 1
        ];

        if (lastFragment) {
          placeCursorAfter(lastFragment.node);
        }

        laterInScene(function () {
          typeGroupBatch(batchIndex + 1);
        }, settings.part3GroupHold);
      }

      if (useLocalCursor) {
        typeParallelGroupBatch(
          groupIndexes,
          batchSchedule,
          completeBatch
        );
      } else {
        var groupIndex = groupIndexes[0];

        typeWholeGroup(
          groupIndex,
          false,
          batchSchedule.delays[groupIndex],
          completeBatch
        );
      }
    }

    function assembleGroup(groupIndex) {
      if (finished || part3SceneFinished) {
        return;
      }

      if (groupIndex >= part3GroupState.length) {
        laterInScene(function () {
          part3AssemblyReady = true;
          maybeBeginPart3Ending();
        }, settings.part3AfterAssemble);
        return;
      }

      var groupState = part3GroupState[groupIndex];
      var element = groupState.element;
      var startX = parseFloat(element.style.getPropertyValue("--sx")) || 0;
      var startY = parseFloat(element.style.getPropertyValue("--sy")) || 0;
      var finalX = parseFloat(element.style.getPropertyValue("--fx")) || 0;
      var finalY = parseFloat(element.style.getPropertyValue("--fy")) || 0;
      var axes = groupIndex % 2 === 0 ? ["x", "y"] : ["y", "x"];
      var axisIndex = 0;
      var stepIndex = 0;
      var currentX = startX;
      var currentY = startY;
      var lastFragment = groupState.fragments[
        groupState.fragments.length - 1
      ];

      if (lastFragment) {
        placeCursorAfter(lastFragment.node);
      }

      function moveStep() {
        if (finished || part3SceneFinished) {
          return;
        }

        var steps = axes[axisIndex] === "x"
          ? horizontalSteps
          : verticalSteps;

        if (stepIndex >= steps.length) {
          axisIndex += 1;
          stepIndex = 0;

          if (axisIndex >= axes.length) {
            laterInScene(function () {
              assembleGroup(groupIndex + 1);
            }, 420);
          } else {
            laterInScene(moveStep, 330);
          }

          return;
        }

        var step = steps[stepIndex];

        if (axes[axisIndex] === "x") {
          currentX = startX + (finalX - startX) * step.fraction;
        } else {
          currentY = startY + (finalY - startY) * step.fraction;
        }

        element.style.setProperty(
          "--part-3-x",
          currentX.toFixed(1) + "px"
        );
        element.style.setProperty(
          "--part-3-y",
          currentY.toFixed(1) + "px"
        );
        stepIndex += 1;
        laterInScene(moveStep, step.delay);
      }

      laterInScene(moveStep, 480);
    }

    function typeEnding(lineIndex) {
      if (finished || part3SceneFinished) {
        return;
      }

      if (lineIndex >= part3EndingState.length) {
        laterInScene(
          finishPart3Groups,
          settings.part3AfterEndingPause
        );
        return;
      }

      var line = part3EndingState[lineIndex];

      line.element.style.visibility = "visible";
      placeCursorAfter(line.node);
      laterInScene(function () {
        typeState(line, function () {
          laterInScene(function () {
            typeEnding(lineIndex + 1);
          }, settings.part3EndingLinePause);
        }, {
          pauseBeforeBright: lineIndex === part3EndingState.length - 1
        });
      }, 420);
    }

    typeIntro(0);
  }

  function animatePart4Continuation(done) {
    var part4SceneFinished = false;
    var part4Stage = "waiting-first";
    var firstParts = part4ContinuationState && segmenter
      ? Array.from(
          segmenter.segment(part4ContinuationState.text),
          function (part) {
            return part.segment;
          }
        )
      : part4ContinuationState
        ? Array.from(part4ContinuationState.text)
        : [];
    var lipsParts = part4LipsState && segmenter
      ? Array.from(
          segmenter.segment(part4LipsState.text),
          function (part) {
            return part.segment;
          }
        )
      : part4LipsState
        ? Array.from(part4LipsState.text)
        : [];
    var finalParts = part4FinalState && segmenter
      ? Array.from(
          segmenter.segment(part4FinalState.text),
          function (part) {
            return part.segment;
          }
        )
      : part4FinalState
        ? Array.from(part4FinalState.text)
        : [];
    var firstPosition = 0;
    var lipsPosition = 0;
    var finalPosition = 0;
    var cursorVerticalStops = [.16, .38, .61, .82, 1];
    var cursorHorizontalStops = [.58, 1];

    function clearPart4CursorMove() {
      cursor.classList.remove("is-part4-moving");
      cursor.style.removeProperty("left");
      cursor.style.removeProperty("top");
    }

    function movePart4Cursor(
      targetElement,
      targetNode,
      callback,
      delayScale
    ) {
      if (
        !targetElement ||
        !targetNode ||
        !targetNode.parentNode ||
        !cursor.parentNode
      ) {
        placeCursorAfter(targetNode);
        laterInScene(callback, settings.part4CursorArrivalPause);
        return;
      }

      var sourceRect = cursor.getBoundingClientRect();
      var movementDelayScale = delayScale || 1;
      var layoutRect = target.getBoundingClientRect();
      var destinationRect = targetElement.getBoundingClientRect();
      var sourceLeft = sourceRect.left - layoutRect.left;
      var sourceTop = sourceRect.top - layoutRect.top;
      var destinationLeft = destinationRect.left - layoutRect.left;
      var destinationTop =
        destinationRect.top -
        layoutRect.top +
        Math.max(0, (destinationRect.height - sourceRect.height) / 2);
      var verticalIndex = 0;
      var horizontalIndex = 0;

      target.appendChild(cursor);
      cursor.classList.add("is-part4-moving");
      cursor.style.left = sourceLeft + "px";
      cursor.style.top = sourceTop + "px";

      function settleAtDestination() {
        clearPart4CursorMove();
        placeCursorAfter(targetNode);
        laterInScene(callback, settings.part4CursorArrivalPause);
      }

      function moveHorizontally() {
        if (horizontalIndex >= cursorHorizontalStops.length) {
          settleAtDestination();
          return;
        }

        var progress = cursorHorizontalStops[horizontalIndex];
        var delay =
          settings.part4CursorStepDelays[
            cursorVerticalStops.length + horizontalIndex
          ] * movementDelayScale;

        laterInScene(function () {
          cursor.style.left =
            sourceLeft +
            (destinationLeft - sourceLeft) * progress +
            "px";
          horizontalIndex += 1;
          moveHorizontally();
        }, delay);
      }

      function moveVertically() {
        if (verticalIndex >= cursorVerticalStops.length) {
          moveHorizontally();
          return;
        }

        var progress = cursorVerticalStops[verticalIndex];
        var delay =
          settings.part4CursorStepDelays[verticalIndex] *
          movementDelayScale;

        laterInScene(function () {
          cursor.style.top =
            sourceTop +
            (destinationTop - sourceTop) * progress +
            "px";
          verticalIndex += 1;
          moveVertically();
        }, delay);
      }

      moveVertically();
    }

    function finishPart4Continuation() {
      if (part4SceneFinished || finished) {
        return;
      }

      part4SceneFinished = true;
      part4Stage = "finished";
      restorePart4Continuation();
      placeCursorAfter(part4FinalState.node);

      activeSceneSkip = null;
      done();
    }

    function keepWaitingForPart4Button() {
      if (
        !part4SceneFinished &&
        (part4Stage === "waiting-first" ||
          part4Stage === "waiting-lips")
      ) {
        activeSceneSkip = keepWaitingForPart4Button;
      }
    }

    function typeFinalCharacter() {
      if (finished || part4SceneFinished) {
        return;
      }

      if (finalPosition >= finalParts.length) {
        laterInScene(finishPart4Continuation, 720);
        return;
      }

      part4FinalState.node.appendData(finalParts[finalPosition]);
      finalPosition += 1;
      placeCursorAfter(part4FinalState.node);
      laterInScene(
        typeFinalCharacter,
        settings.part4CharacterMin +
          Math.random() * settings.part4CharacterRange
      );
    }

    function beginFinalTyping() {
      if (
        finished ||
        part4SceneFinished ||
        part4Stage !== "waiting-lips"
      ) {
        return;
      }

      part4Stage = "typing-final";
      activeSceneSkip = finishPart4Continuation;
      part4LipsPrompt.classList.remove("is-ready");
      part4LipsPrompt.classList.add("is-activated");
      part4LipsTrigger.disabled = true;
      part4LipsTrigger.setAttribute("aria-expanded", "true");
      part4FinalState.element.style.visibility = "visible";
      movePart4Cursor(
        part4FinalState.element,
        part4FinalState.node,
        function () {
          laterInScene(
            typeFinalCharacter,
            settings.part4BeforeFinalPause
          );
        }
      );
    }

    function armLipsButton() {
      if (finished || part4SceneFinished) {
        return;
      }

      part4Stage = "waiting-lips";
      part4LipsPrompt.classList.add("is-ready");
      part4LipsPrompt.classList.remove("is-activated");
      part4LipsTrigger.disabled = false;
      part4LipsTrigger.setAttribute("aria-expanded", "false");
      placeCursorAfter(part4LipsTrigger);

      part4LipsHandler = beginFinalTyping;
      part4LipsTrigger.addEventListener("click", part4LipsHandler, {
        once: true
      });
      activeSceneSkip = keepWaitingForPart4Button;
    }

    function typeLipsCharacter() {
      if (finished || part4SceneFinished) {
        return;
      }

      if (lipsPosition >= lipsParts.length) {
        laterInScene(armLipsButton, 420);
        return;
      }

      part4LipsState.node.appendData(lipsParts[lipsPosition]);
      lipsPosition += 1;
      placeCursorAfter(part4LipsState.node);
      laterInScene(
        typeLipsCharacter,
        settings.part4ButtonCharacterDelay
      );
    }

    function revealLipsButton() {
      if (finished || part4SceneFinished) {
        return;
      }

      part4LipsPrompt.style.visibility = "visible";
      part4LipsPrompt.classList.remove("is-ready", "is-activated");
      placeCursorAfter(part4LipsState.node);
      typeLipsCharacter();
    }

    function typeFirstCharacter() {
      if (finished || part4SceneFinished) {
        return;
      }

      if (firstPosition >= firstParts.length) {
        laterInScene(
          revealLipsButton,
          settings.part4BeforeLipsPause
        );
        return;
      }

      var character = firstParts[firstPosition];
      part4ContinuationState.node.appendData(character);
      firstPosition += 1;
      placeCursorAfter(part4ContinuationState.node);
      laterInScene(
        typeFirstCharacter,
        character === "\n"
          ? settings.part4LinePause
          : settings.part4CharacterMin +
            Math.random() * settings.part4CharacterRange
      );
    }

    function beginPart4Typing() {
      if (
        finished ||
        part4SceneFinished ||
        part4Stage !== "waiting-first"
      ) {
        return;
      }

      part4Stage = "typing-first";
      activeSceneSkip = finishPart4Continuation;
      part4Prompt.classList.remove("is-ready");
      part4Prompt.classList.add("is-activated");
      part4Trigger.disabled = true;
      part4Trigger.setAttribute("aria-expanded", "true");
      part4ContinuationState.element.style.visibility = "visible";
      movePart4Cursor(
        part4Continuation,
        part4ContinuationState.node,
        typeFirstCharacter,
        1.25
      );
    }

    if (
      !part4ContinuationState ||
      !part4LipsState ||
      !part4FinalState ||
      !part4Trigger ||
      !part4LipsTrigger
    ) {
      finishPart4Continuation();
      return;
    }

    part4Prompt.classList.add("is-ready");
    part4Prompt.classList.remove("is-activated");
    part4Trigger.disabled = false;
    part4Trigger.setAttribute("aria-expanded", "false");
    placeCursorAfter(part4Trigger);

    part4TriggerHandler = beginPart4Typing;
    part4Trigger.addEventListener("click", part4TriggerHandler, {
      once: true
    });
    activeSceneSkip = keepWaitingForPart4Button;
  }

  function animateRoomScene(done) {
    var words = roomFragments.filter(function (element) {
      return element.classList.contains("room-word");
    });
    var extras = shuffled(roomFragments.filter(function (element) {
      return element.classList.contains("room-extra");
    }));
    var phrase = ["sitting", "in", "a", "room"];
    var wordQueues = {};
    var sequence = [];
    var extraPosition = 0;

    cursor.classList.add("is-scene");
    roomSection.style.visibility = "visible";
    activeSceneSkip = function () {
      roomFragments.forEach(function (element) {
        element.classList.remove("is-room-typing");
        element.classList.add("is-visible");
        element.textContent = element.getAttribute("data-room-final") || "";
      });
      showRoomWindow(completeRoomScene);
    };

    phrase.forEach(function (word) {
      wordQueues[word] = shuffled(words.filter(function (element) {
        return element.getAttribute("data-room-word") === word;
      }));
    });

    for (var round = 0; round < 5; round += 1) {
      phrase.forEach(function (word) {
        sequence.push({
          element: wordQueues[word][round],
          afterDelay: 300
        });
      });

      var extrasThroughThisRound = Math.round(
        (round + 1) * extras.length / 5
      );

      while (extraPosition < extrasThroughThisRound) {
        sequence.push({
          element: extras[extraPosition],
          afterDelay: 300
        });
        extraPosition += 1;
      }

      sequence[sequence.length - 1].afterDelay = 720;
    }

    function typeFragment(element, completeFragment) {
      var finalText = element.getAttribute("data-room-final") || "";
      var parts = segmenter
        ? Array.from(segmenter.segment(finalText), function (item) {
            return item.segment;
          })
        : Array.from(finalText);
      var textNode = document.createTextNode(roomBaselineStrut);
      var characterPosition = 0;

      element.textContent = "";
      element.appendChild(textNode);
      element.classList.add("is-visible", "is-room-typing");

      function typeFragmentCharacter() {
        if (finished) {
          return;
        }

        if (characterPosition >= parts.length) {
          laterInScene(function () {
            element.classList.remove("is-room-typing");
            completeFragment();
          }, 130);
          return;
        }

        var character = parts[characterPosition];
        textNode.appendData(character);
        characterPosition += 1;

        if (/\s/u.test(character)) {
          while (
            characterPosition < parts.length &&
            /\s/u.test(parts[characterPosition])
          ) {
            textNode.appendData(parts[characterPosition]);
            characterPosition += 1;
          }
        }

        laterInScene(
          typeFragmentCharacter,
          /\s/u.test(character)
            ? 0
            : settings.characterMin +
              Math.random() * settings.characterRange
        );
      }

      typeFragmentCharacter();
    }

    function completeRoomScene() {
      roomFragments.forEach(function (element) {
        element.classList.remove("is-room-typing");
        element.classList.add("is-visible");
        element.textContent = element.getAttribute("data-room-final") || "";
      });
      roomSection.classList.remove("is-animating");
      cursor.classList.remove("is-scene");
      placeCursorAfter(roomSection);
      activeSceneSkip = null;
      done();
    }

    function typeSequenceItem(index) {
      if (finished) {
        return;
      }

      if (index >= sequence.length) {
        laterInScene(function () {
          if (!finished) {
            showRoomWindow(completeRoomScene);
          }
        }, 1650);
        return;
      }

      var item = sequence[index];

      typeFragment(item.element, function () {
        laterInScene(function () {
          typeSequenceItem(index + 1);
        }, item.afterDelay);
      });
    }

    laterInScene(function () {
      typeSequenceItem(0);
    }, 620);
  }

  function animateWaveDecode(element, done) {
    var finalCharacter = element.getAttribute("data-wave-final") || "";
    var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{};:,.<>/?\\|~";
    var line = document.createElement("span");
    var tailLength = 18;
    var frame = 0;
    var frameCount = 24;
    var backgroundFinished = false;

    line.className = "wave-scramble-line";
    line.setAttribute("aria-hidden", "true");
    element.textContent = finalCharacter;
    element.appendChild(line);
    element.classList.add("is-decoding");

    function finishBackgroundDecode() {
      if (backgroundFinished) {
        return;
      }

      backgroundFinished = true;
      element.textContent = finalCharacter;
      element.classList.remove("is-decoding");
    }

    function randomSymbol() {
      return symbols.charAt(Math.floor(Math.random() * symbols.length));
    }

    function drawFrame() {
      if (finished) {
        finishBackgroundDecode();
        return;
      }

      var cycleLength = frameCount * 2 - 2;
      var cycleFrame = frame % cycleLength;
      var distanceFromFull = cycleFrame < frameCount
        ? cycleFrame
        : cycleLength - cycleFrame;
      var progress = distanceFromFull / (frameCount - 1);
      var visibleCount = Math.max(
        3,
        Math.ceil((1 - progress) * tailLength)
      );
      var decodedLine = "";

      for (var index = 0; index < visibleCount; index += 1) {
        decodedLine += randomSymbol();
      }

      line.textContent = decodedLine;

      frame += 1;
      laterInBackground(drawFrame, settings.waveFrameDelay);
    }

    drawFrame();
    placeCursorAfter(element);
    done();
  }

  function animateParallelGroup(group, done) {
    var elements = Array.from(
      group.querySelectorAll(".parallel-fragment")
    );
    var remaining = elements.length;
    var parallelFinished = false;

    cursor.classList.add("is-parallel-scene");

    function finishParallelGroup() {
      if (parallelFinished || finished) {
        return;
      }

      parallelFinished = true;
      elements.forEach(function (element) {
        element.textContent = element.getAttribute("data-parallel-final") || "";
        element.classList.add("is-visible");
        element.classList.remove("is-parallel-typing");
      });
      placeCursorAfter(group);
      cursor.classList.remove("is-parallel-scene");
      activeSceneSkip = null;
      done();
    }

    activeSceneSkip = finishParallelGroup;

    function completeElement() {
      remaining -= 1;

      if (remaining > 0) {
        return;
      }

      laterInScene(function () {
        if (finished) {
          return;
        }

        finishParallelGroup();
      }, settings.parallelGroupHold);
    }

    elements.forEach(function (element) {
      var finalText = element.getAttribute("data-parallel-final") || "";
      var parts = segmenter
        ? Array.from(segmenter.segment(finalText), function (item) {
            return item.segment;
          })
        : Array.from(finalText);
      var textNode = document.createTextNode(roomBaselineStrut);
      var characterPosition = 0;

      element.textContent = "";
      element.appendChild(textNode);
      element.classList.add("is-visible", "is-parallel-typing");

      function typeParallelCharacter() {
        if (finished) {
          return;
        }

        if (characterPosition >= parts.length) {
          laterInScene(function () {
            element.textContent = finalText;
            element.classList.remove("is-parallel-typing");
            completeElement();
          }, 130);
          return;
        }

        var character = parts[characterPosition];
        textNode.appendData(character);
        characterPosition += 1;

        if (/\s/u.test(character)) {
          while (
            characterPosition < parts.length &&
            /\s/u.test(parts[characterPosition])
          ) {
            textNode.appendData(parts[characterPosition]);
            characterPosition += 1;
          }
        }

        laterInScene(
          typeParallelCharacter,
          /\s/u.test(character)
            ? 0
            : settings.characterMin +
              Math.random() * settings.characterRange
        );
      }

      typeParallelCharacter();
    });
  }

  function animateFootnoteScene(marker, footnote, done) {
    var remaining = footnote ? 2 : 1;
    var markerText = marker.getAttribute("data-footnote-final") || "";
    var markerParts = Array.from(markerText);
    var markerNode = document.createTextNode(roomBaselineStrut);
    var markerPosition = 0;
    var lineCursor = null;
    var footnoteFinished = false;

    cursor.classList.add("is-parallel-scene");
    marker.textContent = "";
    marker.appendChild(markerNode);
    marker.classList.add("is-visible", "is-footnote-typing");

    if (footnoteRule && !footnoteRule.classList.contains("is-visible")) {
      footnoteRule.textContent =
        footnoteRule.getAttribute("data-footnote-final") || "";
      footnoteRule.classList.add("is-visible");
    }

    function finishFootnoteScene() {
      if (footnoteFinished || finished) {
        return;
      }

      footnoteFinished = true;
      marker.textContent = markerText;
      marker.classList.add("is-visible");
      marker.classList.remove("is-footnote-typing");

      if (footnote) {
        footnote.textNodes.forEach(function (item) {
          item.node.data = item.text;
        });
        footnote.element.classList.add("is-visible");
      }

      if (lineCursor) {
        lineCursor.remove();
      }

      placeCursorAfter(marker);
      cursor.classList.remove("is-parallel-scene");
      activeSceneSkip = null;
      done();
    }

    activeSceneSkip = finishFootnoteScene;

    function completePart() {
      remaining -= 1;

      if (remaining > 0) {
        return;
      }

      laterInScene(function () {
        if (finished) {
          return;
        }

        finishFootnoteScene();
      }, settings.parallelGroupHold);
    }

    function typeMarkerCharacter() {
      if (finished) {
        return;
      }

      if (markerPosition >= markerParts.length) {
        laterInScene(function () {
          marker.textContent = markerText;
          marker.classList.remove("is-footnote-typing");
          completePart();
        }, 130);
        return;
      }

      markerNode.appendData(markerParts[markerPosition]);
      markerPosition += 1;
      laterInScene(
        typeMarkerCharacter,
        settings.characterMin + Math.random() * settings.characterRange
      );
    }

    typeMarkerCharacter();

    if (!footnote) {
      return;
    }

    var lineItems = [];

    footnote.textNodes.forEach(function (item) {
      var parts = segmenter
        ? Array.from(segmenter.segment(item.text), function (part) {
            return part.segment;
          })
        : Array.from(item.text);

      parts.forEach(function (character) {
        lineItems.push({
          node: item.node,
          character: character
        });
      });
    });

    var linePosition = 0;
    lineCursor = document.createElement("span");
    lineCursor.className = "footnote-inline-cursor";
    lineCursor.setAttribute("aria-hidden", "true");
    footnote.element.classList.add("is-visible");

    if (lineItems[0] && lineItems[0].node.parentNode) {
      lineItems[0].node.parentNode.insertBefore(
        lineCursor,
        lineItems[0].node.nextSibling
      );
    }

    function typeLineCharacter() {
      if (finished) {
        return;
      }

      if (linePosition >= lineItems.length) {
        lineCursor.remove();
        completePart();
        return;
      }

      var item = lineItems[linePosition];
      item.node.appendData(item.character);
      item.node.parentNode.insertBefore(lineCursor, item.node.nextSibling);
      linePosition += 1;

      if (/\s/u.test(item.character)) {
        while (
          linePosition < lineItems.length &&
          /\s/u.test(lineItems[linePosition].character)
        ) {
          var whitespaceItem = lineItems[linePosition];
          whitespaceItem.node.appendData(whitespaceItem.character);
          whitespaceItem.node.parentNode.insertBefore(
            lineCursor,
            whitespaceItem.node.nextSibling
          );
          linePosition += 1;
        }
      }

      laterInScene(
        typeLineCharacter,
        /\s/u.test(item.character)
          ? 0
          : settings.characterMin +
            Math.random() * settings.characterRange
      );
    }

    typeLineCharacter();
  }

  function transitionToSecondMovement(done) {
    if (!firstMovement || !secondMovement) {
      done();
      return;
    }

    var transitionFinished = false;
    var movementContinued = false;
    cursor.classList.add("is-movement-transition");

    function revealSecondMovement(useBlankHold) {
      if (transitionFinished || finished) {
        return;
      }

      transitionFinished = true;
      stopWaveDecodes();
      firstMovement.style.display = "none";
      firstMovement.classList.remove("is-clearing");
      secondMovement.style.display = "block";

      if (soundButton) {
        soundButton.hidden = true;
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      if (characters[position] && characters[position].node) {
        placeCursorAfter(characters[position].node);
      }

      function continueSecondMovement() {
        if (movementContinued || finished) {
          return;
        }

        movementContinued = true;
        inSecondMovement = true;
        cursor.classList.remove("is-movement-transition");
        activeSceneSkip = null;
        done();
      }

      if (useBlankHold) {
        activeSceneSkip = continueSecondMovement;
        laterInScene(continueSecondMovement, settings.movementBlankHold);
      } else {
        continueSecondMovement();
      }
    }

    activeSceneSkip = function () {
      revealSecondMovement(false);
    };

    laterInScene(function () {
      if (finished) {
        return;
      }

      firstMovement.classList.add("is-clearing");

      laterInScene(function () {
        revealSecondMovement(true);
      }, settings.movementFade);
    }, settings.movementPause);
  }

  function recordTypedCharacter(character) {
    typedTail = (typedTail + character).slice(-12);

    if (typedTail.indexOf("(=440)") !== -1) {
      reachA440();
    }
  }

  function textStartsAt(index, text) {
    var parts = Array.from(text);

    return parts.every(function (character, offset) {
      return (
        index + offset < characters.length &&
        characters[index + offset].character === character
      );
    });
  }

  function newlineRunEndingAt(index) {
    var length = 1;

    while (
      index - length >= 0 &&
      characters[index - length].character === newline
    ) {
      length += 1;
    }

    return length;
  }

  function delayAfter(character, index) {
    var previous = index > 0
      ? characters[index - 1].character
      : "";

    if (
      roomSection &&
      character === ")" &&
      typedTail.slice(-6) === "(=440)"
    ) {
      return settings.toneHold;
    }

    if (
      roomSection &&
      character === "波" &&
      typedTail.slice(-2) === "与波"
    ) {
      return settings.waveSplitDelay;
    }

    if (
      roomSection &&
      character === "待" &&
      typedTail.slice(-4) === "并非期待"
    ) {
      return settings.afterExpectationDelay;
    }

    if (
      roomSection &&
      character === "眼" &&
      typedTail.slice(-5) === "任意两只眼"
    ) {
      return settings.afterEyesDelay;
    }
    var next = index + 1 < characters.length
      ? characters[index + 1].character
      : "";

    if (character === newline) {
      if (previous === newline && next !== newline) {
        var runLength = newlineRunEndingAt(index);

        return settings.sectionDelay +
          Math.max(0, runLength - 2) * settings.largeGapStep;
      }

      return settings.lineDelay;
    }

    if (/[。！？…]/u.test(character)) {
      return settings.sentenceDelay;
    }

    if (/[，、；：]/u.test(character)) {
      return settings.commaDelay;
    }

    if (/\s/u.test(character)) {
      return settings.spaceDelay;
    }

    if (part2FirstSection) {
      return settings.part2CharacterMin +
        Math.random() * settings.part2CharacterRange;
    }

    if (isPart5) {
      return settings.part5CharacterMin +
        Math.random() * settings.part5CharacterRange;
    }

    return settings.characterMin + Math.random() * settings.characterRange;
  }

  function removeListeners() {
    window.removeEventListener("pointerdown", skipToNextSection);
    window.removeEventListener("keydown", handleKeydown);
  }

  function keepCursorBlinking() {
    cursor.classList.remove(
      "is-scene",
      "is-movement-transition",
      "is-parallel-scene",
      "is-part3-parallel-scene",
      "is-part2-line-start",
      "is-part2-pull-insert",
      "is-part5-spinner-scene"
    );
    cursor.classList.add("is-finished");
  }

  function startPart5Spinner() {
    if (
      !part5Spinner ||
      !part5SpinnerWord ||
      part5SpinnerRunning
    ) {
      return;
    }

    var frames = ["-", "\\", "|", "/"];

    function showNextSpinnerFrame() {
      if (!part5SpinnerRunning) {
        return;
      }

      var frame = frames[part5SpinnerFrame % frames.length];
      var delay = frame === "-" || frame === "|"
        ? settings.part5SpinnerAxisDelay
        : settings.part5SpinnerDiagonalDelay;

      part5Spinner.textContent = frame;
      part5SpinnerFrame += 1;
      part5SpinnerTimer = window.setTimeout(
        showNextSpinnerFrame,
        delay
      );
    }

    part5SpinnerRunning = true;
    cursor.classList.add("is-part5-spinner-scene");
    part5Spinner.classList.add("is-active");
    target.classList.remove("is-part5-coloring");
    target.classList.add("is-part5-peach");

    part5VanishTimer = window.setTimeout(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          target.classList.add("is-part5-vanishing");
          document.body.classList.add("is-part5-vanishing");
          document.documentElement.classList.add("is-part5-vanishing");
        });
      });
    }, settings.part5BeforeVanishPause);

    showNextSpinnerFrame();
  }

  function complete() {
    finished = true;
    target.classList.remove("is-typing");

    if (part5Spinner) {
      startPart5Spinner();
    } else {
      keepCursorBlinking();
    }

    removeListeners();
  }

  function typeNext() {
    if (finished) {
      return;
    }

    if (position >= characters.length) {
      complete();
      return;
    }

    if (characters[position].scene === "part-2-first") {
      position += 1;
      animatePart2FirstSection(function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "part-2-second") {
      position += 1;
      animatePart2SecondSection(function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "part-3-groups") {
      position += 1;
      animatePart3Groups(function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "part-4-continuation") {
      position += 1;
      animatePart4Continuation(function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "room") {
      position += 1;
      animateRoomScene(function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "wave") {
      var waveElement = characters[position].element;
      position += 1;
      animateWaveDecode(waveElement, function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "second-movement") {
      position += 1;
      transitionToSecondMovement(function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "parallel") {
      var parallelGroup = characters[position].element;
      position += 1;
      animateParallelGroup(parallelGroup, function () {
        timer = window.setTimeout(typeNext, settings.lineDelay);
      });
      return;
    }

    if (characters[position].scene === "footnote") {
      var footnoteItem = characters[position];
      position += 1;
      animateFootnoteScene(
        footnoteItem.marker,
        footnoteItem.footnote,
        function () {
          timer = window.setTimeout(typeNext, settings.lineDelay);
        }
      );
      return;
    }

    if (atLineStart) {
      var movedToFirstCharacter = false;

      while (
        position < characters.length &&
        /[\t \u00a0]/u.test(characters[position].character)
      ) {
        var whitespace = characters[position];
        whitespace.node.appendData(whitespace.character);
        placeCursorAfter(whitespace.node);
        recordTypedCharacter(whitespace.character);
        position += 1;
        movedToFirstCharacter = true;
      }

      atLineStart = false;

      if (
        movedToFirstCharacter &&
        position < characters.length &&
        characters[position].character !== newline
      ) {
        timer = window.setTimeout(typeNext, settings.lineStartHold);
        return;
      }
    }

    if (
      position < characters.length &&
      /[\t \u00a0]/u.test(characters[position].character)
    ) {
      while (
        position < characters.length &&
        /[\t \u00a0]/u.test(characters[position].character)
      ) {
        var inlineWhitespace = characters[position];
        inlineWhitespace.node.appendData(inlineWhitespace.character);
        recordTypedCharacter(inlineWhitespace.character);
        position += 1;
      }

      placeCursorAfter(inlineWhitespace.node);
      timer = window.setTimeout(typeNext, 0);
      return;
    }

    if (
      roomSection &&
      !heldBeforeHerName &&
      textStartsAt(position, "她的名字")
    ) {
      heldBeforeHerName = true;
      timer = window.setTimeout(typeNext, settings.beforeHerNameDelay);
      return;
    }

    if (
      isPart5 &&
      !heldAfterPart5Melancholy &&
      typedTail.slice(-3) === "忧郁里"
    ) {
      heldAfterPart5Melancholy = true;
      timer = window.setTimeout(
        typeNext,
        settings.part5AfterMelancholyPause
      );
      return;
    }

    if (
      roomSection &&
      !heldBeforeAnyTwo &&
      textStartsAt(position, "任意两个")
    ) {
      heldBeforeAnyTwo = true;
      timer = window.setTimeout(typeNext, settings.beforeAnyTwoDelay);
      return;
    }

    if (
      roomSection &&
      !heldBeforeEveryKindIAm &&
      characters[position].character === "I" &&
      typedTail.slice(-4) === "每一种 "
    ) {
      heldBeforeEveryKindIAm = true;
      timer = window.setTimeout(typeNext, settings.phraseLeadDelay);
      return;
    }

    var item = characters[position];
    item.node.appendData(item.character);
    placeCursorAfter(item.node);
    recordTypedCharacter(item.character);
    position += 1;

    if (item.character === newline) {
      atLineStart = true;
    }

    timer = window.setTimeout(
      typeNext,
      delayAfter(item.character, position - 1)
    );
  }

  function skipToNextSection(event) {
    if (
      finished ||
      (event && typeof event.button === "number" && event.button !== 0)
    ) {
      return;
    }

    if (
      event &&
      event.target &&
      event.target.closest &&
      event.target.closest("a, button, .room-window")
    ) {
      return;
    }

    if (roomWindow && !roomWindow.hidden) {
      return;
    }

    window.clearTimeout(timer);

    if (skipActiveScene()) {
      return;
    }

    var sawContent = false;
    var newlineRun = 0;
    var lastNode = null;

    while (position < characters.length) {
      var item = characters[position];

      if (item.scene) {
        break;
      }

      item.node.appendData(item.character);
      recordTypedCharacter(item.character);
      lastNode = item.node;
      position += 1;

      if (item.character === newline) {
        atLineStart = true;
        newlineRun += 1;

        if (sawContent && newlineRun >= 2) {
          while (
            position < characters.length &&
            characters[position].character === newline
          ) {
            var extraNewline = characters[position];
            extraNewline.node.appendData(extraNewline.character);
            recordTypedCharacter(extraNewline.character);
            lastNode = extraNewline.node;
            position += 1;
          }

          break;
        }
      } else if (!/[\t \u00a0]/u.test(item.character)) {
        atLineStart = false;
        sawContent = true;
        newlineRun = 0;
      }
    }

    if (lastNode) {
      placeCursorAfter(lastNode);
    }

    if (position >= characters.length) {
      complete();
      return;
    }

    timer = window.setTimeout(typeNext, 140);
  }

  function revealAll() {
    if (finished) {
      return;
    }

    if (roomWindow && !roomWindow.hidden) {
      return;
    }

    window.clearTimeout(timer);
    clearSceneTimers();
    stopWaveDecodes();
    activeSceneSkip = null;

    if (part5Spinner) {
      window.clearTimeout(part5SpinnerTimer);
      window.clearTimeout(part5VanishTimer);
      part5Spinner.textContent = "";
      part5Spinner.classList.remove("is-active");
      part5SpinnerRunning = false;
      part5SpinnerFrame = 0;
      cursor.classList.remove("is-part5-spinner-scene");
      target.classList.remove("is-part5-vanishing");
      document.body.classList.remove("is-part5-vanishing");
      document.documentElement.classList.remove("is-part5-vanishing");
    }

    if (isPart5) {
      target.classList.remove("is-part5-coloring");
      target.classList.add("is-part5-peach");
    }

    if (part2FirstState.length) {
      restorePart2FirstSection();
    }

    if (part2SecondState.length) {
      restorePart2SecondSection();
    }

    if (part3IntroState.length) {
      restorePart3FirstSection();
    }

    if (part3SecondState) {
      restorePart3SecondSection();
    }

    if (part4ContinuationState) {
      restorePart4Continuation();
    }

    if (roomSection) {
      roomSection.style.visibility = "visible";
      roomSection.classList.remove("is-animating");
      roomFragments.forEach(function (element) {
        element.textContent = element.getAttribute("data-room-final") || "";
        element.classList.add("is-visible");
        element.classList.remove("is-room-typing");
      });
    }

    parallelFragments.forEach(function (element) {
      element.textContent = element.getAttribute("data-parallel-final") || "";
      element.classList.add("is-visible");
      element.classList.remove("is-parallel-typing");
    });

    footnoteMarkers.forEach(function (element) {
      element.textContent = element.getAttribute("data-footnote-final") || "";
      element.classList.add("is-visible");
      element.classList.remove("is-footnote-typing");
    });

    Object.keys(footnoteStates).forEach(function (id) {
      var footnote = footnoteStates[id];

      footnote.textNodes.forEach(function (item) {
        item.node.data = item.text;
      });
      footnote.element.classList.add("is-visible");
    });

    if (footnoteRule) {
      footnoteRule.textContent =
        footnoteRule.getAttribute("data-footnote-final") || "";
      footnoteRule.classList.add("is-visible");
    }

    target.querySelectorAll(".footnote-inline-cursor").forEach(function (item) {
      item.remove();
    });

    if (firstMovement && secondMovement) {
      firstMovement.classList.remove("is-clearing");
      firstMovement.style.display = inSecondMovement ? "none" : "block";
      secondMovement.style.display = "block";
    }

    var revealedLastNode = null;

    while (position < characters.length) {
      var item = characters[position];

      if (item.node) {
        item.node.appendData(item.character);
        revealedLastNode = item.node;
      }

      position += 1;
    }

    reachA440();
    hideRoomWindow();

    finished = true;
    target.classList.remove("is-typing");

    if (footnoteMarkers.length) {
      placeCursorAfter(footnoteMarkers[footnoteMarkers.length - 1]);
    } else if (part3EndingState.length) {
      placeCursorAfter(
        part3EndingState[part3EndingState.length - 1].node
      );
    } else if (part3SecondState) {
      placeCursorAfter(part3SecondState.node);
    } else if (part4FinalState) {
      placeCursorAfter(part4FinalState.node);
    } else if (part2SecondState.length) {
      placeCursorAfter(
        part2SecondState[part2SecondState.length - 1].node
      );
    } else if (revealedLastNode) {
      placeCursorAfter(revealedLastNode);
    }

    if (part5Spinner) {
      startPart5Spinner();
    } else {
      keepCursorBlinking();
    }

    removeListeners();
  }

  function handleKeydown(event) {
    if (
      event.target &&
      event.target.closest &&
      event.target.closest(
        ".sound-toggle, .room-window, .part-4-trigger, " +
          ".part-4-lips-trigger"
      )
    ) {
      return;
    }

    if ([" ", "Enter", "Escape"].indexOf(event.key) === -1) {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }

    revealAll();
  }

  window.addEventListener("pointerdown", skipToNextSection);
  window.addEventListener("keydown", handleKeydown);

  timer = window.setTimeout(typeNext, settings.initialDelay);
})();
