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
    updateUIForPerson
} from './ui.js';

// ===== إدارة الأشخاص =====
class PersonsManager {
    constructor() {
        this.persons = JSON.parse(localStorage.getItem('maath_persons')) || [
            { id: 'default', name: 'معاذ', colorIndex: 0, isDefault: true }
        ];
        this.currentPersonId = localStorage.getItem('maath_current_person') || 'default';
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

function init() {
    try {
        const currentPerson = personsManager.getCurrentPerson();
        
        // تحديث UI
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

        // ربط الأزرار
        setupButtons();
        
    } catch (err) {
        console.error('Init error:', err);
    }
}

function initTasbih(person) {
    try {
        if (currentTasbih) {
            currentTasbih.destroy();
        }
        currentTasbih = new Tasbih(person);
    } catch (err) {
        console.error('Tasbih error:', err);
    }
}

function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('SW registered:', reg))
            .catch((err) => console.log('SW error:', err));
    }
}

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

// ===== ربط الأزرار =====
function setupButtons() {
    // زر إضافة شخص
    const addPersonBtn = document.getElementById('addPersonBtn');
    if (addPersonBtn) {
        addPersonBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openAddPersonModal();
        });
    }

    // أزرار Modal إضافة شخص
    const cancelBtn = document.querySelector('.modal-actions .cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAddPersonModal);
    }

    const addBtn = document.querySelector('.modal-actions .primary');
    if (addBtn) {
        addBtn.addEventListener('click', addNewPerson);
    }

    // أزرار البطاقة
    const buttons = document.querySelectorAll('.buttons .btn');
    if (buttons.length >= 2) {
        buttons[0].addEventListener('click', () => {
            showCard(personsManager.getCurrentPerson());
        });
        buttons[1].addEventListener('click', () => shareLink(globalCount));
    }

    // زر الدعاء
    const duaBtn = document.querySelector('.dua-btn');
    if (duaBtn) {
        duaBtn.addEventListener('click', () => {
            newDua(personsManager.getCurrentPerson().name);
        });
    }

    // أزرار Modal البطاقة
    const closeCardBtn = document.querySelector('.close-btn');
    if (closeCardBtn) {
        closeCardBtn.addEventListener('click', closeCard);
    }

    const saveImageBtn = document.querySelector('.save-btn');
    if (saveImageBtn) {
        saveImageBtn.addEventListener('click', saveImage);
    }

    const copyTextBtn = document.querySelector('.copy-btn');
    if (copyTextBtn) {
        copyTextBtn.addEventListener('click', copyText);
    }
}

// ===== دوال مساعدة =====
function addNewPerson() {
    const input = document.getElementById('newPersonName');
    const name = input ? input.value.trim() : '';
    
    if (name) {
        const newPerson = personsManager.addPerson(name);
        
        // تحديث قائمة الأشخاص
        initPersonsUI(personsManager.getAllPersons(), newPerson.id, (id) => {
            const person = personsManager.selectPerson(id);
            updateUIForPerson(person, personsManager.getCurrentPersonIndex());
            initTasbih(person);
        });
        
        closeAddPersonModal();
        showToast(`تم إضافة ${name} ✅`);
    }
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', init);
