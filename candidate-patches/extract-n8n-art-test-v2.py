#!/usr/bin/env python3
"""Extrai apenas fundo e plano da última execução do workflow piloto, sem imprimir base64."""
import argparse
import base64
import json
import os
from pathlib import Path
import sqlite3

parser = argparse.ArgumentParser()
parser.add_argument("--database", required=True)
parser.add_argument("--output-dir", required=True)
parser.add_argument("--after-id", type=int, required=True)
parser.add_argument("--workflow-id", default="VcCreativeImgV12PilotXiaomiArtTest")
args = parser.parse_args()
workflow_id = args.workflow_id

with sqlite3.connect(f"file:{args.database}?mode=ro", uri=True) as db:
    row = db.execute(
        "SELECT id,status FROM execution_entity WHERE workflowId=? AND id>? ORDER BY id DESC LIMIT 1",
        (workflow_id, args.after_id)
    ).fetchone()
    if not row:
        raise SystemExit("SEM_EXECUCAO_SALVA: confira o arquivo privado execution.log.")
    execution_id, status = row
    print("EXECUCAO_ID=", execution_id)
    print("EXECUCAO_STATUS=", status)
    if status != "success":
        raise SystemExit("EXECUCAO_NAO_CONCLUIDA: confira a aba Execuções no n8n.")
    raw = db.execute(
        "SELECT data FROM execution_data WHERE executionId=?", (execution_id,)
    ).fetchone()
if not raw:
    raise SystemExit("DADOS_DA_EXECUCAO_INDISPONIVEIS")

# O n8n serializa referências em uma tabela plana. A expansão mantém a
# identidade de objetos e evita despejar payloads de imagem no terminal.
table = json.loads(raw[0])
if not isinstance(table, list) or not table:
    raise SystemExit("SERIALIZACAO_N8N_INESPERADA")
seen = {}
def deref(value):
    if isinstance(value, str) and value.isdigit() and int(value) < len(table):
        index = int(value)
        source = table[index]
        if isinstance(source, str):
            return source
        if index in seen:
            return seen[index]
        result = [] if isinstance(source, list) else {}
        seen[index] = result
        if isinstance(source, list):
            result.extend(deref(item) for item in source)
        elif isinstance(source, dict):
            result.update((key, deref(item)) for key, item in source.items())
        else:
            return source
        return result
    if isinstance(value, dict):
        return {key: deref(item) for key, item in value.items()}
    if isinstance(value, list):
        return [deref(item) for item in value]
    return value

# Percorre apenas o caminho da saída final, preservando memória quando o
# response bruto da geração também contém imagens grandes.
root = deref("0")
run_data = root.get("resultData", {}).get("runData", {})
runs = run_data.get("Validar Fundo e Compor Foto Real", [])
if not runs:
    raise SystemExit("NÓ_FINAL_SEM_EXECUCAO")
item = runs[-1].get("data", {}).get("main", [[]])[0][0].get("json", {})
encoded = item.get("image_base64")
plan = item.get("metadata", {}).get("visual_plan")
if not isinstance(encoded, str) or len(encoded) < 100 or not isinstance(plan, dict):
    raise SystemExit("FUNDO_OU_PLANO_AUSENTE")
binary = base64.b64decode(encoded, validate=True)
if len(binary) < 100 or len(binary) > 20_000_000:
    raise SystemExit("FUNDO_FORA_DO_LIMITE")
out = Path(args.output_dir)
for name, data in (("background.bin", binary),
                   ("plan.json", json.dumps(plan, ensure_ascii=False).encode())):
    path = out / name
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as file:
        file.write(data)
print("FUNDO_GERADO_BYTES=", len(binary))
print("PLANO_LAYOUT=", plan.get("layout"))
print("ARQUIVOS_PRIVADOS=", out)
