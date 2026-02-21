import { listenToGlobalCount } from './db.js';
import { Tasbih } from './tasbih.js';
import { showToast, updateGlobalCount, newDua, showCard, closeCard, saveImage, copyText, shareLink } from './ui.js';

// تهيئة
const tasbih = new Tasbih();
let globalCount = 0;

// الاستماع للعداد العام
listenToGlobalCount((count) => {
    globalCount = count;
    updateGlobalCount(count);
});

// توفير الدوال للـ HTML
window.newDua = newDua;
window.showCard = () => showCard(tasbih.getCount());
window.closeCard = closeCard;
window.saveImage = saveImage;
window.copyText = copyText;
window.shareLink = () => shareLink(globalCount);





import { listenToGlobalCount } from './db.js';
import { Tasbih } from './tasbih.js';
import { showToast, updateGlobalCount, newDua, showCard, closeCard, saveImage, copyText, shareLink } from './ui.js';

const tasbih = new Tasbih();
let globalCount = 0;

listenToGlobalCount((count) => {
    globalCount = count;
    updateGlobalCount(count);
});

// ===== زر التثبيت =====
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

// استمع لحدث التثبيت
window.addEventListener('beforeinstallprompt', (e) => {
    // احتفظ بالحدث
    deferredPrompt = e;
    
    // أظهر الزر بسلاسة بعد ثانية
    setTimeout(() => {
        installBtn.classList.add('show');
    }, 1000);
});

// عند الضغط على الزر
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // أظهر نافذة التثبيت
    deferredPrompt.prompt();
    
    // انتظر اختيار المستخدم
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('تم تثبيت التطبيق ✅');
        installBtn.style.display = 'none';
    } else {
        showToast('يمكنك التثبيت لاحقاً');
        // أخفي الزر مؤقتاً
        installBtn.classList.remove('show');
        setTimeout(() => {
            installBtn.classList.add('show');
        }, 60000); // أظهره بعد دقيقة
    }
    
    deferredPrompt = null;
});

// إذا كان مثبت بالفعل
window.addEventListener('appinstalled', () => {
    showToast('التطبيق مثبت ✅');
    installBtn.style.display = 'none';
    deferredPrompt = null;
});

// تحقق إذا كان مثبت (للـ iOS)
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    installBtn.style.display = 'none';
}

window.newDua = newDua;
window.showCard = () => showCard(tasbih.getCount());
window.closeCard = closeCard;
window.saveImage = saveImage;
window.copyText = copyText;
window.shareLink = () => shareLink(globalCount);
