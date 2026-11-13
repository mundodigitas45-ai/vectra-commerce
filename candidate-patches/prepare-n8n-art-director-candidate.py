#!/usr/bin/env python3
"""Cria candidata inativa com direção visual por foto; não importa nem publica."""
import argparse
import copy
import json
import os
from pathlib import Path
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args()

raw = json.loads(Path(args.source).read_text())
source = raw[0] if isinstance(raw, list) else raw
if source.get("id") != "VcCreativeImgV11RealPhotoCandidate" or source.get("active"):
    raise SystemExit("PARADO: candidata base inesperada ou ativa.")
workflow = copy.deepcopy(source)
nodes = workflow["nodes"]
links = workflow["connections"]
by_name = {node["name"]: node for node in nodes}
prep = by_name["Preparar Criativo Visual"]
gate = by_name["Usar Fotografia Aprovada?"]
old_image = by_name["OpenAI - Gerar Imagem Tentativa 1"]
complete = by_name["API - Concluir Imagem"]
if len(nodes) != 19 or len(by_name) != len(nodes) or not old_image.get("credentials"):
    raise SystemExit("PARADO: nós ou credencial OpenAI diferentes do esperado.")
if links[gate["name"]]["main"][0] != [{"node": "Montar Conclusão Foto Real", "type": "main", "index": 0}]:
    raise SystemExit("PARADO: ramo de foto real diferente do esperado.")
if links["Montar Conclusão Foto Real"]["main"][0] != [{"node": complete["name"], "type": "main", "index": 0}]:
    raise SystemExit("PARADO: conclusão da foto real diferente do esperado.")

prep_code = prep["parameters"]["jsCode"]
needle = "    openai_request: {"
if prep_code.count(needle) != 1:
    raise SystemExit("PARADO: preparação do job mudou.")
prep["parameters"]["jsCode"] = prep_code.replace(needle, """    visual_direction_request: {
      model: 'gpt-5-mini',
      reasoning: { effort: 'low' },
      max_output_tokens: 1200,
      input: [{ role: 'user', content: [
        { type: 'input_text', text: [
          'Você é diretor de arte de anúncios profissionais para a Miranda Express.',
          'Analise a fotografia real do produto e planeje um fundo específico para essa foto.',
          'Referência visual: estúdio claro em bege/cinza suave, superfície natural, luz discreta,',
          'produto grande como protagonista, título preto forte, destaque amarelo para preço',
          'e CTA verde. Adapte a composição ao produto e ao formato; evite um layout idêntico',
          'em todos os anúncios. As camadas comerciais serão desenhadas depois por código.',
          'Planeje apenas cenário, área livre para o recorte e contraste; NÃO desenhe o produto.',
          'A foto original será recortada e composta depois. Não mude ângulo, portas, pinos,',
          'cabo, embalagem, inscrições ou quantidade de acessórios por imaginação.',
          'Referências de estilo orientam cor, iluminação e ritmo; nunca identidade ou oferta.',
          'Nunca sugira letras, números, preço, logo, botão, marcas, selos nem outro produto no fundo.',
          'Retorne layout, tinta, destaque e uma descrição concreta do cenário (25 a 800 caracteres).',
          'Produto confirmado: ' + String(product.name || '').slice(0, 180) + '.',
          'Formato: ' + String(format.key || '').slice(0, 40) + '.'
        ].join('\\n') },
        { type: 'input_image', image_url: referenceUrl, detail: 'low' }
      ] }],
      text: { format: { type: 'json_schema', name: 'direcao_criativo', strict: true,
        schema: { type: 'object', additionalProperties: false,
          required: ['layout', 'ink', 'accent', 'scene'], properties: {
            layout: { type: 'string', enum: ['hero_center', 'hero_left', 'hero_right'] },
            ink: { type: 'string', enum: ['dark', 'light'] },
            accent: { type: 'string', enum: ['yellow', 'green'] },
            scene: { type: 'string' }
          } }
      } }
    },
    openai_request: {""", 1)

def edge(name):
    return {"node": name, "type": "main", "index": 0}

def http(name, position, body_expr):
    node = copy.deepcopy(old_image)
    node["id"] = str(uuid.uuid4())
    node["name"] = name
    node["position"] = position
    node["parameters"]["jsonBody"] = body_expr
    node["parameters"]["options"]["timeout"] = 180000
    return node

def code(name, position, js):
    return {"id": str(uuid.uuid4()), "name": name,
        "type": "n8n-nodes-base.code", "typeVersion": 2,
        "position": position, "parameters": {"jsCode": js}}

director_name = "OpenAI - Direção Criativa por Foto"
validate_name = "Validar Direção e Preparar Fundo"
generate_name = "OpenAI - Gerar Fundo Dirigido"
result_name = "Validar Fundo e Compor Foto Real"
director = http(director_name, [250, -340],
                "={{JSON.stringify($json.visual_direction_request)}}")
