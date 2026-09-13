"""Project the CC BY-SA 3.0 display geometry to a static SVG fallback."""
import json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1];data=json.loads((root/'assets/brain/human-brain.json').read_text());a=.33;e=.17;sa,ca,se,ce=math.sin(a),math.cos(a),math.sin(e),math.cos(e)
paths=[]
for p in data:
 if p['name'] not in ['lh.pial','Left-Cerebellum-Cortex','Brain-Stem']:continue
 v=list(zip(*[iter(p['vertices'])]*3));n=list(zip(*[iter(p['normals'])]*3));points=[(250+(-y*ca+x*sa)*2.3,155+(-z*ce+(-x*ca-y*sa)*se)*2.3) for x,y,z in v]
 d=[]
 for i,j in zip(p['edges'][::2],p['edges'][1::2]):
  if -n[i][0]*ca*ce-n[i][1]*sa*ce+n[i][2]*se<.2:continue
  x,y=points[i];xx,yy=points[j];d.append(f'M{x:.1f} {y:.1f}L{xx:.1f} {yy:.1f}')
 paths.append('<path d="'+''.join(d)+'"/>')
(root/'assets/brain/surface.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 510 340"><title>Human brain — Anderson Winkler / Brainder, CC BY-SA 3.0; simplified projection</title><g fill="none" stroke="#9ac4a5" stroke-width=".6" opacity=".7">'+''.join(paths)+'</g></svg>')
