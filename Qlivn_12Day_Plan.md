# 🚀 خطة تنفيذ Qlivn OS — 12 يوم قبل الراسبيري

## 📅 الأسبوع الأول (يوم 1-7) — بناء العمود الفقري

### اليوم 1-2: إعداد Supabase (قاعدة البيانات)

**المطلوب من Claude Code:**
```bash
# إنشاء جداول قاعدة البيانات
- units (الوحدات)
  • id, name, image_url, location
  • current_guest_name, checkout_time
  • access_code, wifi_password
  • monthly_income, gathern_income, airbnb_income

- bookings (الحجوزات)
  • id, unit_id, guest_name, guest_phone
  • checkin, checkout, price, source (gathern/airbnb/direct)
  • status (active/completed/cancelled)

- activity_logs (سجل الأنشطة)
  • id, unit_id, event_type (nfc/heartbeat/silent_exit/code_change)
  • timestamp, details

- access_codes (أكواد الدخول)
  • id, unit_id, code, expires_at, active

- sensors_data (بيانات الحساسات)
  • id, unit_id, motion_detected, last_heartbeat
  • door_opened, timestamp
```

**SQL جاهز للتنفيذ** ← Claude Code يكتبه ويرفعه

---

### اليوم 3-4: تحويل الواجهات لـ React PWA

**المطلوب:**
```bash
# حول الملفات HTML الثابتة لـ
1. Next.js App (أو React + Vite)
2. PWA support (يتثبت على الجوال)
3. Supabase integration (بيانات حية)
4. Dark/Light mode (موجود بالفعل)
5. Real-time updates (Socket)
```

**الواجهات:**
- `/host` → لوحة المضيف (للمضيف.txt)
- `/guest/:unit_id` → بوابة الضيف
- `/founder` → لوحة المؤسس (Fonder.txt)
- `/tablet/:unit_id` → تابلت الغرفة (pods-dashboard_2.html)

---

### اليوم 5-6: Edge Functions (المنطق الذكي)

**السيناريوهات المطلوبة:**

```javascript
// 1. سيناريو الترحيب الشخصي
function onCheckIn(guest_name, unit_id) {
  // تفعيل الإضاءة من 0% → 100% (Fade)
  // عرض رسالة ترحيب على التابلت
  // تشغيل نداء صوتي: "أهلاً بك يا {guest_name}"
}

// 2. العد التنازلي الذكي
function countdownLogic(unit_id, checkout_time) {
  const remaining = checkout_time - now();
  
  if (remaining == 2_hours) {
    // خلفية برتقالية
    // زر التمديد يومض
    // صوت: "يمكنك تمديد إقامتك الآن"
  }
  
  if (remaining == 1_hour) {
    // خلفية حمراء
    // إضاءة → 50%
    // toast: "باقي ساعة واحدة"
  }
  
  if (remaining == 20_minutes) {
    // مكيف → Fan Mode
    // إضاءة → 100%
    // عرض مؤقت بالثواني
  }
}

// 3. Silent Exit Detection
function checkSilentExit(unit_id, booking_duration) {
  const threshold = booking_duration == 1_day ? 3_hours : 8_hours;
  const last_motion = getLastMotion(unit_id);
  const door_opened = isDoorOpened(unit_id);
  
  if (!last_motion && door_opened && elapsed > threshold) {
    sendWhatsApp(owner, "رصدنا حالة خروج صامت (شقة {unit_id})");
    changeStatus(unit_id, "ready_for_cleaning");
  }
}

// 4. زر الدعم الفني
function requestSupport(unit_id, issue_type) {
  sendWhatsApp(owner, "نزيل شقة {unit_id} يطلب: {issue_type}");
  showToast(tablet, "تم إرسال طلبك، سيتواصل معك فريقنا فوراً");
}

// 5. توفير الطاقة
function ecoMode(unit_id) {
  if (no_motion_for(2_hours)) {
    turnOff(lights, ac, tv);
  }
}
```

---

### اليوم 7: ربط iCal (Airbnb + Gathern)

**المطلوب:**
```python
# سكريبت يشتغل كل 15 دقيقة
import ical_parser

def sync_calendars():
    airbnb_url = "https://airbnb.com/calendar/ical/..."
    gathern_url = "https://gathern.sa/calendar/ical/..."
    
    bookings_airbnb = parse_ical(airbnb_url)
    bookings_gathern = parse_ical(gathern_url)
    
    # حفظ في Supabase
    for booking in (bookings_airbnb + bookings_gathern):
        upsert_booking(booking)
```

---

## 📅 الأسبوع الثاني (يوم 8-12) — الاستعداد للراسبيري

### اليوم 8-9: WhatsApp Integration

**الخيارات:**
1. **Twilio API** (مدفوع، موثوق) ← الأفضل
2. **WhatsApp Business API** (رسمي)
3. **واتساب شخصي + Automation** (غير رسمي)

```javascript
// إرسال واتساب تلقائي
async function sendWhatsApp(phone, message) {
  await twilio.messages.create({
    from: 'whatsapp:+14155238886',
    to: `whatsapp:${phone}`,
    body: message
  });
}
```

---

### اليوم 10: Web Speech API (الترحيب الصوتي)

```javascript
// تشغيل نداء صوتي على التابلت
function playWelcomeMessage(guest_name) {
  const utterance = new SpeechSynthesisUtterance(
    `أهلاً بك يا ${guest_name} في Qlivn، نتمنى لك إقامة سعيدة`
  );
  utterance.lang = 'ar-SA';
  speechSynthesis.speak(utterance);
}
```

---

### اليوم 11-12: تحضير كود الراسبيري (جاهز للتثبيت)

