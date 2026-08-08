export function renderCheckoutPage(slug: string) {
  const safeSlug = JSON.stringify(slug);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#0f172a" />
  <title>Confirmar entrega | Miranda Express</title>
  <style>
    *{box-sizing:border-box} body{margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .wrap{max-width:620px;margin:0 auto;padding:14px 14px 40px}.brand{font-size:21px;font-weight:900;margin:4px 0 12px}.hero,.card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 8px 30px rgba(15,23,42,.06)}
    .trust{display:grid;grid-template-columns:1fr;gap:8px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:13px;margin-bottom:12px;font-weight:750;color:#166534}.hero{overflow:hidden}.photo{width:100%;aspect-ratio:4/3;object-fit:contain;background:#fff}.placeholder{display:flex;align-items:center;justify-content:center;aspect-ratio:4/3;background:#f1f5f9;color:#64748b;font-weight:700}.content{padding:16px}.name{font-size:22px;line-height:1.2;font-weight:900}.desc{color:#475569;font-size:14px;line-height:1.5;margin-top:7px}.price{font-size:29px;font-weight:950;margin-top:12px}.muted{color:#64748b;font-size:13px}.qty{display:flex;align-items:center;gap:12px;margin-top:14px}.qty button{width:42px;height:42px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;font-size:22px;font-weight:900}.qty strong{min-width:24px;text-align:center;font-size:18px}.card{padding:16px;margin-top:12px}.card h2{font-size:18px;margin:0 0 13px}.grid{display:grid;gap:11px}.field label{display:block;font-size:13px;font-weight:800;margin:0 0 5px}.field input,.field select{width:100%;height:48px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;font:inherit;background:#fff;color:#0f172a}.field input:focus,.field select:focus{outline:3px solid rgba(34,197,94,.15);border-color:#22c55e}.pay{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pay label{border:1px solid #cbd5e1;border-radius:12px;padding:12px;font-weight:800;cursor:pointer}.pay input{margin-right:7px}.summary{display:grid;gap:8px;font-size:15px}.row{display:flex;justify-content:space-between;gap:16px}.total{font-size:22px;font-weight:950;padding-top:10px;border-top:1px solid #e2e8f0}.notice{margin-top:12px;padding:12px;background:#f0fdf4;border-radius:12px;color:#166534;font-weight:800;font-size:14px}.btn{width:100%;border:0;border-radius:14px;min-height:54px;padding:13px;background:#16a34a;color:white;font-size:17px;font-weight:950;cursor:pointer;margin-top:14px}.btn:disabled{opacity:.55;cursor:not-allowed}.secondary{background:#0f172a}.error{display:none;margin-top:11px;padding:11px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-weight:700;font-size:14px}.success{display:none}.success h1{font-size:25px}.order-code{font-size:22px;font-weight:950;background:#f1f5f9;padding:12px;border-radius:12px;text-align:center;margin:12px 0}.loading{padding:34px;text-align:center;color:#475569;font-weight:750}@media(min-width:560px){.trust{grid-template-columns:repeat(3,1fr);font-size:13px;text-align:center}.grid.two{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="brand">Miranda Express</div>
    <div class="trust"><span>🚚 Entregamos hoje</span><span>💰 Pague só na entrega</span><span>✅ Nada é cobrado aqui</span></div>
    <div id="loading" class="card loading">Carregando seu produto...</div>
    <section id="app" style="display:none">
      <div class="hero">
        <div id="imageBox"></div>
        <div class="content">
          <div class="name" id="productName"></div>
          <div class="desc" id="productDescription"></div>
          <div class="price" id="productPrice"></div>
          <div class="muted">Pagamento somente quando você receber.</div>
          <div class="qty"><button type="button" id="minus">−</button><strong id="quantity">1</strong><button type="button" id="plus">+</button><span class="muted" id="stock"></span></div>
        </div>
      </div>

      <div class="card">
        <h2>Onde vamos entregar?</h2>
        <div class="grid">
          <div class="field"><label for="name">Seu nome</label><input id="name" autocomplete="name" placeholder="Nome completo" /></div>
          <div class="field"><label for="phone">WhatsApp</label><input id="phone" inputmode="tel" autocomplete="tel" placeholder="(91) 99999-9999" /></div>
          <div class="field"><label for="neighborhood">Bairro / conjunto</label><select id="neighborhood"><option value="">Selecione onde será a entrega</option></select></div>
          <div class="grid two">
            <div class="field"><label for="address">Endereço</label><input id="address" autocomplete="street-address" placeholder="Rua, passagem, avenida..." /></div>
            <div class="field"><label for="number">Número</label><input id="number" placeholder="Nº" /></div>
          </div>
          <div class="field"><label for="reference">Ponto de referência (opcional)</label><input id="reference" placeholder="Ex.: próximo à praça" /></div>
        </div>
      </div>

      <div class="card">
        <h2>Como prefere pagar na entrega?</h2>
        <div class="pay">
          <label><input type="radio" name="payment" value="pix" checked /> Pix</label>
          <label><input type="radio" name="payment" value="cash" /> Dinheiro</label>
        </div>
        <div class="notice">Você não paga nada agora. O pagamento é feito somente após a entrega do produto.</div>
      </div>

      <div class="card">
        <h2>Resumo da entrega</h2>
        <div class="summary">
          <div class="row"><span>Produto(s)</span><strong id="productsTotal">—</strong></div>
          <div class="row"><span>Taxa de entrega</span><strong id="deliveryFee">Selecione o bairro</strong></div>
          <div class="row total"><span>Total na entrega</span><strong id="grandTotal">—</strong></div>
        </div>
        <div id="error" class="error"></div>
        <button class="btn" id="confirm" type="button">CONFIRMAR MINHA ENTREGA</button>
      </div>
    </section>

    <section id="success" class="card success">
      <h1>✅ Pedido recebido!</h1>
      <p>Seu produto foi reservado. A entrega será realizada hoje e o pagamento será feito somente na entrega.</p>
      <div class="order-code" id="orderCode">Pedido confirmado</div>
      <button class="btn secondary" id="whatsapp" type="button">ACOMPANHAR PELO WHATSAPP</button>
    </section>
  </main>
<script>
(() => {
  const slug = ${safeSlug};
  const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const $ = id => document.getElementById(id);
  let pageData = null;
  let quantity = 1;
  let quote = null;
  let quoteTimer = null;

  function showError(message){$('error').textContent=message;$('error').style.display='block'}
  function clearError(){$('error').style.display='none';$('error').textContent=''}
  function getPayment(){return document.querySelector('input[name="payment"]:checked').value}
  function tracking(){const p=new URLSearchParams(location.search);return {source:'meta',utm_source:p.get('utm_source'),utm_medium:p.get('utm_medium'),utm_campaign:p.get('utm_campaign'),utm_content:p.get('utm_content')}}

  async function request(url, options){
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if(!res.ok) throw new Error(data?.error?.message || 'Não foi possível concluir. Tente novamente.');
    return data;
  }

  function renderProduct(){
    const p=pageData.product;
    $('productName').textContent=p.name;
    $('productDescription').textContent=p.description || '';
    $('productPrice').textContent=money(p.sale_price);
    $('stock').textContent=p.available_quantity>0 ? 'Disponível para entrega' : 'Indisponível';
    $('imageBox').innerHTML=p.image_url ? '<img class="photo" alt="Produto" src="'+String(p.image_url).replace(/"/g,'&quot;')+'" />' : '<div class="placeholder">Miranda Express</div>';
    const select=$('neighborhood');
    pageData.delivery_zones.forEach(z=>{const o=document.createElement('option');o.value=z.neighborhood;o.textContent=z.neighborhood+(Number(z.delivery_fee)===0?' — entrega grátis':' — '+money(z.delivery_fee));select.appendChild(o)});
    updateQty();
  }

  function updateQty(){$('quantity').textContent=String(quantity);$('minus').disabled=quantity<=1;$('plus').disabled=quantity>=Math.min(20,Number(pageData.product.available_quantity||0));scheduleQuote()}
  function scheduleQuote(){clearTimeout(quoteTimer);quoteTimer=setTimeout(loadQuote,180)}

  async function loadQuote(){
    clearError();
    const neighborhood=$('neighborhood').value;
    if(!neighborhood){quote=null;$('productsTotal').textContent=money(Number(pageData.product.sale_price)*quantity);$('deliveryFee').textContent='Selecione o bairro';$('grandTotal').textContent='—';return}
    try{
      const result=await request('/api/v1/public/checkout/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:pageData.product.id,quantity,neighborhood})});
      quote=result.data;
      $('productsTotal').textContent=money(quote.products_total);
      $('deliveryFee').textContent=Number(quote.delivery_fee)===0?'Grátis':money(quote.delivery_fee);
      $('grandTotal').textContent=money(quote.total);
    }catch(e){quote=null;showError(e.message)}
  }

  async function confirmOrder(){
    clearError();
    const name=$('name').value.trim();
    const phone=$('phone').value.replace(/\D/g,'');
    const neighborhood=$('neighborhood').value;
    const address=$('address').value.trim();
    const number=$('number').value.trim();
    const reference=$('reference').value.trim();
    if(name.length<2) return showError('Informe seu nome.');
    if(phone.length<10) return showError('Informe um WhatsApp válido.');
    if(!neighborhood) return showError('Selecione o bairro da entrega.');
    if(address.length<3 || !number) return showError('Informe o endereço e o número.');
    $('confirm').disabled=true;$('confirm').textContent='CONFIRMANDO...';
    try{
      const result=await request('/api/v1/public/checkout/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer:{name,phone,neighborhood,address:address+', '+number,reference:reference||null},items:[{product_id:pageData.product.id,quantity}],payment_method:getPayment(),preferred_delivery_time:'Hoje',notes:'Pedido realizado pelo checkout de entrega.',marketing:tracking()})});
      const raw=result.data?.order;
      const first=Array.isArray(raw)?raw[0]:raw;
      const code=first?.order_number || first?.order_code || first?.code || first?.number || first?.id || 'Pedido confirmado';
      $('orderCode').textContent=String(code);
      $('app').style.display='none';$('success').style.display='block';
      const whatsapp=result.data?.whatsapp_number;
      $('whatsapp').onclick=()=>{
        const msg='Olá! Fiz meu pedido pelo site. Pedido '+String(code)+'.';
        if(whatsapp){location.href='https://wa.me/'+String(whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent(msg)}
        else{location.href='https://wa.me/?text='+encodeURIComponent(msg)}
      };
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){showError(e.message);$('confirm').disabled=false;$('confirm').textContent='CONFIRMAR MINHA ENTREGA'}
  }

  $('minus').onclick=()=>{if(quantity>1){quantity--;updateQty()}};
  $('plus').onclick=()=>{if(quantity<Math.min(20,Number(pageData?.product?.available_quantity||0))){quantity++;updateQty()}};
  $('neighborhood').onchange=loadQuote;
  $('confirm').onclick=confirmOrder;

  request('/api/v1/public/checkout/'+encodeURIComponent(slug))
    .then(result=>{pageData=result.data;if(!pageData.product.available_quantity)throw new Error('Produto temporariamente sem estoque.');renderProduct();$('loading').style.display='none';$('app').style.display='block'})
    .catch(e=>{$('loading').textContent=e.message});
})();
</script>
</body>
</html>`;
}
