from flask import Blueprint, request, jsonify
from db import validate_code
from smart import unlock_door

bp = Blueprint("codes", __name__)


@bp.post("/api/code/validate")
def validate():
    data = request.get_json(force=True, silent=True) or {}
    code = (data.get("code") or "").strip().upper()

    if not code:
        return jsonify({"valid": False, "error": "الكود مطلوب"}), 400

    result = validate_code(code)
    if not result:
        return jsonify({"valid": False, "error": "كود خاطئ أو منتهي الصلاحية"}), 401

    unlock_door(result["apartment_id"])

    return jsonify({
        "valid": True,
        "booking_id": result["booking_id"],
        "guest_name": result["guest_name"],
        "apartment_id": result["apartment_id"],
        "valid_until": result["valid_until"],
    })
