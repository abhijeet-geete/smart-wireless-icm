import asyncio
import json
from datetime import datetime
from app.services.database import fetch_all, fetch_one, execute
from app.services.payout_engine import calc_rep_payout, calc_manager_payout, calc_rm_payout


async def run_calculations(period: str) -> dict:
    print(f"\n{'='*50}")
    print(f"Starting calculation run for period: {period}")
    print(f"{'='*50}")

    started_at = datetime.utcnow()
    results = {"period": period, "reps": 0, "managers": 0, "rm": 0, "errors": []}

    # Get all active reps
    reps = await fetch_all("select rep_code, rep_name, store_code, store_name from reps where status='Active'")
    managers = await fetch_all("select manager_code, manager_name, store_code, store_name from managers where status='Active'")
    region_managers = await fetch_all("select rm_code, rm_name from region_managers where status='Active'")

    print(f"Found: {len(reps)} reps, {len(managers)} managers, {len(region_managers)} RMs")

    # Calculate all reps in parallel
    print(f"Calculating rep payouts...")
    async def calc_and_store_rep(rep):
        try:
            result = await calc_rep_payout(rep["rep_code"], period)
            await execute(
                """
                insert into payout_results (period, entity_type, entity_code, entity_name, store_code, store_name, rm_code, result_json)
                values ($1, 'rep', $2, $3, $4, $5, 'RM-001', $6)
                on conflict (period, entity_type, entity_code) do update set result_json = $6, calculated_at = now()
                """,
                period, rep["rep_code"], rep["rep_name"],
                rep["store_code"], rep["store_name"],
                json.dumps(result)
            )
            return True
        except Exception as e:
            print(f"Error calculating rep {rep['rep_code']}: {e}")
            return False

    rep_results = await asyncio.gather(*[calc_and_store_rep(r) for r in reps])
    results["reps"] = sum(1 for r in rep_results if r)

    # Calculate all managers in parallel
    print(f"Calculating manager payouts...")
    async def calc_and_store_manager(mgr):
        try:
            result = await calc_manager_payout(mgr["manager_code"], period)
            await execute(
                """
                insert into payout_results (period, entity_type, entity_code, entity_name, store_code, store_name, rm_code, result_json)
                values ($1, 'manager', $2, $3, $4, $5, 'RM-001', $6)
                on conflict (period, entity_type, entity_code) do update set result_json = $6, calculated_at = now()
                """,
                period, mgr["manager_code"], mgr["manager_name"],
                mgr["store_code"], mgr["store_name"],
                json.dumps(result)
            )
            return True
        except Exception as e:
            print(f"Error calculating manager {mgr['manager_code']}: {e}")
            return False

    mgr_results = await asyncio.gather(*[calc_and_store_manager(m) for m in managers])
    results["managers"] = sum(1 for r in mgr_results if r)

    # Calculate RM
    print(f"Calculating RM payouts...")
    for rm in region_managers:
        try:
            result = await calc_rm_payout(rm["rm_code"], period)
            await execute(
                """
                insert into payout_results (period, entity_type, entity_code, entity_name, store_code, store_name, rm_code, result_json)
                values ($1, 'rm', $2, $3, null, null, $2, $4)
                on conflict (period, entity_type, entity_code) do update set result_json = $4, calculated_at = now()
                """,
                period, rm["rm_code"], rm["rm_name"],
                json.dumps(result)
            )
            results["rm"] += 1
        except Exception as e:
            print(f"Error calculating RM {rm['rm_code']}: {e}")
            results["errors"].append(str(e))

    elapsed = (datetime.utcnow() - started_at).total_seconds()
    results["elapsed_seconds"] = round(elapsed, 2)
    results["calculated_at"] = str(started_at)

    print(f"\nCalculation complete in {elapsed:.1f}s")
    print(f"Reps: {results['reps']}, Managers: {results['managers']}, RMs: {results['rm']}")
    print(f"{'='*50}\n")

    return results