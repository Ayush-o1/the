#!/bin/sh
# Builds the three font files the site loads, from the Fontsource packages in node_modules.
# Needs fonttools and brotli: pip install fonttools brotli
# Why: Fraunces is only used at display sizes, so its optical size is fixed at 144 and its weight
# range is narrowed. That takes it from 67 KB to under 20 KB. Every file is cut to Latin.
set -e
OUT=src/fonts
LATIN="U+0020-007E,U+00A0,U+00B7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+2192,U+00D7"
FR=node_modules/@fontsource-variable/fraunces/files
HK=node_modules/@fontsource-variable/hanken-grotesk/files
GM=node_modules/@fontsource-variable/geist-mono/files
TMP=$(mktemp -d)

subset() { # input output
  pyftsubset "$1" --unicodes="$LATIN" --flavor=woff2 --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' --output-file="$2"
}

subset "$FR/fraunces-latin-opsz-normal.woff2" "$TMP/fr-n.woff2"
subset "$FR/fraunces-latin-opsz-italic.woff2" "$TMP/fr-i.woff2"
fonttools varLib.instancer "$TMP/fr-n.woff2" wght=300:400 opsz=144 -o "$OUT/fraunces-roman.woff2" -q
fonttools varLib.instancer "$TMP/fr-i.woff2" wght=300 opsz=144 -o "$OUT/fraunces-italic.woff2" -q

subset "$HK/hanken-grotesk-latin-wght-normal.woff2" "$TMP/hk.woff2"
fonttools varLib.instancer "$TMP/hk.woff2" wght=400:600 -o "$OUT/hanken-grotesk.woff2" -q

subset "$GM/geist-mono-latin-wght-normal.woff2" "$TMP/gm.woff2"
fonttools varLib.instancer "$TMP/gm.woff2" wght=400:500 -o "$OUT/geist-mono.woff2" -q

rm -r "$TMP"
ls -l "$OUT"
