CSS="""
:root{--bg:#f7f6f2;--surface:#fff;--ink:#16181d;--muted:#4b5160;--line:#dedbd2;--accent:#1d4ed8;--accent-ink:#fff;--good:#0f6b3d;--warn:#8a5a00;--bad:#a32020;--good-bg:#e4f4ea;--warn-bg:#fdf0d5;--bad-bg:#fbe5e5}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#101216;--surface:#181b21;--ink:#eceef2;--muted:#a8afbd;--line:#2b303a;--accent:#7aa2ff;--accent-ink:#0b1020;--good:#6fd39b;--warn:#f0c46a;--bad:#ff8f8f;--good-bg:#12301f;--warn-bg:#33270c;--bad-bg:#3a1717}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.skip{position:absolute;left:-999px;top:0;background:var(--accent);color:var(--accent-ink);padding:10px 14px;z-index:20}.skip:focus{left:8px;top:8px}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
a{color:var(--accent)}
header.top{padding:44px 16px 24px;border-bottom:1px solid var(--line);background:var(--surface)}
.wrap{max-width:1080px;margin:0 auto;padding:0 16px}header.top .wrap{padding:0}
.eyebrow{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
h1{font-size:clamp(1.7rem,4vw,2.5rem);line-height:1.15;margin:0 0 12px}h2{font-size:1.45rem;line-height:1.25;margin:0 0 6px}h3{font-size:1.08rem;margin:22px 0 6px}
p{margin:0 0 12px}.lead{font-size:1.08rem;color:var(--muted);max-width:70ch}.small{font-size:.86rem;color:var(--muted)}
nav.toc{position:sticky;top:0;z-index:10;background:var(--surface);border-bottom:1px solid var(--line)}
nav.toc ul{list-style:none;margin:0 auto;padding:0 16px;display:flex;gap:2px;overflow-x:auto;max-width:1080px}
nav.toc a{display:block;padding:12px 10px;color:var(--ink);text-decoration:none;white-space:nowrap;font-size:.9rem;border-bottom:3px solid transparent}nav.toc a:hover{border-bottom-color:var(--accent)}
section{padding:42px 0;border-bottom:1px solid var(--line)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:18px 0}
.kpi{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px}.kpi b{display:block;font-size:1.8rem;line-height:1.1}.kpi span{color:var(--muted);font-size:.88rem}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px;margin:12px 0}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.grid2 .card{margin:0}
.callout{border-left:5px solid var(--accent);background:var(--surface);padding:14px 18px;border-radius:0 10px 10px 0;margin:16px 0}
.callout.warn{border-left-color:var(--warn);background:var(--warn-bg)}.callout.bad{border-left-color:var(--bad);background:var(--bad-bg)}.callout.good{border-left-color:var(--good);background:var(--good-bg)}
.tbl{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--surface);margin:14px 0}
table{border-collapse:collapse;width:100%;min-width:680px;font-size:.92rem}caption{text-align:left;padding:12px 14px;font-weight:600}
th,td{padding:9px 14px;text-align:left;border-top:1px solid var(--line);vertical-align:top}th{background:var(--bg);font-weight:600}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tag{display:inline-block;padding:1px 9px;border-radius:99px;font-size:.78rem;font-weight:600;border:1px solid currentColor;white-space:nowrap}
.tag.keep{color:var(--good);background:var(--good-bg)}.tag.fix{color:var(--warn);background:var(--warn-bg)}.tag.new{color:var(--accent)}.tag.cut{color:var(--bad);background:var(--bad-bg)}
code{background:var(--bg);padding:1px 6px;border-radius:5px;font-size:.88em;word-break:break-all}
ol.s,ul.s{padding-left:22px;margin:8px 0}ol.s li,ul.s li{margin-bottom:6px}
del{color:var(--bad)}ins{color:var(--good);text-decoration:none;font-weight:600}
.copy{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px;margin:14px 0}
.copy h4{margin:18px 0 4px;font-size:1rem}.copy .meta{background:var(--bg);border-radius:8px;padding:10px 14px;font-size:.9rem;margin-bottom:14px}
.copy blockquote{margin:8px 0;padding:2px 14px;border-left:3px solid var(--line);color:var(--ink)}
footer{padding:30px 0 60px;color:var(--muted);font-size:.9rem}
.flow{display:grid;gap:8px}.flow .step{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:start}.flow .num{width:34px;height:34px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-weight:700}
@media(max-width:560px){h1{font-size:1.6rem}}
"""
