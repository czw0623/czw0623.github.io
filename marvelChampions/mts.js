/**
 * 漫威傳奇再起: The Mad Titan's Shadow 戰役紀錄 JavaScript 模組
 * 處理戰役日誌的所有互動功能 - 本地儲存
 */

// 全域錯誤處理
window.addEventListener('error', (event) => {
    console.warn('捕獲到全域錯誤:', event.error);
    // 防止錯誤冒泡到瀏覽器控制台
    if (event.error && event.error.message && event.error.message.includes('runtime.lastError')) {
        event.preventDefault();
        console.log('已忽略 runtime.lastError 錯誤');
    }
});

// 處理未捕獲的 Promise 拒絕
window.addEventListener('unhandledrejection', (event) => {
    console.warn('捕獲到未處理的 Promise 拒絕:', event.reason);
    if (event.reason && typeof event.reason === 'string' && event.reason.includes('runtime.lastError')) {
        event.preventDefault();
        console.log('已忽略 runtime.lastError Promise 拒絕');
    }
});

// 全域變數
const gameFileName = 'marvelChampions_madTitansShadow.json';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('📋 The Mad Titan\'s Shadow 頁面開始初始化...');
        
        // 顯示本地用戶歡迎訊息
        showUserWelcome();
        
        // 綁定按鈕事件
        const saveButton = document.getElementById('saveButton');
        const resetButton = document.getElementById('resetButton');
        
        if (saveButton) {
            saveButton.addEventListener('click', saveData);
            console.log('✅ 儲存按鈕事件已綁定');
        } else {
            console.error('❌ 找不到儲存按鈕');
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', resetData);
            console.log('✅ 重設按鈕事件已綁定');
        } else {
            console.error('❌ 找不到重設按鈕');
        }
        
        // 自動載入資料
        console.log('📋 開始載入資料...');
        await loadData();
        console.log('📋 資料載入完成');
        
        // 隱藏載入訊息
        hideLoadingMessage();
        
        console.log('📋 The Mad Titan\'s Shadow 頁面初始化完成');
        
    } catch (error) {
        console.error('頁面初始化失敗:', error);
        showSaveStatus('頁面載入失敗', 'error');
    }
});

/**
 * 隱藏載入訊息
 */
function hideLoadingMessage() {
    const welcomeElement = document.getElementById('welcome-message');
    if (welcomeElement && welcomeElement.textContent.includes('載入中')) {
        showUserWelcome();
    }
}

/**
 * 更新同步狀態
 */
function updateSyncStatus(message, type = 'info') {
    const syncInfo = document.getElementById('sync-info');
    if (syncInfo) {
        syncInfo.textContent = message;
        
        // 設定顏色
        const colors = {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        };
        syncInfo.style.color = colors[type] || colors.info;
    }
}

/**
 * 獲取本地用戶資訊
 */
function getLocalUser() {
    // 使用簡單的本地用戶系統
    let localUser = localStorage.getItem('localUser');
    if (!localUser) {
        // 創建一個固定的本地用戶
        const userId = 'local_user';
        localUser = {
            sub: userId,
            name: '本地用戶',
            email: 'local@example.com'
        };
        localStorage.setItem('localUser', JSON.stringify(localUser));
        console.log('創建新的本地用戶:', localUser);
    } else {
        localUser = JSON.parse(localUser);
        console.log('載入現有本地用戶:', localUser);
    }
    return localUser;
}

/**
 * 顯示用戶歡迎訊息
 */
function showUserWelcome() {
    const user = getLocalUser();
    const welcomeElement = document.getElementById('welcome-message');
    
    if (user && welcomeElement) {
        welcomeElement.innerHTML = `
            <strong>歡迎使用瘋狂泰坦陰影戰役紀錄！</strong> 
            <small>本地儲存模式</small>
        `;
        console.log('用戶歡迎訊息已顯示');
    } else if (welcomeElement) {
        welcomeElement.textContent = '用戶資訊載入中...';
        console.warn('用戶資訊不可用');
    } else {
        console.error('找不到歡迎訊息元素');
    }
}

/**
 * 取得表單資料
 * @returns {Object} 表單資料物件
 */
function getFormData() {
    const formElements = document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], textarea');
    const data = {};
    
    formElements.forEach(el => {
        if (el.type === 'checkbox') {
            data[el.id] = el.checked;
        } else {
            data[el.id] = el.value;
        }
    });

    // 加入元數據
    const user = getLocalUser();
    data._metadata = {
        userId: user.sub,
        userName: user.name || '本地用戶',
        userEmail: user.email,
        lastModified: new Date().toISOString(),
        version: '1.0',
        campaign: 'mad_titans_shadow'
    };

    return data;
}

/**
 * 設定表單資料
 * @param {Object} data 要載入的資料
 */
