import { updateUserCount } from './db.js';
import { adhkar, getPersonColor } from './config.js';

export class Tasbih {
    constructor(person) {
        this.person = person;
        this.deviceId = this.getDeviceId();
        this.count = this.getPersonCount();
        this.sessionCount = 0;
        this.colorIndex = person.colorIndex || 0;
        
        this.elements = {
            btn: document.getElementById('tasbihBtn'),
            personalCount: document.getElementById('personalCount'),
            dots: document.getElementById('dots'),
            text: document.querySelector('#tasbihBtn span')
        };

        this.init();
    }

    getDeviceId() {
        let id = localStorage.getItem('maath_id');
        if (!id) {
            id = 'u' + Date.now() + Math.random().toString(36).substr(2, 5);
            localStorage.setItem('maath_id', id);
        }
        return id;
    }

    getPersonCount() {
        const counts = JSON.parse(localStorage.getItem('maath_persons_counts')) || {};
        return counts[this.person.id] || 0;
    }

    savePersonCount() {
        const counts = JSON.parse(localStorage.getItem('maath_persons_counts')) || {};
        counts[this.person.id] = this.count;
        localStorage.setItem('maath_persons_counts', JSON.stringify(counts));
    }

    init() {
        // إنشاء النقاط
        this.elements.dots.innerHTML = '';
        for (let i = 0; i < 33; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            this.elements.dots.appendChild(dot);
        }

        this.updateDisplay();
        this.elements.btn.addEventListener('click', () => this.click());
    }

    click() {
        this.count++;
        this.sessionCount++;
        this.savePersonCount();

        this.updateDisplay();
        updateUserCount(`${this.deviceId}_${this.person.id}`, this.count);

        // اهتزاز
        if (navigator.vibrate) navigator.vibrate(15);

        // animation
        this.elements.btn.classList.add('clicking');
        setTimeout(() => this.elements.btn.classList.remove('clicking'), 300);
    }

    updateDisplay() {
        this.elements.personalCount.textContent = this.count.toLocaleString('ar-SA');

        // تحديث النقاط
        const dots = this.elements.dots.querySelectorAll('.dot');
        const activeDots = this.sessionCount % 33;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i < activeDots);
        });

        // تغيير الذكر
        const dhikrIndex = Math.floor(this.sessionCount / 33) % adhkar.length;
        this.elements.text.textContent = adhkar[dhikrIndex];
    }

    getCount() {
        return this.count;
    }

    destroy() {
        // إزالة event listeners إذا لزم
        const newBtn = this.elements.btn.cloneNode(true);
        this.elements.btn.parentNode.replaceChild(newBtn, this.elements.btn);
    }
}
