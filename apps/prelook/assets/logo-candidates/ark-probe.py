#!/usr/bin/env python3
"""Verify the supplied Ark-style key against Ark-compatible endpoints.

Reads ~/.dsh/image-key.txt, accepting either a bare key or the JSON form
{"provider","apiKey","model"}. Tests the domestic Ark endpoint and the
BytePlus ModelArk (international) endpoint, then prints status only — the key
itself is never echoed.
"""

import json
import pathlib
import urllib.error
import urllib.request

KEY_FILE = pathlib.Path.home() / ".dsh" / "image-key.txt"

ENDPOINTS = {
    "Ark (cn-beijing)": "https://ark.cn-beijing.volces.com/api/v3",
    "BytePlus ModelArk (ap-southeast)": "https://ark.ap-southeast.bytepluses.com/api/v3",
}


def load_key() -> tuple[str, str]:
    """Return (api_key, model)."""
    raw = KEY_FILE.read_text(encoding="utf-8").strip()
    if raw.startswith("{"):
        cfg = json.loads(raw)
        return str(cfg.get("apiKey", "")).strip(), str(cfg.get("model", "")).strip()
    return raw, ""


def probe(base: str, key: str) -> None:
    req = urllib.request.Request(
        f"{base}/models",
        headers={"Authorization": f"Bearer {key}", "User-Agent": "curl/8.5.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", "replace")
            print(f"  HTTP {resp.status} — key accepted")
            try:
                data = json.loads(body)
                ids = [m.get("id") for m in data.get("data", []) if isinstance(m, dict)]
                print("  models:", json.dumps(ids, ensure_ascii=False))
            except Exception:  # noqa: BLE001
                print("  body:", body[:800])
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        print(f"  HTTP {exc.code}")
        try:
            print("  error:", json.loads(body).get("error", {}).get("message", body[:300]))
        except Exception:  # noqa: BLE001
            print("  body:", body[:300])
    except Exception as exc:  # noqa: BLE001
        print(f"  FAIL: {type(exc).__name__}: {exc}")


def main() -> None:
    key, model = load_key()
    if not key:
        raise SystemExit("no apiKey found in the key file")
    print(f"key length={len(key)} prefix={key[:4]}*** suffix=***{key[-4:]}")
    print(f"model field: {model or '(empty)'}")
    for name, base in ENDPOINTS.items():
        print(f"\n{name}\n  {base}/models")
        probe(base, key)


if __name__ == "__main__":
    main()
