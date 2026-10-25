/*
 * Add artwork and downloads here; the page also works when opened as a local file.
 * cover: the default artwork. Each track can supply its own cover path.
 * files: [{ label: "伴奏", href: "audio/daydream.wav", format: "WAV", size: "… MB" }].
 * For a cloud-drive page, use its full HTTPS href and external: true.
 * Only add formats and file sizes once they are confirmed.
 * An empty files array deliberately displays "伴奏文件待添加", never a fake link.
 */
window.INST_CATALOG = {
  cover: "covers/transparent-flower.png?v=2x",
  coverAlt: "《透明花》封面",
  tracks: [
    {
      id: "transparent-flower", title: "透明花", cover: "covers/transparent-flower.png?v=2x",
      files: [
        { label: "伴奏", href: "audio/transparent-flower-inst.wav", filename: "透明花_Inst.wav", format: "WAV", size: "101.5 MB" },
        { label: "伴奏", href: "audio/transparent-flower-inst.mp3", filename: "透明花_Inst.mp3", format: "MP3", size: "10.5 MB" },
      ],
    },
    {
      id: "circular-rain", title: "环形雨", cover: "covers/circular-rain.png?v=2x",
      files: [
        { label: "伴奏", href: "audio/circular-rain-inst.wav", filename: "环形雨_Inst.wav", format: "WAV", size: "74.1 MB" },
        { label: "伴奏", href: "audio/circular-rain-inst.mp3", filename: "环形雨_Inst.mp3", format: "MP3", size: "10.2 MB" },
      ],
    },
    {
      id: "daydream", title: "白日梦", cover: "covers/daydream.png?v=2x",
      files: [
        { label: "伴奏", href: "audio/daydream-inst.wav", filename: "白日梦_Inst.wav", format: "WAV", size: "75.7 MB" },
        { label: "伴奏", href: "audio/daydream-inst.mp3", filename: "白日梦_Inst.mp3", format: "MP3", size: "10.5 MB" },
      ],
    },
  ],
};
