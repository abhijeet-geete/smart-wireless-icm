import os
import asyncio
import calendar
from datetime import date, timedelta
from app.services.database import fetch_all, fetch_one, fetch_val

CHARGEBACK_DAYS = int(os.getenv("CHARGEBACK_DAYS", 120))
MANAGER_FLOOR = float(os.getenv("MANAGER_PAYOUT_FLOOR", 0.50))
MANAGER_CAP = float(os.getenv("MANAGER_PAYOUT_CAP", 1.30))
CC_MGR_RATE = float(os.getenv("CC_MGR_RATE", 10.0))
CC_DM_RATE = float(os.getenv("CC_DM_RATE", 10.0))


async def get_system_config(key: str, default: str = None):
    row = await fetch_one(
        "select config_value from system_config where config_key = $1", key
    )
    return row["config_value"] if row else default


async def get_comp_rate(product_type: str, product_code: str, period: str) -> float:
    effective_date = date.fromisoformat(period + "-01")
    row = await fetch_one(
        """
        select rep_flat_rate from comp_config
        where product_type = $1
          and product_code = $2
          and is_eligible = true
          and effective_date <= $3
        order by effective_date desc
        limit 1
        """,
        product_type, product_code, effective_date
    )
    return float(row["rep_flat_rate"]) if row else 0.0


async def get_store_multiplier(store_code: str) -> float:
    row = await fetch_one(
        "select store_multiplier from stores where store_code = $1", store_code
    )
    return float(row["store_multiplier"]) if row else 1.0


