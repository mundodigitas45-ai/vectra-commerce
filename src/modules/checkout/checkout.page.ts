import { MIRANDA_LOGO_DATA_URI } from "./checkout.brand";

export function renderCheckoutPage(slug: string) {
  const safeSlug = JSON.stringify(slug);
  const safeLogo = JSON.stringify(MIRANDA_LOGO_DATA_URI);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#090909" />
  <title>Confirmar entrega | Miranda Express</title>
  <style>
    :root{--black:#090909;--black2:#141414;--gold:#f5b800;--gold2:#ffcf3a;--cream:#fffaf0;--white:#fff;--text:#181818;--muted:#666;--line:#e7e1d6;--green:#19a64a}
    *{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#080808 0,#101010 360px,#f4f1eb 360px);color:var(--text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:720px;margin:0 auto;padding:14px 14px 48px}
    .brand-header{display:flex;align-items:center;gap:14px;padding:12px 14px;border:1px solid #3a300e;border-radius:20px;background:linear-gradient(135deg,#070707,#171307);box-shadow:0 12px 34px rgba(0,0,0,.22)}.brand-logo{width:76px;height:76px;object-fit:cover;border-radius:50%;border:2px solid var(--gold);box-shadow:0 0 0 3px rgba(245,184,0,.12)}.brand-name{font-size:25px;line-height:1;font-weight:950;color:#fff;letter-spacing:.2px}.brand-name span{color:var(--gold)}.tagline{font-size:13px;color:#d7d7d7;margin-top:6px}.city{font-size:12px;color:var(--gold2);font-weight:800;margin-top:4px}
    .trust{display:grid;grid-template-columns:1fr;gap:8px;margin:12px 0;padding:12px;border:1px solid #4a3a08;background:#151206;border-radius:16px;color:#fff;font-weight:850}.trust span{display:flex;align-items:center;justify-content:center;gap:5px}.trust b{color:var(--gold2)}
    .steps{margin:12px 0;padding:15px 17px;background:linear-gradient(135deg,#1a1609,#0d0d0d);border:1px solid #4d3d09;border-radius:18px;color:#fff}.steps strong{display:block;color:var(--gold2);font-size:17px;margin-bottom:8px}.steps ol{margin:0;padding-left:20px;color:#eee;font-size:14px;line-height:1.65}.steps .small{margin-top:9px;color:#cfcfcf;font-size:12px}
    .hero,.card{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 10px 32px rgba(15,15,15,.08)}.hero{overflow:hidden}.product-media{background:linear-gradient(135deg,#0d0d0d,#201a08);padding:14px}.photo{width:100%;max-height:340px;object-fit:contain;background:#fff;border-radius:14px;padding:10px}.placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;background:#0d0d0d;border:1px dashed #65500e;border-radius:14px;color:#ddd;font-weight:800;text-align:center}.placeholder img{width:78px;height:78px;border-radius:50%;border:1px solid var(--gold)}.placeholder small{font-weight:600;color:#aaa}
    .content{padding:18px}.eyebrow{display:inline-block;background:#fff6d6;color:#7b5700;border:1px solid #f8d66d;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900;margin-bottom:8px}.name{font-size:23px;line-height:1.2;font-weight:950}.desc{color:#555;font-size:14px;line-height:1.55;margin-top:8px}.price{font-size:32px;font-weight:950;color:#111;margin-top:13px}.payment-note{font-size:13px;color:#796000;font-weight:800;margin-top:2px}.qty{display:flex;align-items:center;gap:12px;margin-top:15px}.qty button{width:42px;height:42px;border-radius:12px;border:1px solid #ddc76d;background:#fffaf0;color:#17120a;font-size:22px;font-weight:900;cursor:pointer}.qty strong{min-width:24px;text-align:center;font-size:18px}.muted{color:#737373;font-size:13px}
    .card{padding:18px;margin-top:12px}.card h2{font-size:19px;margin:0 0 7px}.section-number{display:inline-flex;width:26px;height:26px;align-items:center;justify-content:center;border-radius:50%;background:var(--gold);color:#111;font-size:13px;font-weight:950;margin-right:7px}.intro{font-size:14px;color:#555;margin-bottom:14px;line-height:1.5}.grid{display:grid;gap:11px}.field label{display:block;font-size:13px;font-weight:850;margin:0 0 5px}.field input,.field select{width:100%;height:49px;border:1px solid #cbc4b8;border-radius:12px;padding:0 12px;font:inherit;background:#fff;color:#171717}.field input:focus,.field select:focus{outline:3px solid rgba(245,184,0,.18);border-color:#d8a400}.help{font-size:12px;color:#777;margin-top:5px}.other-box{display:none;padding:13px;background:#fff9e8;border:1px solid #f0cf67;border-radius:12px}.other-title{font-weight:900;color:#6b4b00;margin-bottom:5px}.other-box p{font-size:13px;line-height:1.45;color:#715b23;margin:0 0 9px}
    .pay{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pay label{border:1px solid #d3cbbb;border-radius:12px;padding:12px;font-weight:850;cursor:pointer;background:#fff}.pay label:has(input:checked){border-color:#e2ab00;background:#fff9dd}.pay input{margin-right:7px;accent-color:#d8a400}.notice{margin-top:12px;padding:12px;background:#f6fff8;border:1px solid #bce9c8;border-radius:12px;color:#12642e;font-weight:800;font-size:14px;line-height:1.4}
    .summary{display:grid;gap:9px;font-size:15px}.row{display:flex;justify-content:space-between;gap:16px}.total{font-size:22px;font-weight:950;padding-top:11px;border-top:1px solid #e2dccf}.total strong{color:#111}.secure-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}.secure-item{padding:9px 6px;border-radius:10px;background:#121212;color:#fff;text-align:center;font-size:11px;font-weight:800}.secure-item b{display:block;color:var(--gold2);font-size:12px;margin-top:2px}
    .btn{width:100%;border:0;border-radius:14px;min-height:56px;padding:13px;background:linear-gradient(180deg,#22b857,#159642);color:#fff;font-size:17px;font-weight:950;cursor:pointer;margin-top:14px;box-shadow:0 8px 22px rgba(25,166,74,.22)}.btn:disabled{opacity:.55;cursor:not-allowed}.secondary{background:#111;border:1px solid var(--gold);color:var(--gold2);box-shadow:none}.error{display:none;margin-top:11px;padding:11px;border-radius:10px;background:#fff0f0;color:#b91c1c;font-weight:700;font-size:14px}.success{display:none}.success h1{font-size:25px}.order-code{font-size:22px;font-weight:950;background:#fff8da;border:1px solid #f2d36a;padding:12px;border-radius:12px;text-align:center;margin:12px 0}.loading{padding:34px;text-align:center;color:#555;font-weight:750}.footer{text-align:center;margin:20px 0 0;color:#666;font-size:12px}.footer strong{color:#111}.gold{color:#b88300;font-weight:900}
    @media(min-width:560px){.trust{grid-template-columns:repeat(3,1fr);font-size:13px}.grid.two{grid-template-columns:1fr 180px}.brand-logo{width:84px;height:84px}.brand-name{font-size:28px}}
  </style>
</head>
<body>
  <main class="wrap">
    <header class="brand-header">
      <img id="logo" class="brand-logo" alt="Logo Miranda Express" />
      <div><div class="brand-name">MIRANDA <span>EXPRESS</span></div><div class="tagline">Seu produto, na hora que você precisa.</div><div class="city">📍 Entrega rápida em Belém e Ananindeua</div></div>
    </header>

    <div class="trust"><span>🚚 <b>Entregamos hoje</b></span><span>💰 Pague só na entrega</span><span>🔒 Compra segura</span></div>

    <div class="steps"><strong>Como funciona seu pedido</strong><ol><li>Escolha a quantidade do produto.</li><li>Preencha seu nome, WhatsApp e endereço.</li><li>Selecione o bairro/conjunto para ver a taxa.</li><li>Confira o valor total e confirme a entrega.</li><li>Você paga somente quando receber.</li></ol><div class="small">Se seu bairro não aparecer, escolha “Não encontrei meu bairro” e nós confirmaremos a taxa pelo WhatsApp.</div></div>

    <div id="loading" class="card loading">Carregando seu produto...</div>

    <section id="app" style="display:none">
      <div class="hero">
        <div id="imageBox" class="product-media"></div>
        <div class="content">
          <div class="eyebrow">PRONTA ENTREGA • BELÉM</div>
          <div class="name" id="productName"></div>
          <div class="desc" id="productDescription"></div>
          <div class="price" id="productPrice"></div>
          <div class="payment-note">💰 Pagamento somente quando você receber.</div>
          <div class="qty"><button type="button" id="minus">−</button><strong id="quantity">1</strong><button type="button" id="plus">+</button><span class="muted" id="stock"></span></div>
        </div>
      </div>

      <div class="card">
        <h2><span class="section-number">1</span>Onde vamos entregar?</h2>
        <div class="intro">Preencha seus dados com atenção. A taxa é calculada automaticamente para os bairros cadastrados.</div>
        <div class="grid">
          <div class="field"><label for="name">Seu nome</label><input id="name" autocomplete="name" placeholder="Nome completo" /></div>
          <div class="field"><label for="phone">Seu WhatsApp</label><input id="phone" inputmode="tel" autocomplete="tel" placeholder="(91) 99999-9999" /></div>
          <div class="field"><label for="neighborhood">Bairro / conjunto</label><select id="neighborhood"><option value="">Toque aqui e selecione seu bairro</option></select><div class="help">Não encontrou? No final da lista existe a opção “Não encontrei meu bairro / conjunto”.</div></div>
          <div id="otherBox" class="other-box"><div class="other-title">Seu bairro ainda não está na tabela?</div><p>Digite o nome abaixo. Você poderá continuar pelo WhatsApp e nossa equipe confirmará a taxa antes do envio.</p><div class="field"><label for="customNeighborhood">Digite seu bairro / conjunto</label><input id="customNeighborhood" placeholder="Ex.: Conjunto X, bairro Y" /></div></div>
          <div class="grid two"><div class="field"><label for="address">Rua / avenida / passagem</label><input id="address" autocomplete="street-address" placeholder="Digite seu endereço" /></div><div class="field"><label for="number">Número</label><input id="number" placeholder="Nº" /></div></div>
          <div class="field"><label for="reference">Ponto de referência (opcional)</label><input id="reference" placeholder="Ex.: próximo à praça, mercado, igreja..." /></div>
        </div>
      </div>

      <div class="card"><h2><span class="section-number">2</span>Como prefere pagar na entrega?</h2><div class="intro">Escolha apenas como pretende pagar quando o produto chegar até você.</div><div class="pay"><label><input type="radio" name="payment" value="pix" checked /> Pix na entrega</label><label><input type="radio" name="payment" value="cash" /> Dinheiro</label></div><div class="notice">✅ Você não paga nada nesta página. O pagamento é feito somente após receber o produto.</div></div>

      <div class="card"><h2><span class="section-number">3</span>Confira e confirme</h2><div class="summary"><div class="row"><span>Produto(s)</span><strong id="productsTotal">—</strong></div><div class="row"><span>Taxa de entrega</span><strong id="deliveryFee">Selecione o bairro</strong></div><div class="row total"><span>Total na entrega</span><strong id="grandTotal">—</strong></div></div><div class="secure-strip"><div class="secure-item">🔒<b>Dados protegidos</b></div><div class="secure-item">📦<b>Entrega rápida</b></div><div class="secure-item">💰<b>Pague ao receber</b></div></div><div id="error" class="error"></div><button class="btn" id="confirm" type="button">CONFIRMAR MINHA ENTREGA</button></div>
    </section>

    <section id="success" class="card success"><h1>✅ Pedido recebido!</h1><p>Seu produto foi reservado. Agora você pode acompanhar o atendimento no mesmo WhatsApp da Miranda Express.</p><div class="order-code" id="orderCode">Pedido confirmado</div><button class="btn secondary" id="whatsapp" type="button">ACOMPANHAR PELO WHATSAPP</button></section>

    <footer class="footer"><strong>Miranda Express</strong> • <span class="gold">Entrega rápida em Belém</span><br/>Compra prática, atendimento rápido e pagamento na entrega.</footer>
  </main>

<script>
(function () {
  var slug = ${safeSlug};
  var BRAND_LOGO = ${safeLogo};
  var OTHER = '__other__';
  var pageData = null;
  var quantity = 1;
  var quoteTimer = null;

  function el(id) { return document.getElementById(id); }
  function money(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function showError(message) { el('error').textContent = message; el('error').style.display = 'block'; }
  function clearError() { el('error').textContent = ''; el('error').style.display = 'none'; }
  function getPayment() { var checked = document.querySelector('input[name="payment"]:checked'); return checked ? checked.value : 'pix'; }

  el('logo').src = BRAND_LOGO;

  function request(url, options) {
    return fetch(url, options).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var message = data && data.error && data.error.message ? data.error.message : 'Não foi possível concluir. Tente novamente.';
          throw new Error(message);
        }
        return data;
      });
    });
  }

  function renderProduct() {
    var product = pageData.product;
    el('productName').textContent = product.name;
    el('productDescription').textContent = product.description || '';
    el('productPrice').textContent = money(product.sale_price);
    el('stock').textContent = product.available_quantity > 0 ? 'Disponível para entrega' : 'Indisponível';

    if (product.image_url) {
      el('imageBox').innerHTML = '<img class="photo" alt="Produto" src="' + String(product.image_url).replace(/"/g, '&quot;') + '" />';
    } else {
      el('imageBox').innerHTML = '<div class="placeholder"><img alt="Miranda Express" src="' + BRAND_LOGO + '"/><div>Foto do produto em atualização</div><small>O produto e o preço abaixo já estão disponíveis para entrega.</small></div>';
    }

    if (pageData.checkout && pageData.checkout.logo_url) {
      el('logo').src = pageData.checkout.logo_url;
    }

    var select = el('neighborhood');
    pageData.delivery_zones.forEach(function (zone) {
      var option = document.createElement('option');
      option.value = zone.neighborhood;
      option.textContent = zone.neighborhood + (Number(zone.delivery_fee) === 0 ? ' — ENTREGA GRÁTIS' : ' — ' + money(zone.delivery_fee));
      select.appendChild(option);
    });

    var other = document.createElement('option');
    other.value = OTHER;
    other.textContent = '⚠ Não encontrei meu bairro / conjunto';
    select.appendChild(other);

    updateQty();
  }

  function currentProductsTotal() { return Number(pageData.product.sale_price) * quantity; }

  function updateQty() {
    el('quantity').textContent = String(quantity);
    el('minus').disabled = quantity <= 1;
    el('plus').disabled = quantity >= Math.min(20, Number(pageData.product.available_quantity || 0));
    clearTimeout(quoteTimer);
    quoteTimer = setTimeout(loadQuote, 180);
  }

  function loadQuote() {
    clearError();
    var neighborhood = el('neighborhood').value;
    el('otherBox').style.display = neighborhood === OTHER ? 'block' : 'none';

    if (!neighborhood) {
      el('productsTotal').textContent = money(currentProductsTotal());
      el('deliveryFee').textContent = 'Selecione o bairro';
      el('grandTotal').textContent = '—';
      return;
    }

    if (neighborhood === OTHER) {
      el('productsTotal').textContent = money(currentProductsTotal());
      el('deliveryFee').textContent = 'A confirmar no WhatsApp';
      el('grandTotal').textContent = 'A confirmar';
      return;
    }

    request('/api/v1/public/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: pageData.product.id, quantity: quantity, neighborhood: neighborhood })
    }).then(function (result) {
      var quote = result.data;
      el('productsTotal').textContent = money(quote.products_total);
      el('deliveryFee').textContent = Number(quote.delivery_fee) === 0 ? 'GRÁTIS' : money(quote.delivery_fee);
      el('grandTotal').textContent = money(quote.total);
    }).catch(function (error) {
      showError(error.message || String(error));
    });
  }

  function openManualWhatsapp(data) {
    var whatsapp = pageData.checkout && pageData.checkout.whatsapp_number ? pageData.checkout.whatsapp_number : '';
    var lines = [
      'Olá! Quero confirmar uma entrega da Miranda Express.',
      'Produto: ' + pageData.product.name,
      'Quantidade: ' + quantity,
      'Nome: ' + data.name,
      'Meu WhatsApp: ' + data.phone,
      'Bairro/conjunto: ' + data.neighborhood,
      'Endereço: ' + data.address + ', ' + data.number,
      'Referência: ' + (data.reference || 'Não informado'),
      'Pagamento na entrega: ' + (getPayment() === 'pix' ? 'Pix' : 'Dinheiro'),
      'Produtos: ' + money(currentProductsTotal()),
      'Taxa de entrega: A CONFIRMAR'
    ];
    window.location.href = 'https://wa.me/' + String(whatsapp).replace(/\\D/g, '') + '?text=' + encodeURIComponent(lines.join('\\n'));
  }

  function confirmOrder() {
    clearError();
    var name = el('name').value.trim();
    var phone = el('phone').value.replace(/\\D/g, '');
    var selected = el('neighborhood').value;
    var custom = el('customNeighborhood').value.trim();
    var address = el('address').value.trim();
    var number = el('number').value.trim();
    var reference = el('reference').value.trim();

    if (name.length < 2) return showError('Informe seu nome.');
    if (phone.length < 10) return showError('Informe um WhatsApp válido.');
    if (!selected) return showError('Selecione o bairro da entrega.');
    if (address.length < 3 || !number) return showError('Informe o endereço e o número.');

    if (selected === OTHER) {
      if (custom.length < 2) return showError('Digite seu bairro ou conjunto.');
      openManualWhatsapp({ name: name, phone: phone, neighborhood: custom, address: address, number: number, reference: reference });
      return;
    }

    el('confirm').disabled = true;
    el('confirm').textContent = 'CONFIRMANDO...';

    request('/api/v1/public/checkout/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: name, phone: phone, neighborhood: selected, address: address + ', ' + number, reference: reference || null },
        items: [{ product_id: pageData.product.id, quantity: quantity }],
        payment_method: getPayment(),
        preferred_delivery_time: 'Hoje',
        notes: 'Pedido realizado pelo checkout de entrega.'
      })
    }).then(function (result) {
      var raw = result.data && result.data.order;
      var first = Array.isArray(raw) ? raw[0] : raw;
      var code = first && (first.order_number || first.order_code || first.code || first.number || first.id) ? (first.order_number || first.order_code || first.code || first.number || first.id) : 'Pedido confirmado';
      el('orderCode').textContent = String(code);
      el('app').style.display = 'none';
      el('success').style.display = 'block';
      var whatsapp = result.data && result.data.whatsapp_number ? result.data.whatsapp_number : '';
      el('whatsapp').onclick = function () {
        var message = 'Olá! Fiz meu pedido pelo site. Pedido ' + String(code) + '.';
        window.location.href = 'https://wa.me/' + String(whatsapp).replace(/\\D/g, '') + '?text=' + encodeURIComponent(message);
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }).catch(function (error) {
      showError(error.message || String(error));
      el('confirm').disabled = false;
      el('confirm').textContent = 'CONFIRMAR MINHA ENTREGA';
    });
  }

  el('minus').onclick = function () { if (quantity > 1) { quantity -= 1; updateQty(); } };
  el('plus').onclick = function () { var max = Math.min(20, Number(pageData && pageData.product ? pageData.product.available_quantity : 0)); if (quantity < max) { quantity += 1; updateQty(); } };
  el('neighborhood').onchange = loadQuote;
  el('confirm').onclick = confirmOrder;

  request('/api/v1/public/checkout/' + encodeURIComponent(slug))
    .then(function (result) {
      pageData = result.data;
      if (!pageData.product.available_quantity) throw new Error('Produto temporariamente sem estoque.');
      renderProduct();
      el('loading').style.display = 'none';
      el('app').style.display = 'block';
    })
    .catch(function (error) {
      el('loading').textContent = error.message || String(error);
    });
})();
</script>
</body>
</html>`;
}
