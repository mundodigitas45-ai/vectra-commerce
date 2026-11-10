#!/usr/bin/env python3
"""Cria candidata inativa a partir da versão publicada; não importa nem publica."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import uuid

OLD_ID = "VcCreativeImgV1"
NEW_ID = "VcCreativeImgV11RealPhotoCandidate"
PUBLISHED_VERSION = "1fda68da-8802-4ae7-9603-628eea65231e"
PREP_SHA = "24c78d1e485f3c64e1a01c2dca8801c6c467f08a5d2e68e91398d4ba7992c74e"
PREP = "Preparar Criativo Visual"
COMPLETE = "API - Concluir Imagem"
OPENAI = "OpenAI - Gerar Imagem Tentativa 1"
GATE = "Usar Fotografia Aprovada?"
BODY = "Montar Conclusão Foto Real"

parser = argparse.ArgumentParser()
parser.add_argument("--source", required=True, help="Export CLI original, mantido privado na VPS")
parser.add_argument("--output", required=True, help="Candidata privada, sem publicar")
parser.add_argument("--db", help="SQLite n8n: usa nodes/connections da versão publicada")
args = parser.parse_args()

raw = json.loads(Path(args.source).read_text())
original = raw[0] if isinstance(raw, list) else raw
if original.get("id", original.get("workflowId")) != OLD_ID:
    raise SystemExit("PARADO: export de outro workflow.")
candidate = copy.deepcopy(original)
if args.db:
    with sqlite3.connect(f"file:{args.db}?mode=ro", uri=True) as db:
        state = db.execute(
            "SELECT active, activeVersionId FROM workflow_entity WHERE id=?", (OLD_ID,)
        ).fetchone()
        if state != (1, PUBLISHED_VERSION):
            raise SystemExit("PARADO: versão publicada mudou.")
        history = db.execute(
            "SELECT nodes, connections FROM workflow_history WHERE workflowId=? AND versionId=?",
            (OLD_ID, PUBLISHED_VERSION)
        ).fetchone()
        if not history:
            raise SystemExit("PARADO: histórico publicado não encontrado.")
        candidate["nodes"] = json.loads(history[0])
        candidate["connections"] = json.loads(history[1])

nodes = candidate["nodes"]
connections = candidate["connections"]
if len(nodes) != 17 or len({n["name"] for n in nodes}) != len(nodes):
    raise SystemExit("PARADO: estrutura inesperada do fluxo publicado.")
by_name = {n["name"]: n for n in nodes}
for required in (PREP, COMPLETE, OPENAI):
    if required not in by_name:
        raise SystemExit(f"PARADO: nó ausente: {required}.")
code = by_name[PREP]["parameters"]["jsCode"]
if hashlib.sha256(code.encode()).hexdigest() != PREP_SHA:
    raise SystemExit("PARADO: lógica de preparação diferente da versão auditada.")
old = "    composition_mode:\n      'identity_lock_v3',"
new = """    composition_mode:
      data.campaign?.brief?.fidelity_mode === 'real_photo'
        ? 'professional_real_photo_v1'
        : 'identity_lock_v3',"""
if code.count(old) != 1:
    raise SystemExit("PARADO: trecho da composição não identificado.")
by_name[PREP]["parameters"]["jsCode"] = code.replace(old, new)
if connections.get(PREP) != {
    "main": [[{"node": OPENAI, "type": "main", "index": 0}]]
}:
    raise SystemExit("PARADO: conexões de preparação mudaram.")

gate = {
    "id": str(uuid.uuid4()), "name": GATE, "type": "n8n-nodes-base.if",
    "typeVersion": 2.2, "position": [-40, -200],
    "parameters": {"conditions": {
        "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 2},
        "combinator": "and",
        "conditions": [{
            "id": str(uuid.uuid4()),
            "leftValue": "={{$json.composition_mode}}",
            "rightValue": "professional_real_photo_v1",
            "operator": {"type": "string", "operation": "equals"}
        }]
    }}
}
body_code = """const source = $json;
if (source.composition_mode !== 'professional_real_photo_v1' ||
    !source.job?.id || !source.channel?.id || !source.reference_image_url) {
  throw new Error('CREATIVE_REAL_PHOTO_JOB_INVALID');
}
return [{ json: {
  job_id: source.job.id,
  worker_id: source.worker_id,
  channel_id: source.channel.id,
  format_key: source.format.key,
  reference_image_url: source.reference_image_url,
  composition_mode: source.composition_mode,
  prompt: 'Composição em camadas da fotografia original aprovada; sem geração de imagem.',
  content: {},
  metadata: {
    generator: 'internal-real-photo-compositor',
    image_ai_calls: 0,
    selected_media_id: source.campaign?.brief?.real_photo_media_id,
    original_reference_url: source.reference_image_url
  },
  output: { composed_with_real_product: true, generated_at: new Date().toISOString() }
}}];"""
body = {
    "id": str(uuid.uuid4()), "name": BODY, "type": "n8n-nodes-base.code",
    "typeVersion": 2, "position": [240, -200],
    "parameters": {"jsCode": body_code}
}
nodes.extend([gate, body])
link = lambda name: {"node": name, "type": "main", "index": 0}
connections[PREP] = {"main": [[link(GATE)]]}
connections[GATE] = {"main": [[link(BODY)], [link(OPENAI)]]}
connections[BODY] = {"main": [[link(COMPLETE)]]}
candidate["id"] = NEW_ID
candidate.pop("workflowId", None)
candidate["name"] = "Central de Criativos Imagens V3.1 — Foto Aprovada (candidata)"
candidate["active"] = False
candidate["versionId"] = str(uuid.uuid4())
candidate.pop("activeVersionId", None)
candidate.pop("versionCounter", None)

output = Path(args.output)
if output.exists():
    raise SystemExit("PARADO: saída já existe.")
fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as target:
    json.dump([candidate], target, ensure_ascii=False, separators=(",", ":"))
print("CANDIDATA_INATIVA:", output)
print("NOS:", len(candidate["nodes"]))
print("VERSAO_PUBLICADA_USADA:", PUBLISHED_VERSION)
print("PRODUCAO_INALTERADA=true")