async def calc_rep_payout(rep_code: str, period: str) -> dict:
    rep = await fetch_one(
        "select * from reps where rep_code = $1", rep_code
    )
    if not rep:
        return {}

    store_code = rep["store_code"]
    mult = await get_store_multiplier(store_code)
    chargeback_days = int(await get_system_config("chargeback_days", "120"))

    rp_acts, rp_deacts, ft_acts, ac_sales, dv_sales, cc_txns_raw = await asyncio.gather(
        fetch_all("select * from rateplan_transactions where rep_code=$1 and period=$2 and type='Activation' order by transaction_date", rep_code, period),
        fetch_all("select * from rateplan_transactions where rep_code=$1 and period=$2 and type='Deactivation' order by transaction_date", rep_code, period),
        fetch_all("select * from feature_transactions where rep_code=$1 and period=$2 and type='Activation' order by transaction_date", rep_code, period),
        fetch_all("select * from accessory_transactions where rep_code=$1 and period=$2 and type='Sale' order by transaction_date", rep_code, period),
        fetch_all("select * from device_transactions where rep_code=$1 and period=$2 and type='Sale' order by transaction_date", rep_code, period),
        fetch_all("select * from creditcard_transactions where rep_code=$1 and period=$2 order by transaction_date", rep_code, period),
    )

    rp_txns = []
    rp_earned = 0.0
    for t in rp_acts:
        base_rate = await get_comp_rate("rateplan", t["rateplan_code"], period)
        earned = round(base_rate * mult, 2)
        rp_earned += earned
        rp_txns.append({
            "date": str(t["transaction_date"]),
            "code": t["rateplan_code"],
            "description": t.get("product_description", ""),
            "subscriber_id": t.get("subscriber_id", ""),
            "phone_number": t.get("phone_number", ""),
            "customer_paid": float(t.get("customer_paid_amount") or 0),
            "type": "Activation",
            "base_rate": base_rate,
            "multiplier": mult,
            "earned": earned,
        })

    for t in rp_deacts:
        act = await fetch_one(
            """select transaction_date from rateplan_transactions
               where subscriber_id=$1 and phone_number=$2
               and type='Activation' order by transaction_date limit 1""",
            t.get("subscriber_id", ""), t.get("phone_number", "")
        )
        if act:
            delta = (t["transaction_date"] - act["transaction_date"]).days
            if 0 <= delta <= chargeback_days:
                base_rate = await get_comp_rate("rateplan", t["rateplan_code"], period)
                clawback = round(base_rate * mult, 2)
                rp_earned -= clawback
                rp_txns.append({
                    "date": str(t["transaction_date"]),
                    "code": t["rateplan_code"],
                    "description": t.get("product_description", ""),
                    "subscriber_id": t.get("subscriber_id", ""),
                    "type": "Chargeback",
                    "base_rate": base_rate,
                    "multiplier": mult,
                    "earned": -clawback,
                })

    ft_txns = []
    ft_earned = 0.0
    for t in ft_acts:
        base_rate = await get_comp_rate("feature", t["feature_code"], period)
        earned = round(base_rate * mult, 2)
        ft_earned += earned
        ft_txns.append({
            "date": str(t["transaction_date"]),
            "code": t["feature_code"],
            "description": t.get("feature_description", ""),
            "subscriber_id": t.get("subscriber_id", ""),
            "phone_number": t.get("phone_number", ""),
            "mrc": float(t.get("feature_mrc") or 0),
            "type": "Activation",
            "base_rate": base_rate,
            "multiplier": mult,
            "earned": earned,
        })

    ac_txns = []
    ac_earned = 0.0
    for t in ac_sales:
        base_rate = await get_comp_rate("accessory", t["accessory_code"], period)
        earned = round(base_rate * mult, 2)
        ac_earned += earned
        ac_txns.append({
            "date": str(t["transaction_date"]),
            "code": t["accessory_code"],
            "description": t.get("accessory_description", ""),
            "subscriber_id": t.get("subscriber_id", ""),
            "phone_number": t.get("phone_number", ""),
            "customer_paid": float(t.get("customer_paid_amount") or 0),
            "type": "Sale",
            "base_rate": base_rate,
            "multiplier": mult,
            "earned": earned,
        })

    dv_txns = []
    dv_earned = 0.0
    for t in dv_sales:
        base_rate = await get_comp_rate("device", t["device_code"], period)
        earned = round(base_rate * mult, 2)
        dv_earned += earned
        dv_txns.append({
            "date": str(t["transaction_date"]),
            "code": t["device_code"],
            "description": t.get("device_description", ""),
            "sale_type": t.get("device_sale_type", ""),
            "subscriber_id": t.get("subscriber_id", ""),
            "phone_number": t.get("phone_number", ""),
            "customer_paid": float(t.get("customer_paid_amount") or 0),
            "type": "Sale",
            "base_rate": base_rate,
            "multiplier": mult,
            "earned": earned,
        })

    cc_txns = []
    cc_earned = 0.0
    cc_rate = await get_comp_rate("creditcard", "CC-SW", period)
    for t in cc_txns_raw:
        cc_earned += cc_rate
        cc_txns.append({
            "date": str(t["transaction_date"]),
            "code": "CC-SW",
            "description": "Smart Wireless Credit Card",
            "type": "SPIF",
            "earned": cc_rate,
        })

    total = round(rp_earned + ft_earned + ac_earned + dv_earned + cc_earned, 2)

    last_day = calendar.monthrange(*map(int, period.split("-")))[1]
    month_end = date(*map(int, period.split("-")), last_day)
    pay_days = int(await get_system_config("payment_days_after_close", "10"))
    payment_date = str(month_end + timedelta(days=pay_days))

    return {
        "rep_code": rep_code,
        "rep_name": rep["rep_name"],
        "store_code": store_code,
        "store_name": rep["store_name"],
        "period": period,
        "store_multiplier": mult,
        "payment_date": payment_date,
        "summary": {
            "rateplan": round(rp_earned, 2),
            "feature": round(ft_earned, 2),
            "accessory": round(ac_earned, 2),
            "device": round(dv_earned, 2),
            "credit_card": round(cc_earned, 2),
            "total": total,
        },
        "transactions": {
            "rateplan": rp_txns,
            "feature": ft_txns,
            "accessory": ac_txns,
            "device": dv_txns,
            "credit_card": cc_txns,
        },
    }


