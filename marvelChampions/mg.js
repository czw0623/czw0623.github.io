/**
 * 漫威傳奇再起: 異變基因 戰役紀錄 JavaScript 模組
 * 處理戰役日誌的所有互動功能 - 支援雲端同步
 */

// 全域變數
let cloudStorage = null;
const gameFileName = 'marvelChampions_mutantGenesis.json';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 檢查登入狀態，但不立即跳轉
        const user = getCurrentUser();
        if (!user) {
            // 顯示未登入狀態
            showNotLoggedIn();
            return;
        }

        // 顯示用戶歡迎訊息
        showUserWelcome();
        
        // 初始化雲端儲存 (非阻塞)
        initCloudStorageAsync();
        
        // 綁定按鈕事件
        document.getElementById('saveButton').addEventListener('click', saveData);
        document.getElementById('resetButton').addEventListener('click', resetData);
        
        // 自動載入資料
        await loadData();
        
        // 隱藏載入訊息
        hideLoadingMessage();
        
    } catch (error) {
        console.error('頁面初始化失敗:', error);
        showSaveStatus('頁面載入失敗', 'error');
    }
});

/**
 * 非阻塞初始化雲端儲存
 */
async function initCloudStorageAsync() {
    try {
        console.log('開始初始化儲存系統...');
        cloudStorage = new CloudStorage();
        await cloudStorage.init();
        
        // 檢查實際的儲存類型
        const storageInfo = cloudStorage.getStorageInfo();
        console.log('✅ 儲存系統已連接:', storageInfo);
        
        if (cloudStorage.isCloudSyncAvailable && cloudStorage.isCloudSyncAvailable()) {
            updateSyncStatus('☁️ 雲端同步就緒', 'success');
        } else {
            updateSyncStatus('📱 本地儲存模式', 'info');
        }
    } catch (error) {
        console.warn('⚠️ 儲存系統初始化失敗:', error.message);
        updateSyncStatus('❌ 儲存系統錯誤', 'error');
    }
}

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
 * 顯示未登入狀態
 */
function showNotLoggedIn() {
    const welcomeElement = document.getElementById('welcome-message');
    const syncInfo = document.getElementById('sync-info');
    
    if (welcomeElement) {
        welcomeElement.innerHTML = `
            <strong style="color: #dc3545;">尚未登入</strong> 
            <br><small>請先<a href="../index.html" style="color: #007bff;">登入</a>以使用戰役紀錄功能</small>
        `;
    }
    
    if (syncInfo) {
        syncInfo.textContent = '❌ 需要登入';
        syncInfo.style.color = '#dc3545';
    }
    
    // 禁用按鈕
    const saveButton = document.getElementById('saveButton');
    const resetButton = document.getElementById('resetButton');
    
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = '請先登入';
    }
    
    if (resetButton) {
        resetButton.disabled = true;
        resetButton.textContent = '請先登入';
    }
    
    console.log('顯示未登入狀態');
}

/**
 * 顯示用戶歡迎訊息
 */
