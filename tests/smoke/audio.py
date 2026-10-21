"""Pipeline check only: 3 s soundtrack."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'lib', 'audio'))
from mgaudio import recipes, sfx
m = recipes.pop(duration=3, key='C', drop=1.0, outro=2.2)
m.sfx(sfx.pop('bubble'), at=0.25)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
print('warnings:', m.export(os.path.join(HERE, 'out', 'audio.wav')).get('warnings'))
