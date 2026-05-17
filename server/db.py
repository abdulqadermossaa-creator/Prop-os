import sqlite3
import os
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "qlevl.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.executescript("""
        -- المؤسس (واحد فقط)
        CREATE TABLE IF NOT EXISTS founder (
            id              INTEGER PRIMARY KEY DEFAULT 1,
            pin             TEXT DEFAULT '1234',
            platform_name   TEXT DEFAULT 'qlevl',
            default_commission REAL DEFAULT 20.0
        );

        -- الملاك
        CREATE TABLE IF NOT EXISTS owners (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL,
            phone           TEXT NOT NULL,
            pin             TEXT DEFAULT '0000',
            commission_rate REAL DEFAULT 20.0,
            is_active       INTEGER DEFAULT 1,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        -- الشقق
        CREATE TABLE IF NOT EXISTS apartments (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id    INTEGER REFERENCES owners(id),
            name        TEXT NOT NULL,
            location    TEXT,
            status      TEXT DEFAULT 'vacant',
            is_active   INTEGER DEFAULT 1,
            hourly_rate REAL DEFAULT 75.0,
            daily_rate  REAL DEFAULT 450.0,
            wifi_name   TEXT,
            wifi_pass   TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        );

        -- الحجوزات
        CREATE TABLE IF NOT EXISTS bookings (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            apartment_id    INTEGER NOT NULL REFERENCES apartments(id),
            guest_name      TEXT NOT NULL,
            guest_phone     TEXT NOT NULL,
            start_time      TEXT NOT NULL,
            end_time        TEXT NOT NULL,
            duration_hours  REAL NOT NULL,
            status          TEXT DEFAULT 'active',
            total_amount    REAL NOT NULL,
            commission_rate REAL NOT NULL,
            commission_amt  REAL NOT NULL,
            cleaning_fee    REAL DEFAULT 0,
            owner_net       REAL NOT NULL,
            created_at      TEXT DEFAULT (datetime('now'))
        );

        -- أكواد الدخول
        CREATE TABLE IF NOT EXISTS access_codes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id  INTEGER NOT NULL REFERENCES bookings(id),
            code        TEXT NOT NULL UNIQUE,
            valid_from  TEXT NOT NULL,
            valid_until TEXT NOT NULL,
            is_used     INTEGER DEFAULT 0,
            created_at  TEXT DEFAULT (datetime('now'))
        );

        -- التمديدات
        CREATE TABLE IF NOT EXISTS extensions (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id   INTEGER NOT NULL REFERENCES bookings(id),
            added_hours  REAL NOT NULL,
            amount_paid  REAL NOT NULL,
            extended_at  TEXT DEFAULT (datetime('now'))
        );

        -- الخدمات الإضافية
        CREATE TABLE IF NOT EXISTS service_orders (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id   INTEGER NOT NULL REFERENCES bookings(id),
            service_type TEXT NOT NULL,
            amount       REAL NOT NULL,
            status       TEXT DEFAULT 'pending',
            ordered_at   TEXT DEFAULT (datetime('now'))
        );

        -- طلبات التنظيف
        CREATE TABLE IF NOT EXISTS cleaning_requests (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            apartment_id INTEGER NOT NULL REFERENCES apartments(id),
            requested_at TEXT DEFAULT (datetime('now')),
            status       TEXT DEFAULT 'pending'
        );
    """)

    # بيانات أولية
    if not c.execute("SELECT 1 FROM founder").fetchone():
        c.execute("INSERT INTO founder (id) VALUES (1)")

    if not c.execute("SELECT 1 FROM owners").fetchone():
        c.execute("""
            INSERT INTO owners (name, phone, commission_rate, pin)
            VALUES ('المالك التجريبي', '966500000001', 20.0, '1111')
        """)

    if not c.execute("SELECT 1 FROM apartments").fetchone():
        c.execute("""
            INSERT INTO apartments (owner_id, name, location, hourly_rate, daily_rate, wifi_name, wifi_pass)
            VALUES (1, 'الشقة A', 'الرياض — حي النزهة', 75.0, 450.0, 'qlevl-A', '12345678')
        """)

    conn.commit()
    conn.close()


# ─── Founder ──────────────────────────────────────────────────────────────────

def get_founder():
    with get_conn() as conn:
        return dict(conn.execute("SELECT * FROM founder WHERE id=1").fetchone())

def verify_founder_pin(pin: str) -> bool:
    f = get_founder()
    return f.get("pin") == pin

def get_all_owners():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM owners ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

def get_founder_stats():
    with get_conn() as conn:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        month = datetime.utcnow().strftime("%Y-%m")
        total_commission = conn.execute(
            "SELECT COALESCE(SUM(commission_amt),0) FROM bookings WHERE status!='cancelled'"
        ).fetchone()[0]
        today_commission = conn.execute(
            "SELECT COALESCE(SUM(commission_amt),0) FROM bookings WHERE date(created_at)=?", (today,)
        ).fetchone()[0]
        month_commission = conn.execute(
            "SELECT COALESCE(SUM(commission_amt),0) FROM bookings WHERE strftime('%Y-%m',created_at)=?", (month,)
        ).fetchone()[0]
        total_bookings = conn.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
        active_apts = conn.execute("SELECT COUNT(*) FROM apartments WHERE is_active=1").fetchone()[0]
        suspended_apts = conn.execute("SELECT COUNT(*) FROM apartments WHERE is_active=0").fetchone()[0]
        return {
            "total_commission": round(total_commission, 2),
            "today_commission": round(today_commission, 2),
            "month_commission": round(month_commission, 2),
            "total_bookings": total_bookings,
            "active_apartments": active_apts,
            "suspended_apartments": suspended_apts,
        }

# ─── Kill Switch ──────────────────────────────────────────────────────────────

def toggle_apartment(apt_id: int, active: bool):
    with get_conn() as conn:
        conn.execute(
            "UPDATE apartments SET is_active=? WHERE id=?", (1 if active else 0, apt_id)
        )

def toggle_owner(owner_id: int, active: bool):
    """يفعّل أو يوقف المالك وكل شققه"""
    with get_conn() as conn:
        conn.execute(
            "UPDATE owners SET is_active=? WHERE id=?", (1 if active else 0, owner_id)
        )
        conn.execute(
            "UPDATE apartments SET is_active=? WHERE owner_id=?", (1 if active else 0, owner_id)
        )

def set_owner_commission(owner_id: int, rate: float):
    with get_conn() as conn:
        conn.execute(
            "UPDATE owners SET commission_rate=? WHERE id=?", (rate, owner_id)
        )

# ─── Owners ───────────────────────────────────────────────────────────────────

def get_owner(owner_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM owners WHERE id=?", (owner_id,)).fetchone()
        return dict(row) if row else None

def verify_owner_pin(owner_id: int, pin: str) -> bool:
    owner = get_owner(owner_id)
    return owner and owner.get("pin") == pin

def create_owner(name: str, phone: str, commission_rate: float, pin: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO owners (name, phone, commission_rate, pin) VALUES (?,?,?,?)",
            (name, phone, commission_rate, pin)
        )
        return cur.lastrowid

def get_owner_apartments(owner_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM apartments WHERE owner_id=?", (owner_id,)
        ).fetchall()
        return [dict(r) for r in rows]

def get_owner_stats(owner_id: int) -> dict:
    with get_conn() as conn:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        month = datetime.utcnow().strftime("%Y-%m")
        today_net = conn.execute("""
            SELECT COALESCE(SUM(b.owner_net),0) FROM bookings b
            JOIN apartments a ON a.id=b.apartment_id
            WHERE a.owner_id=? AND date(b.created_at)=?
        """, (owner_id, today)).fetchone()[0]
        month_net = conn.execute("""
            SELECT COALESCE(SUM(b.owner_net),0) FROM bookings b
            JOIN apartments a ON a.id=b.apartment_id
            WHERE a.owner_id=? AND strftime('%Y-%m',b.created_at)=?
        """, (owner_id, month)).fetchone()[0]
        total_bookings = conn.execute("""
            SELECT COUNT(*) FROM bookings b
            JOIN apartments a ON a.id=b.apartment_id
            WHERE a.owner_id=?
        """, (owner_id,)).fetchone()[0]
        return {
            "today_net": round(today_net, 2),
            "month_net": round(month_net, 2),
            "total_bookings": total_bookings,
        }

# ─── Apartments ───────────────────────────────────────────────────────────────

def get_apartment(apt_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT a.*, o.commission_rate, o.name as owner_name FROM apartments a "
            "LEFT JOIN owners o ON o.id=a.owner_id WHERE a.id=?", (apt_id,)
        ).fetchone()
        return dict(row) if row else {}

def create_apartment(owner_id: int, name: str, location: str,
                     hourly_rate: float, daily_rate: float,
                     wifi_name: str, wifi_pass: str) -> int:
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO apartments (owner_id, name, location, hourly_rate, daily_rate, wifi_name, wifi_pass)
            VALUES (?,?,?,?,?,?,?)
        """, (owner_id, name, location, hourly_rate, daily_rate, wifi_name, wifi_pass))
        return cur.lastrowid

