(function () {
  "use strict";

  var english = document.querySelector(".part-1 .footnote-english");
  var reference = document.querySelector(
    '.part-1 .footnote-line[data-footnote="3"] .footnote-copy'
  );

  if (!english || !reference) {
    return;
  }

  // Capture the initials before the typewriter clears the text. Alignment must
  // remain fixed as more characters appear, rather than following the cursor.
  var englishInitial = Array.from(english.textContent.trim())[0];
  var referenceInitial = Array.from(reference.textContent.trim())[0];
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
  }

  alignInk();

  if (document.fonts) {
    document.fonts.ready.then(alignInk);
    document.fonts.addEventListener("loadingdone", alignInk);
  }

  window.addEventListener("resize", alignInk);
})();
