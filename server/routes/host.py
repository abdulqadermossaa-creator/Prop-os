import secrets
from datetime import datetime
from flask import Blueprint, request, jsonify
from db import (
    get_apartment, get_active_booking, get_income,
    create_access_code, create_cleaning_request,
    get_code_by_booking, end_booking
)
from whatsapp import send_booking_code, send_cleaning_request, send_silent_exit_alert
import os

bp = Blueprint("host", __name__)
HOST_PHONE = os.getenv("HOST_PHONE", "")


@bp.get("/api/host/status")
def host_status():
    apt_id = int(request.args.get("apartment_id", 1))
    apt = get_apartment(apt_id)
    if not apt:
        return jsonify({"error": "الشقة غير موجودة"}), 404

    booking = get_active_booking(apt_id)
    remaining = 0
    if booking:
        end = datetime.strptime(booking["end_time"], "%Y-%m-%d %H:%M:%S")
        remaining = max(0, int((end - datetime.utcnow()).total_seconds()))

    return jsonify({
        "apartment": apt,
        "status": apt.get("status", "vacant"),
        "booking": booking,
        "remaining_seconds": remaining,
    })


@bp.get("/api/host/income")
def host_income():
    apt_id = int(request.args.get("apartment_id", 1))
    return jsonify(get_income(apt_id))


@bp.post("/api/host/code")
def host_generate_code():
    data = request.get_json(force=True, silent=True) or {}
    booking_id = data.get("booking_id")
    if not booking_id:
        return jsonify({"error": "booking_id مطلوب"}), 400

    from db import get_booking
    booking = get_booking(booking_id)
    if not booking:
        return jsonify({"error": "الحجز غير موجود"}), 404

    code = secrets.token_hex(3).upper()
    create_access_code(
        booking_id, code,
        booking["start_time"], booking["end_time"]
    )

    apt = get_apartment(booking["apartment_id"])
    end_dt = datetime.strptime(booking["end_time"], "%Y-%m-%d %H:%M:%S")
    send_booking_code(
        booking["guest_phone"], booking["guest_name"],
        code, apt.get("name", "الشقة"),
        end_dt.strftime("%I:%M %p")
    )

    return jsonify({"code": code, "sent_to": booking["guest_phone"]})


@bp.post("/api/host/cleaning")
def request_cleaning():
    data = request.get_json(force=True, silent=True) or {}
    apt_id = data.get("apartment_id", 1)
    apt = get_apartment(apt_id)
    req_id = create_cleaning_request(apt_id)
    if HOST_PHONE:
        send_cleaning_request(HOST_PHONE, apt.get("name", "الشقة"))
    return jsonify({"request_id": req_id, "status": "pending"})


@bp.post("/api/host/silent-exit")
def silent_exit():
    data = request.get_json(force=True, silent=True) or {}
    apt_id = data.get("apartment_id", 1)
    apt = get_apartment(apt_id)
    booking = get_active_booking(apt_id)

    guest_name = booking["guest_name"] if booking else "ضيف"
    if HOST_PHONE:
        send_silent_exit_alert(HOST_PHONE, apt.get("name", "الشقة"), guest_name)

    if booking:
        end_booking(booking["id"])

    return jsonify({"detected": True, "apartment_id": apt_id})


@bp.get("/api/tablet/<int:apt_id>")
def tablet_state(apt_id: int):
    apt = get_apartment(apt_id)
    if not apt:
        return jsonify({"error": "الشقة غير موجودة"}), 404

    booking = get_active_booking(apt_id)
    remaining = 0
    code_info = None

    if booking:
        end = datetime.strptime(booking["end_time"], "%Y-%m-%d %H:%M:%S")
        remaining = max(0, int((end - datetime.utcnow()).total_seconds()))
        code_info = get_code_by_booking(booking["id"])

    return jsonify({
        "apartment": {
            "name": apt.get("name"),
            "wifi_name": apt.get("wifi_name"),
            "wifi_pass": apt.get("wifi_pass"),
            "hourly_rate": apt.get("hourly_rate"),
        },
        "booking": booking,
        "remaining_seconds": remaining,
        "code": code_info["code"] if code_info else None,
    })
