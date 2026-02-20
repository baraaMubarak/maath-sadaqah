import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, onValue, update, increment } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

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

// بيانات المستخدم
let deviceId = localStorage.getItem('maath_id');
let personalCount = parseInt(localStorage.getItem('maath_count')) || 0;
let sessionCount = 0;

if (!deviceId) {
    deviceId = 'u' + Date.now() + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('maath_id', deviceId);
}

// الأذكار
const adhkar = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله'];

// إنشاء النقاط
const dotsContainer = document.getElementById('dots');
for (let i = 0; i < 33; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dotsContainer.appendChild(dot);
}

const updateDots = () => {
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i < (sessionCount % 33));
    });
};

// ✅ إصلاح: الاستماع لجميع المستخدمين وحساب المجموع
const usersRef = ref(db, 'users');
onValue(usersRef, (snapshot) => {
    let total = 0;
    const users = snapshot.val() || {};
    
    // جمع جميع التسبيحات من جميع المستخدمين
    Object.values(users).forEach(user => {
        total += (user.count || 0);
    });
    
    // تحديث العداد العام في Firebase (للتأكد)
    update(ref(db, 'global'), { totalTasbih: total });
    
    // عرض العداد
    document.getElementById('globalCount').textContent = total;
});

// عرض العداد الشخصي
document.getElementById('personalCount').textContent = personalCount;
updateDots();

// السبحة
document.getElementById('tasbihBtn').addEventListener('click', async () => {
    personalCount++;
    sessionCount++;
    localStorage.setItem('maath_count', personalCount);
    
    document.getElementById('personalCount').textContent = personalCount;
    updateDots();
    
    const dhikr = adhkar[Math.floor(sessionCount / 33) % adhkar.length];
    document.querySelector('#tasbihBtn span').textContent = dhikr;
    
    // تحديث المستخدم في Firebase
    await update(ref(db, 'users/' + deviceId), {
        count: personalCount,
        lastActive: Date.now()
    });
    
    if (navigator.vibrate) navigator.vibrate(15);
});

// الأدعية
const duas = [
    'اللهم اغفر لمعاذ وارحمه وعافه واعف عنه',
    'اللهم اجعل القرآن ربيع قلبه ونور صدره',
    'اللهم أدخله الجنة بغير حساب ولا سابقة عذاب',
    'اللهم اجمعنا به في الفردوس الأعلى',
    'اللهم أنس وحشته في القبر ونور له مضجعه'
];

const newDua = () => {
    const dua = duas[Math.floor(Math.random() * duas.length)];
    document.getElementById('duaText').textContent = dua;
    showToast('تم الدعاء لمعاذ 🤍');
};

// البطاقة
const showCard = () => {
    document.getElementById('cardCount').textContent = personalCount;
    document.getElementById('cardDua').textContent = duas[Math.floor(Math.random() * duas.length)];
    
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('cardDate').textContent = date;
    
    document.getElementById('modal').classList.add('active');
};

const closeCard = () => {
    document.getElementById('modal').classList.remove('active');
};

// ✅ حفظ كصورة - فقط الجزء المرفق (بدون أزرار)
const saveImage = async () => {
    const card = document.getElementById('card');
    
    // إخفاء الأزرار والإغلاق
    const actions = card.querySelector('.share-actions');
    const closeBtn = card.querySelector('.close-x');
    actions.style.display = 'none';
    closeBtn.style.display = 'none';
    
    // إضافة هوامش للصورة
    card.style.padding = '60px 50px';
    
    try {
        showToast('جاري إنشاء الصورة...');
        
        const canvas = await html2canvas(card, {
            backgroundColor: '#f5f3ee',
            scale: 3,
            useCORS: true,
            width: 340,
            height: 600,
            x: -10,
            y: -10
        });
        
        const link = document.createElement('a');
        link.download = `maath-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        showToast('تم حفظ الصورة 📸');
    } catch (err) {
        showToast('حدث خطأ، حاول مرة أخرى');
        console.error(err);
    } finally {
        // إرجاع الأزرار
        actions.style.display = 'flex';
        closeBtn.style.display = 'flex';
        card.style.padding = '50px 40px';
    }
};

const copyText = () => {
    const text = `معاذ - صدقة جارية\n\n${personalCount} تسبيحة\n\n${document.getElementById('cardDua').textContent}`;
    navigator.clipboard.writeText(text);
    showToast('تم النسخ 📋');
};

const shareLink = () => {
    const url = 'https://baraamubarak.github.io/maath-sadaqah';
    const total = document.getElementById('globalCount').textContent;
    const text = `انضم لتسبيح ${total} مرة لمعاذ 🤍\n\n${url}`;
    
    if (navigator.share) {
        navigator.share({ title: 'معاذ - صدقة جارية', text: text });
    } else {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ الرابط 📋');
    }
};

const showToast = (msg) => {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
};

window.showCard = showCard;
window.closeCard = closeCard;
window.saveImage = saveImage;
window.copyText = copyText;
window.shareLink = shareLink;
window.newDua = newDua;
