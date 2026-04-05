import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
_pool = None


async def get_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10, statement_cache_size=0)
    return _pool


async def fetch_all(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(r) for r in rows]


async def fetch_one(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def fetch_val(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval(query, *args)


async def execute(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)


async def execute_many(query: str, args_list: list):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.executemany(query, args_list)