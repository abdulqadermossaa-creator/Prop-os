from flask import Blueprint, request, jsonify
from db import (
    verify_founder_pin, get_founder_stats, get_all_owners, get_all_apartments,
    toggle_apartment, toggle_owner, set_owner_commission,
    create_owner, create_apartment, get_owner, get_full_income_report
)

bp = Blueprint("founder", __name__)

# حماية بسيطة — PIN في كل طلب
def _auth(data: dict) -> bool:
    return verify_founder_pin(str(data.get("pin", "")))


@bp.post("/api/founder/login")
def founder_login():
    data = request.get_json(force=True, silent=True) or {}
    if not _auth(data):
        return jsonify({"error": "PIN خاطئ"}), 401
    return jsonify({"ok": True})


@bp.get("/api/founder/stats")
def founder_stats():
    pin = request.args.get("pin", "")
    if not verify_founder_pin(pin):
        return jsonify({"error": "غير مصرح"}), 401
    stats = get_founder_stats()
    owners = get_all_owners()
    apartments = get_all_apartments()
    return jsonify({
        "stats": stats,
        "owners": owners,
        "apartments": apartments,
    })


@bp.get("/api/founder/income")
def founder_income():
    pin = request.args.get("pin", "")
    if not verify_founder_pin(pin):
        return jsonify({"error": "غير مصرح"}), 401
    return jsonify(get_full_income_report())


# ─── مفتاح القطع ──────────────────────────────────────────────────────────────

@bp.post("/api/founder/apartment/toggle")
def apt_toggle():
    data = request.get_json(force=True, silent=True) or {}
    if not _auth(data):
        return jsonify({"error": "غير مصرح"}), 401

    apt_id = data.get("apartment_id")
    active = bool(data.get("active", True))
    if not apt_id:
        return jsonify({"error": "apartment_id مطلوب"}), 400

    toggle_apartment(apt_id, active)
    status = "مفعّلة" if active else "موقوفة"
    return jsonify({"apartment_id": apt_id, "active": active, "status": status})


@bp.post("/api/founder/owner/toggle")
def owner_toggle():
    """يقطع المالك بالكامل — كل شققه وتابلتاته تتوقف"""
    data = request.get_json(force=True, silent=True) or {}
    if not _auth(data):
        return jsonify({"error": "غير مصرح"}), 401

    owner_id = data.get("owner_id")
    active = bool(data.get("active", True))
    if not owner_id:
        return jsonify({"error": "owner_id مطلوب"}), 400

    toggle_owner(owner_id, active)
    owner = get_owner(owner_id)
    status = "مفعّل" if active else "موقوف — كل شققه معطّلة"
    return jsonify({"owner_id": owner_id, "active": active, "status": status,
                    "owner_name": owner.get("name") if owner else ""})


# ─── إدارة الملاك ─────────────────────────────────────────────────────────────

@bp.post("/api/founder/owner/add")
def add_owner():
    data = request.get_json(force=True, silent=True) or {}
    if not _auth(data):
        return jsonify({"error": "غير مصرح"}), 401

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    commission = float(data.get("commission_rate", 20))
    pin = str(data.get("pin_owner", "0000"))

    if not name or not phone:
        return jsonify({"error": "الاسم والجوال مطلوبان"}), 400

    owner_id = create_owner(name, phone, commission, pin)
    return jsonify({"owner_id": owner_id, "name": name, "commission_rate": commission}), 201


@bp.post("/api/founder/owner/commission")
def update_commission():
    data = request.get_json(force=True, silent=True) or {}
    if not _auth(data):
        return jsonify({"error": "غير مصرح"}), 401

    owner_id = data.get("owner_id")
    rate = float(data.get("commission_rate", 20))
    if not owner_id:
        return jsonify({"error": "owner_id مطلوب"}), 400

    set_owner_commission(owner_id, rate)
    return jsonify({"owner_id": owner_id, "new_commission_rate": rate})


# ─── إضافة شقة ────────────────────────────────────────────────────────────────

@bp.post("/api/founder/apartment/add")
def add_apartment():
    data = request.get_json(force=True, silent=True) or {}
    if not _auth(data):
        return jsonify({"error": "غير مصرح"}), 401

    owner_id = data.get("owner_id")
    name = (data.get("name") or "").strip()
    location = data.get("location", "")
    hourly = float(data.get("hourly_rate", 75))
    daily = float(data.get("daily_rate", 450))
    wifi_name = data.get("wifi_name", "")
    wifi_pass = data.get("wifi_pass", "")

    if not owner_id or not name:
        return jsonify({"error": "owner_id والاسم مطلوبان"}), 400

    apt_id = create_apartment(owner_id, name, location, hourly, daily, wifi_name, wifi_pass)
    return jsonify({"apartment_id": apt_id, "name": name}), 201
