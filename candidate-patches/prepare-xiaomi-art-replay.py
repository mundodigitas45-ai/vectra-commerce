#!/usr/bin/env python3
"""Piloto v3: reutiliza a direção da execução 258366, chama só gerador de fundo."""
import argparse
import copy
import json
import os
from pathlib import Path
import sqlite3
import uuid

parser = argparse.ArgumentParser()
parser.add_argument("--database", required=True)
parser.add_argument("--candidate", required=True)
parser.add_argument("--pilot", required=True)
parser.add_argument("--output-candidate", required=True)
parser.add_argument("--output-pilot", required=True)
args = parser.parse_args()

with sqlite3.connect(f"file:{args.database}?mode=ro", uri=True) as db:
    execution = db.execute("SELECT workflowId,status FROM execution_entity WHERE id=258366").fetchone()
    raw = db.execute("SELECT data FROM execution_data WHERE executionId=258366").fetchone()
if execution != ("VcCreativeImgV12PilotXiaomiArtTestV2", "error") or not raw:
    raise SystemExit("PARADO: execução de direção esperada indisponível.")
table = json.loads(raw[0])
if not isinstance(table, list) or not table:
    raise SystemExit("PARADO: formato da execução mudou.")
seen = {}
def resolve(value):
    if isinstance(value, str) and value.isdigit() and int(value) < len(table):
        index = int(value)
        if index in seen:
            return seen[index]
        src = table[index]
        if isinstance(src, str):
            return src
        out = [] if isinstance(src, list) else {}
        seen[index] = out
        if isinstance(src, list):
            out.extend(resolve(v) for v in src)
        elif isinstance(src, dict):
            out.update((k, resolve(v)) for k, v in src.items())
        else:
            return src
        return out
    if isinstance(value, dict):
        return {k: resolve(v) for k, v in value.items()}
    if isinstance(value, list):
        return [resolve(v) for v in value]
    return value

runs = resolve("0").get("resultData", {}).get("runData", {})
direction = runs.get("OpenAI - Direção Criativa por Foto", [])
if len(direction) != 1:
    raise SystemExit("PARADO: direção original não identificada unicamente.")
branches = (direction[0].get("data") or {}).get("main", [])
if (not isinstance(branches, list) or not branches
        or not isinstance(branches[0], list) or len(branches[0]) != 1
        or any(branch for branch in branches[1:])):
    raise SystemExit("PARADO: saída da direção inesperada.")
response = branches[0][0].get("json", {})
if response.get("status") != "completed" or response.get("model") != "gpt-5-mini-2025-08-07":
    raise SystemExit("PARADO: direção não foi concluída pelo modelo esperado.")
texts = [p.get("text") for o in response.get("output", [])
         for p in o.get("content", []) if p.get("type") == "output_text"]
if len(texts) != 1 or not isinstance(texts[0], str):
    raise SystemExit("PARADO: texto da direção não encontrado.")
plan = json.loads(texts[0])
if (not isinstance(plan, dict) or set(plan) != {"layout", "ink", "accent", "scene"}
        or plan["layout"] not in ("hero_center", "hero_left", "hero_right")
        or plan["ink"] not in ("dark", "light")
        or plan["accent"] not in ("yellow", "green")
        or not isinstance(plan["scene"], str) or not 25 <= len(plan["scene"]) <= 800):
    raise SystemExit("PARADO: plano previamente gerado fora dos limites.")
reused = {"id": response.get("id"), "status": "completed", "output": [
    {"type": "message", "content": [{"type": "output_text", "text": texts[0]}]}
], "usage": response.get("usage")}
if not isinstance(reused["id"], str) or not reused["id"].startswith("resp_"):
    raise SystemExit("PARADO: identificação da direção ausente.")

def load(path, identifier, count):
    data = json.loads(Path(path).read_text())
    if not isinstance(data, list) or len(data) != 1:
        raise SystemExit("PARADO: exportação inesperada.")
    workflow = data[0]
    if workflow.get("id") != identifier or workflow.get("active") is not False or len(workflow.get("nodes", [])) != count:
        raise SystemExit("PARADO: fluxo ou nós diferentes do esperado.")
    return workflow

candidate = load(args.candidate, "VcCreativeImgV12ArtDirectorCandidateV2", 22)
pilot = load(args.pilot, "VcCreativeImgV12PilotXiaomiArtTestV2", 7)
for workflow, identifier in (
    (candidate, "VcCreativeImgV12ArtDirectorCandidateV3"),
    (pilot, "VcCreativeImgV12PilotXiaomiArtTestV3"),
):
    nodes = [n for n in workflow["nodes"] if n.get("name") == "Validar Direção e Preparar Fundo"]
    if len(nodes) != 1:
        raise SystemExit("PARADO: validador não encontrado.")
    code = nodes[0]["parameters"].get("jsCode", "")
    old = "plan.scene.length > 400"
    if code.count(old) != 1:
        raise SystemExit("PARADO: regra anterior não encontrada.")
    nodes[0]["parameters"]["jsCode"] = code.replace(old, "plan.scene.length > 800", 1)
    workflow["id"] = identifier
    workflow["name"] += " — descrição validada até 800 caracteres"
    workflow["versionId"] = str(uuid.uuid4())
    workflow.pop("activeVersionId", None)
    workflow.pop("versionCounter", None)

director = [n for n in pilot["nodes"] if n.get("name") == "OpenAI - Direção Criativa por Foto"]
if len(director) != 1 or director[0].get("type") != "n8n-nodes-base.httpRequest":
    raise SystemExit("PARADO: nó de direção mudou.")
director[0]["name"] = "Reutilizar Direção da Execução 258366"
director[0]["type"] = "n8n-nodes-base.code"
director[0]["typeVersion"] = 2
director[0]["parameters"] = {"jsCode": "return [{json:JSON.parse(" + json.dumps(json.dumps(reused, ensure_ascii=False)) + ")}];"}
director[0].pop("credentials", None)
director[0].pop("onError", None)
links = pilot["connections"]
prep = links["Preparar Criativo Visual"]["main"][0]
if len(prep) != 1 or prep[0].get("node") != "OpenAI - Direção Criativa por Foto":
    raise SystemExit("PARADO: conexão da direção mudou.")
prep[0]["node"] = director[0]["name"]
links[director[0]["name"]] = links.pop("OpenAI - Direção Criativa por Foto")
http = [n for n in pilot["nodes"] if n.get("type") == "n8n-nodes-base.httpRequest"]
if len(http) != 1 or http[0].get("name") != "OpenAI - Gerar Fundo Dirigido" or http[0]["parameters"].get("url") != "https://api.openai.com/v1/responses":
    raise SystemExit("PARADO: piloto deve conter só o gerador de fundo.")
if any(n.get("type") == "n8n-nodes-base.webhook" for n in pilot["nodes"]):
    raise SystemExit("PARADO: piloto não deve ter webhook.")

for output, workflow in ((args.output_candidate, candidate), (args.output_pilot, pilot)):
    fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump([workflow], stream, ensure_ascii=False, separators=(",", ":"))
print("DIRECAO_REUTILIZADA_EXECUCAO=258366")
print("DESCRICAO_TAMANHO=", len(plan["scene"]))
print("CHAMADAS_OPENAI_PREVISTAS=1")
print("PILOTO_INATIVO_SEM_WEBHOOK=true")
