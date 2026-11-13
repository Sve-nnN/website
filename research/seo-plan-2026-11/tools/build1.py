import json,csv,re,collections
S="/private/tmp/claude-501/-Users-juan-Documents-Codigo-Personal-juantech-juan-payload/4733a4c1-4fd3-42c8-b200-cd5fc18963d0/scratchpad"
M=json.load(open(S+"/out/model.json")); R=json.load(open(S+"/crawl.json"))
P={(r["url"].replace("https://juan-tech.com","").rstrip("/") or "/"):r for r in R}
ANCH={
"estrategia-seo":"estrategia SEO","guia-keyword-research":"investigación de palabras clave","estrategia-de-contenidos":"estrategia de contenidos SEO","redaccion-seo":"redacción SEO","mejores-cursos-seo-espanol":"cursos de SEO en español",
"topic-clusters-seo":"topic clusters","pillar-page-seo":"página pilar","enlaces-internos-guia":"enlaces internos","canibalizacion-seo":"canibalización SEO","guia-eeat":"E-E-A-T","seo-off-page-guia":"SEO off page",
"technical-seo-guide":"SEO técnico","robots-txt-best-practices":"robots.txt","xml-sitemap-automation":"sitemap XML","guia-google-search-console":"Google Search Console","auditoria-seo":"auditoría SEO paso a paso","technical-seo-checklist":"checklist de SEO técnico",
"core-web-vitals-guide":"Core Web Vitals","web-performance-guide":"rendimiento web","javascript-seo":"SEO para JavaScript","ssr-vs-csr-seo":"SSR frente a CSR","structured-data-seo":"datos estructurados","schema-markup-guide":"schema markup","seo-on-page-guia":"SEO on page","non-developers-guide":"SEO técnico sin programar",
"data-structures":"estructuras de datos","pilas-y-colas":"pilas y colas","queue-data-structure":"cola o queue","tablas-hash":"tablas hash","heap-data-structure":"heap","arboles-binarios":"árboles binarios","binary-search-tree":"árbol binario de búsqueda","tree-traversal":"recorrido de árboles","graph-algorithms":"algoritmos de grafos",
"complejidad-algoritmica":"complejidad algorítmica","time-complexity":"complejidad temporal","space-complexity":"complejidad espacial","algoritmos-ordenamiento":"algoritmos de ordenamiento","merge-sort-python":"merge sort","quicksort-python":"quicksort","recursividad":"recursividad","dynamic-programming":"programación dinámica",
"diseno-bases-datos":"diseño de bases de datos","normalizacion-bases-datos":"normalización","sql-vs-nosql":"SQL frente a NoSQL","headless-cms-comparison":"CMS headless","astro-vs-nextjs":"Astro frente a Next.js","react-19":"React 19","hidratacion-web":"hidratación web","nextjs-cms":"Next.js con CMS","payload-cms-guide":"Payload CMS","nextjs-seo":"SEO en Next.js","headless-cms-seo":"SEO con CMS headless",
"geo-seo-guia":"GEO SEO","llms-txt-guia":"llms.txt","citabilidad-contenido-ia":"contenido citable por IA","medir-citas-ia":"medir citas en IA",
"seo-consulting":"consultor SEO","seo-technical-audit":"auditoría SEO técnica","ai-seo-geo":"SEO para IA","fullstack-development":"desarrollo full-stack"}
def anchor(t):
    s=t.rstrip("/").split("/")[-1]
    if s in ANCH: return ANCH[s]
    if t.startswith("/case-studies/"):
        h=P.get(t,{}).get("h1","caso de éxito"); return re.split(r"[:,]",h)[0][:70].lower()
    return s.replace("-"," ")
PLACE={"spoke→pilar":"párrafo de introducción o primera mención del tema","pilar→spoke":"sección del pilar que resume el subtema","spoke↔spoke":"cuerpo del artículo, en el párrafo más cercano al subtema","cross-cluster":"bloque Lee también al final del artículo","→ servicio":"cierre del artículo, con una frase que explique qué resuelve el servicio","servicio→guía":"sección Guías relacionadas","caso→servicio":"cierre del caso, bajo Lo que hice","servicio→caso":"sección Resultados reales","servicio↔servicio":"bloque Otros servicios","pilar↔pilar":"cuerpo del pilar"}
rows=[]
for f,t,ty,why,st in M["add"]:
    rows.append([f,t,anchor(t),ty,PLACE.get(ty,""),st,"crear página" if t in M["NEW"] or f in M["NEW"] else ""])
