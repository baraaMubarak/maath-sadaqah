// ===== البيانات =====
const adhkar = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله'];

const duas = [
    'اللهم اغفر لمعاذ وارحمه وعافه واعفُ عنه',
    'اللهم اجعل قبر معاذ روضةً من رياض الجنة',
    'اللهم آنس وحشة معاذ في قبره'
];

const personColors = [
    { primary: '#4a5d4a', secondary: '#c4b59d', bg: '#f8f6f1' },
    { primary: '#5d4a4a', secondary: '#c4a59d', bg: '#f8f1f1' },
    { primary: '#4a5a5d', secondary: '#9db5c4', bg: '#f1f6f8' }
];

// ===== المتغيرات =====
let persons = [];
let currentPersonId = null;
let count = 0;
let sessionCount = 0;

// ===== التهيئة =====
function init() {
    // تحميل الأشخاص
    const saved = localStorage.getItem('maath_persons');
    persons = saved ? JSON.parse(saved) : [{ id: '1', name: 'معاذ', colorIndex: 0 }];
    
    const savedCurrent = localStorage.getItem('maath_current');
    currentPersonId = savedCurrent || '1';
    
    // إذا الشخص الحالي مش موجود، رجع للأول
    const current = persons.find(p => p.id === currentPersonId);
    if (!current) {
        currentPersonId = persons[0].id;
    }
    
    renderPersons();
    selectPerson(currentPersonId);
    initTasbih();
    setupButtons();
}

// ===== عرض الأشخاص =====
function renderPersons() {
    const scroll = document.getElementById('personsScroll');
    scroll.innerHTML = '';
    
    persons.forEach((person, index) => {
        const div = document.createElement('div');
        div.className = 'person-item' + (person.id === currentPersonId ? ' active' : '');
        div.innerHTML = `
            <div class="avatar" style="background:${personColors[index % 3].primary}">${person.name[0]}</div>
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
    const color = personColors[person.colorIndex % 3];
    
    // تحديث CSS
    document.documentElement.style.setProperty('--primary', color.primary);
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
    document.getElementById('personalCount').textContent = count;
    
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
    document.getElementById('personalCount').textContent = count;
    
    // تحديث النقاط
    const dots = document.querySelectorAll('.dot');
    const active = sessionCount % 33;
    dots.forEach((d, i) => d.classList.toggle('active', i < active));
    
    // تغيير الذكر
    const dhikrIndex = Math.floor(sessionCount / 33) % 5;
    document.querySelector('#tasbihBtn span').textContent = adhkar[dhikrIndex];
    
    // اهتزاز
    if (navigator.vibrate) navigator.vibrate(15);
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
    const color = personColors[person.colorIndex % 3];
    const dua = duas[Math.floor(Math.random() * duas.length)].replace(/معاذ/g, person.name);
    
    document.getElementById('cardName').textContent = person.name;
    document.getElementById('cardName').style.color = color.primary;
    document.getElementById('cardLabelName').textContent = person.name;
    document.getElementById('cardDua').textContent = dua;
    
    document.getElementById('cardModal').classList.add('active');
}

function saveImage() {
    showToast('جاري الحفظ...');
    // html2canvas هنا
}

function copyText() {
    const name = document.getElementById('cardName').textContent;
    const dua = document.getElementById('cardDua').textContent;
    navigator.clipboard.writeText(`${name} - صدقة جارية\n\n${dua}`);
    showToast('تم النسخ 📋');
}

// ===== مشاركة =====
function shareLink() {
    const url = 'https://baraamubarak.github.io/maath-sadaqah';
    const text = `انضم للتسبيح 🤍\n\n${url}`;
    
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
