from fastapi import APIRouter, Header, HTTPException
from app.services.payout_engine import (
    calc_rep_payout,
    calc_manager_payout,
    calc_rm_payout,
    calc_store_stats,
)
from app.services.calc_engine import run_calculations
from app.services.database import fetch_all, fetch_one, execute
from app.routers.auth import get_claims
import json

router = APIRouter()


def parse_result(row):
    if not row:
        return None
    r = row["result_json"]
    return r if isinstance(r, dict) else json.loads(r)


@router.post("/admin/run-calculations")
async def trigger_calculations(period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await run_calculations(period)
    return result


@router.get("/rep/{rep_code}")
async def rep_payout(rep_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    role = claims["role"]
    if role == "rep" and claims["linked_code"] != rep_code:
        raise HTTPException(status_code=403, detail="Access denied")
    if role == "manager":
        rep = await fetch_one("select store_code from reps where rep_code=$1", rep_code)
        mgr = await fetch_one("select store_code from managers where manager_code=$1", claims["linked_code"])
        if rep and mgr and rep["store_code"] != mgr["store_code"]:
            raise HTTPException(status_code=403, detail="Rep not in your store")
    cached = await fetch_one(
        "select result_json from payout_results where period=$1 and entity_type='rep' and entity_code=$2",
        period, rep_code
    )
    if cached:
        return parse_result(cached)
    return await calc_rep_payout(rep_code, period)


@router.get("/store/{store_code}/reps")
async def store_reps(store_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] == "manager":
        mgr = await fetch_one("select store_code from managers where manager_code=$1", claims["linked_code"])
        if mgr and mgr["store_code"] != store_code:
            raise HTTPException(status_code=403, detail="Not your store")
    reps = await fetch_all(
        "select rep_code, rep_name from reps where store_code=$1 and status='Active'", store_code
    )
    cached_results = await fetch_all(
        "select entity_code, result_json from payout_results where period=$1 and entity_type='rep' and store_code=$2",
        period, store_code
    )
    cache_map = {r["entity_code"]: parse_result(r) for r in cached_results}
    results = []
    for r in reps:
        if r["rep_code"] in cache_map:
            p = cache_map[r["rep_code"]]
        else:
            p = await calc_rep_payout(r["rep_code"], period)
        results.append({
            "rep_code": r["rep_code"],
            "rep_name": r["rep_name"],
            "rp_count": len(p.get("transactions", {}).get("rateplan", [])),
            "dv_count": len(p.get("transactions", {}).get("device", [])),
            "ft_count": len(p.get("transactions", {}).get("feature", [])),
            "cc_count": len(p.get("transactions", {}).get("credit_card", [])),
            "total_payout": p.get("summary", {}).get("total", 0),
        })
    results.sort(key=lambda x: x["total_payout"], reverse=True)
    return {"store_code": store_code, "period": period, "reps": results}


@router.get("/store/{store_code}/transactions")
async def store_transactions(store_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] == "manager":
        mgr = await fetch_one("select store_code from managers where manager_code=$1", claims["linked_code"])
        if mgr and mgr["store_code"] != store_code:
            raise HTTPException(status_code=403, detail="Not your store")

    cached_results = await fetch_all(
        """select entity_code, entity_name, result_json 
           from payout_results 
           where period=$1 and entity_type='rep' and store_code=$2
           order by entity_name""",
        period, store_code
    )

    all_transactions = {
        "rateplan": [],
        "feature": [],
        "accessory": [],
        "device": [],
        "credit_card": [],
    }

    for row in cached_results:
        p = parse_result(row)
        if not p:
            continue
        txns = p.get("transactions", {})
        rep_code = row["entity_code"]
        rep_name = row["entity_name"]

        for t in txns.get("rateplan", []):
            all_transactions["rateplan"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code})
        for t in txns.get("feature", []):
            all_transactions["feature"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code})
        for t in txns.get("accessory", []):
            all_transactions["accessory"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code})
        for t in txns.get("device", []):
            all_transactions["device"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code})
        for t in txns.get("credit_card", []):
            all_transactions["credit_card"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code})

    for key in all_transactions:
        all_transactions[key].sort(key=lambda x: x.get("date", ""))

    return {"store_code": store_code, "period": period, "transactions": all_transactions}