with open(S+"/out/link-matrix.csv","w",newline="",encoding="utf-8") as fh:
    w=csv.writer(fh); w.writerow(["desde","hacia","anchor","tipo","ubicación","estado hoy","nota"]); w.writerows(rows)
print("link-matrix",len(rows))
# ---- cluster plans + maps ----
tpl=open("/Users/juan/.claude/plugins/cache/agricidaniel-claude-seo/claude-seo/2.2.4/skills/seo-cluster/templates/cluster-map.html").read()
COL=["#4E79A7","#F28E2B","#E15759","#76B7B2","#59A14F"]
VOL={"estrategia-seo":260,"core-web-vitals-guide":720,"technical-seo-guide":90,"geo-seo-guia":590,"data-structures":1600,"recursividad":2400,"tablas-hash":390,"dynamic-programming":210,"complejidad-algoritmica":170,"pilas-y-colas":90,"seo-technical-audit":480}
def path(cat,x): return f"/blog/{x[0]}/{x[1]}" if isinstance(x,tuple) else f"/blog/{cat}/{x}"
TITLES={"seo":"Pilar Estrategia SEO","tech":"Pilar SEO técnico","cs":"Pilar Estructuras de datos","dev":"Pilar Next.js y CMS headless","geo":"Pilar GEO SEO"}
links_all=[(f,t,ty) for f,t,ty,why,st in M["add"]]
for key,c in M["CL"].items():
    pil=c["pillar"]; ids={pil:"pillar"}; clusters=[]
    for ci,(cn,lst) in enumerate(c["clusters"].items()):
        posts=[]
        for pi,x in enumerate(lst):
            p=path(c["cat"],x); ids[p]=f"cluster-{ci}-post-{pi}"
            slug=p.split("/")[-1]; r=P.get(p)
            posts.append({"title":(r["h1"] if r else M["NEW"].get(p,slug))[:60],"keyword":ANCH.get(slug,slug),"volume":VOL.get(slug,0),"template":"ultimate-guide" if False else "explainer","wordCount":(r["words"] if r else 1500),"url":p,"status":"written" if r else "planned"})
        clusters.append({"name":cn,"color":COL[ci%5],"posts":posts})
    L2=[]; seen=set()
    def A(f,t,ty):
        if f!=t and (f,t) not in seen: seen.add((f,t)); L2.append({"from":f,"to":t,"type":ty})
    for ci,c2 in enumerate(clusters):
        k=len(c2["posts"])
        for pi in range(k):
            me="cluster-%d-post-%d"%(ci,pi)
            A(me,"pillar","mandatory"); A("pillar",me,"mandatory")
            for d in (1,2):
                if k>d: A(me,"cluster-%d-post-%d"%(ci,(pi+d)%k),"optional")
        A("cluster-%d-post-0"%ci,"cluster-%d-post-0"%((ci+1)%len(clusters)),"optional")
    n=sum(len(c2["posts"]) for c2 in clusters)
    pr=P.get(pil); pk=ANCH.get(pil.split("/")[-1],c["kw"])
    data={"pillar":{"title":TITLES[key],"keyword":c["kw"],"volume":VOL.get(pil.split("/")[-1],0),"template":"ultimate-guide","wordCount":(pr["words"] if pr else 3000),"url":pil},"clusters":clusters,"links":L2,"meta":{"totalPosts":n+1,"totalClusters":len(clusters),"totalLinks":len(L2),"estimatedWords":sum(p["wordCount"] for c2 in clusters for p in c2["posts"])+(pr["words"] if pr else 3000)}}
    json.dump(data,open(f"{S}/out/cluster-plan-{key}.json","w"),ensure_ascii=False,indent=1)
    html=re.sub(r"const CLUSTER_DATA = \{.*?\n    \};",lambda m:"const CLUSTER_DATA = "+json.dumps(data,ensure_ascii=False)+";",tpl,count=1,flags=re.S)
    open(f"{S}/out/cluster-map-{key}.html","w").write(html)
    print(key,n+1,"posts",len(L2),"links")
