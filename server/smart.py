"""
التحكم بالأجهزة الذكية — stub للتطوير.
في الـ Raspberry Pi الحقيقي: يُستبدل بـ GPIO أو Tuya API.
"""
import logging

logger = logging.getLogger("qlevl.smart")


def unlock_door(apartment_id: int):
    logger.info(f"[Smart] UNLOCK door — apt {apartment_id}")


def lock_door(apartment_id: int):
    logger.info(f"[Smart] LOCK door — apt {apartment_id}")


def turn_on_lights(apartment_id: int):
    logger.info(f"[Smart] LIGHTS ON — apt {apartment_id}")


def turn_off_lights(apartment_id: int):
    logger.info(f"[Smart] LIGHTS OFF — apt {apartment_id}")


def turn_on_ac(apartment_id: int):
    logger.info(f"[Smart] AC ON — apt {apartment_id}")


def turn_off_ac(apartment_id: int):
    logger.info(f"[Smart] AC OFF — apt {apartment_id}")


def warning_lights(apartment_id: int):
    """إضاءة تحذيرية قبل انتهاء الوقت بـ 10 دقائق"""
    logger.info(f"[Smart] WARNING LIGHTS — apt {apartment_id}")


def activate_plug(device_id: str, duration_seconds: int):
    """تشغيل Smart Plug (فشار / قهوة) لمدة محددة"""
    logger.info(f"[Smart] PLUG ON — device {device_id} for {duration_seconds}s")


# خريطة الخدمات → smart plugs
SERVICE_DEVICES = {
    "popcorn": {"device_id": "tuya-plug-001", "duration": 180},
    "coffee":  {"device_id": "tuya-plug-002", "duration": 120},
}


def trigger_service(service_type: str) -> bool:
    device = SERVICE_DEVICES.get(service_type)
    if not device:
        return False
    activate_plug(device["device_id"], device["duration"])
    return True
