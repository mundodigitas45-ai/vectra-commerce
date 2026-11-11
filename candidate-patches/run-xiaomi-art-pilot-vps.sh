#!/usr/bin/env bash
set -euo pipefail
umask 077

api=/root/vectra-art-api.DlGnEF
private=/root/vectra-art-n8n.mPj0LK
candidate="$private/art-director.json"
database=/root/n8n/n8n_data/database.sqlite
workflow_id=VcCreativeImgV12PilotXiaomiArtTest
container_file="/tmp/vectra-xiaomi-pilot-$$.json"
trap 'docker exec n8n rm -f "$container_file" >/dev/null 2>&1 || true' EXIT

test -f "$candidate"
test -f "$api/candidate-patches/prepare-xiaomi-art-test.py"
if ! docker exec n8n n8n execute --help 2>&1 | grep -q -- '--id'; then
  echo 'PARADO: esta instalação não oferece n8n execute --id; nenhum teste importado.'
  exit 1
fi
python3 - "$database" "$workflow_id" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
    row=db.execute('SELECT id FROM workflow_entity WHERE id=?',(sys.argv[2],)).fetchone()
if row: raise SystemExit('PARADO: fluxo piloto já existe; não duplicar.')
print('PILOTO_LIVRE=true')
PY
python3 "$api/candidate-patches/prepare-xiaomi-art-test.py" \
  --source "$candidate" --output "$private/pilot-xiaomi.json"
chmod 644 "$private/pilot-xiaomi.json"
docker cp "$private/pilot-xiaomi.json" "n8n:$container_file" >/dev/null
docker exec n8n n8n import:workflow --input="$container_file" >/dev/null
python3 - "$database" "$workflow_id" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
    row=db.execute('SELECT active FROM workflow_entity WHERE id=?',(sys.argv[2],)).fetchone()
    hooks=db.execute('SELECT COUNT(*) FROM webhook_entity WHERE workflowId=?',(sys.argv[2],)).fetchone()[0]
if row!=(0,) or hooks: raise SystemExit('PARADO: piloto importado em estado inesperado; não executar.')
print('PILOTO_INATIVO_SEM_WEBHOOK=true')
PY
before=$(python3 - "$database" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
 print(db.execute('SELECT COALESCE(MAX(id),0) FROM execution_entity').fetchone()[0])
PY
)
set +e
timeout 360 docker exec n8n n8n execute --id="$workflow_id" > "$private/execution.log" 2>&1
result=$?
set -e
if [ "$result" -ne 0 ]; then
  echo "PILOTO_EXECUCAO_FALHOU_CODIGO=$result"
  echo "LOG_PRIVADO=$private/execution.log"
  exit 1
fi
python3 "$api/candidate-patches/extract-n8n-art-test.py" \
  --database "$database" --output-dir "$private" --after-id "$before"
node "$api/candidate-patches/render-xiaomi-art-test.js" \
  "$private/background.bin" "$private/plan.json" "$private/xiaomi-67w-arte.webp"
echo 'UMA_ARTE_GERADA_PARA_REVISAO=true'
echo 'FLUXOS_PUBLICADOS_E_PAINEL_INALTERADOS=true'
