import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, onValue, update, increment, set } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// تهيئة العداد العام إذا ما موجود
const initGlobal = async () => {
    const globalRef = ref(db, 'global');
    try {
        await set(globalRef, {
            totalTasbih: 0,
            totalDuas: 0
        });
    } catch(e) {
        console.log('Global already exists');
    }
};
initGlobal();

let deviceId = localStorage.getItem('maath_device_id');
let personalCount = parseInt(localStorage.getItem('maath_count')) || 0;
let sessionCount = 0;
const adhkar = ["سبحان الله", "الحمد لله", "الله أكبر", "لا إله إلا الله", "أستغفر الله"];

if (!deviceId) {
    deviceId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('maath_device_id', deviceId);
}

const globalRef = ref(db, 'global/totalTasbih');

// الاستماع للعداد العام
onValue(globalRef, (snapshot) => {
    const count = snapshot.val() || 0;
    document.getElementById('globalCount').textContent = count.toLocaleString('ar-SA');
});

// إنشاء النقاط
const dotsContainer = document.getElementById('progressDots');
for (let i = 0; i < 33; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dotsContainer.appendChild(dot);
}

function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index < (sessionCount % 33));
    });
}

document.getElementById('personalCount').textContent = personalCount;
updateDots();

// السبحة
document.getElementById('tasbihBtn').addEventListener('click', async function(e) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const rect = this.getBoundingClientRect();
    const size = 20;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    personalCount++;
    sessionCount++;
    localStorage.setItem('maath_count', personalCount);
    document.getElementById('personalCount').textContent = personalCount;
    updateDots();

    const adhkarIndex = Math.floor(sessionCount / 33) % adhkar.length;
    this.querySelector('.text').textContent = adhkar[adhkarIndex];

    // تحديث Firebase
    const userRef = ref(db, 'users/' + deviceId);
    await update(userRef, {
        count: personalCount,
        lastActive: Date.now()
    });

    // زيادة العداد العام
    await update(globalRef, increment(1));

    if (navigator.vibrate) navigator.vibrate(10);
});

// الدعاء
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
    
    const duaRef = ref(db, 'global/totalDuas');
    update(duaRef, increment(1));
}

// مشاركة التطبيق
function shareApp() {
    const count = document.getElementById('globalCount').textContent;
    const text = `انضم لـ ${count} شخص تسبح لمعاذ 🤍\n\nhttps://maath-sadaqah.web.app`;
    
    if (navigator.share) {
        navigator.share({ title: 'صدقة معاذ', text: text });
    } else {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ الرابط 📋');
    }
}

// بطاقة المشاركة
function showShareCard() {
    document.getElementById('shareCount').textContent = personalCount.toLocaleString('ar-SA');
    document.getElementById('shareDua').textContent = `"${duas[Math.floor(Math.random() * duas.length)]}"`;
    
    const today = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('shareDate').textContent = today;
    
    document.getElementById('shareModal').classList.add('active');
}

function closeShare() {
    document.getElementById('shareModal').classList.remove('active');
}

function downloadCard() {
    showToast('جاري التحميل... 📸');
    
    // في النسخة المتقدمة: نستخدم html2canvas
    // الآن: ننسخ نص البطاقة
    const text = `معاذ - صدقة جارية\n\n${personalCount.toLocaleString('ar-SA')} تسبيحة\n\n${document.getElementById('shareDua').textContent}\n\n${document.getElementById('shareDate').textContent}`;
    
    navigator.clipboard.writeText(text);
    showToast('تم نسخ البطاقة 📋');
}

function copyDua() {
    const dua = document.getElementById('shareDua').textContent;
    navigator.clipboard.writeText(dua);
    showToast('تم نسخ الدعاء 🤍');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Global functions
window.sendDua = sendDua;
window.shareApp = shareApp;
window.showShareCard = showShareCard;
window.closeShare = closeShare;
window.downloadCard = downloadCard;
window.copyDua = copyDua;

