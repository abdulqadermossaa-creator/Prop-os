import os
import logging
import eventlet
eventlet.monkey_patch()

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

from db import init_db, get_active_booking, end_booking, get_apartment
from whatsapp import send_expiry_warning, send_silent_exit_alert
from smart import turn_off_ac, turn_off_lights, warning_lights
import os as _os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s — %(message)s",
)
logger = logging.getLogger("qlevl")

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret")

CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# ─── Routes ──────────────────────────────────────────────────────────────────
from routes.bookings import bp as bookings_bp
from routes.codes import bp as codes_bp
from routes.extensions import bp as extensions_bp
from routes.services import bp as services_bp
from routes.host import bp as host_bp

for bp in (bookings_bp, codes_bp, extensions_bp, services_bp, host_bp):
    app.register_blueprint(bp)


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok", "system": "qlevl Smart Apartment OS"}


# ─── Background — منطق الوقت والـ Silent Exit ─────────────────────────────────
WARNING_SENT = set()   # booking_ids أُرسل لها تحذير
HOST_PHONE = _os.getenv("HOST_PHONE", "")
# نفترض شقة واحدة في المرحلة الأولى
APARTMENT_ID = 1
PIR_LAST_MOTION = {}   # apt_id → timestamp آخر حركة


def background_monitor():
    from datetime import datetime, timedelta
    import time

    while True:
        eventlet.sleep(60)
        try:
            now = datetime.utcnow()
            booking = get_active_booking(APARTMENT_ID)

            if not booking:
                continue

            end = datetime.strptime(booking["end_time"], "%Y-%m-%d %H:%M:%S")
            remaining = (end - now).total_seconds()

            # تحذير 15 دقيقة قبل الانتهاء
            if 0 < remaining <= 900 and booking["id"] not in WARNING_SENT:
                WARNING_SENT.add(booking["id"])
                minutes_left = int(remaining // 60)
                apt = get_apartment(APARTMENT_ID)
                warning_lights(APARTMENT_ID)
                send_expiry_warning(
                    booking["guest_phone"],
                    booking["guest_name"],
                    minutes_left,
                    apt.get("name", "الشقة")
                )
                socketio.emit("expiry_warning", {
                    "booking_id": booking["id"],
                    "minutes_left": minutes_left,
                })
                logger.info(f"Expiry warning sent — booking {booking['id']}")

            # انتهى الوقت
            if remaining <= 0:
                turn_off_ac(APARTMENT_ID)
                turn_off_lights(APARTMENT_ID)
                end_booking(booking["id"])
                WARNING_SENT.discard(booking["id"])
                socketio.emit("booking_ended", {"booking_id": booking["id"]})
                logger.info(f"Booking {booking['id']} ended automatically")

        except Exception as exc:
            logger.error(f"Monitor error: {exc}")


@socketio.on("connect")
def on_connect():
    logger.info("Client connected via WebSocket")


@socketio.on("pir_motion")
def on_pir_motion(data):
    """الـ Pi يرسل هذا الحدث عند كشف حركة"""
    from datetime import datetime
    apt_id = data.get("apartment_id", APARTMENT_ID)
    PIR_LAST_MOTION[apt_id] = datetime.utcnow()


# ─── Entry ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    logger.info("Database initialized ✓")
    logger.info("Starting background monitor ✓")
    socketio.start_background_task(background_monitor)

    port = int(os.getenv("PORT", 5000))
    logger.info(f"qlevl server running on http://0.0.0.0:{port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=False)