```python
# qlivn_controller.py
import RPi.GPIO as GPIO
import paho.mqtt.client as mqtt
import supabase

# الاتصال بـ Supabase
db = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# الاتصال بـ MQTT (للتحكم المباشر)
client = mqtt.Client()
client.connect("mqtt.supabase.co", 1883, 60)

# استقبال أكواد جديدة
def on_message(client, userdata, msg):
    code = msg.payload.decode()
    print(f"New code received: {code}")
    # أرسل الكود للقفل الذكي عبر GPIO
    send_to_lock(code)

# حساس الحركة
GPIO.setup(MOTION_PIN, GPIO.IN)

def check_motion():
    if GPIO.input(MOTION_PIN):
        db.table('sensors_data').insert({
            'unit_id': UNIT_ID,
            'motion_detected': True,
            'timestamp': now()
        }).execute()

# Loop رئيسي
while True:
    check_motion()
    time.sleep(1)
```

---

## 🎁 أفكار إضافية (ميزات تنافسية)

### 1. **لوحة Analytics للمستثمر**
```javascript
// داشبورد للمالك يعرض:
- ROI شهري لكل وحدة
- نسبة الإشغال (Occupancy Rate)
- متوسط مدة الإقامة
- أعلى الوحدات دخلاً
- مقارنة: Gathern vs Airbnb vs Direct
```

### 2. **نظام التقييم التلقائي**
```javascript
// بعد checkout، إرسال رسالة للضيف:
"شكراً لإقامتك في Qlivn! قيّم تجربتك من 5 ⭐"
// الردود تُحفظ في قاعدة البيانات لكل وحدة
```

### 3. **Smart Pricing (تسعير ديناميكي)**
```javascript
// بناءً على:
- معدل الإشغال الحالي
- الموسم (رمضان، إجازات، مناسبات)
- الطلب على المنطقة
→ اقتراح سعر تلقائي للمضيف
```

### 4. **جدولة التنظيف التلقائية**
```javascript
// عند Silent Exit:
1. إرسال واتساب للمالك
2. إرسال واتساب لعامل النظافة تلقائياً
3. تحديث حالة الوحدة: "Under Cleaning"
4. بعد تأكيد عامل النظافة → "Ready"
```

### 5. **QR Code للضيف**
```javascript
// بدل إرسال كود رقمي فقط:
- توليد QR code فريد لكل ضيف
- الضيف يمسح الكود على باب الشقة
- القفل الذكي يفتح تلقائياً
- أكثر أماناً + تجربة futuristic
```

---

## 🔧 التعديلات المطلوبة على الواجهات الحالية

### تعديل 1: إضافة Real-time Updates
```javascript
// في كل واجهة، إضافة:
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

supabase
  .channel('units')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'units' },
    (payload) => {
      updateUI(payload.new); // تحديث الواجهة فوراً
    }
  )
  .subscribe();
```

### تعديل 2: زر الدعم الفني (في التابلت)
```html
<!-- إضافة في pods-dashboard_2.html -->
<button class="support-btn" onclick="requestSupport()">
  💬 تواصل معنا
</button>

<script>
function requestSupport() {
  const issue = prompt("كيف يمكننا مساعدتك؟");
  fetch('/api/support', {
    method: 'POST',
    body: JSON.stringify({ unit_id, issue })
  });
  alert("تم إرسال طلبك!");
}
</script>
```

### تعديل 3: العد التنازلي الحي
```javascript
// في التابلت
function startCountdown(checkout_time) {
  setInterval(() => {
    const remaining = checkout_time - Date.now();
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    
    document.getElementById('timer').innerText = 
      `⏱️ ${hours}س ${mins}د`;
    
    // تطبيق السيناريوهات
    if (hours == 2) applyWarningMode();
    if (hours == 1) applyDangerMode();
    if (mins == 20 && hours == 0) applyEvictionMode();
  }, 1000);
}
```

---

## 📊 معمارية النظام النهائية

```
┌─────────────┐
│   الضيف     │──► QR Code / Link ──► Guest Portal (React PWA)
└─────────────┘                            │
                                           ▼
┌─────────────┐                    ┌──────────────┐
│   المضيف    │──► Dashboard ───►  │   Supabase   │
└─────────────┘                    │   (Backend)  │
                                   └──────────────┘
┌─────────────┐                            │
│   المؤسس    │──► Analytics ──────────────┘
└─────────────┘                            │
                                           ▼
┌─────────────┐                    ┌──────────────┐
│   التابلت   │◄──── MQTT ─────────│ Raspberry Pi │
└─────────────┘                    └──────────────┘
                                           │
                                    ┌──────┴──────┐
                                    │   الأجهزة   │
                                    ├─────────────┤
                                    │ - قفل ذكي   │
                                    │ - حساس حركة │
                                    │ - مكيف ذكي  │
                                    └─────────────┘
```

---

## ✅ Checklist قبل اليوم 12

- [ ] Supabase جاهز + جداول مكتملة
- [ ] الواجهات محولة لـ React PWA
- [ ] Edge Functions منشورة
- [ ] iCal sync يشتغل
- [ ] WhatsApp integration جاهز
- [ ] كود الراسبيري جاهز للتثبيت
- [ ] التطبيق deployed على Netlify/Vercel
- [ ] اختبار كامل للسيناريوهات

---

## 🎯 النتيجة المتوقعة في اليوم 12

✅ **تطبيق ويب كامل يشتغل**  
✅ **المضيف يقدر يدير الوحدات من جواله**  
✅ **الضيف يستقبل QR ويفتح البوابة**  
✅ **كود الراسبيري جاهز للتثبيت فور الوصول**  
✅ **كل السيناريوهات مبرمجة ومختبرة**

---

**جاهز للبدء؟** 🚀  
قول لي من وين نبدأ وأنا معك خطوة بخطوة.
