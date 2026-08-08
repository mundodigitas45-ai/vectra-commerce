import { MIRANDA_LOGO_DATA_URI } from "./checkout.brand";

export function renderStorefrontPage() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#090909" />
  <title>Miranda Express | Loja</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f5f1e8;color:#111827;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hero{background:linear-gradient(145deg,#050505,#17130a);color:#fff;border-bottom:3px solid #e6b800}.shell{max-width:1120px;margin:0 auto;padding:18px}.brandbar{display:flex;align-items:center;gap:14px}.brandbar img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:1px solid rgba(230,184,0,.65)}.brandname{font-size:28px;font-weight:950;letter-spacing:.3px}.gold{color:#f2c316}.tag{font-size:14px;color:#d1d5db;margin-top:4px}.hero-copy{margin-top:22px;padding:20px 0 8px}.hero-copy h1{font-size:34px;line-height:1.05;margin:0 0 8px}.hero-copy p{margin:0;color:#e5e7eb;max-width:720px;line-height:1.5}.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.trust div{background:#151515;border:1px solid #5d4b00;border-radius:14px;padding:12px;text-align:center;color:#f6d85b;font-weight:800;font-size:14px}.content{max-width:1120px;margin:0 auto;padding:22px 18px 48px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:14px}.section-head h2{margin:0;font-size:25px}.section-head p{margin:0;color:#6b7280;font-size:14px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 9px 24px rgba(0,0,0,.06);display:flex;flex-direction:column}.image{aspect-ratio:1/1;background:#0d0d0d;display:flex;align-items:center;justify-content:center;padding:18px}.image img.product{width:100%;height:100%;object-fit:contain}.image img.fallback{width:42%;max-width:120px;border-radius:50%}.body{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}.name{font-size:16px;font-weight:900;line-height:1.25}.desc{font-size:13px;color:#6b7280;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.stock{font-size:12px;font-weight:800}.ok{color:#166534}.low{color:#b45309}.out{color:#b91c1c}.price{font-size:23px;font-weight:950}.small{font-size:12px;color:#6b7280}.btn{display:block;text-align:center;text-decoration:none;border-radius:12px;padding:12px 10px;font-weight:950;margin-top:auto}.buy{background:#e6b800;color:#111}.buy:hover{filter:brightness(.96)}.disabled{background:#e5e7eb;color:#9ca3af;pointer-events:none}.loading,.empty{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;text-align:center;color:#6b7280}.footer{text-align:center;color:#6b7280;font-size:12px;margin-top:28px}.whatsapp{position:fixed;right:18px;bottom:18px;background:#16a34a;color:#fff;text-decoration:none;font-weight:900;border-radius:999px;padding:13px 16px;box-shadow:0 12px 25px rgba(22,163,74,.28)}@media(min-width:720px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.hero-copy h1{font-size:44px}}@media(max-width:520px){.shell{padding:14px}.brandbar img{width:60px;height:60px}.brandname{font-size:23px}.hero-copy{margin-top:15px}.hero-copy h1{font-size:28px}.trust{grid-template-columns:1fr}.content{padding:18px 12px 42px}.grid{gap:10px}.body{padding:11px}.name{font-size:14px}.price{font-size:20px}.btn{font-size:13px}.section-head{align-items:start;flex-direction:column}}
  </style>
</head>
<body>
  <header class="hero">
    <div class="shell">
      <div class="brandbar"><img src="${MIRANDA_LOGO_DATA_URI}" alt="Miranda Express" /><div><div class="brandname">MIRANDA <span class="gold">EXPRESS</span></div><div class="tag">Seu produto, na hora que você precisa.</div></div></div>
      <div class="hero-copy"><h1>Escolha seu produto e receba <span class="gold">em Belém</span></h1><p>Veja os produtos disponíveis, escolha o que deseja e confirme sua entrega. Você não paga nada nesta página: o pagamento é feito somente quando receber.</p></div>
      <div class="trust"><div>🚚 Entrega rápida</div><div>💰 Pague só na entrega</div><div>🔒 Compra segura</div></div>
    </div>
  </header>
  <main class="content">
    <div class="section-head"><div><h2>Produtos disponíveis</h2><p>Toque em um produto para ver os detalhes e pedir.</p></div></div>
    <div id="loading" class="loading">Carregando produtos...</div>
    <div id="products" class="grid" style="display:none"></div>
    <div id="empty" class="empty" style="display:none">Nenhum produto disponível no momento.</div>
    <div class="footer">Miranda Express • Entrega rápida em Belém e região</div>
  </main>
  <a id="whatsapp" class="whatsapp" href="#">WhatsApp</a>
<script>
(function(){
  var logo=${JSON.stringify(MIRANDA_LOGO_DATA_URI)};
  function el(id){return document.getElementById(id)}
  function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  fetch('/api/v1/public/storefront')
    .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error((d.error&&d.error.message)||'Não foi possível carregar os produtos.');return d})})
    .then(function(result){
      var data=result.data||{};var products=data.products||[];el('loading').style.display='none';
      var wa=data.storefront&&data.storefront.whatsapp_number?String(data.storefront.whatsapp_number).replace(/\D/g,''):'';
      el('whatsapp').href=wa?'https://wa.me/'+wa:'https://wa.me/';
      if(!products.length){el('empty').style.display='block';return}
      var grid=el('products');grid.style.display='grid';
      products.forEach(function(p){
        var qty=Number(p.available_quantity||0);var cls=qty<=0?'out':qty<=3?'low':'ok';var label=qty<=0?'Sem estoque':qty<=3?'Últimas unidades':'Disponível para entrega';
        var image=p.image_url?'<img class="product" src="'+escapeHtml(p.image_url)+'" alt="'+escapeHtml(p.name)+'" />':'<img class="fallback" src="'+logo+'" alt="Miranda Express" />';
        var href='/pedir/'+encodeURIComponent(p.slug);
        var button=qty>0?'<a class="btn buy" href="'+href+'">PEDIR AGORA</a>':'<span class="btn disabled">INDISPONÍVEL</span>';
        var card=document.createElement('article');card.className='card';card.innerHTML='<div class="image">'+image+'</div><div class="body"><div class="name">'+escapeHtml(p.name)+'</div><div class="desc">'+escapeHtml(p.description||'Produto disponível para entrega pela Miranda Express.')+'</div><div class="stock '+cls+'">'+label+'</div><div class="price">'+money(p.sale_price)+'</div><div class="small">Pagamento somente na entrega</div>'+button+'</div>';grid.appendChild(card);
      });
    })
    .catch(function(e){el('loading').textContent=e.message||String(e)});
})();
</script>
</body>
</html>`;
}
