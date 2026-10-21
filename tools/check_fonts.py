"""Check that a font has every character your on-screen text needs:  .venv/bin/python tools/check_fonts.py fonts/X.ttf "your text" """
import sys
from fontTools.ttLib import TTFont
cm = TTFont(sys.argv[1]).getBestCmap()
miss = sorted({c for c in sys.argv[2] if not c.isspace() and ord(c) not in cm})
print('OK' if not miss else 'MISSING: ' + ''.join(miss))
