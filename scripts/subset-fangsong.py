"""Build/check the small OFL-licensed Fangsong webfont used by poem (1).

Requires fonttools[woff]. Supply the official v0.212 TTF to regenerate;
--check validates coverage without needing the original font.
"""

import argparse
from html.parser import HTMLParser
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "log/fonts/poem-zhuque-fangsong-v0212.woff2"


class FangsongText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.text = []

    def handle_starttag(self, tag, attributes):
        if tag in {"meta", "link", "hr", "br", "img", "input"}:
            return
        classes = dict(attributes).get("class", "").split()
        active = bool(self.stack and self.stack[-1][1]) or bool(
            {"footnote-term", "footnote-chinese"}.intersection(classes)
        )
        self.stack.append((tag, active))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        if self.stack and self.stack[-1][1]:
            self.text.append(data)


def required_codepoints():
    parser = FangsongText()
    parser.feed((ROOT / "log/part-1.html").read_text(encoding="utf-8"))
    text = "".join(parser.text)
    if not text:
        raise ValueError("No Fangsong text found in poem (1)")
    return set(map(ord, text))


def verify(font, required):
    missing = required - font.getBestCmap().keys()
    if missing:
        raise ValueError("Missing glyphs: " + "".join(map(chr, sorted(missing))))
    # The animation reserves one em for each Chinese character before loading.
    em = font["head"].unitsPerEm
    for codepoint in required:
        if 0x4E00 <= codepoint <= 0x9FFF:
            glyph = font.getBestCmap()[codepoint]
            if font["hmtx"].metrics[glyph][0] != em:
                raise ValueError(f"Unexpected Han advance: U+{codepoint:04X}")


def main():
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument("source", nargs="?", type=Path)
    arguments.add_argument("--check", action="store_true")
    args = arguments.parse_args()
    required = required_codepoints()
    if args.check:
        with TTFont(OUTPUT) as font:
            verify(font, required)
        print(f"Fangsong coverage OK: {len(required)} characters; {OUTPUT.stat().st_size} bytes")
        return
    if not args.source:
        arguments.error("supply the official ZhuqueFangsong-Regular.ttf, or use --check")

    with TTFont(args.source, recalcTimestamp=False) as font:
        verify(font, required)
        options = subset.Options()
        options.flavor = "woff2"
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        options.name_legacy = True
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=required)
        subsetter.subset(font)
        # Identify this as a site-specific subset; retain copyright/license data.
        names = {1: "Poem Zhuque Subset", 2: "Regular",
                 4: "Poem Zhuque Subset Regular", 6: "PoemZhuqueSubset-Regular",
                 16: "Poem Zhuque Subset", 17: "Regular"}
        for record in font["name"].names:
            if record.nameID in names:
                record.string = names[record.nameID].encode(record.getEncoding())
        font.flavor = "woff2"
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        font.save(OUTPUT)
    with TTFont(OUTPUT) as font:
        verify(font, required)
    print(f"Created {OUTPUT.name}: {len(required)} characters; {OUTPUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
