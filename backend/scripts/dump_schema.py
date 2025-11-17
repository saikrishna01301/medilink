import asyncio
import os
from collections import defaultdict

import asyncpg
from dotenv import load_dotenv
from google.cloud.sql.connector import Connector, IPTypes

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
ENV_PATH = os.path.join(BACKEND_DIR, ".env")
load_dotenv(ENV_PATH)

INSTANCE_CONNECTION_NAME = os.environ.get("INSTANCE_CONNECTION_NAME")
DB_USER = os.environ.get("DB_USER")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME")
USE_PRIVATE_IP = os.environ.get("USE_PRIVATE_IP", "false").lower() == "true"

if not all([INSTANCE_CONNECTION_NAME, DB_USER, DB_PASSWORD, DB_NAME]):
    raise SystemExit("Missing database credentials in backend/.env")

async def fetch_rows():
    loop = asyncio.get_running_loop()
    connector = Connector(loop=loop)
    conn = await connector.connect_async(
        INSTANCE_CONNECTION_NAME,
        "asyncpg",
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        ip_type=IPTypes.PRIVATE if USE_PRIVATE_IP else IPTypes.PUBLIC,
    )
    try:
        tables = await conn.fetch(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
            """
        )
        columns = await conn.fetch(
            """
            SELECT table_schema, table_name, column_name, ordinal_position,
                   data_type, udt_name, character_maximum_length,
                   is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name, ordinal_position;
            """
        )
        constraints = await conn.fetch(
            """
            SELECT tc.table_schema,
                   tc.table_name,
                   tc.constraint_name,
                   tc.constraint_type,
                   kcu.column_name,
                   kcu.ordinal_position,
                   ccu.table_schema AS fk_table_schema,
                   ccu.table_name AS fk_table_name,
                   ccu.column_name AS fk_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
                   ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                  AND tc.table_name = kcu.table_name
            LEFT JOIN information_schema.constraint_column_usage ccu
                   ON tc.constraint_name = ccu.constraint_name
                  AND tc.table_schema = ccu.table_schema
            WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position;
            """
        )
        return tables, columns, constraints
    finally:
        await conn.close()
        await connector.close_async()


def normalize_type(row):
    data_type = row["data_type"]
    if data_type == "USER-DEFINED":
        data_type = row["udt_name"]
    length = row["character_maximum_length"]
    if length is not None and length > 0:
        data_type = f"{data_type}({length})"
    return data_type


def build_schema_snapshot(tables, columns, constraints):
    table_meta = defaultdict(lambda: {"columns": [], "constraints": defaultdict(list)})
    for row in columns:
        key = (row["table_schema"], row["table_name"])
        table_meta[key]["columns"].append(
            {
                "name": row["column_name"],
                "type": normalize_type(row),
                "nullable": row["is_nullable"] == "YES",
                "default": row["column_default"],
            }
        )
    for row in constraints:
        key = (row["table_schema"], row["table_name"])
        ctype = row["constraint_type"].lower()
        entry = {
            "name": row["constraint_name"],
            "column": row["column_name"],
        }
        if ctype == "foreign key":
            entry["references"] = f"{row['fk_table_name']}.{row['fk_column_name']}"
        table_meta[key]["constraints"][ctype].append(entry)
    ordered = []
    for table in tables:
        key = (table["table_schema"], table["table_name"])
        ordered.append((key, table_meta.get(key, {"columns": [], "constraints": {}})))
    return ordered


def print_markdown(snapshot):
    for (schema, table), meta in snapshot:
        print(f"## Table: {schema}.{table}")
        print("| Column | Type | Nullable | Default |")
        print("| ------ | ---- | -------- | ------- |")
        for col in meta["columns"]:
            default = col["default"].replace("::character varying", "") if col["default"] else ""
            default = default.replace("::text", "")
            print(f"| `{col['name']}` | {col['type']} | {'YES' if col['nullable'] else 'NO'} | {default or ''} |")
        if not meta["columns"]:
            print("(no columns found)")
        if meta["constraints"]:
            print("\nConstraints:")
            for ctype, items in meta["constraints"].items():
                formatted = ", ".join(
                    f"{item['name']} ({item['column']}{' -> ' + item['references'] if 'references' in item else ''})"
                    for item in items
                    if item["column"]
                )
                if formatted:
                    print(f"- {ctype.upper()}: {formatted}")
        print("\n")


async def main():
    tables, columns, constraints = await fetch_rows()
    snapshot = build_schema_snapshot(tables, columns, constraints)
    print_markdown(snapshot)

if __name__ == "__main__":
    asyncio.run(main())
