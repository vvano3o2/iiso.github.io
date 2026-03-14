// ==========================================
// TIKTOK: 2. CORE SYSTEM & NAVIGATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const tkAppBtn = document.getElementById('app-tiktok-btn');
    const tkView = document.getElementById('tiktok-view');
    const homeBar = document.getElementById('home-bar');

    // Nav Items
    const tkNavItems = document.querySelectorAll('.tk-bottom-nav .tk-nav-item[data-target]');
    const tkTabContents = document.querySelectorAll('.tk-tab-content');

    // Init function
    function initTikTok() {
        if (window.tkRenderHome) window.tkRenderHome();
        if (window.tkRenderChat) window.tkRenderChat();
        if (window.tkRenderProfile) window.tkRenderProfile();
    }

    // Open App
    if (tkAppBtn && tkView) {
        tkAppBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.isJiggleMode) return;
            
            try {
                initTikTok();
            } catch(err) {
                console.error("TikTok Init Error:", err);
            }
            
            tkView.classList.add('active');
        });
    }

    // Close App
    const closeTkApp = () => {
        window.closeView(tkView);
        window.closeView(document.getElementById('tk-video-detail-sheet'));
        window.closeView(document.getElementById('tk-edit-profile-sheet'));
        window.closeView(document.getElementById('tk-edit-char-sheet'));
        window.closeView(document.getElementById('tk-import-char-sheet'));
        window.closeView(document.getElementById('tk-share-sheet'));
        window.closeView(document.getElementById('tk-comment-user-modal'));
        document.getElementById('tk-sub-profile-view').classList.remove('active');
    };

    if (homeBar && tkView) {
        homeBar.addEventListener('click', closeTkApp);
    }

    // Top Bar Back Buttons
    const homeBackBtn = document.getElementById('tk-home-back-btn');
    if (homeBackBtn) homeBackBtn.addEventListener('click', closeTkApp);

    // Bottom Navigation Switching & Swipe Logic
    const tkNavIndicator = document.querySelector('.tk-nav-indicator');
    const mainContent = document.querySelector('.tk-main-content');
    let currentTabIndex = 0;

    function switchTab(index) {
        if (index < 0 || index >= tkNavItems.length) return;
        currentTabIndex = index;

        // Update Nav Items
        tkNavItems.forEach((nav, i) => {
            if (i === index) nav.classList.add('active');
            else nav.classList.remove('active');
        });

        // Move indicator
        if (tkNavIndicator) {
            // Get actual position and width of the clicked nav item
            const targetItem = tkNavItems[index];
            const navRect = targetItem.parentElement.getBoundingClientRect();
            const itemRect = targetItem.getBoundingClientRect();
            
            // Calculate relative left position
            const leftPos = itemRect.left - navRect.left;
            
            tkNavIndicator.style.width = `${itemRect.width}px`;
            tkNavIndicator.style.left = `${leftPos}px`;
            tkNavIndicator.style.transform = 'none'; // Clear previous transform logic
        }

        // Slide Tabs
        tkTabContents.forEach((tab, i) => {
            tab.style.transform = `translateX(-${index * 100}%)`;
            if (i === index) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Refresh specific tab data if needed
        const targetId = tkNavItems[index].getAttribute('data-target');
        if (targetId === 'tk-home-tab' && window.tkRenderHome) {
            window.tkRenderHome();
        } else if (targetId === 'tk-chat-tab' && window.tkRenderChat) {
            window.tkRenderChat();
        } else if (targetId === 'tk-profile-tab' && window.tkRenderProfile) {
            window.tkRenderProfile();
        }
    }

    tkNavItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            switchTab(index);
        });
    });

    // Swipe gestures
    let startX = 0;
    let isSwiping = false;

    if (mainContent) {
        mainContent.addEventListener('touchstart', (e) => {
            // Ignore if touching a horizontally scrollable element
            if (e.target.closest('.tk-following-bar')) return;
            startX = e.touches[0].clientX;
            isSwiping = true;
        }, { passive: true });

        mainContent.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            // Prevent default to stop native scrolling while swiping tabs horizontally
            // But we need vertical scroll to work on feed/profile, so we don't preventDefault here simply.
        }, { passive: true });

        mainContent.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            isSwiping = false;
            let endX = e.changedTouches[0].clientX;
            let diffX = startX - endX;

            if (Math.abs(diffX) > 50) { // Threshold for swipe
                if (diffX > 0 && currentTabIndex < tkNavItems.length - 1) {
                    // Swipe Left -> Next Tab
                    switchTab(currentTabIndex + 1);
                } else if (diffX < 0 && currentTabIndex > 0) {
                    // Swipe Right -> Prev Tab
                    switchTab(currentTabIndex - 1);
                }
            }
        });
    }
    
    // Initialize
    switchTab(0);
});
