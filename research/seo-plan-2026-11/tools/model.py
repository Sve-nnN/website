import json,collections,csv,re
S="/private/tmp/claude-501/-Users-juan-Documents-Codigo-Personal-juantech-juan-payload/4733a4c1-4fd3-42c8-b200-cd5fc18963d0/scratchpad"
R=json.load(open(S+"/crawl.json"))
P={(r["url"].replace("https://juan-tech.com","").rstrip("/") or "/"):r for r in R}
ES={k:r for k,r in P.items() if not k.startswith("/en")}
B="/blog/"
def b(cat,slug): return f"{B}{cat}/{slug}"
# ---------- clusters propuestos ----------
CL={
 "seo":{"pillar":b("seo","estrategia-seo"),"kw":"estrategia seo","clusters":{
   "Contenido":["guia-keyword-research","estrategia-de-contenidos","redaccion-seo","mejores-cursos-seo-espanol"],
   "Arquitectura":["topic-clusters-seo","pillar-page-seo","enlaces-internos-guia","canibalizacion-seo"],
   "Autoridad":["guia-eeat","seo-off-page-guia"]}, "cat":"seo","service":"/servicios/seo-consulting"},
 "tech":{"pillar":b("tech-seo","technical-seo-guide"),"kw":"seo técnico","clusters":{
   "Rastreo e indexación":["robots-txt-best-practices","xml-sitemap-automation","guia-google-search-console","auditoria-seo","technical-seo-checklist"],
   "Rendimiento y renderizado":["core-web-vitals-guide","web-performance-guide","javascript-seo","ssr-vs-csr-seo"],
   "Datos y on page":["structured-data-seo","schema-markup-guide","seo-on-page-guia","non-developers-guide"]},"cat":"tech-seo","service":"/servicios/seo-technical-audit"},
 "cs":{"pillar":b("cs-fundamentals","data-structures"),"kw":"estructuras de datos","clusters":{
   "Lineales y hash":["pilas-y-colas","queue-data-structure","tablas-hash","heap-data-structure"],
   "Árboles y grafos":["arboles-binarios","binary-search-tree","tree-traversal","graph-algorithms"],
   "Complejidad":["complejidad-algoritmica","time-complexity","space-complexity"],
   "Algoritmos":["algoritmos-ordenamiento","merge-sort-python","quicksort-python","recursividad","dynamic-programming"],
   "Bases de datos":["diseno-bases-datos","normalizacion-bases-datos"]},"cat":"cs-fundamentals","service":"/servicios/fullstack-development"},
 "dev":{"pillar":b("development","headless-cms-comparison"),"kw":"headless cms","clusters":{
   "Frameworks":["astro-vs-nextjs","react-19","hidratacion-web"],
   "CMS headless":["nextjs-cms","payload-cms-guide"],
   "SEO del stack":[("tech-seo","nextjs-seo"),("tech-seo","headless-cms-seo")]},"cat":"development","service":"/servicios/fullstack-development"},
 "geo":{"pillar":b("tech-seo","geo-seo-guia"),"kw":"geo seo","clusters":{
   "Fundamentos GEO":[("tech-seo","llms-txt-guia"),("tech-seo","citabilidad-contenido-ia")],
   "Medición":[("tech-seo","medir-citas-ia")]},"cat":"tech-seo","service":"/servicios/ai-seo-geo","new":True},
}
def path(cat,x): return b(*x) if isinstance(x,tuple) else b(cat,x)
CASES=[k for k in P if k.startswith("/case-studies/") and not k.startswith("/en")]
SERV=["/servicios/seo-consulting","/servicios/seo-technical-audit","/servicios/ai-seo-geo","/servicios/fullstack-development"]
NEW={b("tech-seo","geo-seo-guia"):"GEO SEO: guía para que la IA cite tu sitio",b("tech-seo","llms-txt-guia"):"llms.txt qué es y cómo implementarlo",b("tech-seo","citabilidad-contenido-ia"):"Contenido citable por la IA",b("tech-seo","medir-citas-ia"):"Medir citas en ChatGPT y Perplexity"}
# ---------- enlaces propuestos ----------
add=[]  # (from,to,type,why)
def E(f,t,ty,why): 
    if f!=t: add.append((f,t,ty,why))
posts_by_cl={}
for key,c in CL.items():
    pil=c["pillar"]; allsp=[]
    for cn,lst in c["clusters"].items():
        ps=[path(c["cat"],x) for x in lst]; allsp+=ps; posts_by_cl[(key,cn)]=ps
        for i,p in enumerate(ps):
            E(p,pil,"spoke→pilar","obligatorio")
            E(pil,p,"pilar→spoke","obligatorio")
            for q in (ps[(i+1)%len(ps)],ps[(i+2)%len(ps)] if len(ps)>2 else None):
                if q: E(p,q,"spoke↔spoke","mismo cluster")
    names=list(posts_by_cl_keys:=[k for k in c["clusters"]])
    # cross cluster: primer spoke de cada cluster enlaza al primero del siguiente
    firsts=[path(c["cat"],lst[0]) for lst in c["clusters"].values()]
    for i,p in enumerate(firsts): E(p,firsts[(i+1)%len(firsts)],"cross-cluster","puente temático")
    svc=c["service"]
    for p in allsp+[pil]: E(p,svc,"→ servicio","puente a conversión")
    E(svc,pil,"servicio→guía","refuerza autoridad")
    for p in allsp[:2]: E(svc,p,"servicio→guía","refuerza autoridad")
