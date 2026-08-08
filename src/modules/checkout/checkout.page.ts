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
    *{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:720px;margin:0 auto;padding:14px 14px 44px}.top{display:flex;align-items:center;gap:12px;margin:4px 0 12px}.logo{width:58px;height:58px;object-fit:contain;border-radius:14px;background:#fff;border:1px solid #e2e8f0;padding:5px;display:none}.brand{font-size:24px;font-weight:900}.tagline{font-size:13px;color:#64748b;margin-top:2px}.hero,.card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 10px 32px rgba(15,23,42,.07)}.trust{display:grid;grid-template-columns:1fr;gap:8px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:13px;margin-bottom:12px;font-weight:800;color:#166534}.steps{margin:12px 0;padding:14px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px}.steps strong{display:block;margin-bottom:7px}.steps ol{margin:0;padding-left:20px;color:#334155;font-size:14px;line-height:1.6}.hero{overflow:hidden}.photo{width:100%;max-height:360px;object-fit:contain;background:#fff;padding:12px}.placeholder{display:flex;align-items:center;justify-content:center;min-height:120px;background:#f8fafc;color:#64748b;font-weight:800}.content{padding:17px}.name{font-size:23px;line-height:1.2;font-weight:900}.desc{color:#475569;font-size:14px;line-height:1.55;margin-top:7px}.price{font-size:31px;font-weight:900;margin-top:12px}.muted{color:#64748b;font-size:13px}.qty{display:flex;align-items:center;gap:12px;margin-top:14px}.qty button{width:42px;height:42px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;font-size:22px;font-weight:900}.qty strong{min-width:24px;text-align:center;font-size:18px}.card{padding:17px;margin-top:12px}.card h2{font-size:19px;margin:0 0 6px}.intro{font-size:14px;color:#475569;margin-bottom:14px;line-height:1.5}.grid{display:grid;gap:11px}.field label{display:block;font-size:13px;font-weight:800;margin:0 0 5px}.field input,.field select{width:100%;height:49px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;font:inherit;background:#fff;color:#0f172a}.field input:focus,.field select:focus{outline:3px solid rgba(34,197,94,.15);border-color:#22c55e}.help{font-size:12px;color:#64748b;margin-top:5px}.other-box{display:none;padding:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px}.other-title{font-weight:900;color:#9a3412;margin-bottom:5px}.other-box p{font-size:13px;line-height:1.45;color:#7c2d12;margin:0 0 9px}.pay{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pay label{border:1px solid #cbd5e1;border-radius:12px;padding:12px;font-weight:800;cursor:pointer}.pay input{margin-right:7px}.summary{display:grid;gap:8px;font-size:15px}.row{display:flex;justify-content:space-between;gap:16px}.total{font-size:22px;font-weight:900;padding-top:10px;border-top:1px solid #e2e8f0}.notice{margin-top:12px;padding:12px;background:#f0fdf4;border-radius:12px;color:#166534;font-weight:800;font-size:14px;line-height:1.4}.btn{width:100%;border:0;border-radius:14px;min-height:56px;padding:13px;background:#16a34a;color:#fff;font-size:17px;font-weight:900;cursor:pointer;margin-top:14px}.btn:disabled{opacity:.55;cursor:not-allowed}.secondary{background:#0f172a}.error{display:none;margin-top:11px;padding:11px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-weight:700;font-size:14px}.success{display:none}.success h1{font-size:25px}.order-code{font-size:22px;font-weight:900;background:#f1f5f9;padding:12px;border-radius:12px;text-align:center;margin:12px 0}.loading{padding:34px;text-align:center;color:#475569;font-weight:750}@media(min-width:560px){.trust{grid-template-columns:repeat(3,1fr);font-size:13px;text-align:center}.grid.two{grid-template-columns:1fr 180px}}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="top"><img id="logo" class="logo" alt="Logo Miranda Express" /><div><div class="brand">Miranda Express</div><div class="tagline">Entrega rápida em Belém e Ananindeua</div></div></div>
    <div class="trust"><span>🚚 Entregamos hoje</span><span>💰 Pague só na entrega</span><span>✅ Nada é cobrado aqui</span></div>
    <div class="steps"><strong>Como funciona seu pedido</strong><ol><li>Escolha a quantidade.</li><li>Preencha seus dados e endereço.</li><li>Selecione seu bairro para calcular a taxa.</li><li>Confirme a entrega.</li><li>Você paga somente quando receber.</li></ol></div>
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
        <div class="intro">Preencha os dados abaixo. Se o seu bairro ou conjunto não estiver na lista, escolha <strong>“Não encontrei meu bairro”</strong> e nós confirmaremos a taxa pelo WhatsApp.</div>
        <div class="grid">
          <div class="field"><label for="name">Seu nome</label><input id="name" autocomplete="name" placeholder="Nome completo" /></div>
          <div class="field"><label for="phone">WhatsApp</label><input id="phone" inputmode="tel" autocomplete="tel" placeholder="(91) 99999-9999" /></div>
          <div class="field"><label for="neighborhood">Bairro / conjunto</label><select id="neighborhood"><option value="">Selecione onde será a entrega</option></select><div class="help">A taxa aparece automaticamente quando o bairro estiver cadastrado.</div></div>
          <div id="otherBox" class="other-box"><div class="other-title">Não encontrou seu bairro?</div><p>Digite abaixo o bairro ou conjunto. A taxa será confirmada pelo WhatsApp antes do envio.</p><div class="field"><label for="customNeighborhood">Digite seu bairro / conjunto</label><input id="customNeighborhood" placeholder="Ex.: Conjunto X, bairro Y" /></div></div>
          <div class="grid two"><div class="field"><label for="address">Endereço</label><input id="address" autocomplete="street-address" placeholder="Rua, passagem, avenida..." /></div><div class="field"><label for="number">Número</label><input id="number" placeholder="Nº" /></div></div>
          <div class="field"><label for="reference">Ponto de referência (opcional)</label><input id="reference" placeholder="Ex.: próximo à praça" /></div>
        </div>
      </div>

      <div class="card"><h2>Como prefere pagar na entrega?</h2><div class="pay"><label><input type="radio" name="payment" value="pix" checked /> Pix</label><label><input type="radio" name="payment" value="cash" /> Dinheiro</label></div><div class="notice">Você não paga nada agora. O pagamento é feito somente quando receber o produto.</div></div>

      <div class="card"><h2>Resumo da entrega</h2><div class="summary"><div class="row"><span>Produto(s)</span><strong id="productsTotal">—</strong></div><div class="row"><span>Taxa de entrega</span><strong id="deliveryFee">Selecione o bairro</strong></div><div class="row total"><span>Total na entrega</span><strong id="grandTotal">—</strong></div></div><div id="error" class="error"></div><button class="btn" id="confirm" type="button">CONFIRMAR MINHA ENTREGA</button></div>
    </section>

    <section id="success" class="card success"><h1>✅ Pedido recebido!</h1><p>Seu produto foi reservado. A entrega será realizada hoje e o pagamento será feito somente na entrega.</p><div class="order-code" id="orderCode">Pedido confirmado</div><button class="btn secondary" id="whatsapp" type="button">ACOMPANHAR PELO WHATSAPP</button></section>
  </main>

<script>
(function () {
  var slug = ${safeSlug};
  var OTHER = '__other__';
  var pageData = null;
  var quantity = 1;
  var quoteTimer = null;

  function el(id) { return document.getElementById(id); }
  function money(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function showError(message) { el('error').textContent = message; el('error').style.display = 'block'; }
  function clearError() { el('error').textContent = ''; el('error').style.display = 'none'; }
  function getPayment() { var checked = document.querySelector('input[name="payment"]:checked'); return checked ? checked.value : 'pix'; }

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
      el('imageBox').innerHTML = '<div class="placeholder">Foto do produto em atualização</div>';
    }

    if (pageData.checkout && pageData.checkout.logo_url) {
      el('logo').src = pageData.checkout.logo_url;
      el('logo').style.display = 'block';
    }

    var select = el('neighborhood');
    pageData.delivery_zones.forEach(function (zone) {
      var option = document.createElement('option');
      option.value = zone.neighborhood;
      option.textContent = zone.neighborhood + (Number(zone.delivery_fee) === 0 ? ' — entrega grátis' : ' — ' + money(zone.delivery_fee));
      select.appendChild(option);
    });

    var other = document.createElement('option');
    other.value = OTHER;
    other.textContent = 'Não encontrei meu bairro / conjunto';
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
      el('deliveryFee').textContent = Number(quote.delivery_fee) === 0 ? 'Grátis' : money(quote.delivery_fee);
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
