"""Draws public/favicon.svg: the letters "ak" in Fraunces (the hero's display face), bone on ink.

The glyphs are turned into SVG paths, so the icon does not depend on a font being available.
Fraunces is under the SIL Open Font License 1.1, which allows its outlines in a logo or icon.
Run by hand (like make-textures.py): .build/venv/bin/python scripts/make-favicon.py
Needs fonttools and brotli: pip install fonttools brotli
"""
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
font = TTFont(ROOT / 'src/fonts/fraunces-roman.woff2')
if 'fvar' in font:
    # The heavier end of the subset reads better at 16 px than the hero's light weight.
    font = instantiateVariableFont(font, {'wght': 400})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
TEXT = 'ak'
TRACK = -40  # font units between letters

# Lay the letters out in font units and measure the ink box.
names = [cmap[ord(c)] for c in TEXT]
advance = 0
placed = []
for name in names:
    placed.append((name, advance))
    advance += glyphs[name].width + TRACK
bounds = BoundsPen(glyphs)
for name, x in placed:
    glyphs[name].draw(TransformPen(bounds, (1, 0, 0, 1, x, 0)))
x0, y0, x1, y1 = bounds.bounds

SIZE = 32
INK_HEIGHT = 17.5  # the letters' height inside the 32-unit square
scale = INK_HEIGHT / (y1 - y0)
width = (x1 - x0) * scale
ox = (SIZE - width) / 2 - x0 * scale
oy = (SIZE + INK_HEIGHT) / 2 + y0 * scale  # font y points up, SVG y points down

pen = SVGPathPen(glyphs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
for name, x in placed:
    glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, ox + x * scale, oy)))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <rect width="{SIZE}" height="{SIZE}" rx="3" fill="#0A0D12"/>
  <path fill="#ECE6D8" d="{pen.getCommands()}"/>
</svg>
'''
(ROOT / 'public/favicon.svg').write_text(svg)
print('wrote public/favicon.svg', len(svg), 'bytes')
