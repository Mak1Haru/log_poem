(function () {
  "use strict";

  var root = document.documentElement;
  var params = new URLSearchParams(window.location.search);
  var preview = params.get("preview") === "1";
  var storageKey = "poem-layout-mode";
  var requested = params.get("layout");
  var mode = "original";
  try {
    var saved = localStorage.getItem(storageKey);
    if (saved === "original" || saved === "flow") mode = saved;
  } catch (error) { /* Local-file/private browsing may disable storage. */ }
  if (requested === "original" || requested === "flow") mode = requested;
  if (!preview) root.classList.add("poem-layout-" + mode);

  var scale = 1;
  function update() {
    var width = root.clientWidth || window.innerWidth;
    var compact = !preview && width < 920;
    scale = compact && mode === "original" ? width / 920 : 1;
    root.style.setProperty("--poem-page-scale", String(scale));
    root.style.setProperty("--poem-viewport-width", width / scale + "px");
    // Leave the layout selector its own space below the fixed composition.
    root.style.setProperty("--poem-viewport-height", (window.innerHeight - (compact ? 56 : 0)) / scale + "px");
  }

  // Animation geometry is expressed in the original page's CSS pixels.
  // Undo only the outer page zoom, never the poem's own animated transforms.
  function rect(element) {
    var bounds = element.getBoundingClientRect();
    var result = {};
    ["x", "y", "left", "right", "top", "bottom", "width", "height"].forEach(function (key) {
      result[key] = bounds[key] / scale;
    });
    return result;
  }

  window.PoemView = {
    rect: rect,
    scale: function () { return scale; },
    isFlow: function () { return mode === "flow" && !preview; },
    viewport: function () {
      return { width: root.clientWidth / scale, height: window.innerHeight / scale };
    }
  };
  update();
  window.addEventListener("resize", update);

  document.addEventListener("DOMContentLoaded", function () {
    update();
    if (preview) return;
    if (window.ResizeObserver) {
      new ResizeObserver(update).observe(root);
    }

    var control = document.createElement("nav");
    control.className = "layout-mode-control";
    control.setAttribute("aria-label", "手机排版方式");
    control.title = "切换排版会重新播放当前页动画";
    var nextMode = mode === "original" ? "flow" : "original";
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = nextMode === "flow" ? "切换为手机分行" : "切换为原版排版";
    button.addEventListener("click", function () {
      try { localStorage.setItem(storageKey, nextMode); } catch (error) {}
      var url = new URL(window.location.href);
      url.searchParams.set("layout", nextMode);
      window.location.replace(url.href);
    });
    control.appendChild(button);
    document.body.appendChild(control);

    // Also carry the choice in links, so it works when opening local HTML
    // files even in browsers that restrict localStorage for file:// URLs.
    document.querySelectorAll("a[href]").forEach(function (link) {
      var url = new URL(link.getAttribute("href"), window.location.href);
      if (url.origin === window.location.origin && /(?:\/|\.html)$/.test(url.pathname)) {
        url.searchParams.set("layout", mode);
        link.href = url.href;
      }
    });
  });
})();
