"""Tile the stills of a film into one labelled contact sheet: python tools/sheet.py films/01-flat [cols]"""
import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; cols = int(sys.argv[2]) if len(sys.argv) > 2 else 8
fs = sorted(glob.glob(os.path.join(d, 'out', 'stills', 't*.png')))
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = 300, int(300 * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 6), rows * (h + 28)), (40, 40, 40))
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 28)
    sheet.paste(im.resize((w, h)), (x, y + 24))
    dr.text((x + 4, y + 4), os.path.basename(f)[1:-4] + ' s', fill=(255, 255, 255))
out = os.path.join(d, 'out', 'sheet.jpg'); sheet.save(out, quality=85); print(out)
