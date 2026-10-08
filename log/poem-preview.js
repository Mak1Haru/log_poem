(function () {
  "use strict";

  var card = document.querySelector(".poem-preview-card");
  var triggers = Array.from(document.querySelectorAll(".poem-preview-trigger"));

  if (!card || !triggers.length) {
    return;
  }

  var frame = card.querySelector(".poem-preview-frame");
  var anchor = triggers.find(function (trigger) {
    return trigger.classList.contains("map-number");
  }) || triggers[0];
  var activeTrigger = anchor;
  var closeTimer = 0;
  var fadeTimer = 0;
  var fadeDuration = 1000;
  var fadingOut = false;
  var fadeRestoreFocus = false;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var previewSession = 0;
  var pinned = false;
  var restoringFocus = false;
  card.style.setProperty("--poem-preview-fade-duration", fadeDuration + "ms");

  function isInside(target) {
    return target instanceof Node && (
      card.contains(target) || triggers.some(function (trigger) {
        return trigger.contains(target);
      })
    );
  }

  function cancelClose() {
    window.clearTimeout(closeTimer);
    closeTimer = 0;
    window.clearTimeout(fadeTimer);
    fadeTimer = 0;
  }

  function positionCard() {
    if (card.hidden) {
      return;
    }

    var rect = window.PoemView.rect(anchor);
    var width = card.offsetWidth;
    var height = card.offsetHeight;
    var viewport = window.PoemView.viewport();
    var viewportWidth = viewport.width;
    var viewportHeight = viewport.height;
    var left = rect.right + 10;

    if (left + width > viewportWidth - 12) {
      left = rect.left - width - 10;
    }

    card.style.left = Math.max(12, Math.min(left, viewportWidth - width - 12)) + "px";
    card.style.top = Math.max(12, Math.min(rect.top + 7, viewportHeight - height - 12)) + "px";
  }

  function openPreview(trigger) {
    activeTrigger = trigger;

    if (fadingOut) {
      closePreview(false);
    }

    if (card.hidden) {
      cancelClose();
      previewSession += 1;
      var source = new URL(frame.getAttribute("data-src"), window.location.href);
      source.searchParams.set("previewSession", String(previewSession));
      card.hidden = false;
      frame.src = source.href;
      triggers.forEach(function (item) {
        item.setAttribute("aria-expanded", "true");
      });
    }

    positionCard();
  }

  function closePreview(restoreFocus) {
    cancelClose();
    card.hidden = true;
    fadingOut = false;
    fadeRestoreFocus = false;
    card.classList.remove("is-fading-out");
    pinned = false;
    frame.removeAttribute("src");
    triggers.forEach(function (item) {
      item.setAttribute("aria-expanded", "false");
    });

    if (restoreFocus) {
      restoringFocus = true;
      activeTrigger.focus({ preventScroll: true });
      restoringFocus = false;
    }
  }

  function finishFade() {
    if (fadingOut) {
      closePreview(fadeRestoreFocus);
    }
  }

  function fadeOutPreview() {
    closeTimer = 0;
    if (card.hidden || fadingOut) {
      return;
    }

    fadeRestoreFocus = card.contains(document.activeElement);
    if (reduceMotion.matches) {
      closePreview(fadeRestoreFocus);
      return;
    }

    fadingOut = true;
    card.classList.add("is-fading-out");
    // Keep the iframe visible until the transition ends; the timer is a safety net.
    fadeTimer = window.setTimeout(finishFade, fadeDuration + 150);
  }

  card.addEventListener("transitionend", function (event) {
    if (event.target === card && event.propertyName === "opacity") {
      finishFade();
    }
  });

  function closeAfterPlayback() {
    if (closeTimer || fadingOut) {
      return;
    }

    // Completion already includes the final typing pause; leave a little reading time.
    closeTimer = window.setTimeout(fadeOutPreview, 2000);
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "mouse") {
        openPreview(trigger);
      }
    });
    trigger.addEventListener("focus", function () {
      if (!restoringFocus) {
        openPreview(trigger);
      }
    });
    trigger.addEventListener("click", function () {
      if (!card.hidden && pinned) {
        closePreview(false);
        return;
      }

      openPreview(trigger);
      pinned = true;
      card.focus({ preventScroll: true });
    });
  });

  document.addEventListener("pointerdown", function (event) {
    if (!card.hidden && !isInside(event.target)) {
      closePreview(false);
    }
  });
  document.addEventListener("focusin", function (event) {
    if (!card.hidden && !isInside(event.target)) {
      closePreview(false);
    }
  });
  document.addEventListener("keydown", function (event) {
    if (!card.hidden && event.key === "Escape") {
      event.preventDefault();
      closePreview(true);
    }
  });
  window.addEventListener("message", function (event) {
    // File URLs may serialize their origin as either "null" or "file://".
    // Still require the exact iframe source and the current playback session.
    var localFileOrigin = window.location.protocol === "file:" &&
      (event.origin === "null" || event.origin === "file://");

    if (
      card.hidden ||
      event.source !== frame.contentWindow ||
      (event.origin !== window.location.origin && !localFileOrigin) ||
      !event.data
    ) {
      return;
    }

    if (event.data.type === "part-4-preview-close") {
      closePreview(true);
    } else if (
      event.data.type === "part-4-preview-complete" &&
      event.data.session === String(previewSession)
    ) {
      closeAfterPlayback();
    }
  });
  window.addEventListener("resize", positionCard);
  window.addEventListener("scroll", positionCard, true);
})();
