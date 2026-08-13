(function () {
  "use strict";

  var shell = document.querySelector(".part-6-shell");
  var openCommand = document.querySelector(".part-6-open-command");
  var shellCursor = document.querySelector(".part-6-shell-cursor");
  var viScreen = document.querySelector(".part-6-vi-screen");
  var fileText = document.querySelector(".part-6-file-text");
  var fileCursor = document.querySelector(".part-6-file-cursor");
  var quitCommand = document.querySelector(".part-6-quit-command");
  var commandCursor = document.querySelector(".part-6-command-cursor");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var shellText = "root@localhost: ~ % vi sky.txt";
  var fileCopy =
    "READ ONLY / WRITE ONLY\n" +
    "仅可读取 / 仅可写入";
  var quitText = ":q!";
  var opened = false;
  var quitReady = false;

  if (
    !shell ||
    !openCommand ||
    !shellCursor ||
    !viScreen ||
    !fileText ||
    !fileCursor ||
    !quitCommand ||
    !commandCursor
  ) {
    return;
  }

  function later(callback, delay) {
    return window.setTimeout(callback, delay);
  }

  function typeText(options) {
    var parts = "Segmenter" in Intl
      ? Array.from(
          new Intl.Segmenter("zh-Hans", { granularity: "grapheme" })
            .segment(options.text),
          function (item) {
            return item.segment;
          }
        )
      : Array.from(options.text);
    var position = 0;
    var atLineStart = true;

    function typeNext() {
      if (position >= parts.length) {
        options.done();
        return;
      }

      if (atLineStart) {
        while (position < parts.length && parts[position] === " ") {
          options.node.appendData(parts[position]);
          position += 1;
        }
        atLineStart = false;
      }

      if (position >= parts.length) {
        options.done();
        return;
      }

      var character = parts[position];
      options.node.appendData(character);
      position += 1;

      if (character === "\n") {
        atLineStart = true;
      }

      later(
        typeNext,
        character === "\n"
          ? options.linePause
          : options.characterMin +
            Math.random() * options.characterRange
      );
    }

    typeNext();
  }

  function armQuitCommand() {
    quitReady = true;
    quitCommand.classList.add("is-ready");
    quitCommand.setAttribute("aria-disabled", "false");
    quitCommand.setAttribute("tabindex", "0");
  }

  function typeQuitCommand() {
    commandCursor.hidden = false;
    typeText({
      node: quitCommand.firstChild,
      text: quitText,
      characterMin: 210,
      characterRange: 55,
      linePause: 0,
      done: function () {
        later(armQuitCommand, 420);
      }
    });
  }

  function showCompleteVi() {
    fileText.firstChild.data = fileCopy;
    fileCursor.hidden = true;
    quitCommand.firstChild.data = quitText;
    commandCursor.hidden = false;
    armQuitCommand();
  }

  function openVi() {
    if (opened) {
      return;
    }

    opened = true;
    openCommand.disabled = true;
    openCommand.classList.remove("is-ready");
    openCommand.setAttribute("aria-expanded", "true");
    shellCursor.hidden = true;

    later(function () {
      shell.hidden = true;
      viScreen.hidden = false;

      if (reduceMotion.matches) {
        showCompleteVi();
        return;
      }

      fileCursor.hidden = false;
      typeText({
        node: fileText.firstChild,
        text: fileCopy,
        characterMin: 78,
        characterRange: 28,
        linePause: 900,
        done: function () {
          fileCursor.hidden = true;
          later(typeQuitCommand, 1700);
        }
      });
    }, reduceMotion.matches ? 0 : 360);
  }

  function armOpenCommand() {
    openCommand.disabled = false;
    openCommand.classList.add("is-ready");
  }

  openCommand.appendChild(document.createTextNode(""));
  fileText.appendChild(document.createTextNode(""));
  quitCommand.appendChild(document.createTextNode(""));
  openCommand.addEventListener("click", openVi, { once: true });
  quitCommand.addEventListener("click", function (event) {
    if (!quitReady) {
      event.preventDefault();
    }
  });

  if (reduceMotion.matches) {
    openCommand.firstChild.data = shellText;
    shellCursor.hidden = false;
    armOpenCommand();
    return;
  }

  later(function () {
    shellCursor.hidden = false;
    typeText({
      node: openCommand.firstChild,
      text: shellText,
      characterMin: 72,
      characterRange: 32,
      linePause: 0,
      done: function () {
        later(armOpenCommand, 520);
      }
    });
  }, 900);
})();
