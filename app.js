// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update, increment } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_HXOPcbL80yEbWTx8KFJ5DS2lun5doJY",
    authDomain: "maath-sadaqah.firebaseapp.com",
    projectId: "maath-sadaqah",
    storageBucket: "maath-sadaqah.firebasestorage.app",
    messagingSenderId: "563608713392",
    appId: "1:563608713392:web:2f0bd4f0fbdd8790f0e375",
    measurementId: "G-5PN53EB571",
    databaseURL: "https://maath-sadaqah-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// متغيرات
let deviceId = localStorage.getItem('maath_device_id');
let personalCount = parseInt(localStorage.getItem('maath_count')) || 0;
let sessionCount = 0;
const adhkar = [
    "سبحان الله",
    "الحمد لله", 
    "الله أكبر",
    "لا إله إلا الله",
    "أستغفر الله"
];

// إنشاء معرف الجهاز
if (!deviceId) {
    deviceId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('maath_device_id', deviceId);
}

// إنشاء النقاط
const dotsContainer = document.getElementById('progressDots');
for (let i = 0; i < 33; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dotsContainer.appendChild(dot);
}

// تحديث النقاط
function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index < (sessionCount % 33));
    });
}

// الاستماع للعداد العام
const globalRef = ref(db, 'global/totalTasbih');
onValue(globalRef, (snapshot) => {
    const count = snapshot.val() || 0;
    document.getElementById('globalCount').textContent = count.toLocaleString('ar-SA');
});

// تحديث العداد الشخصي
document.getElementById('personalCount').textContent = personalCount;
updateDots();

// زر السبحة
document.getElementById('tasbihBtn').addEventListener('click', function(e) {
    // تأثير الضغط
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const rect = this.getBoundingClientRect();
    const size = 20;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    // تحديث العدادات
    personalCount++;
    sessionCount++;
    localStorage.setItem('maath_count', personalCount);
    document.getElementById('personalCount').textContent = personalCount;
    updateDots();

    // تغيير الذكر كل 33
    const adhkarIndex = Math.floor(sessionCount / 33) % adhkar.length;
    this.querySelector('.text').textContent = adhkar[adhkarIndex];

    // تحديث Firebase
    const userRef = ref(db, 'users/' + deviceId);
    update(userRef, {
        count: personalCount,
        lastActive: Date.now()
    });

    // زيادة العداد العام
    update(globalRef, increment(1));

    // اهتزاز خفيف (لو متاح)
    if (navigator.vibrate) navigator.vibrate(10);
});

// إرسال دعاء
const duas = [
    "اللهم اغفر لمعاذ وارحمه وعافه واعف عنه",
    "اللهم اجعل القرآن ربيع قلبه ونور صدره",
    "اللهم أدخله الجنة بغير حساب ولا سابقة عذاب",
    "اللهم اجمعنا به في الفردوس الأعلى",
    "اللهم أنس وحشته في القبر ونور له مضجعه"
];

function sendDua() {
    const randomDua = duas[Math.floor(Math.random() * duas.length)];
    document.getElementById('duaText').textContent = `"${randomDua}"`;
    showToast('تم الدعاء لمعاذ 🤍');
    
    // حفظ في Firebase
    const duaRef = ref(db, 'global/totalDuas');
    update(duaRef, increment(1));
}

// مشاركة
function shareApp() {
    const text = `انضم لـ ${document.getElementById('globalCount').textContent} شخص تسبح لمعاذ 🤍\n\nsadaqah-maath.web.app`;
    
    if (navigator.share) {
        navigator.share({
            title: 'صدقة معاذ',
            text: text
        });
    } else {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ الرابط 📋');
    }
}

// إظهار الأذكار
function showAdkar() {
    showToast('قريباً... 🌙');
}

// إشعار
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// اجعل الدوال global
window.sendDua = sendDua;
window.shareApp = shareApp;
window.showAdkar = showAdkar;