async def calc_store_stats(store_code: str, period: str) -> dict:
    rp_acts, rp_deacts, rp_rev, ft_rev, ac_rev, dv_rev, quota = await asyncio.gather(
        fetch_val("select count(*) from rateplan_transactions where store_code=$1 and period=$2 and type='Activation'", store_code, period),
        fetch_val("select count(*) from rateplan_transactions where store_code=$1 and period=$2 and type='Deactivation'", store_code, period),
        fetch_val("select coalesce(sum(customer_paid_amount),0) from rateplan_transactions where store_code=$1 and period=$2 and type='Activation'", store_code, period),
        fetch_val("select coalesce(sum(feature_mrc),0) from feature_transactions where store_code=$1 and period=$2 and type='Activation'", store_code, period),
        fetch_val("select coalesce(sum(customer_paid_amount),0) from accessory_transactions where store_code=$1 and period=$2 and type='Sale'", store_code, period),
        fetch_val("select coalesce(sum(customer_paid_amount),0) from device_transactions where store_code=$1 and period=$2 and type='Sale'", store_code, period),
        fetch_one("select * from store_quotas where store_code=$1 and period=$2", store_code, period),
    )

    rp_net = int(rp_acts or 0) - int(rp_deacts or 0)
    quota = quota or {}

    def att(actual, quota_val):
        q = float(quota_val) if quota_val else 1
        return round(min(1.5, actual / q), 4) if q > 0 else 0

    atts = {
        "rp_volume":         att(rp_net,        quota.get("rp_volume_quota", 100)),
        "rp_revenue":        att(float(rp_rev or 0),  quota.get("rp_revenue_quota", 7000)),
        "feature_revenue":   att(float(ft_rev or 0),  quota.get("feature_revenue_quota", 5000)),
        "accessory_revenue": att(float(ac_rev or 0),  quota.get("accessory_revenue_quota", 3000)),
        "device_revenue":    att(float(dv_rev or 0),  quota.get("device_revenue_quota", 15000)),
    }
    overall = round(min(MANAGER_CAP, sum(atts.values()) / len(atts)), 4)

    return {
        "store_code": store_code,
        "period": period,
        "actuals": {
            "rp_net_adds": rp_net,
            "rp_revenue": round(float(rp_rev or 0), 2),
            "feature_revenue": round(float(ft_rev or 0), 2),
            "accessory_revenue": round(float(ac_rev or 0), 2),
            "device_revenue": round(float(dv_rev or 0), 2),
        },
        "quotas": {
            "rp_volume":         float(quota.get("rp_volume_quota", 0)),
            "rp_revenue":        float(quota.get("rp_revenue_quota", 0)),
            "feature_revenue":   float(quota.get("feature_revenue_quota", 0)),
            "accessory_revenue": float(quota.get("accessory_revenue_quota", 0)),
            "device_revenue":    float(quota.get("device_revenue_quota", 0)),
        },
        "attainments": atts,
        "overall_attainment": overall,
    }


async def calc_manager_payout(manager_code: str, period: str) -> dict:
    mgr = await fetch_one(
        "select * from managers where manager_code=$1", manager_code
    )
    if not mgr:
        return {}

    store_code = mgr["store_code"]
    tti = float(mgr["tti"])

    stats, floor_cfg, cap_cfg, cc_rate_cfg, pay_days_cfg, cc_count = await asyncio.gather(
        calc_store_stats(store_code, period),
        get_system_config("manager_payout_floor", "0.50"),
        get_system_config("manager_payout_cap", "1.30"),
        get_system_config("cc_manager_rate", "10.00"),
        get_system_config("payment_days_after_close", "10"),
        fetch_val("select count(*) from creditcard_transactions where store_code=$1 and period=$2", store_code, period),
    )

    att = stats["overall_attainment"]
    floor = float(floor_cfg)
    cap = float(cap_cfg)
    cc_mgr_rate = float(cc_rate_cfg)
    pay_days = int(pay_days_cfg)

    if att < floor:
        base_payout = 0.0
        effective_att = 0.0
    else:
        effective_att = min(cap, att)
        base_payout = round(tti * effective_att, 2)

    cc_payout = round(int(cc_count or 0) * cc_mgr_rate, 2)
    total_payout = round(base_payout + cc_payout, 2)

    last_day = calendar.monthrange(*map(int, period.split("-")))[1]
    month_end = date(*map(int, period.split("-")), last_day)
    payment_date = str(month_end + timedelta(days=pay_days))

    return {
        "manager_code": manager_code,
        "manager_name": mgr["manager_name"],
        "store_code": store_code,
        "store_name": mgr["store_name"],
        "period": period,
        "tti": tti,
        "store_attainment": att,
        "effective_attainment": effective_att,
        "base_payout": base_payout,
        "cc_count": int(cc_count or 0),
        "cc_payout": cc_payout,
        "total_payout": total_payout,
        "payment_date": payment_date,
        "store_stats": stats,
        "payout_rules": {"floor": floor, "cap": cap, "cc_rate": cc_mgr_rate},
    }


