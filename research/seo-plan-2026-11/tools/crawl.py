import re,json,sys,urllib.request,html,time
from urllib.parse import urljoin,urlparse
from concurrent.futures import ThreadPoolExecutor
base="https://juan-tech.com"
urls=[l.strip() for l in open(sys.argv[1]) if l.strip()]
def fetch(u):
    for _ in range(3):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"seo-audit-readonly"}),timeout=25)
            return r.status,r.geturl(),r.read().decode("utf8","ignore")
        except Exception as e: err=str(e); time.sleep(1)
    return 0,u,""
def first(p,t,fl=re.S|re.I):
    m=re.search(p,t,fl); return html.unescape(m.group(1).strip()) if m else ""
def parse(u):
    st,fu,t=fetch(u)
    d={"url":u,"status":st,"final":fu}
    if not t: return d
    d["title"]=first(r"<title[^>]*>(.*?)</title>",t)
    d["desc"]=first(r'<meta[^>]+name="description"[^>]+content="([^"]*)"',t) or first(r'<meta[^>]+content="([^"]*)"[^>]+name="description"',t)
    d["canon"]=first(r'<link[^>]+rel="canonical"[^>]+href="([^"]*)"',t)
    d["h1"]=first(r"<h1[^>]*>(.*?)</h1>",t); d["h1"]=re.sub(r"<[^>]+>","",d["h1"])
    d["h2"]=[re.sub(r"<[^>]+>","",html.unescape(x)).strip() for x in re.findall(r"<h2[^>]*>(.*?)</h2>",t,re.S)][:15]
    d["hreflang"]=re.findall(r'hreflang="([^"]+)"',t)
    d["schema"]=sorted(set(re.findall(r'"@type"\s*:\s*"([^"]+)"',t)))
    body=re.sub(r"<(script|style|nav|header|footer)[^>]*>.*?</\1>","",t,flags=re.S|re.I)
    m=re.search(r"<main[^>]*>(.*?)</main>",body,re.S|re.I); main=m.group(1) if m else body
    txt=re.sub(r"<[^>]+>"," ",main); d["words"]=len(re.findall(r"\w+",html.unescape(txt)))
    def links(frag):
        out=[]
        for h,a in re.findall(r'<a[^>]+href="([^"#]+)[^"]*"[^>]*>(.*?)</a>',frag,re.S|re.I):
            a=re.sub(r"<[^>]+>","",html.unescape(a)).strip()
            p=urlparse(urljoin(u,h))
            if p.netloc in("juan-tech.com","www.juan-tech.com"): out.append((p.path.rstrip("/") or "/",a[:80]))
        return out
    d["body_links"]=links(main); d["all_links"]=links(t)
    d["imgs"]=len(re.findall(r"<img",main)); d["imgs_noalt"]=len(re.findall(r'<img(?![^>]*alt="[^"]+")',main))
    return d
with ThreadPoolExecutor(6) as ex: res=list(ex.map(parse,urls))
json.dump(res,open(sys.argv[2],"w"),ensure_ascii=False)
print(len(res),sum(1 for r in res if r["status"]==200))
