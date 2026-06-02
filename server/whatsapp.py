import os
import logging
import requests
from requests.auth import HTTPBasicAuth

logger = logging.getLogger("qlevl.whatsapp")

# ── Meta Cloud API ──────────────────────────────────────────────────────────
META_TOKEN    = os.getenv("WHATSAPP_TOKEN", "")
META_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "")
API_VERSION   = os.getenv("WHATSAPP_API_VERSION", "v19.0")

# ── Twilio WhatsApp ─────────────────────────────────────────────────────────
TWILIO_SID   = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM  = os.getenv("TWILIO_WHATSAPP_FROM", "")

# ── تحديد الـ provider تلقائياً ─────────────────────────────────────────────
if TWILIO_SID and TWILIO_TOKEN and TWILIO_FROM:
    _PROVIDER = "twilio"
elif META_TOKEN and META_PHONE_ID:
    _PROVIDER = "meta"
else:
    _PROVIDER = "dev"

logger.info(f"WhatsApp provider: {_PROVIDER.upper()}")


def _send_via_twilio(to: str, message: str) -> bool:
    """إرسال رسالة عبر Twilio WhatsApp API."""
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json"
    # Twilio يتطلب أن يكون الرقم بصيغة whatsapp:+XXXXXXXXX
    to_formatted   = f"whatsapp:+{to.lstrip('+')}"
    from_formatted = f"whatsapp:+{TWILIO_FROM.lstrip('+')}"
    try:
        resp = requests.post(
            url,
            auth=HTTPBasicAuth(TWILIO_SID, TWILIO_TOKEN),
            data={"From": from_formatted, "To": to_formatted, "Body": message},
            timeout=10,
        )
        resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error(f"Twilio WhatsApp send failed: {exc}")
        return False


def _send_via_meta(to: str, message: str) -> bool:
    """إرسال رسالة عبر Meta WhatsApp Cloud API."""
    url = f"https://graph.facebook.com/{API_VERSION}/{META_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message},
    }
    headers = {
        "Authorization": f"Bearer {META_TOKEN}",
        "Content-Type": "application/json",
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error(f"Meta WhatsApp send failed: {exc}")
        return False


def _send(to: str, message: str) -> bool:
    """نقطة الدخول الموحدة — تختار الـ provider تلقائياً."""
    if _PROVIDER == "twilio":
        return _send_via_twilio(to, message)
    if _PROVIDER == "meta":
        return _send_via_meta(to, message)
    # DEV MODE
    logger.info(f"[WhatsApp DEV] → {to}: {message}")
    return True


# ── الدوال العامة (interface ثابت) ──────────────────────────────────────────

def send_booking_code(guest_phone: str, guest_name: str,
                      code: str, apt_name: str, end_time: str):
    msg = (
        f"مرحباً {guest_name} 👋\n\n"
        f"تم تأكيد حجزك في *{apt_name}*\n\n"
        f"🔐 كود الدخول: *{code}*\n"
        f"⏰ صالح حتى: {end_time}\n\n"
        f"استمتع بإقامتك! 🏠"
    )
    return _send(guest_phone, msg)


def send_expiry_warning(guest_phone: str, guest_name: str,
                        minutes_left: int, apt_name: str):
    msg = (
        f"تنبيه ⏰ — {guest_name}\n\n"
        f"باقي *{minutes_left} دقيقة* على انتهاء وقتك في {apt_name}.\n\n"
        f"تبي تمدد؟ اضغط زر التمديد على الشاشة أو رد على هذه الرسالة."
    )
    return _send(guest_phone, msg)


def send_extension_confirmation(guest_phone: str, guest_name: str,
                                added_hours: float, new_end: str):
    h = int(added_hours * 60)
    msg = (
        f"تم التمديد ✅ — {guest_name}\n\n"
        f"أضفنا *{h} دقيقة* لحجزك.\n"
        f"⏰ وقت الخروج الجديد: {new_end}"
    )
    return _send(guest_phone, msg)


def send_silent_exit_alert(host_phone: str, apt_name: str, guest_name: str):
    msg = (
        f"🚪 خروج صامت — {apt_name}\n\n"
        f"يبدو أن الضيف *{guest_name}* غادر الشقة.\n"
        f"لا توجد حركة منذ أكثر من 10 دقائق.\n\n"
        f"هل تريد إرسال طلب تنظيف؟"
    )
    return _send(host_phone, msg)


def send_cleaning_request(host_phone: str, apt_name: str):
    msg = (
        f"🧹 طلب تنظيف — {apt_name}\n\n"
        f"تم إرسال طلب تنظيف للشقة. يرجى الترتيب في أقرب وقت."
    )
    return _send(host_phone, msg)