@router.get("/region/{rm_code}/transactions")
async def region_transactions(rm_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] not in ["dm", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    cached_results = await fetch_all(
        """select entity_code, entity_name, store_code, store_name, result_json 
           from payout_results 
           where period=$1 and entity_type='rep'
           order by store_name, entity_name""",
        period
    )

    all_transactions = {
        "rateplan": [],
        "feature": [],
        "accessory": [],
        "device": [],
        "credit_card": [],
    }

    for row in cached_results:
        p = parse_result(row)
        if not p:
            continue
        txns = p.get("transactions", {})
        rep_code = row["entity_code"]
        rep_name = row["entity_name"]
        store_code = row["store_code"]
        store_name = row["store_name"]

        for t in txns.get("rateplan", []):
            all_transactions["rateplan"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code, "store_name": store_name})
        for t in txns.get("feature", []):
            all_transactions["feature"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code, "store_name": store_name})
        for t in txns.get("accessory", []):
            all_transactions["accessory"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code, "store_name": store_name})
        for t in txns.get("device", []):
            all_transactions["device"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code, "store_name": store_name})
        for t in txns.get("credit_card", []):
            all_transactions["credit_card"].append({**t, "rep_code": rep_code, "rep_name": rep_name, "store_code": store_code, "store_name": store_name})

    for key in all_transactions:
        all_transactions[key].sort(key=lambda x: x.get("date", ""))

    return {"rm_code": rm_code, "period": period, "transactions": all_transactions}


@router.get("/manager/{manager_code}")
async def manager_payout(manager_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] == "manager" and claims["linked_code"] != manager_code:
        raise HTTPException(status_code=403, detail="Access denied")
    cached = await fetch_one(
        "select result_json from payout_results where period=$1 and entity_type='manager' and entity_code=$2",
        period, manager_code
    )
    if cached:
        return parse_result(cached)
    return await calc_manager_payout(manager_code, period)


@router.get("/district/{dm_code}")
async def district_summary(dm_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] not in ["dm", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if claims["role"] == "dm" and claims["linked_code"] != dm_code:
        raise HTTPException(status_code=403, detail="Access denied")
    cached = await fetch_one(
        "select result_json from payout_results where period=$1 and entity_type='rm' and entity_code='RM-001'",
        period
    )
    if cached:
        return parse_result(cached)
    return await calc_rm_payout("RM-001", period)


@router.get("/admin/summary")
async def admin_summary(period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    cached_rm = await fetch_one(
        "select result_json from payout_results where period=$1 and entity_type='rm' and entity_code='RM-001'",
        period
    )
    cached_reps = await fetch_all(
        "select entity_code, entity_name, store_code, store_name, result_json from payout_results where period=$1 and entity_type='rep'",
        period
    )
    cached_mgrs = await fetch_all(
        "select entity_code, result_json from payout_results where period=$1 and entity_type='manager'",
        period
    )

    if cached_rm and cached_reps:
        district = parse_result(cached_rm)
        rep_payouts = []
        for r in cached_reps:
            p = parse_result(r)
            rep_payouts.append({
                "rep_code": r["entity_code"],
                "rep_name": r["entity_name"],
                "store_code": r["store_code"],
                "store_name": r["store_name"],
                "total_payout": p.get("summary", {}).get("total", 0),
                "breakdown": p.get("summary", {}),
            })
    else:
        district = await calc_rm_payout("RM-001", period)
        all_reps = await fetch_all(
            "select rep_code, rep_name, store_code, store_name from reps where status='Active'"
        )
        rep_payouts = []
        for r in all_reps:
            p = await calc_rep_payout(r["rep_code"], period)
            rep_payouts.append({
                "rep_code": r["rep_code"],
                "rep_name": r["rep_name"],
                "store_code": r["store_code"],
                "store_name": r["store_name"],
                "total_payout": p.get("summary", {}).get("total", 0),
                "breakdown": p.get("summary", {}),
            })

    rep_payouts.sort(key=lambda x: x["total_payout"], reverse=True)
    total_rep = sum(r["total_payout"] for r in rep_payouts)
    total_mgr = sum(s["manager_payout"] for s in district.get("stores", []))
    rm_payout = district.get("base_payout", 0)
    total_cc = district.get("cc_payout", 0)

    comp_config = await fetch_all(
        "select * from comp_config where is_eligible=true order by product_type, product_code"
    )

    return {
        "period": period,
        "total_incentive_liability": round(total_rep + total_mgr + rm_payout + total_cc, 2),
        "rep_pool": round(total_rep, 2),
        "manager_pool": round(total_mgr, 2),
        "rm_payout": round(rm_payout, 2),
        "total_cc_pool": round(total_cc, 2),
        "dm_cc_payout": round(total_cc, 2),
        "district": district,
        "top_reps": rep_payouts[:20],
        "all_reps": rep_payouts,
        "comp_config": comp_config,
        "is_cached": bool(cached_rm and cached_reps),
    }