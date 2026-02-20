import { updateUserCount } from './db.js';
import { adhkar } from './config.js';

export class Tasbih {
    constructor() {
        this.deviceId = this.getDeviceId();
        this.count = parseInt(localStorage.getItem('maath_count')) || 0;
        this.sessionCount = 0;
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
    
    init() {
        // إنشاء النقاط
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
        localStorage.setItem('maath_count', this.count);
        
        this.updateDisplay();
        updateUserCount(this.deviceId, this.count);
        
        if (navigator.vibrate) navigator.vibrate(15);
    }
    
    updateDisplay() {
        this.elements.personalCount.textContent = this.count;
        
        // تحديث النقاط
        const dots = this.elements.dots.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i < (this.sessionCount % 33));
        });
        
        // تغيير الذكر
        const dhikrIndex = Math.floor(this.sessionCount / 33) % adhkar.length;
        this.elements.text.textContent = adhkar[dhikrIndex];
    }
    
    getCount() { return this.count; }
}
