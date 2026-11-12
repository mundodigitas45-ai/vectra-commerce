#!/usr/bin/env python3
"""Diagnóstico redigido do piloto n8n. Não imprime payloads ou segredos."""
import json
import re
import sqlite3

database = "/root/n8n/n8n_data/database.sqlite"
workflow = "VcCreativeImgV12PilotXiaomiArtTest"
with sqlite3.connect(f"file:{database}?mode=ro", uri=True) as db:
    row = db.execute("SELECT id,status FROM execution_entity WHERE workflowId=? "
                     "ORDER BY id DESC LIMIT 1", (workflow,)).fetchone()
    if not row:
        raise SystemExit("EXECUCAO_AUSENTE")
    raw = db.execute("SELECT data FROM execution_data WHERE executionId=?", (row[0],)).fetchone()
print("EXECUCAO_ID=", row[0], "STATUS=", row[1])
if not raw:
    raise SystemExit("DADOS_AUSENTES")
table = json.loads(raw[0])
if not isinstance(table, list) or not table:
    raise SystemExit("SERIALIZACAO_INESPERADA")
seen = {}
def deref(value):
    if isinstance(value, str) and value.isdigit() and int(value) < len(table):
        index = int(value)
        item = table[index]
        if isinstance(item, str):
            return item
        if index in seen:
            return seen[index]
        obj = [] if isinstance(item, list) else {}
        seen[index] = obj
        if isinstance(item, list):
            obj.extend(deref(v) for v in item)
        elif isinstance(item, dict):
            obj.update((k, deref(v)) for k, v in item.items())
        else:
            return item
        return obj
    if isinstance(value, dict):
        return {k: deref(v) for k, v in value.items()}
    if isinstance(value, list):
        return [deref(v) for v in value]
    return value

root = deref("0")
runs = root.get("resultData", {}).get("runData", {})
print("NÓS_EXECUTADOS=", list(runs))
name = "OpenAI - Direção Criativa por Foto"
if name not in runs:
    raise SystemExit("OPENAI_NAO_EXECUTOU")
for run in runs[name]:
    data = run.get("data") or {}
    branches = data.get("main") or []
    for branch in branches:
        for item in (branch or [])[:1]:
            response = item.get("json") or {}
            print("CHAVES_RESPOSTA=", sorted(response.keys()))
            for key in ("status", "model", "output_text", "incomplete_details"):
                value = response.get(key)
                if key == "output_text":
                    print("OUTPUT_TEXT_TAMANHO=", len(value) if isinstance(value, str) else None)
                elif key == "incomplete_details":
                    print("INCOMPLETE_REASON=", (value or {}).get("reason") if isinstance(value, dict) else None)
                else:
                    print(key.upper()+"=", value if isinstance(value, (str, int)) else type(value).__name__)
            error = response.get("error")
            if isinstance(error, dict):
                print("ERROR_CODE=", str(error.get("code"))[:80])
                message = str(error.get("message") or "")
                message = re.sub(r"sk-[A-Za-z0-9_-]+|sb_secret_[A-Za-z0-9_-]+", "[CHAVE]", message)
                print("ERROR_MESSAGE=", message[:220])
            output = response.get("output")
            if isinstance(output, list):
                print("OUTPUT_TYPES=", [str(o.get("type")) for o in output if isinstance(o, dict)][:12])
                print("CONTENT_TYPES=", [[str(c.get("type")) for c in o.get("content", []) if isinstance(c, dict)]
                    for o in output if isinstance(o, dict)][:12])
            usage = response.get("usage")
            if isinstance(usage, dict):
                print("USAGE_COUNTS=", {k: v for k,v in usage.items() if k in
                    ("input_tokens", "output_tokens", "total_tokens") and isinstance(v, int)})
print("SOMENTE_LEITURA=true")