async def calc_rm_payout(rm_code: str, period: str) -> dict:
    rm = await fetch_one(
        "select * from region_managers where rm_code = $1", rm_code
    )
    if not rm:
        return {}

    tti = float(rm["tti"])
    floor = float(rm["payout_floor"])
    cap = float(rm["payout_cap"])

    stores, cc_dm_rate_cfg, pay_days_cfg = await asyncio.gather(
        fetch_all("select * from stores where rm_code = $1", rm_code),
        get_system_config("cc_dm_rate", "10.00"),
        get_system_config("payment_days_after_close", "10"),
    )

    cc_dm_rate = float(cc_dm_rate_cfg)
    pay_days = int(pay_days_cfg)

    async def calc_store_summary(store):
        mgr = await fetch_one(
            "select * from managers where store_code = $1", store["store_code"]
        )
        if not mgr:
            return None

        stats, mgr_payout, cc_count, reps = await asyncio.gather(
            calc_store_stats(store["store_code"], period),
            calc_manager_payout(mgr["manager_code"], period),
            fetch_val("select count(*) from creditcard_transactions where store_code=$1 and period=$2", store["store_code"], period),
            fetch_all("select rep_code from reps where store_code=$1 and status='Active'", store["store_code"]),
        )

        dm_cc = round(int(cc_count or 0) * cc_dm_rate, 2)

        rep_payouts = await asyncio.gather(*[
            calc_rep_payout(r["rep_code"], period) for r in reps
        ])
        rep_pool = round(sum(rp.get("summary", {}).get("total", 0) for rp in rep_payouts), 2)

        return {
            "store_code": store["store_code"],
            "store_name": store["store_name"],
            "manager_code": mgr["manager_code"],
            "manager_name": mgr["manager_name"],
            "store_multiplier": float(store["store_multiplier"]),
            "overall_attainment": stats["overall_attainment"],
            "actuals": stats["actuals"],
            "quotas": stats["quotas"],
            "attainments": stats["attainments"],
            "manager_payout": mgr_payout.get("total_payout", 0),
            "rep_pool": rep_pool,
            "dm_cc_payout": dm_cc,
            "rep_count": len(reps),
            "cc_count": int(cc_count or 0),
        }

    store_summaries_raw = await asyncio.gather(*[
        calc_store_summary(store) for store in stores
    ])
    store_summaries = [s for s in store_summaries_raw if s is not None]

    total_cc = sum(s["dm_cc_payout"] for s in store_summaries)
    all_attainments = [s["overall_attainment"] for s in store_summaries]
    avg_att = round(sum(all_attainments) / len(all_attainments), 4) if all_attainments else 0

    if avg_att < floor:
        base_payout = 0.0
        effective_att = 0.0
    else:
        effective_att = min(cap, avg_att)
        base_payout = round(tti * effective_att, 2)

    total_payout = round(base_payout + total_cc, 2)

    last_day = calendar.monthrange(*map(int, period.split("-")))[1]
    month_end = date(*map(int, period.split("-")), last_day)
    payment_date = str(month_end + timedelta(days=pay_days))

    return {
        "rm_code": rm_code,
        "rm_name": rm["rm_name"],
        "region_name": rm["region_name"],
        "period": period,
        "tti": tti,
        "average_attainment": avg_att,
        "effective_attainment": effective_att,
        "base_payout": base_payout,
        "cc_count": int(total_cc / cc_dm_rate) if cc_dm_rate else 0,
        "cc_payout": round(total_cc, 2),
        "total_payout": total_payout,
        "payment_date": payment_date,
        "payout_rules": {"floor": floor, "cap": cap, "cc_rate": cc_dm_rate},
        "store_count": len(store_summaries),
        "average_store_attainment": avg_att,
        "stores": store_summaries,
    }


async def calc_district_summary(dm_code: str, period: str) -> dict:
    return await calc_rm_payout("RM-001", period)