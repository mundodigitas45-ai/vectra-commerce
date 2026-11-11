#!/usr/bin/env python3
"""Promote the verified creative overlay, keeping the previous API container for rollback."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

NAME = "vectra-commerce-api"
IMAGE = "vectra-commerce-api:creative-real-photo-live-overlay-v2"
EXPECTED_IMAGE_ID = "sha256:6631d295ad6ad77607e631c656de215dfc976e9387a041b8d302635647e3e976"
STAGE = Path("/root/vectra-api-criativos-overlay.8N69ip/dist")
RECORD = Path("/root/vectra-api-criativos-overlay.8N69ip/deployment.json")
FILES = {
    Path("modules/creative-image-workers") / name for name in (
        "creative-image-worker.repository.js",
        "creative-image-worker.routes.js",
        "creative-image-worker.schemas.js",
        "professional-real-photo-compositor.js",
        "professional-real-photo-preview.js",
        "real-photo-identity.js",
    )
}


def command(*args, check=True):
    result = subprocess.run(args, text=True, capture_output=True, timeout=120)
    if check and result.returncode:
        raise RuntimeError(f"{args[0]} falhou ({result.returncode}): {result.stderr[-350:]}")
    return result


def inspect(name):
    result = command("docker", "inspect", name)
    return json.loads(result.stdout)[0]


def files(folder):
    return {path.relative_to(folder): path for path in folder.rglob("*") if path.is_file()}


def difference(left, right):
    a, b = files(left), files(right)
    result = set()
    for path in a.keys() | b.keys():
        if path not in a or path not in b:
            result.add(path)
        elif hashlib.sha256(a[path].read_bytes()).digest() != hashlib.sha256(b[path].read_bytes()).digest():
            result.add(path)
    return result


def check_http(path, method="GET", timeout=35):
    deadline = time.monotonic() + timeout
    last = None
    while time.monotonic() < deadline:
        try:
            req = Request("http://127.0.0.1:3001" + path, method=method)
            with urlopen(req, timeout=3) as response:
                status = response.status
        except HTTPError as exc:
            status = exc.code
        except (URLError, OSError) as exc:
            last = type(exc).__name__
            time.sleep(1)
            continue
        if status == 401:
            return
        last = f"HTTP {status}"
        time.sleep(1)
    raise RuntimeError(f"Rota {path} não retornou 401: {last}")


def validate_old(old):
    config, host = old["Config"], old["HostConfig"]
    if old["State"]["Status"] != "running":
        raise RuntimeError("A API atual não está ativa.")
    if old["Image"] == EXPECTED_IMAGE_ID:
        raise RuntimeError("Imagem candidata já está ativa.")
    if (host.get("NetworkMode") != "bridge" or old.get("Mounts") or
        host.get("PortBindings") != {"3000/tcp": [{"HostIp": "127.0.0.1", "HostPort": "3001"}]} or
        (host.get("RestartPolicy") or {}).get("Name") != "unless-stopped" or
        config.get("Cmd") != ["node", "dist/server.js"] or
        host.get("Privileged") or host.get("Binds") or host.get("Devices") or
        host.get("ExtraHosts") or host.get("CapAdd") or host.get("CapDrop") or
        host.get("Memory") or host.get("NanoCpus") or host.get("CpuQuota")):
        raise RuntimeError("Configuração da API mudou; nenhuma troca realizada.")
    env = config.get("Env") or []
    seen = {}
    for entry in env:
        key, sep, value = entry.partition("=")
        if not sep or "\n" in value or "\r" in value or "\0" in value:
            raise RuntimeError("Variável de ambiente não pode ser preservada via env-file.")
        if key in seen and seen[key] != value:
            raise RuntimeError(f"Variável duplicada com valores distintos: {key}")
        seen[key] = value
    return env


def ensure_image_matches_live():
    if not STAGE.is_dir():
        raise RuntimeError("Overlay verificado ausente.")
    if b"creativeImageWorkerRoutes" not in (STAGE / "app.js").read_bytes():
        raise RuntimeError("O app atual não registra as rotas do worker criativo.")
    candidate = inspect(IMAGE)
    if candidate["Id"] != EXPECTED_IMAGE_ID:
        raise RuntimeError("A tag candidata não aponta para o build verificado.")
    with tempfile.TemporaryDirectory(prefix="vectra-api-live-check-") as tmp:
        live = Path(tmp) / "live"
        command("docker", "cp", f"{NAME}:/app/dist", str(live))
        delta = difference(live, STAGE)
        if delta != FILES:
            raise RuntimeError("Runtime ativo mudou; diferenças: " + ", ".join(map(str, sorted(delta))))


def rollback(backed_name, failed_name):
    current = inspect(NAME)
    old = inspect(backed_name)
    if current["Image"] != EXPECTED_IMAGE_ID or old["State"]["Status"] != "exited":
        raise RuntimeError("Estado de rollback inesperado; interrompido para inspeção.")
    command("docker", "stop", NAME)
    command("docker", "rename", NAME, failed_name)
    command("docker", "rename", backed_name, NAME)
    command("docker", "start", NAME)
    check_http("/api/v1/crm/board")
    print("API_ANTERIOR_RESTAURADA=true")
    print("CONTAINER_CANDIDATO_PARADO=", failed_name)


def deploy():
    if RECORD.exists():
        raise RuntimeError("Já existe registro de implantação; não repetir.")
    old = inspect(NAME)
    env = validate_old(old)
    ensure_image_matches_live()
    old_id = old["Id"]
    stamp = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
    backup = NAME + "-before-creative-" + stamp
    next_name = NAME + "-creative-next-" + stamp
    failed = NAME + "-creative-failed-" + stamp
    fd, env_path = tempfile.mkstemp(prefix="vectra-api-env-", dir="/root", text=True)
    os.fchmod(fd, 0o600)
    try:
        with os.fdopen(fd, "w") as file:
            file.write("\n".join(env) + "\n")
        command("docker", "create", "--name", next_name,
                "--network", "bridge", "--restart", "unless-stopped",
                "-p", "127.0.0.1:3001:3000", "--env-file", env_path,
                IMAGE)
    finally:
        os.unlink(env_path)

    print("CONTÊINER_ANTERIOR=", old_id[:12], flush=True)
    print("BACKUP_PREPARADO=", backup, flush=True)
    try:
        command("docker", "stop", NAME)
        command("docker", "rename", NAME, backup)
        command("docker", "rename", next_name, NAME)
        command("docker", "start", NAME)
        check_http("/api/v1/creative-image-preview/real-photo", "POST")
        check_http("/api/v1/crm/board")
    except Exception:
        # If the swap began, restore the original container before surfacing the error.
        try:
            names = set(command("docker", "ps", "-a", "--format", "{{.Names}}").stdout.splitlines())
            if backup in names:
                if NAME in names:
                    if inspect(NAME)["Image"] != EXPECTED_IMAGE_ID:
                        raise RuntimeError("Nome principal ocupado por outro contêiner.")
                    command("docker", "stop", NAME)
                    command("docker", "rename", NAME, failed)
                command("docker", "rename", backup, NAME)
                command("docker", "start", NAME)
            elif NAME in names and inspect(NAME)["Id"] == old_id:
                if inspect(NAME)["State"]["Status"] != "running":
                    command("docker", "start", NAME)
            else:
                raise RuntimeError("Contêiner antigo não pôde ser localizado.")
            check_http("/api/v1/crm/board")
            print("ROLLBACK_AUTOMATICO=true", flush=True)
        except Exception as recovery_error:
            print("ROLLBACK_NAO_CONFIRMADO=", recovery_error, flush=True)
        raise

    RECORD.write_text(json.dumps({"old_id": old_id, "backup": backup,
                                  "image_id": EXPECTED_IMAGE_ID, "failed": failed}) + "\n")
    os.chmod(RECORD, 0o600)
    print("API_CRIATIVOS_ATIVA=true")
    print("BACKUP_CONTAINER=", backup)
    print("N8N_E_PAINEL_INALTERADOS=true")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("deploy", "rollback"))
    args = parser.parse_args()
    if args.action == "deploy":
        deploy()
    else:
        data = json.loads(RECORD.read_text())
        rollback(data["backup"], data["failed"])
