/**
 * 漫威傳奇再起: 異變基因 戰役紀錄 JavaScript 模組
 * 處理戰役日誌的所有互動功能
 */

document.addEventListener('DOMContentLoaded', () => {
    // 檢查登入狀態，如果沒有登入則跳轉到首頁
    if (!requireLogin('../index.html')) {
        return; // 如果沒有登入，函數會自動處理跳轉
    }

    // 顯示用戶歡迎訊息
    const currentUser = getCurrentUser();
    const welcomeMessage = document.getElementById('welcome-message');
    if (currentUser && welcomeMessage) {
        welcomeMessage.textContent = `歡迎, ${currentUser.name || currentUser.given_name || '用戶'}！`;
    }

    const formElements = document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], textarea');
    const storageKey = 'mutantGenesisLog';

    /**
     * 儲存戰役資料
     * 包含用戶身份驗證和個人化儲存
     */
    function saveData() {
        // 檢查登入狀態
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('請先登入才能儲存進度！');
            return;
        }

        const data = {};
        formElements.forEach(el => {
            if (el.type === 'checkbox') {
                data[el.id] = el.checked;
            } else {
                data[el.id] = el.value;
            }
        });

        // 加入用戶身份資訊
        data.userInfo = {
            userId: currentUser.sub,
            userName: currentUser.name || currentUser.given_name,
            userEmail: currentUser.email,
            savedAt: new Date().toISOString(),
            savedAtLocal: new Date().toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        };

        // 使用包含用戶ID的唯一儲存鍵值
        const userStorageKey = `${storageKey}_${currentUser.sub}`;
        localStorage.setItem(userStorageKey, JSON.stringify(data));
        
        alert(`進度已儲存！\n用戶：${currentUser.name || currentUser.given_name}\n儲存時間：${data.userInfo.savedAtLocal}`);
    }

    /**
     * 載入戰役資料
     * 只載入當前用戶的資料
     */
    function loadData() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log('用戶未登入，無法載入個人資料');
            return;
        }

        // 使用包含用戶ID的唯一儲存鍵值
        const userStorageKey = `${storageKey}_${currentUser.sub}`;
        const savedData = localStorage.getItem(userStorageKey);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // 驗證資料是否屬於當前用戶
                if (data.userInfo && data.userInfo.userId === currentUser.sub) {
                    formElements.forEach(el => {
                        if (data[el.id] !== undefined) {
                            if (el.type === 'checkbox') {
                                el.checked = data[el.id];
                            } else {
                                el.value = data[el.id];
                            }
                        }
                    });
                    
                    console.log(`已載入 ${data.userInfo.userName} 的戰役資料 (儲存於: ${data.userInfo.savedAtLocal})`);
                } else {
                    console.log('資料不屬於當前用戶，無法載入');
                }
            } catch (error) {
                console.error('載入資料時發生錯誤:', error);
            }
        } else {
            console.log('找不到該用戶的戰役資料');
        }
    }

    /**
     * 重設戰役資料
     * 只重設當前用戶的資料
     */
    function resetData() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert('請先登入才能重設資料！');
            return;
        }

        if (confirm(`您確定要重設 ${currentUser.name || currentUser.given_name} 的所有戰役資料嗎？此動作無法復原。`)) {
            formElements.forEach(el => {
                if (el.type === 'checkbox') {
                    el.checked = false;
                } else {
                    el.value = '';
                }
            });
            
            // 移除當前用戶的資料
            const userStorageKey = `${storageKey}_${currentUser.sub}`;
            localStorage.removeItem(userStorageKey);
            
            alert(`${currentUser.name || currentUser.given_name} 的戰役資料已重設。`);
        }
    }

    // 綁定按鈕事件
    document.getElementById('saveButton').addEventListener('click', saveData);
    document.getElementById('resetButton').addEventListener('click', resetData);

    // 頁面載入時自動載入資料
    loadData();
});