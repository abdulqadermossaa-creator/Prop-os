from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db import get_booking, get_apartment, extend_booking_end
from whatsapp import send_extension_confirmation

bp = Blueprint("extensions", __name__)


@bp.post("/api/extend")
def extend():
    data = request.get_json(force=True, silent=True) or {}
    booking_id = data.get("booking_id")
    added_hours = float(data.get("added_hours", 0.5))

    if not booking_id:
        return jsonify({"error": "booking_id مطلوب"}), 400

    booking = get_booking(booking_id)
    if not booking:
        return jsonify({"error": "الحجز غير موجود"}), 404

    if booking["status"] != "active":
        return jsonify({"error": "الحجز غير نشط"}), 409

    apt = get_apartment(booking["apartment_id"])
    amount = round(added_hours * float(apt.get("hourly_rate", 75)), 2)

    current_end = datetime.strptime(booking["end_time"], "%Y-%m-%d %H:%M:%S")
    new_end = current_end + timedelta(hours=added_hours)
    new_end_str = new_end.strftime("%Y-%m-%d %H:%M:%S")

    extend_booking_end(booking_id, new_end_str, added_hours, amount)

    send_extension_confirmation(
        booking["guest_phone"],
        booking["guest_name"],
        added_hours,
        new_end.strftime("%I:%M %p")
    )

    return jsonify({
        "booking_id": booking_id,
        "new_end_time": new_end_str,
        "added_hours": added_hours,
        "amount_paid": amount,
    })