def get_all_apartments():
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT a.*, o.name as owner_name, o.is_active as owner_active
            FROM apartments a LEFT JOIN owners o ON o.id=a.owner_id
            ORDER BY a.created_at DESC
        """).fetchall()
        return [dict(r) for r in rows]

# ─── Bookings ─────────────────────────────────────────────────────────────────

def create_booking(apt_id: int, guest_name: str, guest_phone: str,
                   start_time: str, end_time: str,
                   duration_hours: float, total_amount: float,
                   cleaning_fee: float = 0) -> int:
    apt = get_apartment(apt_id)
    commission_rate = float(apt.get("commission_rate") or 20.0)
    commission_amt = round(total_amount * commission_rate / 100, 2)
    owner_net = round(total_amount - commission_amt - cleaning_fee, 2)

    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO bookings
              (apartment_id, guest_name, guest_phone, start_time, end_time,
               duration_hours, total_amount, commission_rate, commission_amt,
               cleaning_fee, owner_net)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (apt_id, guest_name, guest_phone, start_time, end_time,
              duration_hours, total_amount, commission_rate,
              commission_amt, cleaning_fee, owner_net))
        conn.execute("UPDATE apartments SET status='occupied' WHERE id=?", (apt_id,))
        return cur.lastrowid

def get_booking(booking_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()
        return dict(row) if row else None

def get_active_booking(apt_id: int):
    with get_conn() as conn:
        row = conn.execute("""
            SELECT * FROM bookings
            WHERE apartment_id=? AND status='active'
            ORDER BY created_at DESC LIMIT 1
        """, (apt_id,)).fetchone()
        return dict(row) if row else None

def end_booking(booking_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT apartment_id FROM bookings WHERE id=?", (booking_id,)
        ).fetchone()
        if not row:
            return
        conn.execute("UPDATE bookings SET status='completed' WHERE id=?", (booking_id,))
        conn.execute("UPDATE apartments SET status='vacant' WHERE id=?", (row["apartment_id"],))

def extend_booking_end(booking_id: int, new_end_time: str,
                       added_hours: float, amount_paid: float):
    with get_conn() as conn:
        conn.execute(
            "UPDATE bookings SET end_time=?, duration_hours=duration_hours+? WHERE id=?",
            (new_end_time, added_hours, booking_id)
        )
        conn.execute(
            "UPDATE access_codes SET valid_until=? WHERE booking_id=?",
            (new_end_time, booking_id)
        )
        conn.execute("""
            INSERT INTO extensions (booking_id, added_hours, amount_paid)
            VALUES (?,?,?)
        """, (booking_id, added_hours, amount_paid))

# ─── Access Codes ─────────────────────────────────────────────────────────────

def create_access_code(booking_id: int, code: str,
                       valid_from: str, valid_until: str) -> int:
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO access_codes (booking_id, code, valid_from, valid_until)
            VALUES (?,?,?,?)
        """, (booking_id, code, valid_from, valid_until))
        return cur.lastrowid

