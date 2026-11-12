#!/usr/bin/env python3
"""Imprime apenas enumerações e comprimento da cena, sem o texto do plano."""
import json
import sqlite3

dbpath = "/root/n8n/n8n_data/database.sqlite"
with sqlite3.connect(f"file:{dbpath}?mode=ro", uri=True) as db:
    row = db.execute("SELECT data FROM execution_data WHERE executionId=258366").fetchone()
if not row:
    raise SystemExit("PARADO: execução 258366 não encontrada.")
table = json.loads(row[0])
if not isinstance(table, list):
    raise SystemExit("PARADO: formato inesperado.")
seen = {}
def resolve(value):
    if isinstance(value, str) and value.isdigit() and int(value) < len(table):
        idx = int(value)
        if idx in seen:
            return seen[idx]
        src = table[idx]
        if isinstance(src, str):
            return src
        out = [] if isinstance(src, list) else {}
        seen[idx] = out
        if isinstance(src, list):
            out.extend(resolve(x) for x in src)
        elif isinstance(src, dict):
            out.update((k, resolve(v)) for k, v in src.items())
        else:
            return src
        return out
    if isinstance(value, dict):
        return {k: resolve(v) for k, v in value.items()}
    if isinstance(value, list):
        return [resolve(x) for x in value]
    return value

runs = resolve("0")["resultData"]["runData"]
item = runs["OpenAI - Direção Criativa por Foto"][-1]["data"]["main"][0][0]["json"]
texts = [part.get("text") for obj in item.get("output", [])
         for part in obj.get("content", []) if part.get("type") == "output_text"]
if len(texts) != 1 or not isinstance(texts[0], str):
    raise SystemExit("PARADO: resposta textual não identificada de forma única.")
plan = json.loads(texts[0])
if not isinstance(plan, dict):
    raise SystemExit("PARADO: plano não é objeto.")
print("CAMPOS=", sorted(plan))
for key in ("layout", "ink", "accent"):
    value = plan.get(key)
    print(key.upper()+"=", value if isinstance(value, str) and len(value) < 30 else type(value).__name__)
scene = plan.get("scene")
print("SCENE_TYPE=", type(scene).__name__)
print("SCENE_LENGTH=", len(scene) if isinstance(scene, str) else None)
print("STATUS_COMPLETED=", item.get("status") == "completed")
print("SOMENTE_LEITURA=true")
