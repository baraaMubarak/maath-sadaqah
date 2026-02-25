import { duas, getPersonColor } from './config.js';

// ===== Toast =====
export function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== تحديث العداد العام =====
export function updateGlobalCount(count) {
    document.getElementById('globalCount').textContent = count.toLocaleString('ar-SA');
}

// ===== دعاء جديد =====
export function newDua(personName) {
    const dua = duas[Math.floor(Math.random() * duas.length)];
    const personalizedDua = dua.replace(/معاذ/g, personName);
    document.getElementById('duaText').textContent = personalizedDua;
    showToast(`تم الدعاء لـ ${personName} 🤍`);
}

// ===== تحديث UI حسب الشخص =====
export function updateUIForPerson(person, colorIndex) {
    const colors = getPersonColor(colorIndex);
    
    // تحديث CSS variables
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--secondary', colors.secondary);
    document.documentElement.style.setProperty('--bg', colors.bg);
    
    // تحديث الهيدر
    document.getElementById('personName').textContent = person.name;
    document.getElementById('personAvatar').textContent = person.name.charAt(0);
    document.getElementById('personAvatar').style.background = colors.primary;
    
    // تحديث النصوص
    document.getElementById('globalName').textContent = `دعاء لـ ${person.name}`;
    
    // تحديث theme color
    document.querySelector('meta[name="theme-color"]').content = colors.primary;
    
    // تحديث الدعاء الافتراضي
    const defaultDua = duas[0].replace(/معاذ/g, person.name);
    document.getElementById('duaText').textContent = defaultDua;
}

// ===== قائمة الأشخاص =====
export function initPersonsUI(persons, currentId, onSelect) {
    const scroll = document.getElementById('personsScroll');
    const selector = document.getElementById('personSelector');
    
    scroll.innerHTML = '';
    
    persons.forEach((person, index) => {
        const colors = getPersonColor(index);
        const item = document.createElement('div');
        item.className = `person-item ${person.id === currentId ? 'active' : ''}`;
        item.innerHTML = `
            <div class="avatar" style="background: ${colors.primary}">${person.name.charAt(0)}</div>
            <span class="name">${person.name}</span>
        `;
        item.onclick = () => {
            onSelect(person.id);
            togglePersonsList(false);
        };
        scroll.appendChild(item);
    });
    
    // فتح/إغلاق القائمة
    selector.onclick = () => togglePersonsList();
}

function togglePersonsList(forceState) {
    const list = document.getElementById('personsList');
    const selector = document.getElementById('personSelector');
    const isActive = list.classList.contains('active');
    const newState = forceState !== undefined ? forceState : !isActive;
    
    if (newState) {
        list.classList.add('active');
        selector.classList.add('active');
    } else {
        list.classList.remove('active');
        selector.classList.remove('active');
    }
}

export function selectPerson(id) {
    document.querySelectorAll('.person-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === id) item.classList.add('active');
    });
}

// ===== Modal إضافة شخص =====
export function openAddPersonModal() {
    const modal = document.getElementById('addPersonModal');
    const input = document.getElementById('newPersonName');
    modal.classList.add('active');
    input.value = '';
    input.focus();
    
    // تحديث لون المعاينة
    const persons = JSON.parse(localStorage.getItem('maath_persons')) || [];
    const nextColor = getPersonColor(persons.length);
    document.getElementById('colorPreview').style.background = nextColor.primary;
}

export function closeAddPersonModal() {
    document.getElementById('addPersonModal').classList.remove('active');
}

// ===== Modal البطاقة =====
export function showCard(person) {
    const colors = getPersonColor(person.colorIndex || 0);
    const dua = duas[Math.floor(Math.random() * duas.length)].replace(/معاذ/g, person.name);
    
    document.getElementById('cardName').textContent = person.name;
    document.getElementById('cardName').style.color = colors.primary;
    document.getElementById('cardLabelName').textContent = person.name;
    document.getElementById('cardDua').textContent = dua;
    document.getElementById('cardDate').textContent = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    document.getElementById('cardModal').classList.add('active');
}

export function closeCard() {
    document.getElementById('cardModal').classList.remove('active');
}

// ===== حفظ الصورة =====
export async function saveImage() {
    const cardContent = document.getElementById('cardContent');
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
export function copyText() {
    const name = document.getElementById('cardName').textContent;
    const dua = document.getElementById('cardDua').textContent;
    navigator.clipboard.writeText(`${name} - صدقة جارية\n\n${dua}`);
    showToast('تم النسخ 📋');
}

// ===== مشاركة =====
export function shareLink(globalCount) {
    const url = 'https://baraamubarak.github.io/maath-sadaqah';
    const text = `انضم لتسبيح ${globalCount.toLocaleString('ar-SA')} مرة 🤍\n\n${url}`;
    
    if (navigator.share) {
        navigator.share({ title: 'صدقة جارية', text });
    } else {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ الرابط 📋');
    }
}
