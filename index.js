/**
 * 首頁功能模組
 * 包含漢堡菜單等基本功能
 */

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

// DOM 載入完成後初始化首頁功能
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburgerMenu);
} else {
    // 如果 DOM 已經載入完成
    initHamburgerMenu();
}
