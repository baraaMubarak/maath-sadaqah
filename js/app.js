// ===== Firebase Config =====
const firebaseConfig = {
    apiKey: "AIzaSyC_HXOPcbL80yEbWTx8KFJ5DS2lun5doJY",
    authDomain: "maath-sadaqah.firebaseapp.com",
    databaseURL: "https://maath-sadaqah-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "maath-sadaqah",
    storageBucket: "maath-sadaqah.firebasestorage.app",
    messagingSenderId: "563608713392",
    appId: "1:563608713392:web:2f0bd4f0fbdd8790f0e375"
};

// ===== البيانات =====
const adhkar = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله'];

const duas = [
    'اللهم اغفر لمعاذ وارحمه وعافه واعفُ عنه وأكرم نزله ووسع مدخله',
    'اللهم اجعل قبر معاذ روضةً من رياض الجنة ولا تجعله حفرةً من حفر النار',
    'اللهم آنس وحشة معاذ في قبره ونوّر له مضجعه',
    'اللهم أدخل معاذ الجنة بغير حساب ولا سابقة عذاب',
    'اللهم اجمعنا بمعاذ في الفردوس الأعلى من الجنة',
    'اللهم ارفع درجات معاذ في عليين واكتب له الأجر إلى يوم الدين',
    'اللهم تقبل معاذ في زمرة الشهداء والصالحين',
    'اللهم اجعل القرآن العظيم شفيعًا لمعاذ يوم القيامة',
    'اللهم اجعل أعمال معاذ الصالحة نورًا له في ظلمات القبر',
    'اللهم وسّع قبر معاذ مدّ بصره وافرش له من الجنة'
];

const personColors = [
    { primary: '#4a5d4a', secondary: '#c4b59d', bg: '#f8f6f1' },
    { primary: '#5d4a4a', secondary: '#c4a59d', bg: '#f8f1f1' },
    { primary: '#4a5a5d', secondary: '#9db5c4', bg: '#f1f6f8' },
    { primary: '#5d4a5a', secondary: '#b59dc4', bg: '#f6f1f8' },
    { primary: '#5a5d4a', secondary: '#b5c49d', bg: '#f5f8f1' },
    { primary: '#4a4a5d', secondary: '#9d9dc4', bg: '#f1f1f8' }
];

// ===== المتغيرات =====
let persons = [];
let currentPersonId = null;
let count = 0;
let sessionCount = 0;
let db = null;
let globalCount = 0;
let deferredPrompt = null;
let deviceId = null;

// ===== التهيئة =====
function init() {
    // تسجيل Service Worker
    registerSW();
    
    // تحميل Firebase
    loadFirebase();
    
    // تحميل الجهاز ID
    deviceId = localStorage.getItem('maath_device');
    if (!deviceId) {
        deviceId = 'd' + Date.now() + Math.random().toString(36).substr(2, 5);
        localStorage.setItem('maath_device', deviceId);
    }
    
    // تحميل الأشخاص
    const saved = localStorage.getItem('maath_persons');
    persons = saved ? JSON.parse(saved) : [{ id: '1', name: 'معاذ', colorIndex: 0 }];
    
    const savedCurrent = localStorage.getItem('maath_current');
    currentPersonId = savedCurrent || '1';
    
    // إذا الشخص الحالي مش موجود
    const current = persons.find(p => p.id === currentPersonId);
    if (!current) {
        currentPersonId = persons[0].id;
    }
    
    renderPersons();
    selectPerson(currentPersonId);
    initTasbih();
    setupButtons();
    setupInstallButton();
}

// ===== تسجيل Service Worker =====
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW error:', err));
    }
}

// ===== تحميل Firebase =====
function loadFirebase() {
    // تحميل سكربتات Firebase
    const appScript = document.createElement('script');
    appScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    appScript.onload = () => {
        const dbScript = document.createElement('script');
        dbScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
        dbScript.onload = initFirebase;
        document.head.appendChild(dbScript);
    };
    document.head.appendChild(appScript);
}

function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        listenToGlobalCount();
    } catch (err) {
        console.error('Firebase init error:', err);
    }
}

