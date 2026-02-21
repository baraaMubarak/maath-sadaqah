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

// ===== زر التثبيت (منفصل تماماً) =====
(function() {
    let deferredPrompt = null;
    const installBtn = document.getElementById('installBtn');
    
    if (!installBtn) return; // ما في زر، اخرج
    
    // استمع للحدث
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // أظهر الزر بعد 3 ثواني
        setTimeout(() => {
            installBtn.style.display = 'flex';
            installBtn.classList.add('show');
        }, 3000);
    });
    
    // عند الضغط
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
            setTimeout(() => installBtn.classList.add('show'), 60000);
        }
        
        deferredPrompt = null;
    });
    
    // إذا ثبت
    window.addEventListener('appinstalled', () => {
        showToast('التطبيق مثبت ✅');
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });
    
    // إذا كان مثبت مسبقاً
    if (window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.style.display = 'none';
    }
})();