function showUserWelcome() {
    const user = getCurrentUser();
    const welcomeElement = document.getElementById('welcome-message');
    
    if (user && welcomeElement) {
        welcomeElement.innerHTML = `
            <strong>歡迎，${user.name}！</strong> 
            <small>(${user.email})</small>
        `;
        console.log('用戶歡迎訊息已顯示:', user.name);
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
    const user = getCurrentUser();
    data._metadata = {
        userId: user.sub,
        userName: user.name || user.given_name,
        userEmail: user.email,
        lastModified: new Date().toISOString(),
        version: '2.0'
    };

    return data;
}

/**
 * 設定表單資料
 * @param {Object} data 要載入的資料
 */
function setFormData(data) {
    if (!data) return;

    const formElements = document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], textarea');
    
    formElements.forEach(el => {
        if (data.hasOwnProperty(el.id)) {
            if (el.type === 'checkbox') {
                el.checked = data[el.id];
            } else {
                el.value = data[el.id];
            }
        }
    });

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
 * 儲存資料 - 支援雲端同步
 */
async function saveData() {
    const user = getCurrentUser();
    if (!user) {
        alert('請先登入才能儲存資料！');
        return;
    }

    const saveButton = document.getElementById('saveButton');
    const originalText = saveButton.textContent;
    
    try {
        saveButton.textContent = '儲存中...';
        saveButton.disabled = true;

        const data = getFormData();
        
        // 儲存到雲端儲存系統（目前為本地模式）
        if (cloudStorage && cloudStorage.isInitialized) {
            const result = await cloudStorage.saveGameData(gameFileName, data);
            console.log('✅ 資料已儲存:', result);
            
            // 檢查儲存類型並顯示正確訊息
            if (cloudStorage.isCloudSyncAvailable && cloudStorage.isCloudSyncAvailable()) {
                showSaveStatus('已同步至雲端', 'success');
            } else {
                showSaveStatus('已儲存至本地', 'info');
            }
        } else {
            throw new Error('儲存系統不可用');
        }

        // 額外的本地備份（舊格式相容性）
        const localKey = `${gameFileName}_${user.sub}`;
        localStorage.setItem(localKey, JSON.stringify(data));
        console.log('✅ 相容性備份已建立');

    } catch (error) {
        console.error('儲存失敗:', error);
        
        // 如果主要儲存失敗，嘗試緊急本地儲存
        try {
            const data = getFormData();
            const emergencyKey = `emergency_${gameFileName}_${user.sub}`;
            localStorage.setItem(emergencyKey, JSON.stringify(data));
            showSaveStatus('已儲存至本地 (緊急模式)', 'warning');
        } catch (localError) {
            console.error('緊急儲存也失敗:', localError);
            showSaveStatus('儲存失敗', 'error');
        }
    } finally {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    }
}

/**
 * 載入資料 - 優先從雲端載入
 */
async function loadData() {
    const user = getCurrentUser();
    if (!user) {
        console.log('用戶未登入，跳過載入資料');
        return;
    }

    console.log('開始載入資料...');

    try {
        let data = null;

        // 先嘗試從本地載入（更快）
        const localKey = `${gameFileName}_${user.sub}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
            try {
                data = JSON.parse(localData);
                console.log('📱 從本地載入資料');
                updateSyncStatus('📱 本地資料已載入', 'info');
            } catch (error) {
                console.error('本地資料解析失敗:', error);
            }
        }

        // 如果有本地資料，先顯示，然後嘗試雲端同步
        if (data) {
            setFormData(data);
        }

        // 嘗試從儲存系統載入
        if (cloudStorage && cloudStorage.isInitialized) {
            try {
                const cloudData = await cloudStorage.loadGameData(gameFileName);
                
                if (cloudData && cloudData.data) {
                    // 比較儲存系統和本地資料的時間戳
                    if (!data || new Date(cloudData.lastModified) > new Date(data._metadata?.lastModified || 0)) {
                        console.log('✅ 從儲存系統載入較新資料');
                        setFormData(cloudData.data);
                        
                        // 顯示正確的載入來源
                        if (cloudStorage.isCloudSyncAvailable && cloudStorage.isCloudSyncAvailable()) {
                            updateSyncStatus('☁️ 雲端資料已載入', 'success');
                        } else {
                            updateSyncStatus('📱 本地資料已載入', 'info');
                        }
                        
                        // 同步到舊格式本地儲存以保持相容性
                        localStorage.setItem(localKey, JSON.stringify(cloudData.data));
                    } else {
                        console.log('舊格式本地資料較新，保持本地版本');
                        updateSyncStatus('📱 本地資料較新', 'info');
                    }
                } else if (data) {
                    // 只有舊格式本地資料
                    updateSyncStatus('📱 本地資料已載入', 'info');
                }
            } catch (error) {
                console.warn('儲存系統載入失敗:', error.message);
                if (data) {
                    updateSyncStatus('📱 本地資料已載入', 'info');
                } else {
                    updateSyncStatus('⚠️ 載入失敗', 'warning');
                }
            }
        }

        // 如果沒有任何資料
        if (!data) {
            console.log('沒有找到儲存的資料');
            updateSyncStatus('📝 新的遊戲紀錄', 'info');
        }

        console.log('資料載入完成');

    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        updateSyncStatus('❌ 載入失敗', 'error');
    }
}

/**
 * 重設表單資料
 */
function resetData() {
    if (confirm('確定要重設所有資料嗎？此操作無法復原。')) {
        const formElements = document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], textarea');
        
        formElements.forEach(el => {
            if (el.type === 'checkbox') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });

        showSaveStatus('資料已重設', 'info');
        console.log('表單已重設');
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