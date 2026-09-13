"""Validate the public identity pages before publishing (Python standard library)."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from urllib.robotparser import RobotFileParser
from datetime import date
import json, re, struct, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://awszyai.github.io'
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.meta={};self.links=[];self.ids=[];self.h1=0;self.schema=[];self.ld=False;self.buffer='';self.body=False;self.plain=[]
        self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='body':self.body=True
        if tag=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content','')
        if tag in ('link','script','img','a'):
            for attr in ('href','src'):
                if a.get(attr):self.links.append((tag,a,attr))
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='script' and a.get('type')=='application/ld+json':self.ld=True;self.buffer=''
    def handle_endtag(self,tag):
        if tag=='script' and self.ld:self.schema.append(json.loads(self.buffer));self.ld=False
    def handle_data(self,data):
        if self.ld:self.buffer+=data
        elif self.body:self.plain.append(data)

robots=RobotFileParser();robots.parse((ROOT/'robots.txt').read_text().splitlines())
sitemap=ET.parse(ROOT/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[]
for entry in sitemap.findall('s:url',ns):
    url=entry.findtext('s:loc',namespaces=ns);urls.append(url)
    parsed=urlsplit(url)
    assert f'{parsed.scheme}://{parsed.netloc}'==ORIGIN and not parsed.query and not parsed.fragment,url
    assert date.fromisoformat(entry.findtext('s:lastmod',namespaces=ns))<=date.today(),url
    path=ROOT/(unquote(parsed.path).lstrip('/') or 'index.html')
    page=Page(path.read_text())
    canonical=[a['href'] for tag,a,_ in page.links if tag=='link' and a.get('rel')=='canonical']
    assert canonical==[url],f'Wrong canonical: {path}'
    assert 35<=len(page.meta['description'])<=180,path
    assert 'noindex' not in page.meta.get('robots','').lower(),path
    assert page.h1==1 and len(page.ids)==len(set(page.ids)),path
    assert all(word in ''.join(page.plain) for word in ['时子延','Ziyan Shi','Blux','西湖大学','深圳医学科学院']),path
    for agent in ['Googlebot','Bingbot','Baiduspider']:
        assert robots.can_fetch(agent,url),(agent,url)
    for tag,a,attr in page.links:
        target=urlsplit(a[attr]);relative=target.path
        if target.scheme or target.netloc or not relative:continue
        asset=(ROOT/relative.lstrip('/')) if relative.startswith('/') else path.parent/relative
        assert asset.exists(),f'Missing local {attr}: {relative}'
    for key in ['og:title','og:description','og:url','og:image','og:image:alt','twitter:card','twitter:image']:
        assert page.meta.get(key),f'{key}: {path}'
    image=ROOT/urlsplit(page.meta['og:image']).path.lstrip('/')
    header=image.read_bytes()[:24];assert header[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',header[16:24])==(1200,630),image
    assert page.schema,path
    nodes=page.schema[0].get('@graph',page.schema)
    profile=next(n for n in nodes if n['@type']=='ProfilePage')
    assert profile['mainEntity']['@type']=='Person' and profile['mainEntity']['name']=='时子延',path
    if url==ORIGIN+'/':
        site=next(n for n in nodes if n['@type']=='WebSite')
        assert site['name']=='时子延' and site['url']==url
    print(f'PASS {url}: static identity, metadata, schema, links, image, crawler access')
assert len(urls)==len(set(urls)) and len(urls)>=2
assert ORIGIN+'/sitemap.xml' in (robots.site_maps() or [])
assert re.fullmatch(r'[a-f0-9]{32}',(ROOT/'indexnow-key.txt').read_text().strip())
for path in ['assets/brain/human-brain.json','assets/brain/surface.svg','assets/devices/apple-watch-series-11-bezels.png']:
    assert (ROOT/path).is_file(),path
print('PASS sitemap, robots, IndexNow ownership file and visual assets')
