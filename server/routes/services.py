from flask import Blueprint, request, jsonify
from db import get_booking, create_service_order
from smart import trigger_service

bp = Blueprint("services", __name__)

SERVICE_PRICES = {
    "popcorn": 25.0,
    "coffee":  20.0,
}


@bp.post("/api/service/order")
def order_service():
    data = request.get_json(force=True, silent=True) or {}
    booking_id = data.get("booking_id")
    service_type = (data.get("service_type") or "").strip().lower()

    if not booking_id or not service_type:
        return jsonify({"error": "booking_id و service_type مطلوبان"}), 400

    if service_type not in SERVICE_PRICES:
        return jsonify({"error": f"الخدمة '{service_type}' غير متاحة"}), 400

    booking = get_booking(booking_id)
    if not booking or booking["status"] != "active":
        return jsonify({"error": "حجز غير نشط"}), 404

    amount = SERVICE_PRICES[service_type]
    order_id = create_service_order(booking_id, service_type, amount)
    trigger_service(service_type)

    return jsonify({
        "order_id": order_id,
        "service_type": service_type,
        "amount": amount,
        "status": "processing",
    }), 201
