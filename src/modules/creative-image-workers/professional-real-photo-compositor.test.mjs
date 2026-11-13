import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { composeProfessionalRealPhoto } from "./professional-real-photo-compositor.ts";

test("renderiza os formatos a partir da mesma fotografia sem chamar um gerador", async () => {
  const photo = await sharp({
    create: { width: 600, height: 850, channels: 3, background: "#a8cde3" }
  }).jpeg().toBuffer();
  const logo = await sharp({
    create: { width: 128, height: 128, channels: 4, background: "#253b35" }
  }).png().toBuffer();
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const calls = [];
  process.env.SUPABASE_URL = "https://example.supabase.co";
  globalThis.fetch = async url => {
    calls.push(String(url));
    return new Response(String(url).endsWith("photo.jpg") ? photo : logo, {
      headers: { "content-type": String(url).endsWith("photo.jpg") ? "image/jpeg" : "image/png" }
    });
  };
  try {
    for (const [width, height] of [[1080, 1080], [1080, 1350], [1080, 1920], [1200, 628]]) {
      const output = await composeProfessionalRealPhoto({
        referenceImageUrl: "https://example.supabase.co/storage/v1/object/public/photos/photo.jpg",
        logoUrl: "https://example.supabase.co/storage/v1/object/public/logos/logo.png",
        width, height,
        offer: {
          productName: "Carregador Xiaomi 67W",
          kit: "Fonte, cabo e embalagem",
          price: 139.9, delivery: "consult", freeDeliveryRegion: ""
        },
        framing: { top: 0, bottom: 1 },
        direction: "auto"
      });
      const metadata = await sharp(output.buffer).metadata();
      assert.equal(metadata.width, width);
      assert.equal(metadata.height, height);
      assert.equal(output.referenceBytes, photo.length);
      assert.ok(output.buffer.length > 10_000);
    }
    assert.equal(calls.length, 8);
    assert.ok(calls.every(url => url.startsWith("https://example.supabase.co/storage/v1/object/public/")));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
  }
});

test("recusa mídia fora do storage oficial e entrega grátis sem região", async () => {
  const input = {
    referenceImageUrl: "https://outside.invalid/photo.jpg",
    logoUrl: "https://outside.invalid/logo.png",
    width: 1080, height: 1080,
    offer: {
      productName: "Produto", kit: "Kit", price: 49.9,
      delivery: "free", freeDeliveryRegion: ""
    },
    framing: { top: 0, bottom: 1 }, direction: "auto"
  };
  await assert.rejects(() => composeProfessionalRealPhoto(input), /região|confirmados/i);
  const previousUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  try {
    await assert.rejects(() => composeProfessionalRealPhoto({
      ...input, offer: { ...input.offer, delivery: "consult" }
    }), /armazenamento oficial/);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
  }
});

test("usa cenário gerado e máscara sem redesenhar a foto original", async () => {
  const photo = await sharp({create:{width:400,height:400,channels:3,background:'#ec2020'}}).png().toBuffer();
  const logo = await sharp({create:{width:20,height:20,channels:4,background:'#ffffff'}}).png().toBuffer();
  const background = await sharp({create:{width:1080,height:1080,channels:3,background:'#20bd28'}}).png().toBuffer();
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  globalThis.fetch = async url => new Response(String(url).endsWith('photo.png') ? photo : logo,
    {headers:{'content-type':'image/png'}});
  try {
    const output = await composeProfessionalRealPhoto({
      referenceImageUrl:'https://example.supabase.co/storage/v1/object/public/photos/photo.png',
      logoUrl:'https://example.supabase.co/storage/v1/object/public/logos/logo.png',
      width:1080,height:1080,
      offer:{productName:'Produto confirmado',kit:'Fonte e cabo',price:49.9,delivery:'consult',freeDeliveryRegion:''},
      framing:{top:0,bottom:1}, direction:'auto',backgroundBuffer:background,
      visualPlan:{layout:'hero_center',ink:'dark',accent:'green',
        cutoutPolygon:[[.25,.25],[.75,.25],[.75,.75],[.25,.75]]}
    });
    const pixel = async (x,y) => {
      const {data} = await sharp(output.buffer).extract({left:x,top:y,width:1,height:1})
        .removeAlpha().raw().toBuffer({resolveWithObject:true});
      return [...data];
    };
    const outside = await pixel(120,450);
    const inside = await pixel(540,510);
    assert.ok(outside[1] > outside[0] * 2, `fundo esperado: ${outside}`);
    assert.ok(inside[0] > inside[1] * 2, `fotografia original esperada: ${inside}`);
    assert.match(output.layout,/hero_center/);
  } finally {
    globalThis.fetch=previousFetch;
    if (previousUrl===undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL=previousUrl;
  }
});

test("fundo gerado escuro recebe base clara para título e preço", async () => {
  const photo = await sharp({create:{width:400,height:400,channels:3,background:'#dd3030'}}).png().toBuffer();
  const logo = await sharp({create:{width:20,height:20,channels:4,background:'#222222'}}).png().toBuffer();
  const background = await sharp({create:{width:1080,height:1080,channels:3,background:'#173047'}}).png().toBuffer();
  const oldFetch = globalThis.fetch;
  const oldUrl = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  globalThis.fetch = async url => new Response(String(url).endsWith('photo.png') ? photo : logo,
    {headers:{'content-type':'image/png'}});
  try {
    const out = await composeProfessionalRealPhoto({
      referenceImageUrl:'https://example.supabase.co/storage/v1/object/public/photos/photo.png',
      logoUrl:'https://example.supabase.co/storage/v1/object/public/logos/logo.png',
      width:1080,height:1080,
      offer:{productName:'Produto confirmado',kit:'Fonte e cabo',price:49.9,delivery:'consult',freeDeliveryRegion:''},
      framing:{top:0,bottom:1}, direction:'auto', backgroundBuffer:background,
      visualPlan:{layout:'hero_center',ink:'dark',accent:'green',
        cutoutPolygon:[[.25,.25],[.75,.25],[.75,.75],[.25,.75]]}
    });
    const region = async (left,top,width,height) => {
      const {data,info} = await sharp(out.buffer).extract({left,top,width,height})
        .removeAlpha().raw().toBuffer({resolveWithObject:true});
      let darks=0;
      for(let i=0;i<data.length;i+=info.channels)
        if(data[i]<95&&data[i+1]<95&&data[i+2]<95) darks++;
      return darks;
    };
    const panel = await sharp(out.buffer).extract({left:48,top:50,width:1,height:1})
      .removeAlpha().raw().toBuffer();
    assert.ok(panel[0]>200&&panel[1]>200&&panel[2]>200, `base clara esperada: ${panel}`);
    assert.ok((await region(65,83,700,120))>100, 'título em tinta escura esperado');
    assert.ok((await region(65,796,550,95))>100, 'preço em tinta escura esperado');
  } finally {
    globalThis.fetch=oldFetch;
    if(oldUrl===undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL=oldUrl;
  }
});
