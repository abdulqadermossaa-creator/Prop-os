from flask import Blueprint, request, jsonify
from db import verify_owner_pin, get_owner, get_owner_apartments, get_owner_stats, get_active_booking
from datetime import datetime

bp = Blueprint("owner", __name__)


@bp.post("/api/owner/login")
def owner_login():
    data = request.get_json(force=True, silent=True) or {}
    owner_id = data.get("owner_id")
    pin = str(data.get("pin", ""))
    if not verify_owner_pin(owner_id, pin):
        return jsonify({"error": "PIN خاطئ أو المالك غير موجود"}), 401
    owner = get_owner(owner_id)
    if not owner.get("is_active"):
        return jsonify({"error": "حسابك موقوف — تواصل مع المؤسس"}), 403
    return jsonify({"ok": True, "owner": owner})


@bp.get("/api/owner/<int:owner_id>/dashboard")
def owner_dashboard(owner_id: int):
    pin = request.args.get("pin", "")
    if not verify_owner_pin(owner_id, pin):
        return jsonify({"error": "غير مصرح"}), 401

    owner = get_owner(owner_id)
    if not owner.get("is_active"):
        return jsonify({"error": "الحساب موقوف"}), 403

    apartments = get_owner_apartments(owner_id)
    stats = get_owner_stats(owner_id)

    # أضف الحجز النشط لكل شقة
    for apt in apartments:
        booking = get_active_booking(apt["id"])
        if booking:
            end = datetime.strptime(booking["end_time"], "%Y-%m-%d %H:%M:%S")
            remaining = max(0, int((end - datetime.utcnow()).total_seconds()))
            apt["active_booking"] = {**booking, "remaining_seconds": remaining}
        else:
            apt["active_booking"] = None

    return jsonify({
        "owner": owner,
        "apartments": apartments,
        "stats": stats,
    })
