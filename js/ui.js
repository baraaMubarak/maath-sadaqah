import { duas } from './config.js';

export function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

export function updateGlobalCount(count) {
    document.getElementById('globalCount').textContent = count;
}

export function newDua() {
    const dua = duas[Math.floor(Math.random() * duas.length)];
    document.getElementById('duaText').textContent = dua;
    showToast('تم الدعاء لمعاذ 🤍');
}

export function showCard(personalCount) {
    document.getElementById('cardDua').textContent = duas[Math.floor(Math.random() * duas.length)];
    document.getElementById('cardDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('modal').classList.add('active');
}

export function closeCard() {
    document.getElementById('modal').classList.remove('active');
}

export async function saveImage() {
    const cardContent = document.getElementById('cardContent');
    const actions = document.querySelector('.card-actions');
    
    // إخفاء الأزرار
    actions.style.display = 'none';
    
    try {
        showToast('جاري إنشاء الصورة...');
        
        const canvas = await html2canvas(cardContent, {
            backgroundColor: '#f5f3ee',
            scale: 3,
            useCORS: true
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
    }
}

export function copyText() {
    const dua = document.getElementById('cardDua').textContent;
    navigator.clipboard.writeText(`معاذ - صدقة جارية\n\n${dua}`);
    showToast('تم النسخ 📋');
}

export function shareLink(globalCount) {
    const url = 'https://baraamubarak.github.io/maath-sadaqah';
    const text = `انضم لتسبيح ${globalCount} مرة لمعاذ 🤍\n\n${url}`;
    
    if (navigator.share) {
        navigator.share({ title: 'معاذ - صدقة جارية', text });
    } else {
        navigator.clipboard.writeText(text);
        showToast('تم نسخ الرابط 📋');
    }
}
