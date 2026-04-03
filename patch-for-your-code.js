/**
 * 针对你现有代码的 JavaScript 修复补丁
 * 将此代码添加到 3_core.js 开头
 */

(function() {
    'use strict';

    // ==========================================
    // 检测函数
    // ==========================================

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    function isStandalone() {
        return window.navigator.standalone === true || 
               window.matchMedia('(display-mode: standalone)').matches;
    }

    // ==========================================
    // PWA 模式全屏处理
    // ==========================================

    function handlePWAMode() {
        if (!isStandalone()) {
            console.log('[iOS Fix] Not in PWA mode');
            return;
        }

        console.log('[iOS Fix] PWA mode detected');
        document.body.classList.add('pwa-mode');

        // 强制设置视口高度变量
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setVH();

        // 隐藏手机边框
        const phoneFrame = document.querySelector('.phone-frame');
        if (phoneFrame) {
            phoneFrame.style.cssText = `
                width: 100vw !important;
                height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                border-radius: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                background-color: transparent !important;
            `;
        }

        // 调整 screen
        const screen = document.querySelector('.screen');
        if (screen) {
            screen.style.cssText = `
                border-radius: 0 !important;
                width: 100% !important;
                height: 100% !important;
            `;
        }

        // 隐藏刘海
        const notch = document.querySelector('.notch');
        if (notch) {
            notch.style.display = 'none';
        }

        // 调整状态栏
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            statusBar.style.paddingTop = 'env(safe-area-inset-top)';
            statusBar.style.height = 'calc(54px + env(safe-area-inset-top))';
        }

        // 监听 resize
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    // ==========================================
    // 底栏位置修复
    // ==========================================

    function fixBottomElements() {
        // 获取安全区域值
        const testDiv = document.createElement('div');
        testDiv.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            pointer-events: none;
            visibility: hidden;
            z-index: -1;
        `;
        document.body.appendChild(testDiv);

        const computedStyle = window.getComputedStyle(testDiv);
        const safeAreaBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
        document.body.removeChild(testDiv);

        console.log('[iOS Fix] Safe area bottom:', safeAreaBottom);

        // 设置 CSS 变量
        document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);

        // 修复 dock 位置
        const dockContainer = document.querySelector('.dock-container');
        if (dockContainer) {
            dockContainer.style.bottom = `${Math.max(12, safeAreaBottom)}px`;
        }

        // 修复 home bar 位置
        const homeBar = document.querySelector('.home-bar');
        if (homeBar) {
            homeBar.style.bottom = `${Math.max(8, safeAreaBottom)}px`;
        }

        // 修复页面指示器位置
        const pageIndicators = document.querySelector('.page-indicators');
        if (pageIndicators) {
            pageIndicators.style.bottom = `${110 + Math.max(12, safeAreaBottom)}px`;
        }

        // 修复搜索 pill 位置
        const searchPill = document.querySelector('.home-search-pill');
        if (searchPill) {
            searchPill.style.bottom = `${75 + Math.max(12, safeAreaBottom)}px`;
        }
    }

    // ==========================================
    // 键盘处理
    // ==========================================

    function handleKeyboard() {
        if (!window.visualViewport) return;

        const initialHeight = window.visualViewport.height;
        const bottomNavs = document.querySelectorAll('.line-bottom-nav-container, .yt-bottom-nav-container');

        window.visualViewport.addEventListener('resize', () => {
            const currentHeight = window.visualViewport.height;
            const heightDiff = initialHeight - currentHeight;
            const isKeyboardOpen = heightDiff > 150;

            if (isKeyboardOpen) {
                document.body.classList.add('keyboard-open');
                
                // 隐藏底部导航
                bottomNavs.forEach(nav => {
                    nav.style.transform = 'translateY(100%)';
                    nav.style.transition = 'transform 0.25s ease';
                });
            } else {
                document.body.classList.remove('keyboard-open');
                
                // 显示底部导航
                bottomNavs.forEach(nav => {
                    nav.style.transform = '';
                });

                // 强制滚动回顶部
                setTimeout(() => {
                    window.scrollTo(0, 0);
                    document.body.scrollTop = 0;
                    document.documentElement.scrollTop = 0;
                }, 50);
            }
        });
    }

    // ==========================================
    // 强制重排（解决渲染问题）
    // ==========================================

    function forceRelayout() {
        const phoneFrame = document.querySelector('.phone-frame');
        if (phoneFrame) {
            const display = phoneFrame.style.display;
            phoneFrame.style.display = 'none';
            phoneFrame.offsetHeight;
            phoneFrame.style.display = display || '';
        }
    }

    // ==========================================
    // 初始化
    // ==========================================

    function init() {
        console.log('[iOS Fix] Initializing...');

        // PWA 模式处理
        handlePWAMode();

        // iOS 特定修复
        if (isIOS()) {
            console.log('[iOS Fix] iOS device detected');
            document.body.classList.add('ios-device');
            
            // 修复底栏位置
            fixBottomElements();
            
            // 键盘处理
            setTimeout(handleKeyboard, 500);
            
            // 强制重排
            setTimeout(forceRelayout, 100);

            // 监听方向变化
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    fixBottomElements();
                    forceRelayout();
                }, 300);
            });
        }

        console.log('[iOS Fix] Initialization complete');
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露全局 API
    window.iOSFix = {
        isIOS,
        isStandalone,
        fixBottomElements,
        forceRelayout
    };

})();
