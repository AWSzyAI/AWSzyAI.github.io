"""Build the website's text-based sharing card with its existing brand font.
Requires Pillow. No personal photograph or third-party device artwork is used.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
ROOT = Path(__file__).resolve().parents[1]
S = 2
image = Image.new('RGB', (1200*S, 630*S), '#103b2b')
draw = ImageDraw.Draw(image)
font_path = ROOT / 'font/LXGWWenKai-Regular.ttf'
def text(value, x, y, size, color):
    draw.text((x*S, y*S), value, fill=color, font=ImageFont.truetype(str(font_path), size*S))
# Subtle signal lines echo the live page without relying on animated canvas.
for j in range(24):
    points=[]
    for x in range(630,1202,3):
        u=(x-630)/570
        y=330+math.sin(u*5+j*.09)*75+(j-12)*9*(.25+u)
        points.append((x*S,y*S))
    draw.line(points,fill='#245941',width=S)
text('时子延',70,61,66,'#edf2e7')
text('Ziyan Shi',76,147,28,'#b9d0b9')
text('建模心智。',70,263,58,'#edf2e7')
text('探索意识与记忆。',70,342,58,'#edf2e7')
text('神经科学  ·  脑机接口  ·  科研软件',76,489,26,'#c0d4bd')
draw.line([(76*S,562*S),(1124*S,562*S)],fill='#49725a',width=S)
text('awszyai.github.io',76,579,21,'#a9c3ac')
image.resize((1200,630),Image.Resampling.LANCZOS).save(ROOT/'assets/social/ziyan-shi.png',optimize=True)
