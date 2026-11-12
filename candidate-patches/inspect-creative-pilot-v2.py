#!/usr/bin/env python3
"""Lê apenas metadados da última execução do piloto v2, sem imprimir payloads."""
import json
import re
import sqlite3

database = "/root/n8n/n8n_data/database.sqlite"
workflow = "VcCreativeImgV12PilotXiaomiArtTestV2"
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
result = root.get("resultData", {})
runs = result.get("runData", {})
print("NOS_EXECUTADOS=", list(runs))
def clean(value):
    value = str(value or "")
    value = re.sub(r"sk-[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{10,}|eyJhbGci[A-Za-z0-9_.-]+", "[SEGREDO]", value)
    value = re.sub(r"Bearer\s+\S+", "Bearer [OCULTO]", value, flags=re.I)
    return value[:240]
error = result.get("error")
if isinstance(error, dict):
    node = error.get("node") or {}
    print("NO_ERRO=", clean(node.get("name") if isinstance(node, dict) else node))
    print("TIPO_ERRO=", clean(error.get("name")))
    print("MENSAGEM_ERRO=", clean(error.get("message")))
for name in ("OpenAI - Direção Criativa por Foto", "OpenAI - Gerar Fundo Dirigido"):
    for run in runs.get(name, []):
        run_error = run.get("error")
        if isinstance(run_error, dict):
            print("ERRO_NO_HTTP=", name, "CODIGO=", clean(run_error.get("httpCode") or run_error.get("code")),
                  "MENSAGEM=", clean(run_error.get("message")))
        for branch in (run.get("data") or {}).get("main", []) or []:
            for item in (branch or [])[:1]:
                response = item.get("json") or {}
                if not isinstance(response, dict):
                    continue
                print("NO_RESPOSTA=", name)
                print("STATUS=", clean(response.get("status")), "MODELO=", clean(response.get("model")))
                details = response.get("incomplete_details")
                print("INCOMPLETE_REASON=", clean(details.get("reason") if isinstance(details, dict) else None))
                err = response.get("error")
                if isinstance(err, dict):
                    print("API_ERROR_CODE=", clean(err.get("code")))
                    print("API_ERROR_MESSAGE=", clean(err.get("message")))
                output = response.get("output")
                if isinstance(output, list):
                    print("OUTPUT_TYPES=", [o.get("type") for o in output if isinstance(o, dict)][:12])
                    print("CONTENT_TYPES=", [[c.get("type") for c in o.get("content", []) if isinstance(c, dict)]
                                            for o in output if isinstance(o, dict)][:12])
                    print("IMAGEM_RETORNADA=", any(o.get("type") == "image_generation_call" and bool(o.get("result"))
                                                   for o in output if isinstance(o, dict)))
                usage = response.get("usage")
                if isinstance(usage, dict):
                    print("TOKENS=", {k: v for k, v in usage.items() if k in
                                      ("input_tokens", "output_tokens", "total_tokens") and isinstance(v, int)})
print("SOMENTE_LEITURA=true")
