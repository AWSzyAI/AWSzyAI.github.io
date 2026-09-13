"""Notify IndexNow of deployed identity pages. HTTP acceptance is not indexation."""
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import argparse, json, re, sys, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
HOST='awszyai.github.io';ORIGIN='https://'+HOST

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--dry-run',action='store_true');args=parser.parse_args()
    key=(ROOT/'indexnow-key.txt').read_text().strip()
    if not re.fullmatch('[a-f0-9]{32}',key):raise ValueError('Invalid public ownership key')
    tree=ET.parse(ROOT/'sitemap.xml')
    urls=list(dict.fromkeys(n.text for n in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')))
    if not 1<=len(urls)<=10000 or any(urlsplit(u).netloc!=HOST or urlsplit(u).scheme!='https' for u in urls):
        raise ValueError('Only canonical HTTPS pages on the configured host may be submitted')
    payload={'host':HOST,'key':key,'keyLocation':ORIGIN+'/indexnow-key.txt','urlList':urls}
    if args.dry_run:
        print(json.dumps({'endpoint':'https://api.indexnow.org/indexnow','urlList':urls,'keyLocation':payload['keyLocation']},indent=2));return
    with urlopen(payload['keyLocation'],timeout=30) as response:
        if response.read().decode().strip()!=key:raise ValueError('Deployed ownership file does not match; wait for Pages deployment')
    # Confirm the newly committed content is actually deployed, rather than notifying early.
    for url in urls:
        path=ROOT/(urlsplit(url).path.lstrip('/') or 'index.html')
        with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=30) as response:
            if response.read()!=path.read_bytes():raise ValueError(f'Deployed content is not current yet: {url}')
    request=Request('https://api.indexnow.org/indexnow',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json; charset=utf-8'},method='POST')
    with urlopen(request,timeout=45) as response:
        if response.status not in (200,202):raise ValueError(f'Unexpected HTTP {response.status}')
        print(f'IndexNow HTTP {response.status}: {len(urls)} URLs received. '+('Key validation pending. ' if response.status==202 else '')+'Crawling and indexing remain search-engine decisions.')
if __name__=='__main__':
    try:main()
    except (HTTPError,URLError,ValueError) as error:
        print(f'IndexNow submission failed: {error}',file=sys.stderr);sys.exit(1)
