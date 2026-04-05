import asyncio
import csv
import os
from datetime import date
from dotenv import load_dotenv

load_dotenv()

import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "sample")


def parse_date(s):
    if not s:
        return None
    return date.fromisoformat(s.strip())


async def load_csv(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"  File not found: {path}")
        return []
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


async def main():
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    print("Connected!")

    print("\nLoading rateplan transactions...")
    rows = await load_csv("rateplan_transactions.csv")
    count = 0
    for r in rows:
        try:
            await conn.execute("""
                insert into rateplan_transactions
                (transaction_date, period, rateplan_code, rep_code, rep_name,
                 store_code, store_name, plan_mrc, customer_paid_amount,
                 subscriber_id, phone_number, product_description, volume, type)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            """,
                parse_date(r["transaction_date"]),
                r["transaction_date"][:7],
                r["rateplan_code"], r["rep_code"], r.get("rep_name"),
                r["store_code"], r.get("store_name"),
                float(r["plan_mrc"]) if r.get("plan_mrc") else None,
                float(r["customer_paid_amount"]) if r.get("customer_paid_amount") else None,
                r.get("subscriber_id"), r.get("phone_number"),
                r.get("product_description"),
                int(r.get("volume", 1)), r["type"]
            )
            count += 1
        except Exception as e:
            print(f"  Skipped row: {e}")
    print(f"  Loaded {count} rateplan transactions")

    print("\nLoading feature transactions...")
    rows = await load_csv("feature_transactions.csv")
    count = 0
    for r in rows:
        try:
            await conn.execute("""
                insert into feature_transactions
                (transaction_date, period, feature_code, rep_code, rep_name,
                 store_code, store_name, feature_mrc, subscriber_id,
                 phone_number, feature_description, volume, type)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            """,
                parse_date(r["transaction_date"]),
                r["transaction_date"][:7],
                r["feature_code"], r["rep_code"], r.get("rep_name"),
                r["store_code"], r.get("store_name"),
                float(r["feature_mrc"]) if r.get("feature_mrc") else None,
                r.get("subscriber_id"), r.get("phone_number"),
                r.get("feature_description"),
                int(r.get("volume", 1)), r["type"]
            )
            count += 1
        except Exception as e:
            print(f"  Skipped row: {e}")
    print(f"  Loaded {count} feature transactions")

    print("\nLoading accessory transactions...")
    rows = await load_csv("accessory_transactions.csv")
    count = 0
    for r in rows:
        try:
            await conn.execute("""
                insert into accessory_transactions
                (transaction_date, period, accessory_code, rep_code, rep_name,
                 store_code, store_name, customer_paid_amount, subscriber_id,
                 phone_number, accessory_description, volume, type)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            """,
                parse_date(r["transaction_date"]),
                r["transaction_date"][:7],
                r["accessory_code"], r["rep_code"], r.get("rep_name"),
                r["store_code"], r.get("store_name"),
                float(r["customer_paid_amount"]) if r.get("customer_paid_amount") else None,
                r.get("subscriber_id"), r.get("phone_number"),
                r.get("accessory_description"),
                int(r.get("volume", 1)), r["type"]
            )
            count += 1
        except Exception as e:
            print(f"  Skipped row: {e}")
    print(f"  Loaded {count} accessory transactions")

    print("\nLoading device transactions...")
    rows = await load_csv("device_transactions.csv")
    count = 0
    for r in rows:
        try:
            await conn.execute("""
                insert into device_transactions
                (transaction_date, period, device_code, rep_code, rep_name,
                 store_code, store_name, customer_paid_amount, device_sale_type,
                 subscriber_id, phone_number, device_description, volume, type)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            """,
                parse_date(r["transaction_date"]),
                r["transaction_date"][:7],
                r["device_code"], r["rep_code"], r.get("rep_name"),
                r["store_code"], r.get("store_name"),
                float(r["customer_paid_amount"]) if r.get("customer_paid_amount") else None,
                r.get("device_sale_type"),
                r.get("subscriber_id"), r.get("phone_number"),
                r.get("device_description"),
                int(r.get("volume", 1)), r["type"]
            )
            count += 1
        except Exception as e:
            print(f"  Skipped row: {e}")
    print(f"  Loaded {count} device transactions")

    print("\nLoading credit card transactions...")
    rows = await load_csv("creditcard_transactions.csv")
    count = 0
    for r in rows:
        try:
            await conn.execute("""
                insert into creditcard_transactions
                (transaction_date, period, product_code, rep_code, rep_name,
                 store_code, store_name, subscriber_id, phone_number, volume)
                values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            """,
                parse_date(r["transaction_date"]),
                r["transaction_date"][:7],
                r.get("product_code", "CC-SW"),
                r["rep_code"], r.get("rep_name"),
                r["store_code"], r.get("store_name"),
                r.get("subscriber_id"), r.get("phone_number"),
                int(r.get("volume", 1))
            )
            count += 1
        except Exception as e:
            print(f"  Skipped row: {e}")
    print(f"  Loaded {count} credit card transactions")

    await conn.close()
    print("\nAll data loaded successfully!")


if __name__ == "__main__":
    asyncio.run(main())