(() => {
  "use strict";
  const catalog = window.INST_CATALOG;
  if (!catalog) return;

  function safeURL(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (["https:", "http:"].includes(url.protocol)) return url;
      if (url.protocol === "file:" && location.protocol === "file:") return url;
    } catch { /* Leave missing or invalid files unavailable. */ }
    return null;
  }

  function setupCoverGallery() {
    const surface = document.getElementById("cover-surface");
    if (surface.dataset.galleryReady) return;
    surface.dataset.galleryReady = "true";
    const initialCover = document.getElementById("cover-image");
    const placeholder = document.getElementById("cover-placeholder");
    const defaultArtwork = catalog.cover || initialCover.getAttribute("src");
    const defaultAlt = catalog.coverAlt || initialCover.alt;
    const layers = [{ image: initialCover, weight: 1 }];
    const artworkCache = new Map();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let selected = layers[0];
    let artworkRequest = 0;
    let animationFrame = 0;

    function loadArtwork(url) {
      if (!artworkCache.has(url.href)) {
        const image = url.href === initialCover.src ? initialCover : new Image();
        const ready = new Promise(resolve => {
          const loaded = async () => {
            try { await image.decode(); } catch { /* Render successfully loaded images. */ }
            if (!image.naturalWidth) return resolve(null);
            let layer = layers.find(item => item.image === image);
            if (!layer) {
              image.className = "cover-layer";
              image.alt = "";
              image.setAttribute("aria-hidden", "true");
              image.style.opacity = "0";
              surface.append(image);
              layer = { image, weight: 0 };
              layers.push(layer);
            }
            resolve(layer);
          };
          image.addEventListener("load", loaded, { once: true });
          image.addEventListener("error", () => resolve(null), { once: true });
          if (image.src !== url.href) image.src = url.href;
          else if (image.complete) {
            if (image.naturalWidth) loaded();
            else resolve(null);
          }
        });
        artworkCache.set(url.href, ready);
      }
      return artworkCache.get(url.href);
    }

    function paintLayers() {
      // Convert blend weights into stacked opacities. The bottom remains opaque,
      // so a crossfade never exposes white paper or briefly washes out the art.
      let remaining = 1;
      for (let index = layers.length - 1; index > 0; index -= 1) {
        const layer = layers[index];
        const opacity = remaining > 0.000001 ? layer.weight / remaining : 0;
        layer.image.style.opacity = String(Math.max(0, Math.min(1, opacity)));
        remaining = Math.max(0, remaining - layer.weight);
      }
      layers[0].image.style.opacity = "1";
    }

    function settleArtwork() {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      layers.forEach(layer => { layer.weight = layer === selected ? 1 : 0; });
      paintLayers();
      surface.dataset.transitioning = "false";
    }

    function crossfadeTo(layer, alt) {
      layer.image.alt = alt;
      if (layer === selected && (animationFrame || layer.weight === 1)) return;
      cancelAnimationFrame(animationFrame);
      selected.image.removeAttribute("id");
      selected.image.setAttribute("aria-hidden", "true");
      selected = layer;
      selected.image.id = "cover-image";
      selected.image.removeAttribute("aria-hidden");
      if (reducedMotion.matches) return settleArtwork();
      // Interruptions start from the current mixture, never from a reset frame.
      const startWeights = new Map(layers.map(item => [item, item.weight]));
      const start = performance.now();
      surface.dataset.transitioning = "true";
      function tick(now) {
        const progress = Math.min(1, (now - start) / 620);
        const eased = progress * progress * (3 - 2 * progress);
        layers.forEach(item => {
          item.weight = (startWeights.get(item) || 0) * (1 - eased) + (item === selected ? eased : 0);
        });
        paintLayers();
        if (progress < 1) animationFrame = requestAnimationFrame(tick);
        else settleArtwork();
      }
      animationFrame = requestAnimationFrame(tick);
    }

    async function showArtwork(source, alt) {
      const url = safeURL(source);
      const request = ++artworkRequest;
      if (!url) return;
      const layer = await loadArtwork(url);
      if (request !== artworkRequest) return;
      if (layer) {
        initialCover.hidden = false;
        placeholder.hidden = true;
        crossfadeTo(layer, alt);
      } else if (!initialCover.naturalWidth) {
        initialCover.hidden = true;
        placeholder.hidden = false;
      }
    }

    showArtwork(defaultArtwork, defaultAlt);
    const trackList = document.getElementById("tracks");
    trackList.addEventListener("pointerleave", event => {
      if (event.pointerType !== "touch") showArtwork(defaultArtwork, defaultAlt);
    });
    trackList.addEventListener("focusout", event => {
      if (!trackList.contains(event.relatedTarget) && !trackList.matches(":hover")) {
        showArtwork(defaultArtwork, defaultAlt);
      }
    });
    for (const track of catalog.tracks || []) {
      const url = safeURL(track.cover);
      if (url) loadArtwork(url);
      const element = Array.from(trackList.querySelectorAll("[data-track]"))
        .find(item => item.dataset.track === track.id);
      if (!element) continue;
      const selectArtwork = () => showArtwork(track.cover || defaultArtwork,
        track.cover ? `《${track.title}》封面` : defaultAlt);
      element.addEventListener("pointerenter", event => {
        if (event.pointerType !== "touch") selectArtwork();
      });
      element.addEventListener("focusin", selectArtwork);
      element.addEventListener("click", selectArtwork);
    }
    reducedMotion.addEventListener("change", event => { if (event.matches) settleArtwork(); });
    window.addEventListener("pagehide", settleArtwork);
  }
  setupCoverGallery();

  for (const track of catalog.tracks || []) {
    const element = Array.from(document.querySelectorAll("[data-track]"))
      .find(item => item.dataset.track === track.id);
    if (!element) continue;
    if (track.title) element.querySelector(".track-name").textContent = track.title;
    const files = (track.files || []).map(file => ({ ...file, url: safeURL(file.href) }))
      .filter(file => file.url);
    if (!files.length) continue;
    const heading = document.createElement("p");
    heading.className = "download-heading";
    heading.textContent = "伴奏";
    const list = document.createElement("ul");
    list.className = "download-list";
    for (const file of files) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "download-link";
      link.href = file.url.href;
      // Cross-origin hosts may ignore the download attribute; show that as a link.
      const external = file.external || file.url.origin !== location.origin;
      if (external) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.setAttribute("download", file.filename || "");
      }
      const metadata = [file.format, file.size].filter(Boolean).join(" / ");
      const meta = document.createElement("span");
      meta.className = "file-meta";
      meta.textContent = metadata || file.label || "伴奏";
      const action = document.createElement("span");
      action.className = "download-action";
      action.textContent = external ? "↗" : "↓";
      action.setAttribute("aria-hidden", "true");
      link.setAttribute("aria-label", `${track.title} · ${file.label || "伴奏"}${metadata ? ` · ${metadata}` : ""}${external ? "（新窗口）" : "，下载"}`);
      link.append(meta, action);
      item.append(link);
      list.append(item);
    }
    element.querySelector(".track-files").replaceChildren(heading, list);
  }

  // Native details keeps touch, keyboard and no-JS navigation working alike.
  document.querySelectorAll(".track").forEach(track => {
    track.addEventListener("keydown", event => {
      if (event.key === "Escape" && track.open) {
        track.open = false;
        track.querySelector("summary").focus();
      }
    });
  });
})();
