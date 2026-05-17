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
        CREATE TABLE IF NOT EXISTS apartments (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            location    TEXT,
            status      TEXT DEFAULT 'vacant',
            hourly_rate REAL DEFAULT 50.0,
            daily_rate  REAL DEFAULT 300.0,
            wifi_name   TEXT,
            wifi_pass   TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            apartment_id  INTEGER NOT NULL REFERENCES apartments(id),
            guest_name    TEXT NOT NULL,
            guest_phone   TEXT NOT NULL,
            start_time    TEXT NOT NULL,
            end_time      TEXT NOT NULL,
            duration_hours REAL NOT NULL,
            status        TEXT DEFAULT 'active',
            total_amount  REAL NOT NULL,
            created_at    TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS access_codes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id  INTEGER NOT NULL REFERENCES bookings(id),
            code        TEXT NOT NULL UNIQUE,
            valid_from  TEXT NOT NULL,
            valid_until TEXT NOT NULL,
            is_used     INTEGER DEFAULT 0,
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS extensions (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id   INTEGER NOT NULL REFERENCES bookings(id),
            added_hours  REAL NOT NULL,
            amount_paid  REAL NOT NULL,
            extended_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS service_orders (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id   INTEGER NOT NULL REFERENCES bookings(id),
            service_type TEXT NOT NULL,
            amount       REAL NOT NULL,
            status       TEXT DEFAULT 'pending',
            ordered_at   TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS cleaning_requests (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            apartment_id INTEGER NOT NULL REFERENCES apartments(id),
            requested_at TEXT DEFAULT (datetime('now')),
            status       TEXT DEFAULT 'pending'
        );
    """)

    # شقة تجريبية إذا الجدول فارغ
    existing = c.execute("SELECT COUNT(*) FROM apartments").fetchone()[0]
    if existing == 0:
        c.execute("""
            INSERT INTO apartments (name, location, hourly_rate, daily_rate, wifi_name, wifi_pass)
            VALUES ('الشقة A', 'الرياض — حي النزهة', 75.0, 450.0, 'qlevl-A', '12345678')
        """)

    conn.commit()
    conn.close()


# ─── Apartments ───────────────────────────────────────────────────────────────

def get_apartment(apt_id: int):
    with get_conn() as conn:
        return dict(conn.execute(
            "SELECT * FROM apartments WHERE id=?", (apt_id,)
        ).fetchone() or {})


def set_apartment_status(apt_id: int, status: str):
    with get_conn() as conn:
        conn.execute(
            "UPDATE apartments SET status=? WHERE id=?", (status, apt_id)
        )


# ─── Bookings ─────────────────────────────────────────────────────────────────

def create_booking(apt_id: int, guest_name: str, guest_phone: str,
                   start_time: str, end_time: str,
                   duration_hours: float, total_amount: float) -> int:
    with get_conn() as conn:
        cur = conn.execute("""
            INSERT INTO bookings
              (apartment_id, guest_name, guest_phone, start_time, end_time,
               duration_hours, total_amount)
            VALUES (?,?,?,?,?,?,?)
        """, (apt_id, guest_name, guest_phone, start_time, end_time,
              duration_hours, total_amount))
        conn.execute(
            "UPDATE apartments SET status='occupied' WHERE id=?", (apt_id,)
        )
        return cur.lastrowid


def get_booking(booking_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM bookings WHERE id=?", (booking_id,)
        ).fetchone()
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
        conn.execute(
            "UPDATE bookings SET status='completed' WHERE id=?", (booking_id,)
        )
        conn.execute(
            "UPDATE apartments SET status='vacant' WHERE id=?",
            (row["apartment_id"],)
        )


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
            WHERE ac.code=?
              AND ac.valid_from <= ?
              AND ac.valid_until >= ?
              AND b.status='active'
        """, (code, now, now)).fetchone()
        return dict(row) if row else None


def get_code_by_booking(booking_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM access_codes WHERE booking_id=? ORDER BY id DESC LIMIT 1",
            (booking_id,)
        ).fetchone()
        return dict(row) if row else None


# ─── Service Orders ───────────────────────────────────────────────────────────

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

        services_today = conn.execute("""
            SELECT COALESCE(SUM(so.amount),0)
            FROM service_orders so
            JOIN bookings b ON b.id=so.booking_id
            WHERE b.apartment_id=? AND date(so.ordered_at)=?
        """, (apt_id, today)).fetchone()[0]

        return {
            "today": round(today_total + services_today, 2),
            "month": round(month_total, 2),
        }


# ─── Cleaning ─────────────────────────────────────────────────────────────────

def create_cleaning_request(apt_id: int) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO cleaning_requests (apartment_id) VALUES (?)", (apt_id,)
        )
        return cur.lastrowid
