#!/usr/bin/env bash
set -euo pipefail
umask 077

api=/root/vectra-art-api.DlGnEF
private=/root/vectra-art-n8n.mPj0LK
database=/root/n8n/n8n_data/database.sqlite
workflow_id=VcCreativeImgV12PilotXiaomiArtTest
python3 - "$database" "$workflow_id" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
    pilot=db.execute('SELECT active FROM workflow_entity WHERE id=?',(sys.argv[2],)).fetchone()
    hooks=db.execute('SELECT COUNT(*) FROM webhook_entity WHERE workflowId=?',(sys.argv[2],)).fetchone()[0]
    live=db.execute('SELECT active,activeVersionId FROM workflow_entity WHERE id=?',('VcCreativeImgV1',)).fetchone()
if pilot!=(0,) or hooks or live!=(1,'1fda68da-8802-4ae7-9603-628eea65231e'):
    raise SystemExit('PARADO: o estado dos fluxos mudou; execução cancelada.')
print('PILOTO_ISOLADO_E_PRODUCAO_CONFERIDOS=true')
PY

docker exec -i n8n node - <<'JS'
const net=require('node:net');
const ports=[5690,5691,5692];
(async()=>{for(const port of ports){await new Promise((resolve,reject)=>{
 const server=net.createServer();server.once('error',reject);
 server.listen(port,'127.0.0.1',()=>server.close(resolve));
});}console.log('PORTAS_DO_PILOTO_LIVRES=true');})().catch(()=>{
 console.error('PARADO: alguma porta do piloto está ocupada.');process.exitCode=1;
});
JS

before=$(python3 - "$database" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
 print(db.execute('SELECT COALESCE(MAX(id),0) FROM execution_entity').fetchone()[0])
PY
)
set +e
timeout 360 docker exec \
  -e N8N_PORT=5690 \
  -e N8N_RUNNERS_BROKER_PORT=5691 \
  -e N8N_RUNNERS_TASK_BROKER_URI=http://127.0.0.1:5691 \
  -e N8N_RUNNERS_MODE=internal \
  -e N8N_RUNNERS_LAUNCHER_HEALTH_CHECK_PORT=5692 \
  n8n n8n execute --id="$workflow_id" > "$private/execution-retry.log" 2>&1
result=$?
set -e
if [ "$result" -ne 0 ]; then
  echo "PILOTO_EXECUCAO_FALHOU_CODIGO=$result"
  echo "LOG_PRIVADO=$private/execution-retry.log"
  exit 1
fi
python3 "$api/candidate-patches/extract-n8n-art-test.py" \
  --database "$database" --output-dir "$private" --after-id "$before"
node "$api/candidate-patches/render-xiaomi-art-test.js" \
  "$private/background.bin" "$private/plan.json" "$private/xiaomi-67w-arte.webp"
echo 'UMA_ARTE_GERADA_PARA_REVISAO=true'
echo 'PRODUCAO_INALTERADA=true'
