from fastapi import APIRouter, Header, HTTPException
from app.services.payout_engine import (
    calc_rep_payout,
    calc_manager_payout,
    calc_district_summary,
    calc_store_stats,
)
from app.services.database import fetch_all, fetch_one
from app.routers.auth import get_claims

router = APIRouter()


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
    results = []
    for r in reps:
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


@router.get("/manager/{manager_code}")
async def manager_payout(manager_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] == "manager" and claims["linked_code"] != manager_code:
        raise HTTPException(status_code=403, detail="Access denied")
    return await calc_manager_payout(manager_code, period)


@router.get("/district/{dm_code}")
async def district_summary(dm_code: str, period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] not in ["dm", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if claims["role"] == "dm" and claims["linked_code"] != dm_code:
        raise HTTPException(status_code=403, detail="Access denied")
    return await calc_district_summary(dm_code, period)


@router.get("/admin/summary")
async def admin_summary(period: str = "2025-01", authorization: str = Header(None)):
    claims = get_claims(authorization)
    if claims["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    district = await calc_district_summary("DM-001", period)
    all_reps = await fetch_all("select rep_code, rep_name, store_code, store_name from reps where status='Active'")
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
    total_mgr = sum(s["manager_payout"] for s in district["stores"])
    comp_config = await fetch_all("select * from comp_config where is_eligible=true order by product_type, product_code")
    return {
        "period": period,
        "total_incentive_liability": round(total_rep + total_mgr + district["dm_cc_payout"], 2),
        "rep_pool": round(total_rep, 2),
        "manager_pool": round(total_mgr, 2),
        "dm_cc_payout": district["dm_cc_payout"],
        "district": district,
        "top_reps": rep_payouts[:20],
        "all_reps": rep_payouts,
        "comp_config": comp_config,
    }