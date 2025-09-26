/**
 * Google OAuth 登入功能模組 - Lightbox 版本
 * 包含登入、登出、用戶狀態管理等功能
 */

// Google 登入回調函數
function handleCredentialResponse(response) {
    // 解碼 JWT token
    const responsePayload = decodeJwtResponse(response.credential);
    
    console.log("ID: " + responsePayload.sub);
    console.log('Full Name: ' + responsePayload.name);
    console.log('Given Name: ' + responsePayload.given_name);
    console.log('Family Name: ' + responsePayload.family_name);
    console.log("Image URL: " + responsePayload.picture);
    console.log("Email: " + responsePayload.email);
    
    // 關閉登入 lightbox
    closeLightbox();
    
    // 顯示用戶資訊
    showUserInfo(responsePayload);
}

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
 * 顯示用戶資訊並更新 UI 狀態
 * @param {object} userInfo - 用戶資訊物件
 */
function showUserInfo(userInfo) {
    // 更新主要狀態區域
    const loggedOutState = document.getElementById('logged-out-state');
    const loggedInState = document.getElementById('logged-in-state');
    
    if (loggedOutState) loggedOutState.style.display = 'none';
    if (loggedInState) loggedInState.style.display = 'block';
    
    // 更新用戶摘要
    const userAvatar = document.getElementById('user-avatar');
    const userGreeting = document.getElementById('user-greeting');
    
    if (userAvatar && userInfo.picture) {
        userAvatar.src = userInfo.picture;
    }
    if (userGreeting) {
        userGreeting.textContent = `你好，${userInfo.given_name || userInfo.name || '用戶'}！`;
    }
    
    // 更新 lightbox 中的用戶詳細資訊
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userPicture = document.getElementById('user-picture');
    
    if (userName) userName.textContent = userInfo.name || '未知用戶';
    if (userEmail) userEmail.textContent = userInfo.email || '無Email';
    if (userPicture && userInfo.picture) userPicture.src = userInfo.picture;
    
    // 儲存用戶資訊到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
}

/**
 * 登出功能
 * 清除 Google 登入狀態和本地儲存
 */
function signOut() {
    try {
        // 清除 Google 登入狀態
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }
        
        // 清除本地儲存
        localStorage.removeItem('userInfo');
        
        // 更新 UI 狀態
        const loggedOutState = document.getElementById('logged-out-state');
        const loggedInState = document.getElementById('logged-in-state');
        
        if (loggedOutState) loggedOutState.style.display = 'block';
        if (loggedInState) loggedInState.style.display = 'none';
        
        // 關閉可能開啟的 lightbox
        closeUserInfoLightbox();
        
        console.log('用戶已登出');
    } catch (error) {
        console.error('登出時發生錯誤:', error);
    }
}

/**
 * 檢查是否已經登入
 * 從 localStorage 恢復登入狀態
 */
function checkLoginStatus() {
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            showUserInfo(userInfo);
        }
    } catch (error) {
        console.error('檢查登入狀態時發生錯誤:', error);
        // 如果 localStorage 中的資料有問題，清除它
        localStorage.removeItem('userInfo');
    }
}

/**
 * 開啟登入 lightbox
 */
function openLoginLightbox() {
    const lightbox = document.getElementById('login-lightbox');
    if (lightbox) {
        lightbox.style.display = 'flex';
        // 使用 setTimeout 確保 CSS transition 能正常運作
        setTimeout(() => {
            lightbox.classList.add('active');
        }, 10);
    }
}

/**
 * 關閉登入 lightbox
 */
function closeLightbox() {
    const lightbox = document.getElementById('login-lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 300); // 等待動畫完成
    }
}

/**
 * 開啟用戶資訊 lightbox
 */
function openUserInfoLightbox() {
    const lightbox = document.getElementById('user-info-lightbox');
    if (lightbox) {
        lightbox.style.display = 'flex';
        setTimeout(() => {
            lightbox.classList.add('active');
        }, 10);
    }
}

/**
 * 關閉用戶資訊 lightbox
 */
function closeUserInfoLightbox() {
    const lightbox = document.getElementById('user-info-lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 300);
    }
}

/**
 * 初始化 Google 登入功能
 * 綁定事件監聽器並檢查登入狀態
 */
function initGoogleAuth() {
    // 檢查登入狀態
    checkLoginStatus();
    
    // 綁定登入觸發按鈕
    const loginTriggerBtn = document.getElementById('login-trigger-btn');
    if (loginTriggerBtn) {
        loginTriggerBtn.addEventListener('click', openLoginLightbox);
    }
    
    // 綁定登出按鈕事件
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', signOut);
    }
    
    // 綁定 lightbox 關閉按鈕
    const closeLightboxBtn = document.getElementById('close-lightbox');
    if (closeLightboxBtn) {
        closeLightboxBtn.addEventListener('click', closeLightbox);
    }
    
    const closeUserInfoBtn = document.getElementById('close-user-info');
    if (closeUserInfoBtn) {
        closeUserInfoBtn.addEventListener('click', closeUserInfoLightbox);
    }
    
    // 綁定用戶摘要點擊事件（點擊頭像或名字顯示詳細資訊）
    const userSummary = document.getElementById('user-summary');
    if (userSummary) {
        userSummary.addEventListener('click', openUserInfoLightbox);
        userSummary.style.cursor = 'pointer';
    }
    
    // 點擊 lightbox 背景關閉
    const loginLightbox = document.getElementById('login-lightbox');
    const userInfoLightbox = document.getElementById('user-info-lightbox');
    
    if (loginLightbox) {
        loginLightbox.addEventListener('click', (e) => {
            if (e.target === loginLightbox) {
                closeLightbox();
            }
        });
    }
    
    if (userInfoLightbox) {
        userInfoLightbox.addEventListener('click', (e) => {
            if (e.target === userInfoLightbox) {
                closeUserInfoLightbox();
            }
        });
    }
    
    // ESC 鍵關閉 lightbox
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeUserInfoLightbox();
        }
    });
}

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', initGoogleAuth);

// 為了向後兼容，也支援 window.onload
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleAuth);
} else {
    // 如果 DOM 已經載入完成
    initGoogleAuth();
}