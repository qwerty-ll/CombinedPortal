"""Checks the GigaChat setup with real requests, step by step, without printing the key or the token.

    docker compose exec portal python -m app.services.gigachat_check
    docker compose -f infrastructure/docker-compose.yml exec backend python -m app.services.gigachat_check
"""
import asyncio
import sys

from app.services import rag_service


async def main() -> int:
    try:
        await rag_service.self_check(print)
    except Exception as e:  # the whole point is to show what failed
        cause = e.__cause__ or e
        print(f"ОШИБКА: {rag_service._explain(cause)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
