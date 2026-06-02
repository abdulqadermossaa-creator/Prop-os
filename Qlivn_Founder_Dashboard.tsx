// ==========================================
// لوحة المؤسس - الصفحة الرئيسية
// ==========================================

export default function FounderDashboard() {
  const stats = {
    total_clients: 12,
    total_units: 38,
    active_bookings: 24,
    monthly_revenue: 4800, // ر.س
    this_month_growth: '+15%',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">👑 لوحة المؤسس</h1>
          <p className="text-muted mt-1">نظرة شاملة على المنصة</p>
        </div>
        <button 
          onClick={() => window.location.href = '/founder/clients/add'}
          className="px-6 py-3 bg-sky text-black font-bold rounded-xl hover:bg-sky/90"
        >
          ➕ إضافة عميل جديد
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="العملاء النشطين" 
          value={stats.total_clients}
          icon="👥"
          color="sky"
        />
        <StatCard 
          label="إجمالي الوحدات" 
          value={stats.total_units}
          icon="🏠"
          color="accent"
        />
        <StatCard 
          label="حجوزات نشطة" 
          value={stats.active_bookings}
          icon="📅"
          color="gold"
        />
        <StatCard 
          label="الدخل الشهري" 
          value={`${stats.monthly_revenue} ر.س`}
          trend={stats.this_month_growth}
          icon="💰"
          color="accent"
        />
      </div>

      {/* جدول العملاء */}
      <div className="bg-card rounded-3xl p-6 border border-border mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">📋 قائمة العملاء</h2>
          <input 
            type="search" 
            placeholder="بحث..."
            className="px-4 py-2 rounded-xl bg-background border border-border"
          />
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-right border-b border-border">
              <th className="pb-3">المضيف</th>
              <th className="pb-3">عدد الوحدات</th>
              <th className="pb-3">الباقة</th>
              <th className="pb-3">الدخل الشهري</th>
              <th className="pb-3">الحالة</th>
              <th className="pb-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <ClientRow 
              name="أحمد السالم"
              units={5}
              plan="Premium"
              revenue={500}
              status="active"
            />
            <ClientRow 
              name="خالد الفهد"
              units={3}
              plan="Basic"
              revenue={300}
              status="active"
            />
            <ClientRow 
              name="ليلى محمد"
              units={8}
              plan="Enterprise"
              revenue={800}
              status="active"
            />
          </tbody>
        </table>
      </div>

      {/* سجل الأنشطة الأخير */}
      <div className="bg-card rounded-3xl p-6 border border-border">
        <h2 className="text-xl font-bold mb-4">⚡ آخر الأنشطة</h2>
        <div className="space-y-3">
          <ActivityItem 
            icon="🆕"
            text="عميل جديد: محمد الغامدي"
            time="منذ 20 دقيقة"
          />
          <ActivityItem 
            icon="💰"
            text="دفعة جديدة: 500 ر.س من أحمد السالم"
            time="منذ ساعة"
          />
          <ActivityItem 
            icon="🏠"
            text="وحدة جديدة: شقة النخيل"
            time="منذ 3 ساعات"
          />
        </div>
      </div>

    </div>
  );
}

function StatCard({ label, value, icon, color, trend }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && <span className="text-xs text-accent">{trend}</span>}
      </div>
      <div className={`text-2xl font-bold text-${color}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

function ClientRow({ name, units, plan, revenue, status }) {
  return (
    <tr className="border-b border-border">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky/20 flex items-center justify-center">
            {name[0]}
          </div>
          <span className="font-bold">{name}</span>
        </div>
      </td>
      <td className="py-4">{units} وحدات</td>
      <td className="py-4">
        <span className="px-3 py-1 rounded-lg bg-gold/20 text-gold text-sm">
          {plan}
        </span>
      </td>
      <td className="py-4 font-bold text-accent">{revenue} ر.س</td>
      <td className="py-4">
        <span className="px-3 py-1 rounded-lg bg-accent/20 text-accent text-sm">
          {status === 'active' ? 'نشط' : 'موقف'}
        </span>
      </td>
      <td className="py-4">
        <button className="text-sky hover:underline text-sm">
          عرض التفاصيل
        </button>
      </td>
    </tr>
  );
}

function ActivityItem({ icon, text, time }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-background rounded-xl">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-muted mt-1">{time}</p>
      </div>
    </div>
  );
}
