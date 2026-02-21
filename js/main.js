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