validate = code(validate_name, [470, -340], r"""
const source = $('Preparar Criativo Visual').first().json;
const response = $json;
const text = (response.output || []).flatMap(item => item.content || [])
  .find(part => part.type === 'output_text')?.text;
if (!text) throw new Error('Direção criativa não retornada.');
let plan;
try { plan = JSON.parse(text); } catch { throw new Error('Direção criativa inválida.'); }
if (!['hero_center', 'hero_left', 'hero_right'].includes(plan.layout) ||
    !['dark', 'light'].includes(plan.ink) ||
    !['yellow', 'green'].includes(plan.accent) ||
    typeof plan.scene !== 'string' || plan.scene.length < 25 || plan.scene.length > 800) {
  throw new Error('Plano visual fora dos limites seguros.');
}
const size = { square: '1024x1024', feed_portrait: '1024x1536',
  story: '1024x1536', landscape: '1536x1024' }[source.format.key];
if (!size) throw new Error('Formato inválido.');
const prompt = [
  'Crie somente um cenário de estúdio fotográfico para um anúncio profissional.',
  'Direção artística: ' + plan.scene + '.',
  'Composição: ' + plan.layout + '; preserve espaço livre para a fotografia original do produto,',
  'o título, a logo, o preço e o CTA que serão inseridos por código depois.',
  'Paleta base clara: bege suave, cinza quente ou branco quebrado; superfície natural e sombras discretas.',
  'Não repita um fundo genérico: adapte materiais, profundidade e luz à categoria da fotografia.',
  'Resultado realista, limpo e sofisticado, com boa leitura para texto preto e preço amarelo.',
  'Não desenhe produto, carregador, cabo, embalagem, objeto comercial ou pessoa.',
  'Não desenhe letras, números, preço, selo, logotipo, botão, marca ou CTA.',
  'Evite brilhos agressivos, raios, molduras e clichês repetidos.',
  'A foto original será inserida depois; a imagem gerada NÃO substitui o produto.'
].join('\n');
return [{json: {...source, visual_plan: {
  layout:plan.layout, ink:plan.ink, accent:plan.accent,
}, generated_background_prompt:prompt,
  openai_background_request: { model:'gpt-5.4',
    input:[{role:'user',content:[{type:'input_text',text:prompt}]}],
    tools:[{type:'image_generation',quality:'high',size}] },
  direction_usage:response.usage || null,
  direction_response_id:response.id || null
}}];
""".strip())
generate = http(generate_name, [690, -340],
                "={{JSON.stringify($json.openai_background_request)}}")
result = code(result_name, [910, -340], r"""
const source = $('Validar Direção e Preparar Fundo').first().json;
const response = $json;
const image = (response.output || []).find(item =>
  item?.type === 'image_generation_call' && typeof item.result === 'string')?.result;
if (!image || image.length < 100) throw new Error('Fundo gerado não retornado.');
return [{json:{
  job_id:source.job.id,worker_id:source.worker_id,
  channel_id:source.channel.id,format_key:source.format.key,
  reference_image_url:source.reference_image_url,
  composition_mode:'professional_real_photo_v1',image_base64:image,
  prompt:source.generated_background_prompt,
  content:{},
  metadata:{generator:'openai-background-with-photo-direction',
    visual_plan:source.visual_plan,
    selected_media_id:source.campaign?.brief?.real_photo_media_id,
    original_reference_url:source.reference_image_url,
    direction_response_id:source.direction_response_id,
    direction_usage:source.direction_usage,
    generation_response_id:response.id || null,
    generation_usage:response.usage || null},
  output:{composed_with_real_product:true,
    generated_at:new Date().toISOString()}
}}];
""".strip())

nodes[:] = [node for node in nodes if node["name"] != "Montar Conclusão Foto Real"]
nodes.extend((director, validate, generate, result))
links[gate["name"]]["main"][0] = [edge(director_name)]
links.pop("Montar Conclusão Foto Real")
links[director_name] = {"main": [[edge(validate_name)]]}
links[validate_name] = {"main": [[edge(generate_name)]]}
links[generate_name] = {"main": [[edge(result_name)]]}
links[result_name] = {"main": [[edge(complete["name"])]]}
workflow["id"] = "VcCreativeImgV12ArtDirectorCandidate"
workflow["name"] = "Central de Criativos — Direção Visual por Foto (candidata)"
workflow["active"] = False
workflow["versionId"] = str(uuid.uuid4())
workflow.pop("activeVersionId", None)
output = Path(args.output)
fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as file:
    json.dump([workflow], file, ensure_ascii=False, separators=(",", ":"))
print("CANDIDATA_INATIVA=", output)
print("NÓS=", len(nodes))
print("PRODUCAO_INALTERADA=true")
