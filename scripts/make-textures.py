"""Builds the planet textures in src/assets/tex/ from public NASA and USGS maps.

Run by hand when a source changes. Needs Pillow and numpy (not project dependencies):
    python3 -m venv .venv && .venv/bin/pip install pillow numpy
    .venv/bin/python scripts/make-textures.py <folder with the source files>

Sources (all public domain or free to reuse with credit to NASA; see README):
  world.200404.3x5400x2700.jpg      NASA Earth Observatory, Blue Marble: Next Generation (April 2004)
  BlackMarble_2016_01deg_gray.jpg   NASA Earth Observatory, Earth at Night 2016 (Black Marble)
  cloud_combined_2048.jpg           NASA Earth Observatory, The Blue Marble (2002) cloud layer
  mars_viking_clrmosaic_global_1024.jpg   USGS Astrogeology, Mars Viking Global Color Mosaic 925 m
  europa_voyager_galileossi_global_mosaic_500m_1024.jpg  USGS Astrogeology, Europa Voyager-Galileo SSI mosaic
  PIA07782.jpg                      NASA/JPL/Space Science Institute, Cassini map of Jupiter
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
OUT = Path(__file__).resolve().parent.parent / 'src' / 'assets' / 'tex'
OUT.mkdir(parents=True, exist_ok=True)


def load(name, mode='RGB'):
    return Image.open(SRC / name).convert(mode)


def save(image, name, quality, **options):
    path = OUT / name
    image.save(path, 'WEBP', quality=quality, method=6, **options)
    print(f'{name}: {image.size[0]}x{image.size[1]}, {path.stat().st_size // 1024} KB')


# Earth, day side. No alpha channel: browsers premultiply it and WebP drops the colour under
# transparent pixels. The Blue Marble base map paints every ocean the same dark navy, so the
# Earth shader finds water from the colour itself (blue clearly leads and the pixel is dark).
# The oceans are flattened to that navy here, which also makes the file smaller.
day = load('world.200404.3x5400x2700.jpg').resize((4096, 2048), Image.LANCZOS)
rgb = np.asarray(day).astype(np.float32)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
water = (b > r * 1.25) & (b > g * 1.05) & ((r + g + b) / 3 < 70)
mask = np.asarray(Image.fromarray((water * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)))
navy = np.array([8, 14, 42], dtype=np.float32)
rgb[mask > 127] = navy
save(Image.fromarray(rgb.astype(np.uint8)), 'earth-day.webp', 74)

# Night lights, as brightness only.
night = load('BlackMarble_2016_01deg_gray.jpg', 'L').resize((2048, 1024), Image.LANCZOS)
save(night, 'earth-night.webp', 70)

# Clouds, as brightness only.
clouds = load('cloud_combined_2048.jpg', 'L')
save(clouds, 'earth-clouds.webp', 72)

save(load('mars_viking_clrmosaic_global_1024.jpg'), 'mars.webp', 80)
save(load('europa_voyager_galileossi_global_mosaic_500m_1024.jpg', 'L'), 'europa.webp', 80)
save(load('PIA07782.jpg').resize((2048, 1024), Image.LANCZOS), 'jupiter.webp', 78)
