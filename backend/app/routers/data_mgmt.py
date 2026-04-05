import io
import csv
from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from app.routers.auth import get_claims
from app.services.database import execute, execute_many, fetch_all

router = APIRouter()


def require_admin(authorization: str):
    claims = get_claims(authorization)
    if claims["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return claims


@router.post("/upload/{file_type}")
async def upload_csv(file_type: str, file: UploadFile = File(...), authorization: str = Header(None)):
    require_admin(authorization)
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="Empty file")

    if file_type == "rateplan_transactions":
        await execute_many(
            """insert into rateplan_transactions
               (transaction_date, period, rateplan_code, rep_code, rep_name,
                store_code, store_name, plan_mrc, customer_paid_amount,
                subscriber_id, phone_number, product_description, volume, type)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
               on conflict do nothing""",
            [(r["transaction_date"],
              r["transaction_date"][:7],
              r["rateplan_code"], r["rep_code"], r.get("rep_name"),
              r["store_code"], r.get("store_name"),
              float(r["plan_mrc"]) if r.get("plan_mrc") else None,
              float(r["customer_paid_amount"]) if r.get("customer_paid_amount") else None,
              r.get("subscriber_id"), r.get("phone_number"),
              r.get("product_description"),
              int(r.get("volume", 1)), r["type"]) for r in rows]
        )
    elif file_type == "feature_transactions":
        await execute_many(
            """insert into feature_transactions
               (transaction_date, period, feature_code, rep_code, rep_name,
                store_code, store_name, feature_mrc, subscriber_id,
                phone_number, feature_description, volume, type)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
               on conflict do nothing""",
            [(r["transaction_date"], r["transaction_date"][:7],
              r["feature_code"], r["rep_code"], r.get("rep_name"),
              r["store_code"], r.get("store_name"),
              float(r["feature_mrc"]) if r.get("feature_mrc") else None,
              r.get("subscriber_id"), r.get("phone_number"),
              r.get("feature_description"),
              int(r.get("volume", 1)), r["type"]) for r in rows]
        )
    elif file_type == "accessory_transactions":
        await execute_many(
            """insert into accessory_transactions
               (transaction_date, period, accessory_code, rep_code, rep_name,
                store_code, store_name, customer_paid_amount, subscriber_id,
                phone_number, accessory_description, volume, type)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
               on conflict do nothing""",
            [(r["transaction_date"], r["transaction_date"][:7],
              r["accessory_code"], r["rep_code"], r.get("rep_name"),
              r["store_code"], r.get("store_name"),
              float(r["customer_paid_amount"]) if r.get("customer_paid_amount") else None,
              r.get("subscriber_id"), r.get("phone_number"),
              r.get("accessory_description"),
              int(r.get("volume", 1)), r["type"]) for r in rows]
        )
    elif file_type == "device_transactions":
        await execute_many(
            """insert into device_transactions
               (transaction_date, period, device_code, rep_code, rep_name,
                store_code, store_name, customer_paid_amount, device_sale_type,
                subscriber_id, phone_number, device_description, volume, type)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
               on conflict do nothing""",
            [(r["transaction_date"], r["transaction_date"][:7],
              r["device_code"], r["rep_code"], r.get("rep_name"),
              r["store_code"], r.get("store_name"),
              float(r["customer_paid_amount"]) if r.get("customer_paid_amount") else None,
              r.get("device_sale_type"),
              r.get("subscriber_id"), r.get("phone_number"),
              r.get("device_description"),
              int(r.get("volume", 1)), r["type"]) for r in rows]
        )
    elif file_type == "creditcard_transactions":
        await execute_many(
            """insert into creditcard_transactions
               (transaction_date, period, product_code, rep_code, rep_name,
                store_code, store_name, subscriber_id, phone_number, volume)
               values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
               on conflict do nothing""",
            [(r["transaction_date"], r["transaction_date"][:7],
              r.get("product_code", "CC-SW"),
              r["rep_code"], r.get("rep_name"),
              r["store_code"], r.get("store_name"),
              r.get("subscriber_id"), r.get("phone_number"),
              int(r.get("volume", 1))) for r in rows]
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown file type: {file_type}")

    return {"message": f"Uploaded {len(rows)} rows to {file_type}"}


@router.get("/files")
async def list_files(authorization: str = Header(None)):
    require_admin(authorization)
    tables = ["rateplan_transactions", "feature_transactions",
              "accessory_transactions", "device_transactions",
              "creditcard_transactions"]
    result = []
    for t in tables:
        count = await fetch_all(f"select count(*) as cnt from {t}")
        result.append({"table": t, "rows": int(count[0]["cnt"])})
    return {"tables": result}