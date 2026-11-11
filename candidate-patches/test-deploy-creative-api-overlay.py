import importlib.util
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError


path = Path(__file__).with_name("deploy-creative-api-overlay.py")
spec = importlib.util.spec_from_file_location("creative_api_deploy", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_connection_reset_during_startup_is_retried():
    unauthorized = HTTPError("http://127.0.0.1:3001", 401, "Unauthorized", {}, None)
    with patch.object(module, "urlopen", side_effect=[ConnectionResetError(104, "reset"), unauthorized]) as call:
        with patch.object(module.time, "sleep"):
            module.check_http("/api/v1/crm/board", timeout=5)
    assert call.call_count == 2


if __name__ == "__main__":
    test_connection_reset_during_startup_is_retried()
    print("TRANSIENTE_DE_PARTIDA_TRATADO=true")
