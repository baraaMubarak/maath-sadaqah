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
        item.dataset.id = person.id;
        
        item.innerHTML = `
            <div class="avatar" style="background: ${colors.primary}">${person.name.charAt(0)}</div>
            <span class="name">${person.name}</span>
        `;
        
        item.onclick = (e) => {
            e.stopPropagation();
            
            document.querySelectorAll('.person-item').forEach(el => {
                el.classList.remove('active');
            });
            
            item.classList.add('active');
            onSelect(person.id);
        };
        
        scroll.appendChild(item);
    });
    
    if (selector) {
        selector.onclick = (e) => {
            e.stopPropagation();
            togglePersonsList();
        };
    }
    
    document.addEventListener('click', (e) => {
        const list = document.getElementById('personsList');
        const selector = document.getElementById('personSelector');
        
        if (list && selector && 
            !list.contains(e.target) && 
            !selector.contains(e.target)) {
            list.classList.remove('active');
            selector.classList.remove('active');
        }
    });
}

function togglePersonsList() {
    const list = document.getElementById('personsList');
    const selector = document.getElementById('personSelector');
    
    if (list && selector) {
        const isActive = list.classList.contains('active');
        
        if (isActive) {
            list.classList.remove('active');
            selector.classList.remove('active');
        } else {
            list.classList.add('active');
            selector.classList.add('active');
        }
    }
}

// ===== Modal إضافة شخص =====
export function openAddPersonModal() {
    const modal = document.getElementById('addPersonModal');
    const input = document.getElementById('newPersonName');
    
    if (modal) {
        modal.classList.add('active');
        if (input) {
            input.value = '';
            input.focus();
        }
        
        const persons = JSON.parse(localStorage.getItem('maath_persons')) || [];
        const nextColor = getPersonColor(persons.length);
        const preview = document.getElementById('colorPreview');
        if (preview) {
            preview.style.background = nextColor.primary;
        }
    }
}

export function closeAddPersonModal() {
    const modal = document.getElementById('addPersonModal');
    if (modal) {
        modal.classList.remove('active');
    }
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
