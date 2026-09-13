"""Derive display meshes from Brainder MZ3 archives (CC BY-SA 3.0).
Usage: python3 scripts/build-brain-mesh.py /path/to/archives
Archives: pial.tar.bz2 and deep.tar.bz2. See assets/brain/README.md.
"""
import tarfile, gzip, struct, math, json, sys
from pathlib import Path
root=Path(sys.argv[1]); out=Path(__file__).resolve().parents[1]/'assets/brain'
parts=[]
for archive in ('pial','deep'):
 with tarfile.open(root/(archive+'.tar.bz2')) as t:
  for name in t.getnames():
   if not name.endswith('.mz3'): continue
   key=Path(name).stem
   if archive=='deep' and not any(s in key for s in ('Cerebellum-Cortex','Hippocampus','Amygdala','Brain-Stem')):continue
   b=t.extractfile(name).read(); b=gzip.decompress(b) if b[:2]==b'\x1f\x8b' else b
   magic,attr,nf,nv,skip=struct.unpack_from('<HHIII',b);assert magic==23117 and attr==3
   faces=list(struct.iter_unpack('<III',b[16+skip:16+skip+nf*12]))
   vertices=list(struct.iter_unpack('<fff',b[16+skip+nf*12:16+skip+nf*12+nv*12]))
   cell=3.2 if archive=='pial' else 2.5 if 'Cerebellum' in key else 1.5
   buckets={};mapping=[];sums=[]
   for v in vertices:
    k=tuple(math.floor(a/cell) for a in v)
    if k not in buckets:buckets[k]=len(sums);sums.append([0,0,0,0])
    i=buckets[k];mapping.append(i)
    for j in range(3):sums[i][j]+=v[j]
    sums[i][3]+=1
   vs=[[s[j]/s[3] for j in range(3)] for s in sums]
   fs=[];seen=set()
   for f in faces:
    f=tuple(mapping[i] for i in f);k=tuple(sorted(f))
    if len(set(f))!=3 or k in seen:continue
    seen.add(k);fs.append(f)
   ns=[[0,0,0] for v in vs];edges=set()
   for a,b,c in fs:
    u=[vs[b][j]-vs[a][j] for j in range(3)];v=[vs[c][j]-vs[a][j] for j in range(3)]
    n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
    for i in (a,b,c):
     for j in range(3):ns[i][j]+=n[j]
    for pair in ((a,b),(b,c),(c,a)):edges.add(tuple(sorted(pair)))
   normals=[]
   for n in ns:
    length=math.sqrt(sum(x*x for x in n)) or 1;normals.extend(round(x/length,3) for x in n)
   parts.append(dict(name=key,vertices=[round(x,2) for v in vs for x in v],normals=normals,faces=[i for f in fs for i in f],edges=[i for e in sorted(edges) for i in e]))
   assert len(vs)<65536
   print(key,len(vs),len(fs))
out.mkdir(exist_ok=True)
(out/'human-brain.json').write_text(json.dumps(parts,separators=(',',':')))
