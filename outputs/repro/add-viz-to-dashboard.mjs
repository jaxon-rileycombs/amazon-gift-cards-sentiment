import { readFileSync, writeFileSync } from "node:fs";
const path = "outputs/gift-cards-balanced-three-class-dashboard.html";
let html = readFileSync(path, "utf8");
const css =
  ".micro{display:grid;grid-template-columns:54px 1fr 32px;gap:9px;align-items:center;margin:11px 0;font-size:.84rem}.pair{display:grid;grid-template-columns:92px 1fr 34px 1fr 34px;gap:7px;align-items:center;margin:13px 0;font-size:.8rem}.mini{height:10px;background:#07101c;border-radius:12px;overflow:hidden}.mini i{display:block;height:100%;min-width:3px;border-radius:12px}.actual{background:#819ac7}.pred{background:var(--accent)}.key{display:flex;gap:14px;color:var(--muted);font-size:.78rem;margin:13px 0}.key i{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:5px}";
const section =
  '<h2>Descriptive & prediction view</h2><section class="grid"><div class="card"><div class="label">Star-rating distribution · balanced sample</div><div id="star-bars"></div><div class="note">The sample is balanced by class, not by individual star: 1–2★ and 4–5★ are pooled before sampling.</div></div><div class="card"><div class="label">Held-out answer vs. model prediction</div><div class="key"><span><i style="background:#819ac7"></i>Rating-derived answer</span><span><i style="background:var(--accent)"></i>Model prediction</span></div><div id="compare-bars"></div><div class="note"><b>Visible failure mode:</b> the model predicts NEGATIVE 73 times, including 26 of the 50 neutral reviews.</div></div></section>';
const code =
  "const starCounts=Object.fromEntries([1,2,3,4,5].map(s=>[s,R.results.filter(x=>x.rating===s).length]));$('#star-bars').innerHTML=[1,2,3,4,5].map(s=>'<div class=\"micro\"><span>'+s+'★</span><div class=\"mini\"><i style=\"width:'+Math.max(3,starCounts[s]/R.total*100)+'%;background:'+(['var(--neg)','var(--neg)','var(--neu)','var(--pos)','var(--pos)'][s-1])+'\"></i></div><b>'+starCounts[s]+'</b></div>').join('');const predicted=Object.fromEntries(labels.map(l=>[l,R.results.filter(x=>x.prediction===l).length]));$('#compare-bars').innerHTML=labels.map(l=>'<div class=\"pair\"><b>'+l+'</b><div class=\"mini\"><i class=\"actual\" style=\"width:'+R.perClass[l].total/R.total*100+'%\"></i></div><b>'+R.perClass[l].total+'</b><div class=\"mini\"><i class=\"pred\" style=\"width:'+Math.max(3,predicted[l]/R.total*100)+'%\"></i></div><b>'+predicted[l]+'</b></div>').join('');";
if (!html.includes('id="star-bars"')) {
  html = html
    .replace("</style>", css + "</style>")
    .replace("<h2>Review evidence</h2>", section + "<h2>Review evidence</h2>")
    .replace("function draw(f){", code + "function draw(f){");
}
writeFileSync(path, html);
