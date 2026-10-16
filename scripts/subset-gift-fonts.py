"""Generate local, variable WOFF2 subsets. No personal text is uploaded.

Install fonttools[woff], then run with two downloaded official source TTFs:
  python scripts/subset-gift-fonts.py --source-dir tmp/font-sources
See docs/loading-and-motion-polish.md for pinned source and license information.
"""
import argparse
import hashlib
import json
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

parser = argparse.ArgumentParser()
parser.add_argument("--source-dir", type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
# Include Chinese UI / memories / letter plus basic Latin and punctuation.
text = "".join(file.read_text(encoding="utf-8") for file in (root / "src").rglob("*.tsx"))
text += "".join(file.read_text(encoding="utf-8") for file in (root / "src/data").glob("*.ts"))
# Keep visual QA's explicitly temporary letter sample in the same typeface.
text += "这是一段用于测试阅读焦点的排版文字。正式信件将保留原有段落与换行。"
chars = set(range(0x20, 0x7F)) | {ord(char) for char in text if ord(char) >= 0x2000}
chars |= set(range(0x2000, 0x2070)) | set(range(0x3000, 0x3040)) | set(range(0xFF01, 0xFF60))
output = root / "public/fonts"
output.mkdir(exist_ok=True)
manifest = {}
for family, filename in [("serif", "NotoSerifSC.ttf"), ("sans", "NotoSansSC.ttf")]:
    font = TTFont(args.source_dir / filename)
    font.recalcTimestamp = False
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=chars)
    subsetter.subset(font)
    # Subset first to avoid instancing the entire CJK glyph collection.
    instantiateVariableFont(font, {"wght": (400, 600)}, inplace=True)
    font.flavor = "woff2"
    temporary = output / f"ling-{family}.woff2"
    font.save(temporary)
    digest = hashlib.sha256(temporary.read_bytes()).hexdigest()[:10]
    final = output / f"ling-{family}.{digest}.woff2"
    temporary.replace(final)
    for stale in output.glob(f"ling-{family}.*.woff2"):
        if stale != final:
            stale.unlink()
    manifest[family] = f"/fonts/{final.name}"
    print(f"{family}: {len(font.getBestCmap())} glyphs, {final.stat().st_size / 1024:.1f} KB")
(root / "src/data/fonts.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