// ===== الاستماع للعداد العام =====
function listenToGlobalCount() {
    if (!db) return;
    
    db.ref('users').on('value', (snapshot) => {
        let total = 0;
        const users = snapshot.val() || {};
        Object.values(users).forEach(user => {
            total += user.count || 0;
        });
        globalCount = total;
        document.getElementById('globalCount').textContent = total.toLocaleString('ar-SA');
        
        // تحديث في Firebase
        db.ref('global/total').set(total);
    });
}

// ===== تحديث العداد في Firebase =====
function updateFirebaseCount() {
    if (!db || !currentPersonId) return;
    
    const userRef = db.ref(`users/${deviceId}_${currentPersonId}`);
    userRef.set({
        count: count,
        personName: persons.find(p => p.id === currentPersonId)?.name || 'unknown',
        timestamp: Date.now()
    });
}

// ===== عرض الأشخاص =====
function renderPersons() {
    const scroll = document.getElementById('personsScroll');
    if (!scroll) return;
    
    scroll.innerHTML = '';
    
    persons.forEach((person, index) => {
        const div = document.createElement('div');
        div.className = 'person-item' + (person.id === currentPersonId ? ' active' : '');
        div.innerHTML = `
            <div class="avatar" style="background:${personColors[index % 6].primary}">${person.name[0]}</div>
            <span class="name">${person.name}</span>
        `;
        div.onclick = () => selectPerson(person.id);
        scroll.appendChild(div);
    });
}

// ===== اختيار شخص =====
function selectPerson(id) {
    currentPersonId = id;
    localStorage.setItem('maath_current', id);
    
    const person = persons.find(p => p.id === id);
    const color = personColors[person.colorIndex % 6];
    
    // تحديث CSS
    document.documentElement.style.setProperty('--primary', color.primary);
    document.documentElement.style.setProperty('--secondary', color.secondary);
    document.documentElement.style.setProperty('--bg', color.bg);
    
    // تحديث الهيدر
    document.getElementById('personName').textContent = person.name;
    document.getElementById('personAvatar').textContent = person.name[0];
    document.getElementById('personAvatar').style.background = color.primary;
    document.getElementById('globalName').textContent = `دعاء لـ ${person.name}`;
    
    // تحديث الدعاء
    document.getElementById('duaText').textContent = duas[0].replace(/معاذ/g, person.name);
    
    // تحديث القائمة
    renderPersons();
    
    // تحميل العداد
    const savedCount = localStorage.getItem(`count_${id}`);
    count = savedCount ? parseInt(savedCount) : 0;
    sessionCount = 0;
    document.getElementById('personalCount').textContent = count;
    updateDots();
    
    // إغلاق القائمة
    document.getElementById('personsList').classList.remove('active');
}

// ===== التسبيح =====
function initTasbih() {
    const dots = document.getElementById('dots');
    dots.innerHTML = '';
    for (let i = 0; i < 33; i++) {
        dots.innerHTML += '<div class="dot"></div>';
    }
    
    document.getElementById('tasbihBtn').onclick = clickTasbih;
}

function clickTasbih() {
    count++;
    sessionCount++;
    localStorage.setItem(`count_${currentPersonId}`, count);
    document.getElementById('personalCount').textContent = count.toLocaleString('ar-SA');
    
    // تحديث Firebase
    updateFirebaseCount();
    
    // تحديث النقاط
    updateDots();
    
    // تغيير الذكر
    const dhikrIndex = Math.floor(sessionCount / 33) % 5;
    document.querySelector('#tasbihBtn span').textContent = adhkar[dhikrIndex];
    
    // اهتزاز
    if (navigator.vibrate) navigator.vibrate(15);
}

function updateDots() {
    const dots = document.querySelectorAll('.dot');
    const active = sessionCount % 33;
    dots.forEach((d, i) => d.classList.toggle('active', i < active));
}

