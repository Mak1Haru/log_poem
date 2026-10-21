(function () {
  "use strict";

  var english = document.querySelector(".part-1 .footnote-english");
  var reference = document.querySelector(
    '.part-1 .footnote-line[data-footnote="3"] .footnote-copy'
  );
  var work = document.querySelector(".part-1 .work");
  var serif = document.querySelector(".part-1 .footnote-term");

  if (!english || !reference) {
    return;
  }

  // Capture the initials before the typewriter clears the text. Alignment must
  // remain fixed as more characters appear, rather than following the cursor.
  var englishInitial = Array.from(english.textContent.trim())[0];
  var referenceInitial = Array.from(reference.textContent.trim())[0];
  // Use one shared CJK sample for both faces, captured before typing starts.
  // Every character is present in the small downloadable fallback as well.
  // Measuring the complete sample keeps the correction independent of which
  // word (or which part of a word) is currently being typed.
  var cjkSample = Array.from(new Set(Array.from(document.querySelectorAll(
    ".part-1 .footnote-term, .part-1 .footnote-chinese"
  )).map(function (element) {
    return element.textContent;
  }).join("").match(/[\u3400-\u9fff]/g) || [])).join("");
  var context = document.createElement("canvas").getContext("2d");

  if (!context || !englishInitial || !referenceInitial) {
    return;
  }

  function inkInset(element, initial) {
    var style = window.getComputedStyle(element);
    context.font = style.fontStyle + " " + style.fontWeight + " " +
      style.fontSize + " " + style.fontFamily;
    context.textAlign = "left";
    return -context.measureText(initial).actualBoundingBoxLeft /
      parseFloat(style.fontSize);
  }

  function alignInk() {
    var inset = inkInset(reference, referenceInitial) -
      inkInset(english, englishInitial);

    if (Number.isFinite(inset)) {
      english.style.setProperty("--footnote-ink-inset", inset + "em");
    }

    if (work && serif && cjkSample) {
      var bodyBottom = cjkBottom(window.getComputedStyle(work));
      var serifBottom = cjkBottom(window.getComputedStyle(serif));
      var shift = bodyBottom - serifBottom;

      if (Number.isFinite(shift)) {
        work.style.setProperty("--poem-serif-baseline-shift", shift + "em");
      }
    }
  }

  function cjkBottom(style) {
    // A large measurement size avoids pixel rounding at the 11/14px display
    // sizes. Oblique synthesis changes x, not y, so use upright ink metrics.
    context.font = "normal " + style.fontWeight + " 1000px " + style.fontFamily;
    context.textBaseline = "alphabetic";
    return context.measureText(cjkSample).actualBoundingBoxDescent / 1000;
  }

  alignInk();

  if (document.fonts) {
    document.fonts.ready.then(alignInk);
    document.fonts.addEventListener("loadingdone", alignInk);
  }

  window.addEventListener("resize", alignInk);
})();
