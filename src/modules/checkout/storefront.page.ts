import { MIRANDA_LOGO_DATA_URI } from "./checkout.brand";

export function renderStorefrontPage() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <meta name="theme-color" content="#090909" />

  <title>Miranda Express | Agende sua entrega</title>

  <meta name="description" content="Escolha seu produto e agende sua entrega. Você não paga nada no site: o pagamento é feito somente quando receber." />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://loja.vectradev.shop/" />
  <meta property="og:title" content="Miranda Express | Agende sua entrega" />
  <meta property="og:description" content="Reserve seu produto sem pagamento antecipado e pague somente quando receber." />

  <meta property="og:image" content="https://loja.vectradev.shop/products/products/logo-miranda-preview.jpg?v=5" />
  <meta property="og:image:secure_url" content="https://loja.vectradev.shop/products/products/logo-miranda-preview.jpg?v=5" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Miranda Express" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Miranda Express | Entrega Rápida" />
  <meta name="twitter:description" content="Escolha seu produto, receba no seu endereço e pague somente na entrega." />
  <meta name="twitter:image" content="https://loja.vectradev.shop/products/products/logo-miranda-preview.jpg?v=5" />

  <link rel="icon" type="image/png" href="https://loja.vectradev.shop/products/products/logo-miranda-express.png" />
  <link rel="apple-touch-icon" href="https://loja.vectradev.shop/products/products/logo-miranda-express.png" />

  <link rel="icon" type="image/png" href="https://loja.vectradev.shop/products/products/logo-miranda-express.png?v=4" /><meta name="description" content="Miranda Express - Entrega rápida em Belém e região. Escolha seu produto e pague somente na entrega." />
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f5f1e8;color:#111827;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hero{background:linear-gradient(145deg,#050505,#17130a);color:#fff;border-bottom:3px solid #e6b800}.shell{max-width:1120px;margin:0 auto;padding:18px}.brandbar{display:flex;align-items:center;gap:14px}.brandbar img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:1px solid rgba(230,184,0,.65)}.brandname{font-size:28px;font-weight:950;letter-spacing:.3px}.gold{color:#f2c316}.tag{font-size:14px;color:#d1d5db;margin-top:4px}.hero-copy{margin-top:22px;padding:20px 0 8px}.hero-copy h1{font-size:34px;line-height:1.05;margin:0 0 8px}.hero-copy p{margin:0;color:#e5e7eb;max-width:720px;line-height:1.5}.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.trust div{background:#151515;border:1px solid #5d4b00;border-radius:14px;padding:12px;text-align:center;color:#f6d85b;font-weight:800;font-size:14px}.content{max-width:1120px;margin:0 auto;padding:22px 18px 48px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:14px}.section-head h2{margin:0;font-size:25px}.section-head p{margin:0;color:#6b7280;font-size:14px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 9px 24px rgba(0,0,0,.06);display:flex;flex-direction:column}.image{aspect-ratio:1/1;background:#0d0d0d;display:flex;align-items:center;justify-content:center;padding:18px}.image img.product{width:100%;height:100%;object-fit:contain}.image img.fallback{width:42%;max-width:120px;border-radius:50%}.body{padding:14px;display:flex;flex-direction:column;gap:8px;flex:1}.name{font-size:16px;font-weight:900;line-height:1.25}.desc{font-size:13px;color:#6b7280;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.stock{font-size:12px;font-weight:800}.ok{color:#166534}.low{color:#b45309}.out{color:#b91c1c}.price{font-size:23px;font-weight:950}.small{font-size:12px;color:#6b7280}.btn{display:block;text-align:center;text-decoration:none;border-radius:12px;padding:12px 10px;font-weight:950;margin-top:auto}.buy{background:#e6b800;color:#111}.buy:hover{filter:brightness(.96)}.disabled{background:#e5e7eb;color:#9ca3af;pointer-events:none}.loading,.empty{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;text-align:center;color:#6b7280}.footer{text-align:center;color:#6b7280;font-size:12px;margin-top:28px}.whatsapp{position:fixed;right:18px;bottom:18px;background:#16a34a;color:#fff;text-decoration:none;font-weight:900;border-radius:999px;padding:13px 16px;box-shadow:0 12px 25px rgba(22,163,74,.28)}@media(min-width:720px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.hero-copy h1{font-size:44px}}@media(max-width:520px){.shell{padding:14px}.brandbar img{width:60px;height:60px}.brandname{font-size:23px}.hero-copy{margin-top:15px}.hero-copy h1{font-size:28px}.trust{grid-template-columns:1fr}.content{padding:18px 12px 42px}.grid{gap:10px}.body{padding:11px}.name{font-size:14px}.price{font-size:20px}.btn{font-size:13px}.section-head{align-items:start;flex-direction:column}}
    .compat-search{margin-top:16px;background:linear-gradient(135deg,#fffaf0,#fff);border:1px solid #e5c347;border-radius:18px;padding:16px;color:#111;box-shadow:0 8px 22px rgba(0,0,0,.10)}
    .compat-search h3{margin:0 0 5px;font-size:18px}
    .compat-search p{margin:0 0 12px;color:#5f5b4f;font-size:13px;line-height:1.45}
    .device-fields{display:grid;grid-template-columns:1fr 1fr auto;gap:9px}
    .device-fields select{min-width:0;height:46px;border:1px solid #d7c36e;border-radius:11px;background:#fff;padding:0 10px;font:inherit;color:#111}
    .device-check-btn{border:0;border-radius:11px;padding:0 16px;background:#e6b800;color:#111;font-weight:950;cursor:pointer;min-height:46px}
    .saved-device{display:none;align-items:center;justify-content:space-between;gap:10px;background:#f0fff4;border:1px solid #9bdfad;border-radius:12px;padding:11px 12px;margin-top:10px;color:#155b2d;font-size:13px;font-weight:800}
    .saved-device button{border:0;background:transparent;color:#8a6500;font-weight:900;cursor:pointer;text-decoration:underline}
    .device-message{margin-top:8px;font-size:12px;font-weight:800;color:#9a3412}
    @media(max-width:620px){.device-fields{grid-template-columns:1fr}.device-check-btn{width:100%}}

    /* MIRANDA EXPRESS V2 */
    html{scroll-behavior:smooth}
    body{overflow-x:hidden}
    .top-alert{
      background:#e6b800;
      color:#111;
      text-align:center;
      padding:9px 14px;
      font-size:13px;
      font-weight:950;
      letter-spacing:.2px
    }
    .hero{
      position:relative;
      overflow:hidden;
      background:
        radial-gradient(circle at 82% 15%,rgba(230,184,0,.18),transparent 32%),
        linear-gradient(145deg,#030303,#17130a 72%,#0b0b0b)
    }
    .hero:after{
      content:"";
      position:absolute;
      width:280px;
      height:280px;
      border-radius:50%;
      right:-120px;
      bottom:-170px;
      background:rgba(230,184,0,.09);
      filter:blur(4px)
    }
    .brandbar,.hero-copy,.trust,.compat-search{position:relative;z-index:1}
    .hero-copy h1{max-width:850px}
    .hero-copy p{font-size:16px}
    .hero-actions{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:18px
    }
    .hero-cta{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:48px;
      padding:0 20px;
      border-radius:13px;
      text-decoration:none;
      font-weight:950
    }
    .hero-cta.primary{
      background:#e6b800;
      color:#111;
      box-shadow:0 10px 28px rgba(230,184,0,.22)
    }
    .hero-cta.secondary{
      border:1px solid rgba(255,255,255,.22);
      color:#fff;
      background:rgba(255,255,255,.06)
    }
    .no-payment{
      margin-top:16px;
      display:flex;
      gap:10px;
      align-items:flex-start;
      background:rgba(22,163,74,.12);
      border:1px solid rgba(74,222,128,.38);
      border-radius:14px;
      padding:13px 14px;
      max-width:760px
    }
    .no-payment strong{color:#86efac}
    .no-payment span{font-size:13px;color:#e5e7eb;line-height:1.45}
    .section-block{margin-top:34px}
    .section-title{text-align:center;margin-bottom:18px}
    .section-title h2{font-size:28px;margin:0 0 6px;color:#111827}
    .section-title p{margin:0 auto;max-width:680px;color:#6b7280;line-height:1.55}
    .steps-grid,.coverage-grid,.benefits-grid{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:14px
    }
    .info-card{
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:18px;
      padding:19px;
      box-shadow:0 9px 24px rgba(0,0,0,.05)
    }
    .step-number{
      width:38px;height:38px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      background:#111;color:#f2c316;font-weight:950;margin-bottom:12px
    }
    .info-card h3{margin:0 0 7px;font-size:17px}
    .info-card p{margin:0;color:#6b7280;font-size:13px;line-height:1.5}
    .coverage-card{text-align:center}
    .coverage-card .emoji{font-size:28px;margin-bottom:7px}
    .coverage-card strong{display:block;font-size:17px}
    .coverage-card span{display:block;color:#6b7280;font-size:13px;margin-top:5px;line-height:1.45}
    .faq{max-width:850px;margin:0 auto}
    .faq details{
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:14px;
      padding:0 16px;
      margin-bottom:9px
    }
    .faq summary{
      cursor:pointer;
      padding:16px 0;
      font-weight:900;
      list-style:none
    }
    .faq summary::-webkit-details-marker{display:none}
    .faq p{margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.55}
    .card{
      transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease;
      animation:cardIn .45s ease both
    }
    .card:hover{
      transform:translateY(-4px);
      box-shadow:0 16px 34px rgba(0,0,0,.10);
      border-color:#dcc563
    }
    .buy{
      transition:transform .16s ease,filter .16s ease,box-shadow .16s ease;
      box-shadow:0 7px 18px rgba(230,184,0,.18)
    }
    .buy:hover{transform:translateY(-1px);filter:brightness(.97)}
    @keyframes cardIn{
      from{opacity:0;transform:translateY(12px)}
      to{opacity:1;transform:translateY(0)}
    }
    .footer-v2{
      margin-top:40px;
      padding:26px 15px;
      border-top:1px solid #e5e7eb;
      text-align:center;
      color:#6b7280;
      font-size:12px;
      line-height:1.7
    }
    .footer-v2 strong{color:#111827}
    @media(max-width:720px){
      .steps-grid,.coverage-grid,.benefits-grid{grid-template-columns:1fr}
      .hero-actions{flex-direction:column}
      .hero-cta{width:100%}
      .hero-copy p{font-size:14px}
      .section-title h2{font-size:23px}
      .top-alert{font-size:12px}
    }

    /* PONTO LOCAL MIRANDA EXPRESS */
    .local-point{
      position:relative;
      overflow:hidden;
      background:linear-gradient(135deg,#0a0a0a,#1b180d);
      border:1px solid #665400;
      border-radius:22px;
      padding:24px;
      color:#fff;
      box-shadow:0 14px 34px rgba(0,0,0,.12)
    }

    .local-point:after{
      content:"";
      position:absolute;
      width:190px;
      height:190px;
      border-radius:50%;
      right:-75px;
      top:-95px;
      background:rgba(230,184,0,.12)
    }

    .local-point-content{
      position:relative;
      z-index:1;
      display:grid;
      grid-template-columns:auto 1fr;
      gap:18px;
      align-items:start
    }

    .local-icon{
      width:56px;
      height:56px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:16px;
      background:#e6b800;
      color:#111;
      font-size:28px
    }

    .local-point h3{
      margin:0 0 7px;
      font-size:23px
    }

    .local-address{
      color:#f2c316;
      font-weight:950;
      margin-bottom:10px
    }

    .local-point p{
      margin:0;
      max-width:760px;
      color:#d1d5db;
      font-size:14px;
      line-height:1.6
    }

    .local-badges{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:15px
    }

    .local-badges span{
      background:rgba(255,255,255,.07);
      border:1px solid rgba(255,255,255,.12);
      border-radius:999px;
      padding:8px 11px;
      font-size:12px;
      font-weight:850
    }

    .local-whatsapp{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      margin-top:17px;
      min-height:44px;
      padding:0 16px;
      border-radius:12px;
      background:#16a34a;
      color:#fff;
      text-decoration:none;
      font-weight:950;
      font-size:13px
    }

    .local-note{
      display:block;
      margin-top:10px;
      color:#9ca3af;
      font-size:11px;
      line-height:1.5
    }

    @media(max-width:620px){
      .local-point{padding:19px}
      .local-point-content{grid-template-columns:1fr}
      .local-icon{width:48px;height:48px}
      .local-point h3{font-size:20px}
      .local-whatsapp{width:100%}
    }/* AJUSTE FINAL HERO DESKTOP */
    @media(min-width:981px){
      .hero-main{

        align-items:start
      }

      .hero-copy{
        padding-top:0
      }

      .hero-actions{
        margin-top:16px
      }

      .no-payment{
        margin-top:14px;
        max-width:760px
      }
    }

    @media(max-width:980px){
      .hero-main{
        grid-template-columns:1fr;
        gap:18px
      }

      .hero-main-message{
        font-size:14px
      }

      .hero-message-zone{
        margin:12px 0
      }
    }

    @media(max-width:640px){
      .hero-points{
        display:grid;
        grid-template-columns:1fr 1fr;
        width:100%
      }

      .hero-point{
        border-radius:12px;
        padding:9px 7px;
        text-align:center
      }

      .hero-main-message{
        width:100%;
        font-size:14px
      }
    }
@media(max-width:980px){
    }

    @media(max-width:640px){
    }


    /* HERO LIMPO E COMPACTO */
    @media(min-width:981px){
      .hero-main{

        gap:22px;
        align-items:start
      }

      .hero-message-zone{
        margin:10px 0 12px
      }

      .hero-actions{
        margin-top:12px
      }

      .no-payment{
        margin-top:12px
      }
    }

    @media(max-width:980px){
    }

</style>
</head>
<body>
  <div class="top-alert">✅ VOCÊ NÃO PAGA NADA PELO SITE • PAGAMENTO SOMENTE NA ENTREGA</div>
  <header class="hero">
    <div class="shell">
      <div class="brandbar"><img src="${MIRANDA_LOGO_DATA_URI}" alt="Miranda Express" /><div><div class="brandname">MIRANDA <span class="gold">EXPRESS</span></div><div class="tag">Seu produto, na hora que você precisa.</div></div></div>
      <div class="hero-main">
        <div class="hero-copy">
          <h1>Escolha seu produto e <span class="gold">agende sua entrega</span>.</h1>

          <div class="hero-message-zone">
            <div class="hero-main-message">
              ⚡ Entrega rápida em Belém e regiões atendidas
            </div>

            <div class="hero-points">
              <div class="hero-point">💰 Pagamento na entrega</div>
              <div class="hero-point">✅ Confira antes de pagar</div>
            </div>
          </div>

          <p>Reserve em poucos minutos. Você não informa cartão e não faz pagamento antecipado. Escolha o produto, informe seu endereço e pague somente quando receber.</p>

          <div class="hero-actions">
            <a class="hero-cta primary" href="#produtos">VER PRODUTOS</a>
            <a class="hero-cta secondary" href="#como-funciona">COMO FUNCIONA</a>
          </div>

          <div class="no-payment">
            <div>🛡️</div>
            <span><strong>Sem pagamento antecipado.</strong><br/>Esta página serve para reservar o produto e agendar a entrega. A taxa é informada antes da confirmação.</span>
          </div>
          </div>
        </div>
      </div>

      <div class="trust">
        <div>🚚 Entrega local</div>
        <div>💰 Pague ao receber</div>
        <div>📍 Taxa por bairro</div>
      </div>
      <div class="compat-search">
        <h3>📱 Qual é o seu celular?</h3>
        <p>Selecione uma vez. Vamos lembrar do seu aparelho e verificar automaticamente cada produto que você abrir.</p>

        <div class="device-fields" id="deviceFields">
          <select id="deviceBrand">
            <option value="">Selecione a marca</option>
          </select>

          <select id="deviceModel" disabled>
            <option value="">Selecione o modelo</option>
          </select>

          <button type="button" id="saveDevice" class="device-check-btn">
            USAR ESTE CELULAR
          </button>
        </div>

        <div id="deviceMessage" class="device-message"></div>

        <div id="savedDevice" class="saved-device">
          <span id="savedDeviceText"></span>
          <button type="button" id="changeDevice">Trocar aparelho</button>
        </div>
      </div>
    </div>
  </header>
  <main class="content">

    <section id="produtos">
      <div class="section-head">
        <div>
          <h2>Produtos disponíveis</h2>
          <p>Escolha o produto e toque em “Agendar entrega”. Você só paga quando receber.</p>
        </div>
      </div>
      <div id="loading" class="loading">Carregando produtos...</div>
      <div id="products" class="grid" style="display:none"></div>
      <div id="empty" class="empty" style="display:none">Nenhum produto disponível no momento.</div>
    </section>

    <section id="como-funciona" class="section-block">
      <div class="section-title">
        <h2>Como funciona?</h2>
        <p>É simples, rápido e sem pagamento antecipado.</p>
      </div>

      <div class="steps-grid">
        <div class="info-card">
          <div class="step-number">1</div>
          <h3>Escolha o produto</h3>
          <p>Confira preço, disponibilidade e informações do produto que deseja receber.</p>
        </div>

        <div class="info-card">
          <div class="step-number">2</div>
          <h3>Agende a entrega</h3>
          <p>Informe cidade, bairro e endereço. A taxa de entrega aparece antes da confirmação.</p>
        </div>

        <div class="info-card">
          <div class="step-number">3</div>
          <h3>Receba e pague</h3>
          <p>Você não paga pelo site. O pagamento é feito somente quando o produto chegar até você.</p>
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="section-title">
        <h2>Onde entregamos?</h2>
        <p>Atendimento local com taxa calculada de acordo com a região selecionada.</p>
      </div>

      <div class="coverage-grid">
        <div class="info-card coverage-card">
          <div class="emoji">📍</div>
          <strong>Belém</strong>
          <span>Bairros cadastrados na nossa área de entrega.</span>
        </div>

        <div class="info-card coverage-card">
          <div class="emoji">📦</div>
          <strong>Ananindeua</strong>
          <span>Cidade Nova e Centro de Ananindeua.</span>
        </div>

        <div class="info-card coverage-card">
          <div class="emoji">🚚</div>
          <strong>Marituba</strong>
          <span>Entregas até a região do Centro de Marituba.</span>
        </div>
      </div>
    </section>


    <section class="section-block" id="nosso-ponto">
      <div class="section-title">
        <h2>📍 Nosso ponto em Belém</h2>
        <p>Estoque local para atender você com mais agilidade e segurança.</p>
      </div>

      <div class="local-point">
        <div class="local-point-content">

          <div class="local-icon">📍</div>

          <div>
            <h3>Miranda Express em Belém</h3>

            <div class="local-address">
              Mangueirão • Conjunto Catalina • Belém-PA
            </div>

            <p>
              Os produtos disponíveis em estoque saem do nosso ponto de
              distribuição local em Belém. Isso permite um atendimento mais
              próximo e entregas mais rápidas nas regiões atendidas pela
              Miranda Express.
            </p>

            <div class="local-badges">
              <span>📦 Estoque local</span>
              <span>🚚 Saída de Belém</span>
              <span>💰 Pagamento na entrega</span>
            </div>

            <a id="locationWhatsapp"
               class="local-whatsapp"
               href="#">
              💬 FALAR COM A MIRANDA EXPRESS
            </a>

            <span class="local-note">
              Por segurança, o endereço completo do estoque é informado
              pelo atendimento quando necessário.
            </span>
          </div>

        </div>
      </div>
    </section>

<section class="section-block">
      <div class="section-title">
        <h2>Dúvidas frequentes</h2>
        <p>Antes de agendar, veja como funciona a entrega da Miranda Express.</p>
      </div>

      <div class="faq">
        <details>
          <summary>Preciso pagar alguma coisa pelo site?</summary>
          <p>Não. O site é usado para escolher o produto e agendar a entrega. O pagamento é feito somente no recebimento.</p>
        </details>

        <details>
          <summary>A taxa de entrega aparece antes de confirmar?</summary>
          <p>Sim. No checkout você escolhe sua cidade e bairro e vê a taxa antes de confirmar a entrega.</p>
        </details>

        <details>
          <summary>Posso falar com a Miranda Express pelo WhatsApp?</summary>
          <p>Sim. Use o botão verde do WhatsApp disponível nesta página para falar diretamente com a nossa equipe.</p>
        </details>

        <details>
          <summary>O produto fica reservado quando eu agendo?</summary>
          <p>Seu pedido é registrado para atendimento e entrega conforme a disponibilidade de estoque informada no momento do agendamento.</p>
        </details>
      </div>
    </section>

    <div class="footer-v2">
      <strong>Miranda Express</strong><br/>
      Entrega local • Pagamento somente no recebimento<br/>
      Belém • Ananindeua selecionada • Centro de Marituba
    </div>

  </main>
  <a id="whatsapp" class="whatsapp" href="#">WhatsApp</a>
<script>
(function(){
  /*
   * RASTREAMENTO DINÂMICO
   *
   * A loja consulta a configuração pública da empresa.
   * Nenhum Pixel fica fixo neste código.
   *
   * Se a API estiver indisponível ou não houver Pixel ativo,
   * a loja continua funcionando normalmente.
   */

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

  function loadMetaPixel(pixelId){
    pixelId=String(pixelId||'').trim();

    if(!/^\\d{5,30}$/.test(pixelId)){
      return;
    }

    if(window.__vectraMetaPixelLoaded===pixelId){
      return;
    }

    window.__vectraMetaPixelLoaded=pixelId;

    if(!window.fbq){
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

    window.fbq('init',pixelId);
    window.fbq('track','PageView');
  }

  function loadTrackingConfig(){
    if(!hasMetaConsent()){
      return;
    }

    var domain=String(window.location.hostname||'')
      .trim()
      .toLowerCase();

    if(!domain){
      return;
    }

    fetch(
      'https://api.vectradev.shop/api/public/sites/config?domain='+
      encodeURIComponent(domain),
      {
        method:'GET',
        mode:'cors',
        credentials:'omit',
        cache:'no-store'
      }
    )
      .then(function(response){
        if(!response.ok){
          return null;
        }

        return response.json();
      })
      .then(function(result){
        var integrations=
          result&&
          result.success&&
          result.data&&
          Array.isArray(result.data.integrations)
            ? result.data.integrations
            : [];

        var metaPixel=integrations.find(function(item){
          return item&&
            item.provider==='meta'&&
            item.integration_type==='pixel'&&
            item.is_enabled===true;
        });

        if(
          metaPixel&&
          metaPixel.public_config&&
          metaPixel.public_config.pixel_id
        ){
          loadMetaPixel(
            metaPixel.public_config.pixel_id
          );
        }
      })
      .catch(function(){
        /*
         * Falha de tracking nunca pode impedir produtos,
         * compatibilidade, checkout ou agendamento.
         */
      });
  }

  initMetaConsent();

  var logo=${JSON.stringify(MIRANDA_LOGO_DATA_URI)};
  var DEVICE_KEY='miranda_selected_device';
  var allDevices=[];

  function getSavedDevice(){
    try{
      return JSON.parse(localStorage.getItem(DEVICE_KEY)||'null');
    }catch(e){
      return null;
    }
  }

  function setSavedDevice(device){
    localStorage.setItem(DEVICE_KEY,JSON.stringify(device));
  }

  function clearSavedDevice(){
    localStorage.removeItem(DEVICE_KEY);
  }

  function el(id){return document.getElementById(id)}
  function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function renderSavedDevice(){
    var saved=getSavedDevice();
    var box=el('savedDevice');
    var fields=el('deviceFields');
    var msg=el('deviceMessage');

    if(saved&&saved.brand&&saved.model){
      el('savedDeviceText').textContent='✅ Aparelho selecionado: '+saved.brand+' '+saved.model;
      box.style.display='flex';
      fields.style.display='none';
      msg.textContent='';
    }else{
      box.style.display='none';
      fields.style.display='grid';
    }
  }

  function fillBrands(){
    var select=el('deviceBrand');
    var brands=[];

    allDevices.forEach(function(d){
      if(d.brand&&brands.indexOf(d.brand)===-1)brands.push(d.brand);
    });

    brands.sort(function(a,b){
      return String(a).localeCompare(String(b),'pt-BR');
    });

    brands.forEach(function(brand){
      var option=document.createElement('option');
      option.value=brand;
      option.textContent=brand;
      select.appendChild(option);
    });
  }

  function fillModels(brand){
    var select=el('deviceModel');
    select.innerHTML='<option value="">Selecione o modelo</option>';

    var models=allDevices.filter(function(d){
      return d.brand===brand;
    });

    models.sort(function(a,b){
      return String(a.model).localeCompare(String(b.model),'pt-BR',{numeric:true});
    });

    models.forEach(function(d){
      var option=document.createElement('option');
      option.value=d.model;
      option.textContent=d.model;
      select.appendChild(option);
    });

    select.disabled=!brand;
  }

  function loadDeviceSelector(){
    fetch('/api/v1/public/devices')
      .then(function(r){return r.json()})
      .then(function(result){
        allDevices=result&&result.data&&Array.isArray(result.data.devices)
          ? result.data.devices
          : [];

        fillBrands();
        renderSavedDevice();
      })
      .catch(function(){
        el('deviceMessage').textContent='Não foi possível carregar a lista de aparelhos agora.';
      });
  }

  el('deviceBrand').onchange=function(){
    fillModels(this.value);
    el('deviceMessage').textContent='';
  };

  el('deviceModel').onchange=function(){
    el('deviceMessage').textContent='';
  };

  el('saveDevice').onclick=function(){
    var brand=el('deviceBrand').value;
    var model=el('deviceModel').value;

    if(!brand||!model){
      el('deviceMessage').textContent='Selecione a marca e o modelo do celular.';
      return;
    }

    var exists=allDevices.some(function(d){
      return d.brand===brand&&d.model===model;
    });

    if(!exists){
      el('deviceMessage').textContent='Selecione um aparelho existente na nossa base.';
      return;
    }

    setSavedDevice({
      brand:brand,
      model:model
    });

    renderSavedDevice();
  };

  el('changeDevice').onclick=function(){
    clearSavedDevice();
    el('deviceBrand').value='';
    fillModels('');
    renderSavedDevice();
  };

  loadDeviceSelector();


  fetch('/api/v1/public/storefront')
    .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error((d.error&&d.error.message)||'Não foi possível carregar os produtos.');return d})})
    .then(function(result){
      var data=result.data||{};var products=data.products||[];el('loading').style.display='none';
      var wa=data.storefront&&data.storefront.whatsapp_number?String(data.storefront.whatsapp_number).replace(/\D/g,''):'';
      el('whatsapp').href=wa?'https://wa.me/'+wa:'https://wa.me/';
       var locationWa=el('locationWhatsapp');
       if(locationWa){
         locationWa.href=wa?'https://wa.me/'+wa:'https://wa.me/';
       }
      if(!products.length){el('empty').style.display='block';return}
      var grid=el('products');grid.style.display='grid';
      products.forEach(function(p){
        var qty=Number(p.available_quantity||0);var cls=qty<=0?'out':qty<=3?'low':'ok';var label=qty<=0?'Sem estoque':qty<=3?'Últimas unidades':'Disponível para entrega';
        var image=p.image_url?'<img class="product" src="'+escapeHtml(p.image_url)+'" alt="'+escapeHtml(p.name)+'" />':'<img class="fallback" src="'+logo+'" alt="Miranda Express" />';
        var href='/pedir/'+encodeURIComponent(p.slug);
        var button=qty>0?'<a class="btn buy" href="'+href+'">AGENDAR ENTREGA</a>':'<span class="btn disabled">INDISPONÍVEL</span>';
        var card=document.createElement('article');card.className='card';card.innerHTML='<div class="image">'+image+'</div><div class="body"><div class="name">'+escapeHtml(p.name)+'</div><div class="desc">'+escapeHtml(p.description||'Produto disponível para entrega pela Miranda Express.')+'</div><div class="stock '+cls+'">'+label+'</div><div class="price">'+money(p.sale_price)+'</div><div class="small">Pagamento somente na entrega</div>'+button+'</div>';grid.appendChild(card);
      });
    })
    .catch(function(e){el('loading').textContent=e.message||String(e)});
})();
</script>
</body>
</html>`;
}
