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
    .hero,.card{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 10px 32px rgba(15,15,15,.08)}.hero{overflow:hidden}.product-media{background:linear-gradient(135deg,#0d0d0d,#201a08);padding:14px}.photo{width:100%;max-height:430px;object-fit:contain;background:#fff;border-radius:14px;padding:10px;display:block}.thumbs{display:flex;gap:8px;overflow-x:auto;padding:10px 2px 2px;scrollbar-width:thin}.thumb{width:72px;height:72px;flex:0 0 72px;object-fit:cover;background:#fff;border:2px solid transparent;border-radius:10px;padding:3px;cursor:pointer;transition:.18s}.thumb:hover{transform:translateY(-2px)}.thumb.active{border-color:var(--gold);box-shadow:0 0 0 2px rgba(245,184,0,.18)}.gallery-count{color:#d6d6d6;font-size:11px;font-weight:800;margin-top:8px;text-align:center}.placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;background:#0d0d0d;border:1px dashed #65500e;border-radius:14px;color:#ddd;font-weight:800;text-align:center}.placeholder img{width:78px;height:78px;border-radius:50%;border:1px solid var(--gold)}.placeholder small{font-weight:600;color:#aaa}
    .content{padding:18px}.eyebrow{display:inline-block;background:#fff6d6;color:#7b5700;border:1px solid #f8d66d;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900;margin-bottom:8px}.name{font-size:23px;line-height:1.2;font-weight:950}.desc{color:#555;font-size:14px;line-height:1.55;margin-top:8px}.price{font-size:32px;font-weight:950;color:#111;margin-top:13px}.payment-note{font-size:13px;color:#796000;font-weight:800;margin-top:2px}.qty{display:flex;align-items:center;gap:12px;margin-top:15px}.qty button{width:42px;height:42px;border-radius:12px;border:1px solid #ddc76d;background:#fffaf0;color:#17120a;font-size:22px;font-weight:900;cursor:pointer}.qty strong{min-width:24px;text-align:center;font-size:18px}.muted{color:#737373;font-size:13px}
    .card{padding:18px;margin-top:12px}.card h2{font-size:19px;margin:0 0 7px}.section-number{display:inline-flex;width:26px;height:26px;align-items:center;justify-content:center;border-radius:50%;background:var(--gold);color:#111;font-size:13px;font-weight:950;margin-right:7px}.intro{font-size:14px;color:#555;margin-bottom:14px;line-height:1.5}.grid{display:grid;gap:11px}.field label{display:block;font-size:13px;font-weight:850;margin:0 0 5px}.field input,.field select{width:100%;height:49px;border:1px solid #cbc4b8;border-radius:12px;padding:0 12px;font:inherit;background:#fff;color:#171717}.field input:focus,.field select:focus{outline:3px solid rgba(245,184,0,.18);border-color:#d8a400}.help{font-size:12px;color:#777;margin-top:5px}.other-box{display:none;padding:13px;background:#fff9e8;border:1px solid #f0cf67;border-radius:12px}.other-title{font-weight:900;color:#6b4b00;margin-bottom:5px}.other-box p{font-size:13px;line-height:1.45;color:#715b23;margin:0 0 9px}
    .pay{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pay label{border:1px solid #d3cbbb;border-radius:12px;padding:12px;font-weight:850;cursor:pointer;background:#fff}.pay label:has(input:checked){border-color:#e2ab00;background:#fff9dd}.pay input{margin-right:7px;accent-color:#d8a400}.notice{margin-top:12px;padding:12px;background:#f6fff8;border:1px solid #bce9c8;border-radius:12px;color:#12642e;font-weight:800;font-size:14px;line-height:1.4}
    .summary{display:grid;gap:9px;font-size:15px}.row{display:flex;justify-content:space-between;gap:16px}.total{font-size:22px;font-weight:950;padding-top:11px;border-top:1px solid #e2dccf}.total strong{color:#111}.secure-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}.secure-item{padding:9px 6px;border-radius:10px;background:#121212;color:#fff;text-align:center;font-size:11px;font-weight:800}.secure-item b{display:block;color:var(--gold2);font-size:12px;margin-top:2px}
    .btn{width:100%;border:0;border-radius:14px;min-height:56px;padding:13px;background:linear-gradient(180deg,#22b857,#159642);color:#fff;font-size:17px;font-weight:950;cursor:pointer;margin-top:14px;box-shadow:0 8px 22px rgba(25,166,74,.22)}.btn:disabled{opacity:.55;cursor:not-allowed}.secondary{background:#111;border:1px solid var(--gold);color:var(--gold2);box-shadow:none}.error{display:none;margin-top:11px;padding:11px;border-radius:10px;background:#fff0f0;color:#b91c1c;font-weight:700;font-size:14px}.success{display:none}.success h1{font-size:25px}.order-code{font-size:22px;font-weight:950;background:#fff8da;border:1px solid #f2d36a;padding:12px;border-radius:12px;text-align:center;margin:12px 0}.loading{padding:34px;text-align:center;color:#555;font-weight:750}.footer{text-align:center;margin:20px 0 0;color:#666;font-size:12px}.footer strong{color:#111}.gold{color:#b88300;font-weight:900}
    .compat-card{padding:16px;margin-top:12px;border-radius:18px;background:#fff;border:1px solid var(--line);box-shadow:0 10px 32px rgba(15,15,15,.08)}
    .compat-title{font-size:18px;font-weight:950;margin-bottom:5px}
    .compat-sub{font-size:13px;color:#666;line-height:1.45}
    .compat-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
    .compat-fields select{width:100%;height:46px;border:1px solid #cbc4b8;border-radius:11px;background:#fff;padding:0 10px;font:inherit}
    .compat-check{width:100%;border:0;border-radius:11px;padding:12px;background:#e6b800;color:#111;font-weight:950;cursor:pointer;margin-top:9px}
    .compat-result{margin-top:10px;padding:13px;border-radius:12px;font-size:13px;line-height:1.5}
    .compat-result strong{display:block;font-size:16px;margin-bottom:4px}
    .compat-good{background:#effcf3;border:1px solid #a6dfb7;color:#145c2d}
    .compat-bad{background:#fff1f1;border:1px solid #efb1b1;color:#8f1d1d}
    .compat-unknown{background:#fff9e7;border:1px solid #ead076;color:#705400}
    .compat-selected{font-weight:900;color:#222;margin-top:7px}
    .compat-change{border:0;background:transparent;color:#8b6500;font-weight:900;text-decoration:underline;cursor:pointer;padding:5px 0}
    .recommend-card{margin-top:12px;background:#fff;border:1px solid #e1d8bd;border-radius:14px;padding:11px;display:grid;grid-template-columns:86px 1fr;gap:11px;align-items:center;color:#161616}
    .recommend-card img{width:86px;height:86px;object-fit:contain;border-radius:10px;background:#f7f7f7}
    .recommend-name{font-weight:950;font-size:14px;line-height:1.25}
    .recommend-price{font-weight:950;font-size:20px;margin-top:4px}
    .recommend-stock{font-size:12px;color:#166534;font-weight:800}
    .recommend-btn{display:inline-block;margin-top:7px;background:#e6b800;color:#111;text-decoration:none;font-size:12px;font-weight:950;padding:9px 12px;border-radius:9px}
    @media(max-width:520px){.compat-fields{grid-template-columns:1fr}}
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

      <div id="compatCard" class="compat-card">
        <div class="compat-title">📱 Esse carregador serve no seu celular?</div>
        <div id="compatSub" class="compat-sub">Informe seu aparelho para verificar usando nossa base de compatibilidade.</div>

        <div id="compatSelected" class="compat-selected" style="display:none"></div>
        <button id="compatChange" class="compat-change" type="button" style="display:none">Trocar aparelho</button>

        <div id="compatForm">
          <div class="compat-fields">
            <select id="compatBrand">
              <option value="">Selecione a marca</option>
            </select>

            <select id="compatModel" disabled>
              <option value="">Selecione o modelo</option>
            </select>
          </div>

          <button id="compatCheck" class="compat-check" type="button">
            VERIFICAR COMPATIBILIDADE
          </button>
        </div>

        <div id="compatResult"></div>
      </div>

      <div class="card">
        <h2><span class="section-number">1</span>Onde vamos entregar?</h2>
        <div class="intro">Preencha seus dados com atenção. A taxa é calculada automaticamente para os bairros cadastrados.</div>
        <div class="grid">
          <div class="field"><label for="name">Seu nome</label><input id="name" autocomplete="name" placeholder="Nome completo" /></div>
          <div class="field"><label for="phone">Seu WhatsApp</label><input id="phone" inputmode="tel" autocomplete="tel" placeholder="(91) 99999-9999" /></div>
          <div class="field"><label for="city">Cidade</label><select id="city"><option value="">Selecione sua cidade</option></select></div>
          <div class="field"><label for="neighborhood">Bairro / conjunto</label><select id="neighborhood" disabled><option value="">Primeiro selecione sua cidade</option></select><div class="help">Não encontrou? No final da lista existe a opção “Não encontrei meu bairro / conjunto”.</div></div>
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
  /*
   * META TRACKING DINÂMICO
   *
   * Pixel definido pelo painel.
   * Nenhum Pixel ID fica fixo neste código.
   *
   * Falhas de tracking nunca podem bloquear
   * checkout, reserva ou criação de pedido.
   */
  var metaTrackingReady = false;
  var metaTrackingQueue = [];

  var META_CONSENT_KEY = 'vectra_meta_consent_v1';
  var metaConsentState = readMetaConsent();

  function readMetaConsent() {
    try {
      var value = localStorage.getItem(META_CONSENT_KEY);

      if (
        value === 'granted' ||
        value === 'denied'
      ) {
        return value;
      }
    } catch (e) {}

    return null;
  }

  function hasMetaConsent() {
    return metaConsentState === 'granted';
  }

  function saveMetaConsent(value) {
    metaConsentState = value;

    try {
      localStorage.setItem(
        META_CONSENT_KEY,
        value
      );
    } catch (e) {}
  }

  function removeMetaConsentBanner() {
    var banner = document.getElementById(
      'vectra-meta-consent'
    );

    if (banner && banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  }

  function ensureMetaPrivacyButton() {
    if (
      document.getElementById(
        'vectra-meta-privacy-button'
      )
    ) {
      return;
    }

    var button = document.createElement('button');

    button.id = 'vectra-meta-privacy-button';
    button.type = 'button';
    button.textContent = 'Privacidade';

    button.style.cssText =
      'position:fixed;' +
      'right:14px;' +
      'bottom:14px;' +
      'z-index:2147483000;' +
      'border:1px solid #d1d5db;' +
      'border-radius:999px;' +
      'background:#ffffff;' +
      'color:#111827;' +
      'padding:8px 12px;' +
      'font:600 12px Arial,sans-serif;' +
      'box-shadow:0 2px 10px rgba(0,0,0,.12);' +
      'cursor:pointer;';

    button.onclick = function() {
      showMetaConsentBanner();
    };

    document.body.appendChild(button);
  }

  function showMetaConsentBanner() {
    removeMetaConsentBanner();

    var banner = document.createElement('div');

    banner.id = 'vectra-meta-consent';

    banner.style.cssText =
      'position:fixed;' +
      'left:16px;' +
      'right:16px;' +
      'bottom:16px;' +
      'z-index:2147483640;' +
      'max-width:680px;' +
      'margin:0 auto;' +
      'background:#ffffff;' +
      'color:#111827;' +
      'border:1px solid #e5e7eb;' +
      'border-radius:16px;' +
      'box-shadow:0 10px 35px rgba(0,0,0,.22);' +
      'padding:18px;' +
      'font-family:Arial,sans-serif;';

    var title = document.createElement('div');

    title.textContent = 'Sua privacidade';
    title.style.cssText =
      'font-size:17px;' +
      'font-weight:700;' +
      'margin-bottom:7px;';

    var text = document.createElement('div');

    text.textContent =
      'Usamos tecnologias de medição da Meta para entender visitas e melhorar nossos anúncios. Você pode aceitar ou rejeitar essa medição. Sua escolha não interfere na compra nem na entrega.';

    text.style.cssText =
      'font-size:13px;' +
      'line-height:1.45;' +
      'color:#4b5563;' +
      'margin-bottom:14px;';

    var actions = document.createElement('div');

    actions.style.cssText =
      'display:flex;' +
      'gap:10px;' +
      'justify-content:flex-end;' +
      'flex-wrap:wrap;';

    var reject = document.createElement('button');

    reject.type = 'button';
    reject.textContent = 'Rejeitar';

    reject.style.cssText =
      'border:1px solid #d1d5db;' +
      'border-radius:10px;' +
      'background:#ffffff;' +
      'color:#111827;' +
      'padding:10px 16px;' +
      'font-weight:700;' +
      'cursor:pointer;';

    var accept = document.createElement('button');

    accept.type = 'button';
    accept.textContent = 'Aceitar';

    accept.style.cssText =
      'border:0;' +
      'border-radius:10px;' +
      'background:#111827;' +
      'color:#ffffff;' +
      'padding:10px 18px;' +
      'font-weight:700;' +
      'cursor:pointer;';

    reject.onclick = function() {
      var wasGranted =
        metaConsentState === 'granted';

      saveMetaConsent('denied');

      if (
        typeof metaTrackingQueue !== 'undefined' &&
        Array.isArray(metaTrackingQueue)
      ) {
        metaTrackingQueue.length = 0;
      }

      if (
        typeof metaTrackingReady !== 'undefined'
      ) {
        metaTrackingReady = false;
      }

      removeMetaConsentBanner();
      ensureMetaPrivacyButton();

      /*
       * Se o Pixel já havia sido carregado nesta página,
       * recarrega para iniciar uma nova sessão sem tracking.
       */
      if (wasGranted) {
        window.location.reload();
      }
    };

    accept.onclick = function() {
      saveMetaConsent('granted');

      removeMetaConsentBanner();
      ensureMetaPrivacyButton();

      loadTrackingConfig();
    };

    actions.appendChild(reject);
    actions.appendChild(accept);

    banner.appendChild(title);
    banner.appendChild(text);
    banner.appendChild(actions);

    document.body.appendChild(banner);
  }

  function initMetaConsent() {
    ensureMetaPrivacyButton();

    if (hasMetaConsent()) {
      loadTrackingConfig();
      return;
    }

    if (metaConsentState === 'denied') {
      return;
    }

    showMetaConsentBanner();
  }


  function flushMetaTrackingQueue() {
    if (!metaTrackingReady || !window.fbq) return;

    while (metaTrackingQueue.length) {
      var item = metaTrackingQueue.shift();

      try {
        window.fbq(
          'track',
          item.event,
          item.params || {}
        );
      } catch (e) {}
    }
  }

  function trackMeta(eventName, params) {
    /*
     * Eventos ocorridos antes do consentimento
     * não são armazenados nem enviados depois.
     */
    if (
      !eventName ||
      !hasMetaConsent()
    ) {
      return;
    }

    if (
      metaTrackingReady &&
      window.fbq
    ) {
      try {
        window.fbq(
          'track',
          eventName,
          params || {}
        );
      } catch (e) {}

      return;
    }

    metaTrackingQueue.push({
      event: eventName,
      params: params || {}
    });
  }

  function loadMetaPixel(pixelId) {
    pixelId = String(pixelId || '').trim();

    if (!/^\\d{5,30}$/.test(pixelId)) {
      return;
    }

    if (
      window.__vectraMetaPixelLoaded === pixelId
    ) {
      metaTrackingReady = true;
      flushMetaTrackingQueue();
      return;
    }

    window.__vectraMetaPixelLoaded = pixelId;

    if (!window.fbq) {
      !function(f,b,e,v,n,t,s){
        if(f.fbq)return;

        n=f.fbq=function(){
          n.callMethod
            ? n.callMethod.apply(n,arguments)
            : n.queue.push(arguments);
        };

        if(!f._fbq)f._fbq=n;

        n.push=n;
        n.loaded=true;
        n.version='2.0';
        n.queue=[];

        t=b.createElement(e);
        t.async=true;
        t.src=v;

        s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s);
      }(
        window,
        document,
        'script',
        'https://connect.facebook.net/en_US/fbevents.js'
      );
    }

    try {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');

      metaTrackingReady = true;
      flushMetaTrackingQueue();
    } catch (e) {}
  }

  function loadTrackingConfig() {
    if (!hasMetaConsent()) {
      return;
    }

    var domain = String(
      window.location.hostname || ''
    )
      .trim()
      .toLowerCase();

    if (!domain) return;

    fetch(
      'https://api.vectradev.shop/api/public/sites/config?domain=' +
      encodeURIComponent(domain),
      {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      }
    )
      .then(function(response) {
        if (!response.ok) {
          return null;
        }

        return response.json();
      })
      .then(function(result) {
        var integrations =
          result &&
          result.success &&
          result.data &&
          Array.isArray(result.data.integrations)
            ? result.data.integrations
            : [];

        var metaPixel = integrations.find(
          function(item) {
            return (
              item &&
              item.provider === 'meta' &&
              item.integration_type === 'pixel' &&
              item.is_enabled === true
            );
          }
        );

        if (
          metaPixel &&
          metaPixel.public_config &&
          metaPixel.public_config.pixel_id
        ) {
          loadMetaPixel(
            metaPixel.public_config.pixel_id
          );
        }
      })
      .catch(function() {
        /*
         * Tracking é side effect.
         * Nunca interromper checkout.
         */
      });
  }

  initMetaConsent();

  var slug = ${safeSlug};
  var BRAND_LOGO = ${safeLogo};
  var OTHER = '__other__';
  var pageData = null;
  var quantity = 1;
  var quoteTimer = null;
  var DEVICE_KEY = 'miranda_selected_device';
  var compatibilityDevices = [];


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

  function getSavedDevice() {
    try {
      return JSON.parse(localStorage.getItem(DEVICE_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function saveDevice(device) {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
  }

  function clearDevice() {
    localStorage.removeItem(DEVICE_KEY);
  }

  function fillCompatibilityBrands() {
    var select = el('compatBrand');
    select.innerHTML = '<option value="">Selecione a marca</option>';

    var brands = [];

    compatibilityDevices.forEach(function (device) {
      if (device.brand && brands.indexOf(device.brand) === -1) {
        brands.push(device.brand);
      }
    });

    brands.sort(function (a, b) {
      return String(a).localeCompare(String(b), 'pt-BR');
    });

    brands.forEach(function (brand) {
      var option = document.createElement('option');
      option.value = brand;
      option.textContent = brand;
      select.appendChild(option);
    });
  }

  function fillCompatibilityModels(brand) {
    var select = el('compatModel');
    select.innerHTML = '<option value="">Selecione o modelo</option>';

    compatibilityDevices
      .filter(function (device) {
        return device.brand === brand;
      })
      .sort(function (a, b) {
        return String(a.model).localeCompare(String(b.model), 'pt-BR', { numeric: true });
      })
      .forEach(function (device) {
        var option = document.createElement('option');
        option.value = device.model;
        option.textContent = device.model;
        select.appendChild(option);
      });

    select.disabled = !brand;
  }

  function renderRecommendation(product) {
    if (!product) return '';

    var image = product.image_url
      ? '<img src="' + String(product.image_url).replace(/"/g, '&quot;') + '" alt="' + String(product.name || '').replace(/"/g, '&quot;') + '"/>'
      : '<img src="' + BRAND_LOGO + '" alt="Miranda Express"/>';

    return '' +
      '<div class="recommend-card">' +
        image +
        '<div>' +
          '<div class="recommend-name">Recomendamos: ' + String(product.name || '') + '</div>' +
          '<div class="recommend-price">' + money(product.sale_price) + '</div>' +
          '<div class="recommend-stock">' + Number(product.available_quantity || 0) + ' unidade(s) disponível(is)</div>' +
          '<a class="recommend-btn" href="/pedir/' + encodeURIComponent(product.slug) + '">PEDIR AGORA</a>' +
        '</div>' +
      '</div>';
  }

  function renderCompatibility(data) {
    var result = el('compatResult');
    var deviceName = data.device
      ? String(data.device.brand || '') + ' ' + String(data.device.model || '')
      : '';

    if (data.status === 'compatible') {
      result.innerHTML =
        '<div class="compat-result compat-good">' +
          '<strong>✅ Compatível com seu ' + deviceName + '</strong>' +
          '<div>' + String(data.message || '') + '</div>' +
        '</div>';
      return;
    }

    if (data.status === 'not_recommended') {
      result.innerHTML =
        '<div class="compat-result compat-bad">' +
          '<strong>❌ Este não é o carregador mais indicado para seu ' + deviceName + '.</strong>' +
          '<div>' + String(data.message || '') + '</div>' +
          renderRecommendation(data.recommendation) +
        '</div>';
      return;
    }

    result.innerHTML =
      '<div class="compat-result compat-unknown">' +
        '<strong>⚠️ Compatibilidade ainda não confirmada</strong>' +
        '<div>' + String(data.message || 'Não encontramos uma verificação aprovada para esta combinação.') + '</div>' +
        renderRecommendation(data.recommendation) +
      '</div>';
  }

  function checkSelectedDevice(device) {
    if (!device || !device.brand || !device.model || !pageData || !pageData.product) {
      return;
    }

    el('compatResult').innerHTML =
      '<div class="compat-result compat-unknown">Verificando compatibilidade...</div>';

    var url =
      '/api/v1/public/compatibility' +
      '?brand=' + encodeURIComponent(device.brand) +
      '&model=' + encodeURIComponent(device.model) +
      '&slug=' + encodeURIComponent(pageData.product.slug);

    request(url)
      .then(function (result) {
        renderCompatibility(result.data);
      })
      .catch(function () {
        el('compatResult').innerHTML =
          '<div class="compat-result compat-unknown">Não foi possível verificar agora. Tente novamente.</div>';
      });
  }

  function showSelectedDevice(device) {
    el('compatForm').style.display = 'none';
    el('compatSelected').style.display = 'block';
    el('compatChange').style.display = 'inline-block';
    el('compatSelected').textContent =
      'Aparelho selecionado: ' + device.brand + ' ' + device.model;

    checkSelectedDevice(device);
  }

  function showCompatibilityForm() {
    el('compatForm').style.display = 'block';
    el('compatSelected').style.display = 'none';
    el('compatChange').style.display = 'none';
    el('compatResult').innerHTML = '';
  }

  function initCompatibility() {
    request('/api/v1/public/devices')
      .then(function (result) {
        compatibilityDevices =
          result.data && Array.isArray(result.data.devices)
            ? result.data.devices
            : [];

        fillCompatibilityBrands();

        var saved = getSavedDevice();

        if (saved && saved.brand && saved.model) {
          showSelectedDevice(saved);
        } else {
          showCompatibilityForm();
        }
      })
      .catch(function () {
        showCompatibilityForm();
      });
  }

  el('compatBrand').onchange = function () {
    fillCompatibilityModels(this.value);
    el('compatResult').innerHTML = '';
  };

  el('compatCheck').onclick = function () {
    var brand = el('compatBrand').value;
    var model = el('compatModel').value;

    if (!brand || !model) {
      el('compatResult').innerHTML =
        '<div class="compat-result compat-unknown">Selecione a marca e o modelo do seu celular.</div>';
      return;
    }

    var valid = compatibilityDevices.some(function (device) {
      return device.brand === brand && device.model === model;
    });

    if (!valid) {
      el('compatResult').innerHTML =
        '<div class="compat-result compat-unknown">Selecione um aparelho existente na nossa base.</div>';
      return;
    }

    var device = {
      brand: brand,
      model: model
    };

    saveDevice(device);
    showSelectedDevice(device);
  };

  el('compatChange').onclick = function () {
    clearDevice();
    el('compatBrand').value = '';
    fillCompatibilityModels('');
    showCompatibilityForm();
  };

  function renderProduct() {
    var product = pageData.product;
    el('productName').textContent = product.name;
    el('productDescription').textContent = product.description || '';
    el('productPrice').textContent = money(product.sale_price);
    el('stock').textContent = product.available_quantity > 0 ? 'Disponível para entrega' : 'Indisponível';

    var images = Array.isArray(product.images) && product.images.length
      ? product.images
      : (product.image_url ? [product.image_url] : []);

    var imageBox = el('imageBox');
    imageBox.innerHTML = '';

    if (images.length) {
      var mainImage = document.createElement('img');
      mainImage.className = 'photo';
      mainImage.id = 'mainProductImage';
      mainImage.alt = product.name;
      mainImage.src = images[0];
      imageBox.appendChild(mainImage);

      if (images.length > 1) {
        var thumbs = document.createElement('div');
        thumbs.className = 'thumbs';

        images.forEach(function (url, index) {
          var thumb = document.createElement('img');
          thumb.className = 'thumb' + (index === 0 ? ' active' : '');
          thumb.src = url;
          thumb.alt = product.name + ' - foto ' + (index + 1);

          thumb.onclick = function () {
            mainImage.src = url;

            thumbs.querySelectorAll('.thumb').forEach(function (item) {
              item.classList.remove('active');
            });

            thumb.classList.add('active');
          };

          thumbs.appendChild(thumb);
        });

        imageBox.appendChild(thumbs);

        var count = document.createElement('div');
        count.className = 'gallery-count';
        count.textContent = images.length + ' fotos do produto';
        imageBox.appendChild(count);
      }
    } else {
      imageBox.innerHTML = '<div class="placeholder"><img alt="Miranda Express" src="' + BRAND_LOGO + '"/><div>Foto do produto em atualização</div><small>O produto e o preço abaixo já estão disponíveis para entrega.</small></div>';
    }

    if (pageData.checkout && pageData.checkout.logo_url) {
      el('logo').src = pageData.checkout.logo_url;
    }

    var citySelect = el('city');
    var neighborhoodSelect = el('neighborhood');

    var preferredCityOrder = ['Belém', 'Ananindeua', 'Marituba'];

    var cities = pageData.delivery_zones
      .map(function (zone) { return String(zone.city || '').trim(); })
      .filter(function (city, index, arr) {
        return city && arr.indexOf(city) === index;
      })
      .sort(function (a, b) {
        var ai = preferredCityOrder.indexOf(a);
        var bi = preferredCityOrder.indexOf(b);

        if (ai === -1) ai = 999;
        if (bi === -1) bi = 999;

        if (ai !== bi) return ai - bi;
        return a.localeCompare(b, 'pt-BR');
      });

    cities.forEach(function (city) {
      var option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });

    function fillNeighborhoods(city) {
      neighborhoodSelect.innerHTML = '';

      if (!city) {
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Primeiro selecione sua cidade';
        neighborhoodSelect.appendChild(placeholder);
        neighborhoodSelect.disabled = true;
        return;
      }

      neighborhoodSelect.disabled = false;

      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Toque aqui e selecione seu bairro';
      neighborhoodSelect.appendChild(placeholder);

      pageData.delivery_zones
        .filter(function (zone) {
          return String(zone.city || '').trim() === city;
        })
        .sort(function (a, b) {
          return String(a.neighborhood || '').localeCompare(
            String(b.neighborhood || ''),
            'pt-BR'
          );
        })
        .forEach(function (zone) {
          var option = document.createElement('option');
          option.value = zone.neighborhood;
          option.textContent =
            zone.neighborhood +
            (Number(zone.delivery_fee) === 0
              ? ' — ENTREGA GRÁTIS'
              : ' — ' + money(zone.delivery_fee));

          neighborhoodSelect.appendChild(option);
        });

      var other = document.createElement('option');
      other.value = OTHER;
      other.textContent = '⚠ Não encontrei meu bairro / conjunto';
      neighborhoodSelect.appendChild(other);
    }

    citySelect.onchange = function () {
      fillNeighborhoods(this.value);

      el('otherBox').style.display = 'none';
      el('customNeighborhood').value = '';
      el('productsTotal').textContent = money(currentProductsTotal());
      el('deliveryFee').textContent = 'Selecione o bairro';
      el('grandTotal').textContent = '—';
      clearError();
    };

    fillNeighborhoods('');

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

    trackMeta('InitiateCheckout', {
      content_ids: [String(pageData.product.id)],
      content_name: String(pageData.product.name || ''),
      content_type: 'product',
      contents: [{
        id: String(pageData.product.id),
        quantity: quantity
      }],
      num_items: quantity,
      value: Number(currentProductsTotal() || 0),
      currency: 'BRL'
    });

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
        notes: 'Pedido realizado pelo checkout de entrega.',
        tracking_consent:
          metaConsentState === 'granted'
            ? 'granted'
            : (
                metaConsentState === 'denied'
                  ? 'denied'
                  : 'unknown'
              )
      })
    }).then(function (result) {
      var raw = result.data && result.data.order;
      var first = Array.isArray(raw) ? raw[0] : raw;
      var code = first && (first.order_number || first.order_code || first.code || first.number || first.id) ? (first.order_number || first.order_code || first.code || first.number || first.id) : 'Pedido confirmado';
      el('orderCode').textContent = String(code);

      var metaQuote =
        result.data &&
        result.data.quote
          ? result.data.quote
          : {};

      trackMeta('Lead', {
        content_ids: [String(pageData.product.id)],
        content_name: String(pageData.product.name || ''),
        content_type: 'product',
        contents: [{
          id: String(pageData.product.id),
          quantity: quantity
        }],
        num_items: quantity,
        value:
          metaQuote.total != null
            ? Number(metaQuote.total)
            : Number(currentProductsTotal() || 0),
        currency: 'BRL'
      });

      el('app').style.display = 'none';
      el('success').style.display = 'block';
      var whatsapp = result.data && result.data.whatsapp_number ? result.data.whatsapp_number : '';
      el('whatsapp').onclick = function () {
        var quote = result.data && result.data.quote ? result.data.quote : {};
        var paymentLabel = getPayment() === 'pix' ? 'Pix' : 'Dinheiro';

        var imageUrl = '';
        if (pageData.product && pageData.product.image_url) {
          imageUrl = String(pageData.product.image_url);

          if (imageUrl.indexOf('http://') !== 0 && imageUrl.indexOf('https://') !== 0) {
            imageUrl = window.location.origin + (imageUrl.charAt(0) === '/' ? imageUrl : '/' + imageUrl);
          }
        }

        var selectedDevice = null;

        try {
          var savedDevice = localStorage.getItem('miranda_selected_device');
          if (savedDevice) selectedDevice = JSON.parse(savedDevice);
        } catch (e) {}

        var lines = [
          'Olá! Fiz meu pedido pelo site. Pedido ' + String(code) + '.',
          '',
          '🛒 *PEDIDO CONFIRMADO — MIRANDA EXPRESS*',
          '',
          '📦 *Pedido:* ' + String(code),
          '',
          '🔌 *Produto:* ' + pageData.product.name,
          '📦 *Quantidade:* ' + quantity,
          '💰 *Valor dos produtos:* ' + money(
            quote.products_total != null
              ? quote.products_total
              : currentProductsTotal()
          )
        ];

        if (selectedDevice && selectedDevice.brand && selectedDevice.model) {
          lines.push('');
          lines.push('📱 *Celular:* ' + selectedDevice.brand + ' ' + selectedDevice.model);
          lines.push('✅ Compatibilidade verificada no site');
        }

        lines.push('');
        lines.push('👤 *Cliente:* ' + name);
        lines.push('📞 *WhatsApp:* ' + phone);
        lines.push('📍 *Endereço:* ' + address + ', ' + number);
        lines.push('🏘️ *Bairro:* ' + selected);
        lines.push('📌 *Referência:* ' + (reference || 'Não informado'));
        lines.push('');
        lines.push(
          '🚚 *Taxa de entrega:* ' +
          (
            quote.delivery_fee != null
              ? (Number(quote.delivery_fee) === 0 ? 'GRÁTIS' : money(quote.delivery_fee))
              : 'A confirmar'
          )
        );
        lines.push(
          '💵 *TOTAL:* ' +
          (
            quote.total != null
              ? money(quote.total)
              : money(currentProductsTotal())
          )
        );
        lines.push('');
        lines.push('💳 *Pagamento:* ' + paymentLabel + ' na entrega');
        lines.push('🚚 *Entrega:* Hoje');

        if (imageUrl) {
          lines.push('');
          lines.push('🖼️ *Foto / referência do produto:*');
          lines.push(imageUrl);
        }

        window.location.href =
          'https://wa.me/' +
          String(whatsapp).replace(/\\D/g, '') +
          '?text=' +
          encodeURIComponent(lines.join('\\n'));
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

      trackMeta('ViewContent', {
        content_ids: [String(pageData.product.id)],
        content_name: String(pageData.product.name || ''),
        content_type: 'product',
        value: Number(pageData.product.sale_price || 0),
        currency: 'BRL'
      });

      initCompatibility();
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