# pilares entre sí
E(CL["seo"]["pillar"],CL["tech"]["pillar"],"pilar↔pilar","")
E(CL["tech"]["pillar"],CL["seo"]["pillar"],"pilar↔pilar","")
E(CL["tech"]["pillar"],CL["geo"]["pillar"],"pilar↔pilar","")
E(CL["geo"]["pillar"],CL["tech"]["pillar"],"pilar↔pilar","")
E(CL["dev"]["pillar"],CL["tech"]["pillar"],"pilar↔pilar","")
E(CL["cs"]["pillar"],CL["tech"]["pillar"],"pilar↔pilar","puente desarrolladores a SEO técnico")
# casos ↔ servicios
cmap={"migracion-ecommerce-nextjs-seo-tecnico":["/servicios/seo-technical-audit","/servicios/fullstack-development"],
 "pittsburgh-criminal-defense-legal-content-seo":["/servicios/seo-consulting"],"immigration-law-atlanta-seo":["/servicios/seo-consulting"],
 "edtech-financiera-infantil-crecimiento-organico-seo":["/servicios/seo-consulting"],"fabricante-baldosa-hidraulica-seo-espana":["/servicios/seo-consulting","/servicios/seo-technical-audit"],
 "urologo-seo-local-salud-santiago-rd":["/servicios/seo-consulting"],"talleres-costura-miami-lanzamiento-seo-local":["/servicios/seo-consulting"]}
for c,ss in cmap.items():
    cp="/case-studies/"+c
    for s in ss: E(cp,s,"caso→servicio","prueba a conversión"); E(s,cp,"servicio→caso","prueba social")
for s in SERV[:3]:
    for o in SERV:
        if o!=s: E(s,o,"servicio↔servicio","")
# servicios → guía GEO
E("/servicios/ai-seo-geo",CL["geo"]["pillar"],"servicio→guía","")
# páginas dev huérfanas: hub CS enlaza a posts de bases de datos y dev
E(b("cs-fundamentals","diseno-bases-datos"),b("development","sql-vs-nosql"),"spoke↔spoke","")
E(b("development","sql-vs-nosql"),b("cs-fundamentals","diseno-bases-datos"),"spoke↔spoke","")
# ---------- grafo actual ----------
nodes=list(ES.keys())+[n for n in NEW]
idx={n:i for i,n in enumerate(nodes)}
def cur_edges():
    E_={}
    for k,r in ES.items():
        body={t for t,a in r.get("body_links",[])}
        for t,a in r.get("all_links",[]):
            if t in idx and t!=k:
                w=1.0 if t in body else 0.25
                E_[(k,t)]=max(E_.get((k,t),0),w)
    return E_
def pr(E_,d=.85,it=80):
    n=len(nodes); out=collections.defaultdict(float)
    for (f,t),w in E_.items(): out[f]+=w
    v=[1/n]*n
    for _ in range(it):
        nv=[(1-d)/n]*n; dang=sum(v[idx[f]] for f in nodes if out[f]==0)
        for f,t in E_: nv[idx[t]]+=d*v[idx[f]]*E_[(f,t)]/out[f]
        for i in range(n): nv[i]+=d*dang/n
        v=nv
    return {k:v[idx[k]]*n for k in nodes}
cur=cur_edges()
# redirects/404 saneados en el estado propuesto: enlaces a rutas no existentes ya se ignoraron (no están en idx)
new=dict(cur)
body_new=set()
for f,t,ty,why in add:
    if f in idx and t in idx: new[(f,t)]=max(new.get((f,t),0),1.0); body_new.add((f,t))
pc,pn=pr(cur),pr(new)
json.dump({"cur":pc,"new":pn},open(S+"/out/pr.json","w"))
def grp(k):
    for key,c in CL.items():
        if k==c["pillar"]: return "pilar:"+key
    if k in SERV: return "servicio"
    if k.startswith("/case-studies/"): return "caso"
    if k=="/": return "home"
    if k in("/blog","/blog/seo","/blog/tech-seo","/blog/development","/blog/cs-fundamentals","/blog/general","/case-studies","/servicios"): return "hub/categoría"
    if k.startswith("/blog/"): return "post:"+k.split("/")[2]
    return "otras"
agg=collections.defaultdict(lambda:[0,0,0])
for k in nodes:
    g=grp(k); agg[g][0]+=pc[k]; agg[g][1]+=pn[k]; agg[g][2]+=1
print("grupo | n | PR actual (suma, escala N=1 por página) | propuesto | cambio %")
for g,(a,b2,n) in sorted(agg.items()): print(f"{g:22} {n:3} {a:7.2f} {b2:7.2f} {100*(b2-a)/a if a else 0:+6.0f}%")
print("\nTop servicios/pilares:")
for k in SERV+[c["pillar"] for c in CL.values()]+["/","/contact"]: print(f"  {k:55} {pc.get(k,0):5.2f} -> {pn.get(k,0):5.2f}")
# enlaces realmente nuevos (no existían en cuerpo)
cb={(k,t) for k,r in ES.items() for t,a in r.get("body_links",[])}
rows=[]
for f,t,ty,why in add:
    if (f,t) in cb: continue
    rows.append((f,t,ty,why,"existía en menú/footer" if (f,t) in cur else "nuevo"))
seen=set(); out=[]
for r in rows:
    if (r[0],r[1]) not in seen: seen.add((r[0],r[1])); out.append(r)
print("\nenlaces propuestos nuevos en cuerpo:",len(out), collections.Counter(r[2] for r in out))
json.dump({"add":out,"CL":CL,"NEW":NEW,"grp":{k:grp(k) for k in nodes}},open(S+"/out/model.json","w"),ensure_ascii=False)
# huérfanos y pocos enlaces (cuerpo) hoy
inb=collections.Counter(t for (f,t) in cb if f!=t)
print("\nES posts con ≤2 enlaces de cuerpo entrantes:",sum(1 for k in ES if k.startswith('/blog/') and k.count('/')==3 and inb[k]<=2))
