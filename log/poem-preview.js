(function () {
  "use strict";

  var card = document.querySelector(".poem-preview-card");
  var triggers = Array.from(document.querySelectorAll(".poem-preview-trigger"));

  if (!card || !triggers.length) {
    return;
  }

  var frame = card.querySelector(".poem-preview-frame");
  var closeButton = card.querySelector(".poem-preview-close");
  var anchor = triggers.find(function (trigger) {
    return trigger.classList.contains("map-number");
  }) || triggers[0];
  var activeTrigger = anchor;
  var closeTimer = 0;
  var pinned = false;
  var restoringFocus = false;

  function isInside(target) {
    return target instanceof Node && (
      card.contains(target) || triggers.some(function (trigger) {
        return trigger.contains(target);
      })
    );
  }

  function cancelClose() {
    window.clearTimeout(closeTimer);
  }

  function positionCard() {
    if (card.hidden) {
      return;
    }

    var rect = anchor.getBoundingClientRect();
    var width = card.offsetWidth;
    var height = card.offsetHeight;
    var viewportWidth = document.documentElement.clientWidth;
    var viewportHeight = window.innerHeight;
    var left = rect.right + 10;

    if (left + width > viewportWidth - 12) {
      left = rect.left - width - 10;
    }

    card.style.left = Math.max(12, Math.min(left, viewportWidth - width - 12)) + "px";
    card.style.top = Math.max(12, Math.min(rect.top + 7, viewportHeight - height - 12)) + "px";
  }

  function openPreview(trigger) {
    cancelClose();
    activeTrigger = trigger;

    if (card.hidden) {
      card.hidden = false;
      frame.src = frame.getAttribute("data-src");
      triggers.forEach(function (item) {
        item.setAttribute("aria-expanded", "true");
      });
    }

    positionCard();
  }

  function closePreview(restoreFocus) {
    cancelClose();
    card.hidden = true;
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

  function scheduleClose() {
    cancelClose();
    closeTimer = window.setTimeout(function () {
      if (pinned || isInside(document.activeElement)) {
        return;
      }

      if (card.matches(":hover") || triggers.some(function (item) {
        return item.matches(":hover");
      })) {
        return;
      }

      closePreview(false);
    }, 350);
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "mouse") {
        openPreview(trigger);
      }
    });
    trigger.addEventListener("pointerleave", scheduleClose);
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

  card.addEventListener("pointerenter", cancelClose);
  card.addEventListener("pointerleave", scheduleClose);
  card.addEventListener("focusin", cancelClose);
  closeButton.addEventListener("click", function () {
    closePreview(true);
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
    if (
      !card.hidden &&
      event.source === frame.contentWindow &&
      event.data && event.data.type === "part-4-preview-close"
    ) {
      closePreview(true);
    }
  });
  window.addEventListener("resize", positionCard);
  window.addEventListener("scroll", positionCard, true);
})();
