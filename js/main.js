import { listenToGlobalCount } from './db.js';
import { Tasbih } from './tasbih.js';
import { 
    showToast, 
    updateGlobalCount, 
    newDua, 
    showCard, 
    closeCard, 
    saveImage, 
    copyText, 
    shareLink,
    initPersonsUI,
    openAddPersonModal,
    closeAddPersonModal,
    addNewPerson,
    selectPerson,
    updateUIForPerson
} from './ui.js';

// ===== إدارة الأشخاص =====
class PersonsManager {
    constructor() {
        this.persons = JSON.parse(localStorage.getItem('maath_persons')) || [
            { id: 'default', name: 'معاذ', colorIndex: 0, isDefault: true }
        ];
        this.currentPersonId = localStorage.getItem('maath_current_person') || 'default';
        this.tasbihInstances = {};
    }

    getCurrentPerson() {
        return this.persons.find(p => p.id === this.currentPersonId) || this.persons[0];
    }

    getCurrentPersonIndex() {
        return this.persons.findIndex(p => p.id === this.currentPersonId);
    }

    addPerson(name) {
        const id = 'p' + Date.now();
        const colorIndex = this.persons.length;
        const newPerson = { id, name, colorIndex };
        this.persons.push(newPerson);
        this.savePersons();
        return newPerson;
    }

    selectPerson(id) {
        this.currentPersonId = id;
        localStorage.setItem('maath_current_person', id);
        return this.getCurrentPerson();
    }

    savePersons() {
        localStorage.setItem('maath_persons', JSON.stringify(this.persons));
    }

    getAllPersons() {
        return this.persons;
    }
}

// ===== تهيئة التطبيق =====
const personsManager = new PersonsManager();
let currentTasbih = null;
let globalCount = 0;

// تهيئة الواجهة
function init() {
    const currentPerson = personsManager.getCurrentPerson();
    
    // تحديث UI حسب الشخص الحالي
    updateUIForPerson(currentPerson, personsManager.getCurrentPersonIndex());
    
    // تهيئة قائمة الأشخاص
    initPersonsUI(personsManager.getAllPersons(), currentPerson.id, (id) => {
        const person = personsManager.selectPerson(id);
        updateUIForPerson(person, personsManager.getCurrentPersonIndex());
        initTasbih(person);
    });

    // تهيئة التسبيح
    initTasbih(currentPerson);

    // الاستماع للعداد العام
    listenToGlobalCount((count) => {
        globalCount = count;
        updateGlobalCount(count);
    });

    // تسجيل Service Worker
    registerSW();

    // إعداد زر التثبيت
    setupInstallButton();

    // توفير الدوال للـ HTML
    window.newDua = () => newDua(personsManager.getCurrentPerson().name);
    window.showCard = () => showCard(personsManager.getCurrentPerson());
    window.closeCard = closeCard;
    window.saveImage = saveImage;
    window.copyText = copyText;
    window.shareLink = () => shareLink(globalCount);
    window.openAddPersonModal = openAddPersonModal;
    window.closeAddPersonModal = closeAddPersonModal;
    window.addNewPerson = () => {
        const name = document.getElementById('newPersonName').value.trim();
        if (name) {
            const newPerson = personsManager.addPerson(name);
            initPersonsUI(personsManager.getAllPersons(), newPerson.id, (id) => {
                const person = personsManager.selectPerson(id);
                updateUIForPerson(person, personsManager.getCurrentPersonIndex());
                initTasbih(person);
            });
            closeAddPersonModal();
            selectPerson(newPerson.id);
            showToast(`تم إضافة ${name} ✅`);
        }
    };
}

// تهيئة التسبيح
function initTasbih(person) {
    if (currentTasbih) {
        currentTasbih.destroy();
    }
    currentTasbih = new Tasbih(person);
}

// تسجيل Service Worker
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('SW registered:', reg))
            .catch((err) => console.log('SW error:', err));
    }
}

// إعداد زر التثبيت
function setupInstallButton() {
    let deferredPrompt = null;
    const installBtn = document.getElementById('installBtn');

    if (!installBtn) return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        setTimeout(() => {
            installBtn.style.display = 'block';
            installBtn.classList.add('show');
        }, 2000);
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
            setTimeout(() => installBtn.classList.add('show'), 60000);
        }

        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        showToast('التطبيق مثبت ✅');
        installBtn.style.display = 'none';
        deferredPrompt = null;
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
        installBtn.style.display = 'none';
    }
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', init);
// تهيئة التسبيح
function initTasbih(person) {
    // ما نحتاج نعمل destroy، فقط نعمل instance جديد
    currentTasbih = new Tasbih(person);
}
