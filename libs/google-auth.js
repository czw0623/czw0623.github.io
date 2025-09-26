/**
 * Google OAuth 核心認證功能模組
 * 提供跨頁面使用的基礎認證功能，不包含 UI 相關邏輯
 */

/**
 * 解碼 JWT token
 * @param {string} token - JWT token 字串
 * @returns {object} 解碼後的用戶資訊物件
 */
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}



/**
 * 核心登出功能
 * 清除 Google 登入狀態和本地儲存，不包含 UI 更新
 */
function signOutCore() {
    try {
        // 清除 Google 登入狀態
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }
        
        // 清除本地儲存
        localStorage.removeItem('userInfo');
        
        console.log('用戶已登出');
    } catch (error) {
        console.error('登出時發生錯誤:', error);
    }
}



/**
 * 檢查用戶是否已登入，如果沒有則顯示警告並導回首頁
 * @param {string} redirectUrl - 重定向的 URL，預設為首頁
 * @returns {boolean} - 如果已登入返回 true，否則返回 false
 */
function requireLogin(redirectUrl = '/') {
    try {
        // 檢查 localStorage 中是否有用戶資訊
        const storedUserInfo = localStorage.getItem('userInfo');
        
        if (!storedUserInfo) {
            // 沒有登入，顯示警告
            alert('請先登入才能使用此功能！');
            
            // 導回首頁或指定頁面
            window.location.href = redirectUrl;
            
            return false;
        }
        
        // 嘗試解析用戶資訊
        const userInfo = JSON.parse(storedUserInfo);
        
        // 檢查用戶資訊是否有效（至少要有 email 或 sub）
        if (!userInfo.email && !userInfo.sub) {
            // 用戶資訊無效，清除並要求重新登入
            localStorage.removeItem('userInfo');
            alert('登入狀態已過期，請重新登入！');
            window.location.href = redirectUrl;
            return false;
        }
        
        // 登入狀態有效
        return true;
        
    } catch (error) {
        console.error('檢查登入狀態時發生錯誤:', error);
        
        // 如果 localStorage 中的資料有問題，清除它
        localStorage.removeItem('userInfo');
        alert('登入狀態異常，請重新登入！');
        window.location.href = redirectUrl;
        
        return false;
    }
}

/**
 * 獲取當前登入用戶的資訊
 * @returns {object|null} - 用戶資訊物件或 null
 */
function getCurrentUser() {
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            // 驗證用戶資訊的完整性
            if (userInfo.email || userInfo.sub) {
                return userInfo;
            }
        }
        return null;
    } catch (error) {
        console.error('獲取用戶資訊時發生錯誤:', error);
        localStorage.removeItem('userInfo');
        return null;
    }
}

/**
 * 檢查是否已登入（僅返回布林值，不會導向）
 * @returns {boolean} - 登入狀態
 */
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// 注意：不再自動初始化，由各頁面根據需要調用相應功能