// ==========================================
// إضافة في لوحة المؤسس (founder dashboard)
// ==========================================

// صفحة: /founder/clients/add

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddClient() {
  const [formData, setFormData] = useState({
    // معلومات المضيف
    host_name: '',
    host_phone: '',
    host_email: '',
    subscription_plan: 'basic', // basic, premium, enterprise
    
    // معلومات الوحدة
    unit_name: '',
    unit_location: '',
    unit_image_url: '',
    
    // معلومات الربط
    airbnb_ical_url: '',
    gathern_ical_url: '',
    
    // معلومات الدفع
    monthly_fee: 100, // ر.س
    setup_fee: 500, // تركيب لمرة واحدة
  });

  async function handleSubmit(e) {
    e.preventDefault();
    
    // 1. إنشاء حساب المضيف
    const { data: host, error: hostError } = await supabase
      .from('hosts')
      .insert({
        name: formData.host_name,
        phone: formData.host_phone,
        email: formData.host_email,
        subscription_plan: formData.subscription_plan,
        monthly_fee: formData.monthly_fee,
        status: 'active',
        joined_date: new Date(),
      })
      .select()
      .single();

    if (hostError) {
      alert('خطأ في إنشاء الحساب: ' + hostError.message);
      return;
    }

    // 2. إنشاء الوحدة
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .insert({
        host_id: host.id,
        name: formData.unit_name,
        location: formData.unit_location,
        image_url: formData.unit_image_url,
        access_code: generateRandomCode(), // 4 أرقام عشوائية
        wifi_password: '', // يضيفها المضيف لاحقاً
        status: 'ready',
      })
      .select()
      .single();

    if (unitError) {
      alert('خطأ في إنشاء الوحدة: ' + unitError.message);
      return;
    }

    // 3. حفظ روابط iCal
    if (formData.airbnb_ical_url || formData.gathern_ical_url) {
      await supabase.from('ical_sources').insert({
        unit_id: unit.id,
        airbnb_url: formData.airbnb_ical_url,
        gathern_url: formData.gathern_ical_url,
      });
    }

    // 4. إرسال واتساب للمضيف
    await fetch('/api/send-welcome-whatsapp', {
      method: 'POST',
      body: JSON.stringify({
        phone: formData.host_phone,
        host_name: formData.host_name,
        unit_name: formData.unit_name,
        login_url: `https://qlivn.app/host/login?id=${host.id}`,
      }),
    });

    // 5. تحديث عدد العملاء في لوحتك
    alert('✅ تم إضافة العميل بنجاح!');
    window.location.href = '/founder/clients';
  }

  function generateRandomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">➕ إضافة عميل جديد</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* قسم 1: معلومات المضيف */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">👤 معلومات المضيف</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">اسم المضيف</label>
              <input
                type="text"
                required
                value={formData.host_name}
                onChange={(e) => setFormData({...formData, host_name: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="أحمد السالم"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">رقم الجوال (واتساب)</label>
              <input
                type="tel"
                required
                value={formData.host_phone}
                onChange={(e) => setFormData({...formData, host_phone: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="+966501234567"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.host_email}
                onChange={(e) => setFormData({...formData, host_email: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="ahmed@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">باقة الاشتراك</label>
              <select
                value={formData.subscription_plan}
                onChange={(e) => setFormData({...formData, subscription_plan: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
              >
                <option value="basic">Basic - 100 ر.س/شهر</option>
                <option value="premium">Premium - 200 ر.س/شهر</option>
                <option value="enterprise">Enterprise - مخصص</option>
              </select>
            </div>
          </div>
        </div>

        {/* قسم 2: معلومات الوحدة */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">🏠 معلومات الوحدة الأولى</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">اسم الوحدة</label>
              <input
                type="text"
                required
                value={formData.unit_name}
                onChange={(e) => setFormData({...formData, unit_name: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="شقة الراكة"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">الموقع</label>
              <input
                type="text"
                value={formData.unit_location}
                onChange={(e) => setFormData({...formData, unit_location: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="الرياض، حي الملقا"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">رابط صورة الوحدة</label>
              <input
                type="url"
                value={formData.unit_image_url}
                onChange={(e) => setFormData({...formData, unit_image_url: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="https://..."
              />
              <p className="text-xs text-muted mt-1">يمكن إضافتها لاحقاً</p>
            </div>
          </div>
        </div>

        {/* قسم 3: ربط المنصات */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">🔗 ربط المنصات</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">رابط Airbnb iCal</label>
              <input
                type="url"
                value={formData.airbnb_ical_url}
                onChange={(e) => setFormData({...formData, airbnb_ical_url: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="https://airbnb.com/calendar/ical/..."
              />
              <p className="text-xs text-muted mt-1">اختياري - يمكن إضافته لاحقاً</p>
            </div>

            <div>
              <label className="block text-sm mb-2">رابط Gathern iCal</label>
              <input
                type="url"
                value={formData.gathern_ical_url}
                onChange={(e) => setFormData({...formData, gathern_ical_url: e.target.value})}
                className="w-full p-3 rounded-xl bg-background border border-border"
                placeholder="https://gathern.sa/calendar/ical/..."
              />
              <p className="text-xs text-muted mt-1">اختياري - يمكن إضافته لاحقاً</p>
            </div>
          </div>
        </div>

        {/* قسم 4: الدفع */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">💰 التسعير</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-xl">
              <span>رسوم التركيب (لمرة واحدة)</span>
              <span className="font-bold text-gold">{formData.setup_fee} ر.س</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-xl">
              <span>الاشتراك الشهري</span>
              <span className="font-bold text-accent">{formData.monthly_fee} ر.س</span>
            </div>
          </div>
        </div>

        {/* زر الإرسال */}
        <button
          type="submit"
          className="w-full py-4 bg-sky text-black font-bold rounded-xl text-lg hover:bg-sky/90 transition"
        >
          ✅ إضافة العميل وإرسال الترحيب
        </button>
      </form>
    </div>
  );
}


// ==========================================
// API Endpoint: إرسال واتساب ترحيبي
// ==========================================

// صفحة: /api/send-welcome-whatsapp/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { phone, host_name, unit_name, login_url } = await request.json();

  const message = `
🎉 مرحباً بك في Qlivn يا ${host_name}!

تم تفعيل حسابك بنجاح.

📍 الوحدة: ${unit_name}
🔐 رابط لوحتك الخاصة:
${login_url}

يمكنك الآن:
✓ إدارة الحجوزات
✓ تغيير أكواد الدخول
✓ مراقبة الدخل
✓ التحكم بالوحدة عن بُعد

فريق Qlivn 🚀
  `.trim();

  // إرسال عبر Twilio
  const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: 'whatsapp:+14155238886',
      To: `whatsapp:${phone}`,
      Body: message,
    }),
  });

  return NextResponse.json({ success: true });
}


// ==========================================
// جدول hosts في Supabase
// ==========================================

/*
CREATE TABLE hosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subscription_plan TEXT DEFAULT 'basic',
  monthly_fee NUMERIC DEFAULT 100,
  status TEXT DEFAULT 'active', -- active, suspended, cancelled
  joined_date TIMESTAMP DEFAULT NOW(),
  total_units INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ical_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id),
  airbnb_url TEXT,
  gathern_url TEXT,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
*/
