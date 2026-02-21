import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, onValue, update, increment } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

// Firebase Configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Config
const adhkar = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله'];

const duas = [
    'اللهم اغفر لمعاذ وارحمه وعافه واعف عنه',
    'اللهم اجعل القرآن ربيع قلبه ونور صدره',
    'اللهم أدخله الجنة بغير حساب ولا سابقة عذاب',
    'اللهم اجمعنا به في الفردوس الأعلى',
    'اللهم أنس وحشته في القبر ونور له مضجعه'
];

// State
let deviceId = localStorage.getItem('maath_id');
let personalCount = parseInt(localStorage.getItem('maath_count')) || 0;
let sessionCount = 0;
let globalCount = 0;

if (!deviceId) {
    deviceId = 'u' + Date.now() + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('maath_id', deviceId);
}

// UI Functions
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function updateGlobalCount(count) {
    document.getElementById('globalCount').textContent = count;
}

function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i < (sessionCount % 33));
    });
}

// Initialize UI
document.getElementById('personalCount').textContent = personalCount;

// Create dots
const dotsContainer = document.getElementById('dots');
for (let i = 0; i < 33; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dotsContainer.appendChild(dot);
}
updateDots();

// Listen to global count
const usersRef = ref(db, 'users');
onValue(usersRef, (snapshot) => {
    let total = 0;
    const users = snapshot.val() || {};
    
    Object.values(users).forEach(user => {
        total += (user.count || 0);
    });
    
    update(ref(db, 'global'), { totalTasbih: total });
    globalCount = total;
    updateGlobalCount(total);
});

// Tasbih click
document.getElementById('tasbihBtn').addEventListener('click', async () => {
    personalCount++;
    sessionCount++;
    localStorage.setItem('maath_count', personalCount);
    
    document.getElementById('personalCount').textContent = personalCount;
    updateDots();
    
    const dhikrIndex = Math.floor(sessionCount / 33) % adhkar.length;
    document.querySelector('#tasbihBtn span').textContent = adhkar[dhikrIndex];
    
    await update(ref(db, 'users/' + deviceId), {
        count: personalCount,
        lastActive: Date.now()
    });
    
    if (navigator.vibrate) navigator.vibrate(15);
});

// Dua functions
window.newDua = () => {
    const dua = duas[Math.floor(Math.random() * duas.length)];
    document.getElementById('duaText').textContent = dua;
    showToast('تم الدعاء لمعاذ 🤍');
};

// Card functions
window.showCard = () => {
    document.getElementById('cardCount').textContent = personalCount;
    document.getElementById('cardDua').textContent = duas[Math.floor(Math.random() * duas.length)];
    document.getElementById('cardDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('modal').classList.add('active');
};

window.closeCard = () => {
    document.getElementById('modal').classList.remove('active');
};

window.saveImage = async () => {
    const card = document.getElementById('card');
    const actions = card.querySelector('.share-actions');
    const closeBtn = card.querySelector('.close-x');
    
    actions.style.display = 'none';
    closeBtn.style.display = 'none';
    
    try {
        showToast('جاري إنشاء الصورة...');
        
        const canvas = await html2canvas(card, {
            backgroundColor: '#f5f3ee',
            scale: 2,
            useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `maath-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        showToast('تم حفظ الصورة 📸');
    } catch (err) {
        showToast('حدث خطأ، حاول مرة أخرى');
    } finally {
        actions.style.display = 'flex';
        closeBtn.style.display = 'flex';
    }
};

window.copyText = () => {
    const dua = document.getElementById('cardDua').textContent;
    navigator.clipboard.writeText(`معاذ - صدقة جارية\n\n${dua}`);
    showToast('تم النسخ 📋');
};

window.shareLink = () => {
    const url = 'https://baraamubarak.github.io/maath-sadaqah';
    const text = `انضم لتسبيح ${globalCount} مرة لمعاذ 🤍\n\n${url}`;
    
    if (navigator.share) {
        navigator.share({ title: 'معاذ - صدقة جارية', text });
    } else {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ الرابط 📋');
    }
};

// Install button
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

if (installBtn) {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        setTimeout(() => {
            installBtn.classList.add('show');
        }, 3000);
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showToast('تم تثبيت التطبيق ✅');
            installBtn.style.display = 'none';
        } else {
            showToast('يمكنك التثبيت لاحقاً');
            installBtn.classList.remove('show');
        }
        
        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        showToast('التطبيق مثبت ✅');
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });
}