// ===== الأزرار =====
function setupButtons() {
    // قائمة الأشخاص
    document.getElementById('personSelector').onclick = () => {
        document.getElementById('personsList').classList.toggle('active');
    };
    
    // إضافة شخص
    document.getElementById('addPersonBtn').onclick = () => {
        document.getElementById('addPersonModal').classList.add('active');
        document.getElementById('newPersonName').focus();
    };
    
    document.getElementById('cancelBtn').onclick = () => {
        document.getElementById('addPersonModal').classList.remove('active');
    };
    
    document.getElementById('addBtn').onclick = addPerson;
    
    // دعاء
    document.getElementById('duaBtn').onclick = () => {
        const person = persons.find(p => p.id === currentPersonId);
        const dua = duas[Math.floor(Math.random() * duas.length)].replace(/معاذ/g, person.name);
        document.getElementById('duaText').textContent = dua;
        showToast(`تم الدعاء لـ ${person.name} 🤍`);
    };
    
    // بطاقة
    document.getElementById('showCardBtn').onclick = showCard;
    document.getElementById('closeBtn').onclick = () => {
        document.getElementById('cardModal').classList.remove('active');
    };
    document.getElementById('saveBtn').onclick = saveImage;
    document.getElementById('copyBtn').onclick = copyText;
    
    // مشاركة
    document.getElementById('shareBtn').onclick = shareLink;
}

// ===== زر التثبيت =====
function setupInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
        installBtn.classList.add('show');
    });
    
    installBtn.onclick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            showToast('تم تثبيت التطبيق ✅');
            installBtn.style.display = 'none';
        } else {
            showToast('يمكنك التثبيت لاحقاً');
        }
        deferredPrompt = null;
    };
    
    window.addEventListener('appinstalled', () => {
        showToast('التطبيق مثبت ✅');
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.style.display = 'none';
    }
}

// ===== إضافة شخص =====
function addPerson() {
    const name = document.getElementById('newPersonName').value.trim();
    if (!name) return;
    
    const newPerson = {
        id: Date.now().toString(),
        name: name,
        colorIndex: persons.length
    };
    
    persons.push(newPerson);
    localStorage.setItem('maath_persons', JSON.stringify(persons));
    
    document.getElementById('addPersonModal').classList.remove('active');
    document.getElementById('newPersonName').value = '';
    
    renderPersons();
    selectPerson(newPerson.id);
    showToast(`تم إضافة ${name} ✅`);
}

// ===== بطاقة =====
function showCard() {
    const person = persons.find(p => p.id === currentPersonId);
    const color = personColors[person.colorIndex % 6];
    const dua = duas[Math.floor(Math.random() * duas.length)].replace(/معاذ/g, person.name);
    
    document.getElementById('cardName').textContent = person.name;
    document.getElementById('cardName').style.color = color.primary;
    document.getElementById('cardLabelName').textContent = person.name;
    document.getElementById('cardDua').textContent = dua;
    document.getElementById('cardDate').textContent = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    document.getElementById('cardModal').classList.add('active');
}

// ===== حفظ صورة =====
async function saveImage() {
    const cardContent = document.querySelector('.card-content');
    const actions = document.querySelector('.card-actions');
    
    actions.style.display = 'none';
    
    try {
        showToast('جاري إنشاء الصورة...');
        
        const canvas = await html2canvas(cardContent, {
            backgroundColor: '#f5f3ee',
            scale: 3,
            useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `sadaqah-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        showToast('تم حفظ الصورة 📸');
    } catch (err) {
        showToast('حدث خطأ، حاول مرة أخرى');
        console.error(err);
    } finally {
        actions.style.display = 'flex';
    }
}

// ===== نسخ النص =====
function copyText() {
    const name = document.getElementById('cardName').textContent;
    const dua = document.getElementById('cardDua').textContent;
    navigator.clipboard.writeText(`${name} - صدقة جارية\n\n${dua}`);
    showToast('تم النسخ 📋');
}

// ===== مشاركة =====
function shareLink() {
    const url = 'https://baraamubarak.github.io/maath-sadaqah';
    const text = `انضم لتسبيح ${globalCount.toLocaleString('ar-SA')} مرة 🤍\n\n${url}`;
    
    if (navigator.share) {
        navigator.share({ title: 'صدقة جارية', text });
    } else {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ الرابط 📋');
    }
}

// ===== Toast =====
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== تشغيل =====
document.addEventListener('DOMContentLoaded', init);
