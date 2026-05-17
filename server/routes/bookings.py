import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db import (
    create_booking, get_booking, get_active_booking,
    create_access_code, get_apartment
)
from whatsapp import send_booking_code
from smart import unlock_door, turn_on_lights, turn_on_ac

bp = Blueprint("bookings", __name__)


def _gen_code() -> str:
    return secrets.token_hex(3).upper()


def _parse_float(val, default=1.0) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


@bp.post("/api/book")
def book():
    data = request.get_json(force=True, silent=True) or {}

    apt_id = data.get("apartment_id", 1)
    guest_name = (data.get("guest_name") or "").strip()
    guest_phone = (data.get("guest_phone") or "").strip()
    duration_hours = _parse_float(data.get("duration_hours"), 1.0)

    if not guest_name or not guest_phone:
        return jsonify({"error": "guest_name و guest_phone مطلوبان"}), 400

    apt = get_apartment(apt_id)
    if not apt:
        return jsonify({"error": "الشقة غير موجودة"}), 404

    if not apt.get("is_active", 1):
        return jsonify({"error": "هذه الشقة موقوفة من قِبل الإدارة"}), 403

    if apt.get("status") == "occupied":
        active = get_active_booking(apt_id)
        if active:
            return jsonify({"error": "الشقة مشغولة حالياً"}), 409

    # حساب الوقت والسعر
    now = datetime.utcnow()
    end = now + timedelta(hours=duration_hours)
    start_str = now.strftime("%Y-%m-%d %H:%M:%S")
    end_str = end.strftime("%Y-%m-%d %H:%M:%S")
    total = round(duration_hours * float(apt.get("hourly_rate", 75)), 2)

    booking_id = create_booking(
        apt_id, guest_name, guest_phone,
        start_str, end_str, duration_hours, total
    )

    code = _gen_code()
    create_access_code(booking_id, code, start_str, end_str)

    # تفعيل الأجهزة
    unlock_door(apt_id)
    turn_on_lights(apt_id)
    turn_on_ac(apt_id)

    # إرسال كود عبر واتساب
    send_booking_code(
        guest_phone, guest_name, code,
        apt.get("name", "الشقة"),
        end.strftime("%I:%M %p")
    )

    return jsonify({
        "booking_id": booking_id,
        "code": code,
        "start_time": start_str,
        "end_time": end_str,
        "total_amount": total,
        "apartment": apt.get("name"),
    }), 201


@bp.get("/api/booking/<int:booking_id>")
def booking_detail(booking_id: int):
    booking = get_booking(booking_id)
    if not booking:
        return jsonify({"error": "الحجز غير موجود"}), 404

    end = datetime.strptime(booking["end_time"], "%Y-%m-%d %H:%M:%S")
    remaining = max(0, int((end - datetime.utcnow()).total_seconds()))

    return jsonify({**booking, "remaining_seconds": remaining})