def validate_code(code: str) -> dict:
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    with get_conn() as conn:
        row = conn.execute("""
            SELECT ac.*, b.guest_name, b.apartment_id
            FROM access_codes ac
            JOIN bookings b ON b.id = ac.booking_id
            JOIN apartments a ON a.id = b.apartment_id
            WHERE ac.code=?
              AND ac.valid_from <= ?
              AND ac.valid_until >= ?
              AND b.status='active'
              AND a.is_active=1
        """, (code, now, now)).fetchone()
        return dict(row) if row else None

def get_code_by_booking(booking_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM access_codes WHERE booking_id=? ORDER BY id DESC LIMIT 1",
            (booking_id,)
        ).fetchone()
        return dict(row) if row else None

# ─── Services ─────────────────────────────────────────────────────────────────

def create_service_order(booking_id: int, service_type: str, amount: float) -> int:
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO service_orders (booking_id, service_type, amount)
            VALUES (?,?,?)
        """, (booking_id, service_type, amount))
        return cur.lastrowid

# ─── Income ───────────────────────────────────────────────────────────────────

def get_income(apt_id: int) -> dict:
    with get_conn() as conn:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        month = datetime.utcnow().strftime("%Y-%m")
        today_total = conn.execute("""
            SELECT COALESCE(SUM(total_amount),0) FROM bookings
            WHERE apartment_id=? AND date(created_at)=?
        """, (apt_id, today)).fetchone()[0]
        month_total = conn.execute("""
            SELECT COALESCE(SUM(total_amount),0) FROM bookings
            WHERE apartment_id=? AND strftime('%Y-%m',created_at)=?
        """, (apt_id, month)).fetchone()[0]
        return {"today": round(today_total, 2), "month": round(month_total, 2)}

# ─── Cleaning ─────────────────────────────────────────────────────────────────

def create_cleaning_request(apt_id: int) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO cleaning_requests (apartment_id) VALUES (?)", (apt_id,)
        )
        return cur.lastrowid
