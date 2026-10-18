#!/usr/bin/env python3
"""Exercise one local static route through exact raw HTTP request bytes."""

import asyncio
import base64
import hashlib
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, "/site")
sys.path.insert(0, "/source")

from aiohttp import web, __version__

MARKER = b"AIOHTTP_PAIR_PRIVATE_MARKER_20261019\n"
PUBLIC = b"AIOHTTP_PAIR_PUBLIC_CONTROL_20261019\n"
REQUESTS = {
    "traversal": b"GET /../private_file HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n",
    "normal": b"GET /public.txt HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n",
}


async def exchange(port, request):
    reader, writer = await asyncio.wait_for(asyncio.open_connection("127.0.0.1", port), 3)
    try:
        writer.write(request)
        await asyncio.wait_for(writer.drain(), 3)
        chunks = []
        length = 0
        while True:
            chunk = await asyncio.wait_for(reader.read(8192), 5)
            if not chunk:
                break
            length += len(chunk)
            if length > 65536:
                raise RuntimeError("response_oversize")
            chunks.append(chunk)
        return b"".join(chunks)
    finally:
        writer.close()
        await writer.wait_closed()


async def main():
    root = Path("/tmp/fixture")
    safe = root / "safe"
    safe.mkdir(parents=True)
    (root / "private_file").write_bytes(MARKER)
    (safe / "public.txt").write_bytes(PUBLIC)
    if any(path.is_symlink() for path in root.rglob("*")):
        raise RuntimeError("fixture_symlink")
    app = web.Application()
    app.router.add_routes([web.static("/", safe, follow_symlinks=True)])
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", 0)
    try:
        await site.start()
        port = site._server.sockets[0].getsockname()[1]
        cells = {}
        for name, request in REQUESTS.items():
            raw = await exchange(port, request)
            cells[name] = {
                "request_b64": base64.b64encode(request).decode("ascii"),
                "response_b64": base64.b64encode(raw).decode("ascii"),
                "request_sha256": hashlib.sha256(request).hexdigest(),
                "response_sha256": hashlib.sha256(raw).hexdigest(),
                "response_bytes": len(raw),
            }
        print(json.dumps({"version": __version__, "cells": cells}, sort_keys=True), flush=True)
    finally:
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
