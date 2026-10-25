(() => {
  "use strict";

  const pending = new WeakSet();

  function report(link, message) {
    const heading = link.closest(".track-files")?.querySelector(".download-heading");
    if (!heading) return;
    let status = heading.querySelector(".download-status");
    if (!message) {
      status?.remove();
      return;
    }
    if (!status) {
      status = document.createElement("span");
      status.className = "download-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      heading.append(status);
    }
    status.textContent = message;
  }

  document.addEventListener("click", async event => {
    const link = event.target.closest?.(".download-link[download]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, document.baseURI);
    if (url.protocol === "file:") {
      event.preventDefault();
      report(link, "请通过 localhost 或网站地址下载");
      return;
    }
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== location.origin) return;

    // Do not navigate to an audio URL: some browsers open their media viewer
    // even for a download link. Only a completed binary file is handed off.
    event.preventDefault();
    if (pending.has(link)) return;
    pending.add(link);
    link.setAttribute("aria-busy", "true");
    link.setAttribute("aria-disabled", "true");
    const format = link.querySelector(".file-meta")?.textContent.split(" / ")[0] || "文件";
    // Clear an earlier error, but keep a normal download visually unchanged.
    report(link, "");

    let objectURL;
    let saveLink;
    try {
      const response = await fetch(url.href, { mode: "same-origin", credentials: "same-origin", redirect: "error" });
      if (!response.ok || /(?:text\/html|application\/json)/i.test(response.headers.get("content-type") || "")) throw new Error("File unavailable");
      const blob = await response.blob();
      const length = Number(response.headers.get("content-length"));
      if (!blob.size || (length > 0 && !response.headers.get("content-encoding") && blob.size !== length)) throw new Error("Incomplete file");

      // Keep the original bytes and filename, but use a generic binary MIME
      // type so the result is saved instead of passed to an audio player.
      objectURL = URL.createObjectURL(blob.slice(0, blob.size, "application/octet-stream"));
      saveLink = document.createElement("a");
      saveLink.href = objectURL;
      saveLink.download = link.download || decodeURIComponent(url.pathname.split("/").pop());
      saveLink.hidden = true;
      document.body.append(saveLink);
      saveLink.click();
      report(link, "");
      // Leave time for the browser to consume the URL, especially on mobile.
      const handedOffURL = objectURL;
      setTimeout(() => URL.revokeObjectURL(handedOffURL), 60000);
      objectURL = null;
    } catch {
      report(link, `${format} 下载未能开始，请重试`);
    } finally {
      saveLink?.remove();
      if (objectURL) URL.revokeObjectURL(objectURL);
      pending.delete(link);
      link.removeAttribute("aria-busy");
      link.removeAttribute("aria-disabled");
    }
  });
})();
