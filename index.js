/**
 * 首頁專用的 Google 登入 UI 處理模組
 * 包含用戶界面更新等首頁特定功能
 */

/**
 * 顯示用戶資訊並更新首頁 UI 狀態
 * @param {object} userInfo - 用戶資訊物件
 */
function showUserInfo(userInfo) {
    // 更新主要狀態區域
    const loggedOutState = document.getElementById('logged-out-state');
    const loggedInState = document.getElementById('logged-in-state');
    
    if (loggedOutState) loggedOutState.style.display = 'none';
    if (loggedInState) loggedInState.style.display = 'flex'; // Use flex for better alignment
    
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
}

/**
 * 首頁登出功能
 * 清除 UI 狀態並調用核心登出功能
 */
function indexSignOut() {
    try {
        // 調用核心登出功能
        signOutCore();
        
        // 更新首頁 UI 狀態
        const loggedOutState = document.getElementById('logged-out-state');
        const loggedInState = document.getElementById('logged-in-state');
        
        if (loggedOutState) loggedOutState.style.display = 'block';
        if (loggedInState) loggedInState.style.display = 'none';
        
        // 關閉可能開啟的 lightbox
        closeUserInfoLightbox();
        
        console.log('首頁用戶狀態已重設');
    } catch (error) {
        console.error('首頁登出時發生錯誤:', error);
    }
}

/**
 * 檢查登入狀態並更新首頁 UI
 */
function checkIndexLoginStatus() {
    try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            showUserInfo(userInfo);
        }
    } catch (error) {
        console.error('檢查首頁登入狀態時發生錯誤:', error);
        // 如果 localStorage 中的資料有問題，清除它
        localStorage.removeItem('userInfo');
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
 * Google 登入回調函數（首頁專用）
 * 處理登入成功後的 UI 更新
 */
function handleCredentialResponse(response) {
    // 解碼 JWT token
    const responsePayload = decodeJwtResponse(response.credential);
    
    console.log("ID: " + responsePayload.sub);
    console.log('Full Name: ' + responsePayload.name);
    console.log('Given Name: ' + responsePayload.given_name);
    console.log('Family Name: ' + responsePayload.family_name);
    console.log("Image URL: " + responsePayload.picture);
    console.log("Email: " + responsePayload.email);
    
    // 儲存用戶資訊到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(responsePayload));
    
    // 顯示用戶資訊
    showUserInfo(responsePayload);
}

/**
 * 漢堡菜單控制功能
 */
function initHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const body = document.body;
    
    // 開啟菜單
    function openMenu() {
        hamburgerBtn.classList.add('active');
        sidebarMenu.classList.add('active');
        sidebarOverlay.classList.add('active');
        body.classList.add('menu-open');
    }
    
    // 關閉菜單
    function closeMenu() {
        hamburgerBtn.classList.remove('active');
        sidebarMenu.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        body.classList.remove('menu-open');
    }
    
    // 切換菜單狀態
    function toggleMenu() {
        if (sidebarMenu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    // 綁定事件
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMenu);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMenu);
    }
    
    // 點擊側邊菜單內的連結時關閉菜單
    const menuLinks = sidebarMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    // ESC 鍵關閉菜單
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // 視窗大小改變時關閉菜單
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidebarMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}

/**
 * 初始化首頁的 Google 登入功能
 * 綁定事件監聽器並檢查登入狀態
 */
function initIndexGoogleAuth() {
    // 初始化漢堡菜單
    initHamburgerMenu();
    
    // 檢查登入狀態
    checkIndexLoginStatus();
    
    // 綁定登出按鈕事件
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', indexSignOut);
    }
    
    // 綁定 lightbox 關閉按鈕
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
    const userInfoLightbox = document.getElementById('user-info-lightbox');
    
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
            closeUserInfoLightbox();
        }
    });
}

// DOM 載入完成後初始化首頁功能
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndexGoogleAuth);
} else {
    // 如果 DOM 已經載入完成
    initIndexGoogleAuth();
}
