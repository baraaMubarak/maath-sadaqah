import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, onValue, update, increment } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ✅ حل المشكلة: حساب المجموع من جميع المستخدمين
export function listenToGlobalCount(callback) {
    const usersRef = ref(db, 'users');
    
    onValue(usersRef, (snapshot) => {
        let total = 0;
        const users = snapshot.val() || {};
        
        // جمع جميع التسبيحات
        Object.values(users).forEach(user => {
            total += (user.count || 0);
        });
        
        // تحديث الـ global (للتأكد)
        update(ref(db, 'global'), { totalTasbih: total });
        
        callback(total);
    });
}

export function updateUserCount(deviceId, count) {
    return update(ref(db, `users/${deviceId}`), {
        count: count,
        lastActive: Date.now()
    });
}

export function getUserData(deviceId, callback) {
    const userRef = ref(db, `users/${deviceId}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val() || { count: 0 };
        callback(data);
    });
}