function setFormData(data) {
    if (!data) {
        console.log('setFormData: 沒有資料可載入');
        return;
    }

    console.log('setFormData: 開始載入資料:', Object.keys(data).length, '個欄位');
    
    const formElements = document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], textarea');
    let loadedCount = 0;
    
    formElements.forEach(el => {
        if (data.hasOwnProperty(el.id)) {
            if (el.type === 'checkbox') {
                el.checked = data[el.id];
            } else {
                el.value = data[el.id];
            }
            loadedCount++;
        }
    });
    
    console.log('setFormData: 已載入', loadedCount, '個表單欄位');

    // 顯示同步資訊
    if (data._metadata) {
        const syncInfo = document.getElementById('sync-info');
        if (syncInfo) {
            const lastModified = new Date(data._metadata.lastModified);
            syncInfo.textContent = `最後更新: ${lastModified.toLocaleString('zh-TW')}`;
        }
    }
}

/**
 * 儲存資料 - 本地儲存
 */
async function saveData() {
    console.log('💾 瘋狂泰坦陰影儲存按鈕被點擊');
    
    try {
        const gameData = getFormData();
        const user = getLocalUser();
        const localKey = `${gameFileName}_${user.sub}`;
        
        localStorage.setItem(localKey, JSON.stringify(gameData));
        console.log('💾 瘋狂泰坦陰影資料已儲存到本地:', localKey);
        
        showSaveStatus('瘋狂泰坦陰影資料已成功儲存', 'success');
        updateSyncStatus('� 已儲存瘋狂泰坦陰影資料', 'success');
        
    } catch (error) {
        console.error('❌ 瘋狂泰坦陰影儲存錯誤:', error);
        showSaveStatus('儲存失敗', 'error');
    }
}

/**
 * 載入資料 - 從本地載入
 */
function loadData() {
    console.log('📂 載入瘋狂泰坦陰影資料...');
    
    try {
        const user = getLocalUser();
        const localKey = `${gameFileName}_${user.sub}`;
        const savedData = localStorage.getItem(localKey);
        
        if (savedData) {
            console.log('📂 找到本地瘋狂泰坦陰影資料');
            const gameData = JSON.parse(savedData);
            setFormData(gameData);
            console.log('📂 瘋狂泰坦陰影資料載入完成');
            updateSyncStatus('📂 瘋狂泰坦陰影資料載入完成', 'success');
        } else {
            console.log('📂 沒有找到瘋狂泰坦陰影資料');
            updateSyncStatus('📝 新的瘋狂泰坦陰影遊戲紀錄', 'info');
        }
    } catch (error) {
        console.error('❌ 瘋狂泰坦陰影載入錯誤:', error);
        updateSyncStatus('❌ 載入失敗', 'error');
    }
}

/**
 * 重設表單資料
 */
function resetData() {
    console.log('🗑️ 瘋狂泰坦陰影重設按鈕被點擊');
    if (confirm('確定要重設所有瘋狂泰坦陰影資料嗎？此操作無法復原。')) {
        console.log('🗑️ 開始重設表單...');
        
        // 清空表單元素
        const formElements = document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], textarea');
        
        formElements.forEach(el => {
            if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });

        // 清除本地儲存
        const user = getLocalUser();
        const localKey = `${gameFileName}_${user.sub}`;
        localStorage.removeItem(localKey);
        console.log('🗑️ 已清除本地儲存:', localKey);

        // 更新狀態顯示
        showSaveStatus('瘋狂泰坦陰影資料已重設', 'info');
        updateSyncStatus('📝 新的瘋狂泰坦陰影遊戲紀錄', 'info');
        
        console.log('🗑️ 瘋狂泰坦陰影表單已重設完成');
    }
}

/**
 * 顯示儲存狀態
 * @param {string} message 訊息
 * @param {string} type 類型 (success, warning, error, info)
 */
function showSaveStatus(message, type = 'info') {
    // 移除現有狀態訊息
    const existingStatus = document.querySelector('.save-status');
    if (existingStatus) {
        existingStatus.remove();
    }

    // 創建狀態訊息
    const status = document.createElement('div');
    status.className = `save-status save-status-${type}`;
    status.textContent = message;
    
    // 添加樣式
    status.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        transition: opacity 0.3s ease;
    `;

    // 設定顏色
    const colors = {
        success: '#4CAF50',
        warning: '#FF9800', 
        error: '#F44336',
        info: '#2196F3'
    };
    status.style.backgroundColor = colors[type] || colors.info;

    // 添加到頁面
    document.body.appendChild(status);

    // 自動移除
    setTimeout(() => {
        status.style.opacity = '0';
        setTimeout(() => {
            if (status.parentNode) {
                status.parentNode.removeChild(status);
            }
        }, 300);
    }, 3000);
}