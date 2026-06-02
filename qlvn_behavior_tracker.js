// ============================================================
// 🧠 QLVN OS - Behavior Tracker
// نظام مراقبة سلوك الضيف الذكي
// ============================================================
// 
// المنطق: نراقب الضيف بصمت، ولما نكتشف نمط معين، نشغّل فهد
//
// الأنماط المرصودة:
// 1. الحيرة في Netflix (5 دقايق + سحب كثير + ما اختار)
// 2. الجو الحار (38° + ما عدّل المكيف)
// 3. وقت المباراة (7PM + يوم فيه مباراة)
// 4. الجوع (8PM + ما طلب طعام)
// 5. وقت النوم (11PM + إضاءة قوية)
// 6. الصباح (7-9 AM + توه فاتح التابلت)
// ============================================================

const QlvnBehaviorTracker = {
    
    // 📊 حالة الضيف (State)
    state: {
        sessionStart: Date.now(),
        currentScreen: 'home',
        screenEnterTime: Date.now(),
        scrollCount: 0,
        lastScrollTime: 0,
        selectedAnything: false,
        actionsLog: [], // [{ time, action }]
        triggeredScenarios: new Set(), // لمنع تكرار نفس السيناريو
        
        // بيئة الشقة
        temperature: 38,           // درجة حرارة خارج
        roomTemp: 22,               // داخل الشقة
        lightLevel: 60,             // نسبة الإضاءة
        guestEnterTime: Date.now(), // متى دخل الضيف
        
        // معلومات الضيف
        guestName: 'محمد',
        favoriteTeam: null,
        lastFoodOrder: null,
        lastCoffeeOrder: null
    },
    
    // ⏱️ Timer للمراقبة الدورية (كل 30 ثانية)
    monitoringInterval: null,
    
    // 🚀 بدء المراقبة
    start() {
        console.log('🧠 Qlvn Behavior Tracker: بدأت المراقبة');
        this.monitoringInterval = setInterval(() => {
            this.runPatternDetection();
        }, 30000); // كل 30 ثانية
        
        // أيضاً، فحص فوري عند بداية التطبيق
        setTimeout(() => this.runPatternDetection(), 2000);
    },
    
    // 🛑 إيقاف المراقبة
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            console.log('🛑 Qlvn Behavior Tracker: توقفت المراقبة');
        }
    },
    
    // ============================================
    // 📍 تتبع التنقل بين الشاشات
    // ============================================
    onScreenEnter(screenName) {
        // حفظ الشاشة القديمة
        const previousScreen = this.state.currentScreen;
        const duration = Date.now() - this.state.screenEnterTime;
        
        // log
        this.state.actionsLog.push({
            time: Date.now(),
            action: 'screen_enter',
            screen: screenName,
            previousScreen,
            previousDuration: duration
        });
        
        // تحديث الحالة
        this.state.currentScreen = screenName;
        this.state.screenEnterTime = Date.now();
        this.state.scrollCount = 0;
        this.state.selectedAnything = false;
        
        console.log(`📍 دخل ${screenName} | السابق: ${previousScreen} (${Math.round(duration/1000)}ث)`);
    },
    
    // 📜 تتبع السحب (Scroll)
    onScroll() {
        this.state.scrollCount++;
        this.state.lastScrollTime = Date.now();
    },
    
    // ✅ تتبع الاختيار (لما الضيف يضغط على شي)
    onSelection(item) {
        this.state.selectedAnything = true;
        this.state.actionsLog.push({
            time: Date.now(),
            action: 'selection',
            item
        });
    },
    
    // 🌡️ تحديث بيئة الشقة
    updateEnvironment(env) {
        Object.assign(this.state, env);
    },
    
    // ============================================
    // 🔍 PATTERN DETECTION - اكتشاف الأنماط
    // ============================================
    runPatternDetection() {
        const now = Date.now();
        const hour = new Date().getHours();
        const screenDuration = (now - this.state.screenEnterTime) / 1000; // بالثواني
        const sessionDuration = (now - this.state.sessionStart) / 1000;
        
        console.log(`🔍 فحص الأنماط... الشاشة: ${this.state.currentScreen} (${Math.round(screenDuration)}ث)`);
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🎬 السيناريو 1: الحيرة في Netflix
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (this.state.currentScreen === 'netflix' &&
            screenDuration > 300 &&             // 5 دقايق
            this.state.scrollCount > 10 &&       // سحب أكثر من 10 مرات
            !this.state.selectedAnything &&     // ما اختار شي
            !this.state.triggeredScenarios.has('netflix_confused')) {
            
            this.trigger('netflix_confused', {
                message: 'الضيف حائر في Netflix منذ 5 دقايق',
                action: () => this.showFahadCard('netflix_confused')
            });
        }
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🌡️ السيناريو 2: الجو حار (الضيف توه دخل)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (this.state.temperature >= 35 &&
            this.state.roomTemp >= 26 &&
            sessionDuration < 600 &&            // أول 10 دقايق
            !this.state.triggeredScenarios.has('weather_hot')) {
            
            this.trigger('weather_hot', {
                message: `الجو حار (${this.state.temperature}°)، الضيف توه دخل`,
                action: () => this.showFahadCard('weather_hot')
            });
        }
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ⚽ السيناريو 3: وقت المباراة
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (hour >= 18 && hour <= 21 &&         // 6-9 مساءً
            !this.state.triggeredScenarios.has('match_time')) {
            
            // (لاحقاً نستخدم Gemini للتحقق من المباريات الحية)
            const isMatchDay = true; // mock
            
            if (isMatchDay) {
                this.trigger('match_time', {
                    message: 'وقت المباراة + الضيف موجود',
                    action: () => this.showFahadCard('match_time')
                });
            }
        }
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🍔 السيناريو 4: الجوع (8PM + ما طلب طعام)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (hour >= 19 && hour <= 21 &&
            !this.state.lastFoodOrder &&
            sessionDuration > 14400 &&          // 4 ساعات داخل الشقة
            !this.state.triggeredScenarios.has('dinner_time')) {
            
            this.trigger('dinner_time', {
                message: 'وقت العشاء + ما طلب طعام',
                action: () => this.showFahadCard('dinner_time')
            });
        }
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🌙 السيناريو 5: وقت النوم
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if ((hour >= 23 || hour <= 2) &&
            this.state.lightLevel > 60 &&       // الإضاءة قوية
            !this.state.triggeredScenarios.has('sleep_mode')) {
            
            this.trigger('sleep_mode', {
                message: 'وقت متأخر + إضاءة قوية',
                action: () => this.showFahadCard('sleep_mode')
            });
        }
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ☕ السيناريو 6: قهوة الصباح
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (hour >= 7 && hour <= 9 &&
            sessionDuration < 600 &&            // أول 10 دقايق
            !this.state.lastCoffeeOrder &&
            !this.state.triggeredScenarios.has('morning_coffee')) {
            
            this.trigger('morning_coffee', {
                message: 'صباح + ضيف توه قام',
                action: () => this.showFahadCard('morning_coffee')
            });
        }
        
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🌅 السيناريو 7: غروب الشمس
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (hour >= 17 && hour <= 18 &&
            !this.state.triggeredScenarios.has('sunset_mood')) {
            
            this.trigger('sunset_mood', {
                message: 'وقت المغرب جميل',
                action: () => this.showFahadCard('sunset_mood')
            });
        }
    },
    
    // ============================================
    // 🚨 إطلاق السيناريو
    // ============================================
    trigger(scenarioName, options) {
        console.log(`🚨 سيناريو: ${scenarioName} | ${options.message}`);
        
        // منع التكرار
        this.state.triggeredScenarios.add(scenarioName);
        
        // تنفيذ الإجراء
        options.action();
    },
    
    // ============================================
    // 🎴 عرض بطاقة فهد (يتصل مع التابلت)
    // ============================================
    showFahadCard(scenario) {
        // هذي الدالة سترتبط بـ tablet UI
        if (typeof window.showFahadAlert === 'function') {
            window.showFahadAlert(scenario);
        } else {
            console.log(`💬 [فهد]: حان وقت السيناريو ${scenario}`);
        }
    },
    
    // ============================================
    // 🔄 إعادة تعيين (لو الضيف اتفاعل مع فهد)
    // ============================================
    resetScenario(scenarioName) {
        this.state.triggeredScenarios.delete(scenarioName);
    },
    
    // ============================================
    // 📊 تقرير للمضيف/المؤسس
    // ============================================
    getReport() {
        return {
            sessionDuration: (Date.now() - this.state.sessionStart) / 1000,
            currentScreen: this.state.currentScreen,
            screenTime: (Date.now() - this.state.screenEnterTime) / 1000,
            actionsCount: this.state.actionsLog.length,
            triggeredScenarios: Array.from(this.state.triggeredScenarios),
            environment: {
                temperature: this.state.temperature,
                roomTemp: this.state.roomTemp,
                lightLevel: this.state.lightLevel
            }
        };
    }
};

// ============================================================
// 🎯 كيف نستخدمها في التابلت
// ============================================================
//
// في tablet_qlvn_fahad.html، أضف:
//
// 1. تحميل المكتبة:
//    <script src="qlvn_behavior_tracker.js"></script>
//
// 2. بدء المراقبة:
//    QlvnBehaviorTracker.start();
//
// 3. تتبع الشاشات:
//    QlvnBehaviorTracker.onScreenEnter('netflix');
//    QlvnBehaviorTracker.onScreenEnter('home');
//
// 4. تتبع السحب:
//    document.addEventListener('scroll', () => QlvnBehaviorTracker.onScroll());
//
// 5. تتبع الاختيار:
//    QlvnBehaviorTracker.onSelection('movie:The Crown');
//
// 6. تحديث البيئة (من السنسورات):
//    QlvnBehaviorTracker.updateEnvironment({
//        temperature: 39,
//        roomTemp: 28,
//        lightLevel: 80
//    });
//
// 7. ربط فهد بالتابلت:
//    window.showFahadAlert = (scenario) => {
//        // عرض البطاقة المنبثقة لفهد
//    };
//
// ============================================================

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QlvnBehaviorTracker;
}
