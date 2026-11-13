#!/usr/bin/env bash
set -euo pipefail
umask 077

api=/root/vectra-art-api.DlGnEF
private=/root/vectra-art-n8n.mPj0LK
database=/root/n8n/n8n_data/database.sqlite
workflow_id=VcCreativeImgV12PilotXiaomiArtTestV3
stage="$private/retry-v3b"
container_file="/tmp/vectra-xiaomi-pilot-v3-$$.json"
trap 'docker exec -u 0 n8n rm -f "$container_file" >/dev/null 2>&1 || true' EXIT

test -f "$private/retry-v2/art-director-v2.json"
test -f "$private/retry-v2/pilot-xiaomi-v2.json"
test -f "$api/candidate-patches/prepare-xiaomi-art-replay.py"
test -f "$api/candidate-patches/extract-n8n-art-test-v2.py"
test -f "$api/candidate-patches/render-xiaomi-art-test.js"

python3 - "$database" "$workflow_id" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
    live=db.execute('SELECT active,activeVersionId FROM workflow_entity WHERE id=?',
                    ('VcCreativeImgV1',)).fetchone()
    v2=db.execute('SELECT active FROM workflow_entity WHERE id=?',
                  ('VcCreativeImgV12PilotXiaomiArtTestV2',)).fetchone()
    v3=db.execute('SELECT 1 FROM workflow_entity WHERE id=?',(sys.argv[2],)).fetchone()
if live!=(1,'1fda68da-8802-4ae7-9603-628eea65231e') or v2!=(0,) or v3:
    raise SystemExit('PARADO: produção ou pilotos em estado inesperado.')
print('PRECHECK_OK=true')
PY
docker exec -i n8n node - <<'JS'
const net=require('node:net');
(async()=>{for(const port of [5690,5691,5692]) await new Promise((resolve,reject)=>{
 const server=net.createServer();server.once('error',reject);
 server.listen(port,'127.0.0.1',()=>server.close(resolve));
});console.log('PORTAS_ISOLADAS_LIVRES=true');})().catch(()=>{
 console.error('PARADO: portas isoladas ocupadas.');process.exitCode=1;
});
JS

mkdir -m 700 "$stage"
python3 "$api/candidate-patches/prepare-xiaomi-art-replay.py" \
  --database "$database" \
  --candidate "$private/retry-v2/art-director-v2.json" \
  --pilot "$private/retry-v2/pilot-xiaomi-v2.json" \
  --output-candidate "$stage/art-director-v3.json" \
  --output-pilot "$stage/pilot-xiaomi-v3.json"
docker cp "$stage/pilot-xiaomi-v3.json" "n8n:$container_file" >/dev/null
docker exec -u 0 n8n chmod 644 "$container_file"
docker exec n8n n8n import:workflow --input="$container_file"

before=$(python3 - "$database" "$workflow_id" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
    pilot=db.execute('SELECT active,activeVersionId FROM workflow_entity WHERE id=?',
                     (sys.argv[2],)).fetchone()
    hooks=db.execute('SELECT COUNT(*) FROM webhook_entity WHERE workflowId=?',
                     (sys.argv[2],)).fetchone()[0]
    executions=db.execute('SELECT COUNT(*) FROM execution_entity WHERE workflowId=?',
                          (sys.argv[2],)).fetchone()[0]
    maximum=db.execute('SELECT COALESCE(MAX(id),0) FROM execution_entity').fetchone()[0]
if pilot!=(0,None) or hooks or executions:
    raise SystemExit('PARADO: piloto importado em estado inesperado ou já executado.')
print(maximum)
PY
)
echo 'PILOTO_V3_INATIVO_SEM_WEBHOOK=true'

set +e
timeout 360 docker exec \
  -e N8N_PORT=5690 \
  -e N8N_RUNNERS_BROKER_PORT=5691 \
  -e N8N_RUNNERS_TASK_BROKER_URI=http://127.0.0.1:5691 \
  -e N8N_RUNNERS_MODE=internal \
  -e N8N_RUNNERS_LAUNCHER_HEALTH_CHECK_PORT=5692 \
  n8n n8n execute --id="$workflow_id" > "$stage/execution.log" 2>&1
result=$?
set -e
if [ "$result" -ne 0 ]; then
  echo "PILOTO_V3_FALHOU_CODIGO=$result"
  echo "LOG_PRIVADO=$stage/execution.log"
  exit 1
fi

python3 "$api/candidate-patches/extract-n8n-art-test-v2.py" \
  --database "$database" --output-dir "$stage" --after-id "$before" \
  --workflow-id "$workflow_id"
node "$api/candidate-patches/render-xiaomi-art-test.js" \
  "$stage/background.bin" "$stage/plan.json" "$stage/xiaomi-67w-arte.webp"
echo "ARTE_PARA_REVISAO=$stage/xiaomi-67w-arte.webp"
echo 'PRODUCAO_INALTERADA=true'
