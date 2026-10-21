"""Build/check poem (1)'s OFL-licensed Songti webfont.

Requires fonttools[woff]. Supply the official 2.003R
SubsetOTF/CN/SourceHanSerifCN-Light.otf to regenerate.
--check verifies the bundled font without needing the original.
"""

import argparse
import hashlib
from html.parser import HTMLParser
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "log/fonts/poem-songti-light-v2003.woff2"
SOURCE_SHA256 = "e2e51701c3c5da146c0f5a587abd55a7d12e114338bc86cb4d05c316e727c228"
FAMILY = "Poem Songti Subset"
POSTSCRIPT_NAME = "PoemSongtiSubset-Light"


class SerifText(HTMLParser):
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
    parser = SerifText()
    parser.feed((ROOT / "log/part-1.html").read_text(encoding="utf-8"))
    text = "".join(parser.text)
    if not text:
        raise ValueError("No Chinese serif text found in poem (1)")
    return set(map(ord, text))


def verify(font, required):
    cmap = font.getBestCmap()
    missing = required - cmap.keys()
    if missing:
        raise ValueError("Missing glyphs: " + "".join(map(chr, sorted(missing))))
    # Parallel typing reserves one em per Chinese character before loading.
    for codepoint in required:
        if 0x4E00 <= codepoint <= 0x9FFF:
            if font["hmtx"][cmap[codepoint]][0] != font["head"].unitsPerEm:
                raise ValueError(f"Unexpected Han advance: U+{codepoint:04X}")


def rename_subset(font):
    # OFL reserves "Source". Rename both OpenType and CFF family names;
    # preserve the original copyright, trademark and license records.
    names = {1: FAMILY, 2: "Light", 3: POSTSCRIPT_NAME + ";2.003;subset",
             4: FAMILY + " Light", 6: POSTSCRIPT_NAME,
             16: FAMILY, 17: "Light"}
    for record in font["name"].names:
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    if "CFF " in font:
        cff = font["CFF "].cff
        cff.fontNames = [POSTSCRIPT_NAME]
        for top in cff.topDictIndex:
            top.FamilyName = FAMILY
            top.FullName = FAMILY + " Light"
            for index, dictionary in enumerate(getattr(top, "FDArray", [])):
                if hasattr(dictionary, "FontName"):
                    dictionary.FontName = POSTSCRIPT_NAME + f"-FD{index}"


def main():
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument("source", nargs="?", type=Path)
    arguments.add_argument("--check", action="store_true")
    args = arguments.parse_args()
    required = required_codepoints()
    if not args.check:
        if not args.source:
            arguments.error("supply SourceHanSerifCN-Light.otf, or use --check")
        if hashlib.sha256(args.source.read_bytes()).hexdigest() != SOURCE_SHA256:
            arguments.error("source does not match the pinned official 2.003R font")
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
            rename_subset(font)
            font.flavor = "woff2"
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            font.save(OUTPUT)
    with TTFont(OUTPUT) as font:
        verify(font, required)
        assert font["name"].getDebugName(1) == FAMILY
        assert font["OS/2"].usWeightClass == 300
    print(f"Songti Light OK: {len(required)} characters; {OUTPUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
