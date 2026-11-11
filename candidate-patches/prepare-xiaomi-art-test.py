#!/usr/bin/env python3
"""Constrói workflow de teste isolado: 1 foto, 1 fundo IA, zero jobs reais."""
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
workflow = raw[0] if isinstance(raw, list) else raw
if workflow.get("id") != "VcCreativeImgV12ArtDirectorCandidate" or workflow.get("active"):
    raise SystemExit("PARADO: origem de teste inesperada.")
by_name = {node["name"]: node for node in workflow["nodes"]}
names = ["Teste Manual", "Preparar Criativo Visual",
         "OpenAI - Direção Criativa por Foto", "Validar Direção e Preparar Fundo",
         "OpenAI - Gerar Fundo Dirigido", "Validar Fundo e Compor Foto Real"]
if len(by_name) != len(workflow["nodes"]) or not all(name in by_name for name in names):
    raise SystemExit("PARADO: nós candidatos mudaram.")
nodes = [copy.deepcopy(by_name[name]) for name in names]
photo = ("https://qudpndluldjudukelwxd.supabase.co/storage/v1/object/public/"
         "product-media/products/images/8c7c4486-f345-449b-807d-29e051842a4f-"
         "WhatsApp-Image-2026-10-28-at-19.01.50-3-.jpeg")
fixture = {
    "id": str(uuid.uuid4()), "name": "Dados de Teste Xiaomi",
    "type": "n8n-nodes-base.code", "typeVersion": 2,
    "position": [-650, -200],
    "parameters": {"jsCode": "return [{json:" + json.dumps({
        "job": {"id": "00000000-0000-4000-8000-000000000001"},
        "channel": {"id": "00000000-0000-4000-8000-000000000002"},
        "format": {"key": "square", "width": 1080, "height": 1080},
        "product": {"id": "925afb5b-8bde-451e-bed9-248e0270e29d",
                    "name": "Carregador Xiaomi original  67W Charging Combo (Type-A) MDY-12-EZ."},
        "product_media": [{"id": "d8d9b8b1-db94-4351-9ebc-b4517b808d8a",
                           "public_url": photo, "is_primary": True,
                           "source": "google_drive", "file_name": "WhatsApp Image 2026-10-28 at 19.01.50 (3).jpeg"}],
        "campaign": {"product_id": "925afb5b-8bde-451e-bed9-248e0270e29d",
                     "brief": {"fidelity_mode": "real_photo",
                               "real_photo_media_id": "d8d9b8b1-db94-4351-9ebc-b4517b808d8a"}}
    }, ensure_ascii=False) + "}];"}
}
nodes.insert(1, fixture)
edge = lambda name: {"node": name, "type": "main", "index": 0}
chain = ["Teste Manual", "Dados de Teste Xiaomi"] + names[1:]
connections = {left: {"main": [[edge(right)]]}
               for left, right in zip(chain, chain[1:])}
candidate = copy.deepcopy(workflow)
candidate.update({
    "id": "VcCreativeImgV12PilotXiaomiArtTest",
    "name": "TESTE ISOLADO — Uma arte Xiaomi 67W (sem job comercial)",
    "active": False, "nodes": nodes, "connections": connections,
    "versionId": str(uuid.uuid4()),
    "settings": {"saveDataSuccessExecution": "all", "saveDataErrorExecution": "all",
                 "saveManualExecutions": True}
})
candidate.pop("activeVersionId", None)
candidate.pop("versionCounter", None)
if any(node["type"] == "n8n-nodes-base.webhook" for node in nodes):
    raise SystemExit("PARADO: webhook em teste isolado.")
if any("/api/v1/internal/" in json.dumps(node.get("parameters", {})) for node in nodes):
    raise SystemExit("PARADO: teste tentaria alterar API comercial.")
output = Path(args.output)
fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as target:
    json.dump([candidate], target, ensure_ascii=False, separators=(",", ":"))
print("TESTE_INATIVO=", output)
print("NO_COMERCIAL_CHAMADO=false")
print("CHAMADAS_OPENAI_PREVISTAS=2")
