#!/usr/bin/env python3
"""Prepara uma segunda execução isolada, corrigindo somente o orçamento de texto."""
import argparse
import copy
import json
import os
from pathlib import Path
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--candidate", required=True)
parser.add_argument("--pilot", required=True)
parser.add_argument("--output-candidate", required=True)
parser.add_argument("--output-pilot", required=True)
args = parser.parse_args()

OLD = "max_output_tokens: 450,"
NEW = "reasoning: { effort: 'low' },\n      max_output_tokens: 1200,"

def load(path, identifier, count):
    raw = json.loads(Path(path).read_text())
    if not isinstance(raw, list) or len(raw) != 1:
        raise SystemExit("PARADO: exportação inesperada.")
    workflow = raw[0]
    nodes = workflow.get("nodes", [])
    if workflow.get("id") != identifier or workflow.get("active") is not False or len(nodes) != count:
        raise SystemExit("PARADO: identidade, estado ou nós mudaram.")
    return workflow

candidate = load(args.candidate, "VcCreativeImgV12ArtDirectorCandidate", 22)
pilot = load(args.pilot, "VcCreativeImgV12PilotXiaomiArtTest", 7)
for workflow, new_id in (
    (candidate, "VcCreativeImgV12ArtDirectorCandidateV2"),
    (pilot, "VcCreativeImgV12PilotXiaomiArtTestV2"),
):
    nodes = [n for n in workflow["nodes"] if n.get("name") == "Preparar Criativo Visual"]
    if len(nodes) != 1:
        raise SystemExit("PARADO: nó de preparação não identificado.")
    code = nodes[0]["parameters"].get("jsCode", "")
    if code.count(OLD) != 1 or "visual_direction_request" not in code:
        raise SystemExit("PARADO: limite anterior não encontrado exatamente uma vez.")
    nodes[0]["parameters"]["jsCode"] = code.replace(OLD, NEW, 1)
    workflow["id"] = new_id
    workflow["name"] += " — limite de direção corrigido"
    workflow["versionId"] = str(uuid.uuid4())
    workflow.pop("activeVersionId", None)
    workflow.pop("versionCounter", None)
    if any(n.get("type") == "n8n-nodes-base.webhook" for n in pilot["nodes"]):
        raise SystemExit("PARADO: piloto não deve ter webhook.")

http = [n for n in pilot["nodes"] if n.get("type") == "n8n-nodes-base.httpRequest"]
if len(http) != 2 or any(n.get("parameters", {}).get("url") != "https://api.openai.com/v1/responses" for n in http):
    raise SystemExit("PARADO: chamadas HTTP do piloto mudaram.")
if any("/api/v1/internal/" in json.dumps(n.get("parameters", {})) for n in pilot["nodes"]):
    raise SystemExit("PARADO: piloto contém chamada à API comercial.")

for output, workflow in ((args.output_candidate, candidate), (args.output_pilot, pilot)):
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump([workflow], stream, ensure_ascii=False, separators=(",", ":"))
print("CANDIDATA_V2_INATIVA=true")
print("PILOTO_V2_INATIVO=true")
print("ALTERACAO=reasoning_low_e_limite_1200")
