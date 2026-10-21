(function () {
  "use strict";

  var root = document.documentElement;
  var preview = new URLSearchParams(window.location.search).get("preview") === "1";
  // Match the CSS breakpoint exactly, including when the device rotates.
  var narrow = window.matchMedia("(max-width: 919px)");

  // Retire the old choice. Legacy ?layout= links are deliberately ignored;
  // they must not force a phone back into the shrunken desktop composition.
  try {
    localStorage.removeItem("poem-layout-mode");
  } catch (error) { /* Local-file/private browsing may disable storage. */ }

  function update() {
    root.classList.toggle("poem-layout-flow", !preview && narrow.matches);
    root.classList.toggle("poem-layout-original", !preview && !narrow.matches);
  }

  // Both layouts now use normal CSS pixels, with no outer page zoom.
  // Keep this shared geometry API for the existing poem animations/previews.
  function rect(element) {
    var bounds = element.getBoundingClientRect();
    var result = {};
    ["x", "y", "left", "right", "top", "bottom", "width", "height"].forEach(function (key) {
      result[key] = bounds[key];
    });
    return result;
  }

  window.PoemView = {
    rect: rect,
    scale: function () { return 1; },
    isFlow: function () { return !preview && narrow.matches; },
    viewport: function () {
      return {
        width: root.clientWidth || window.innerWidth,
        height: window.innerHeight
      };
    }
  };

  update();
  window.addEventListener("resize", update);
  if (narrow.addEventListener) {
    narrow.addEventListener("change", update);
  } else if (narrow.addListener) {
    narrow.addListener(update);
  }
  document.addEventListener("DOMContentLoaded", update);
})();
