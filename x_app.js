document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // X (Twitter) App Logic
    // ==========================================
    const xView = document.getElementById('x-view');
    const xDrawer = document.getElementById('x-drawer');
    const xDrawerOverlay = document.getElementById('x-drawer-overlay');
    const xUserProfileView = document.getElementById('x-user-profile-view');
    
    // Tabs & Nav
    const xTabsContainer = document.getElementById('x-tabs-container');
    const xBottomNavItems = document.querySelectorAll('.x-bottom-nav .x-nav-item');
    const xNavIndicator = document.getElementById('x-nav-indicator');
    
    // Tweet Detail View
    const xTweetDetailView = document.getElementById('x-tweet-detail-view');
    const xDetailBackBtn = document.getElementById('x-detail-back-btn');
    const xDetailContent = document.getElementById('x-detail-content');

    // Headers
    const xHeaderAvatarBtn = document.getElementById('x-header-avatar-btn');
    const xHeaderAvatarImg = document.getElementById('x-header-avatar-img');
    const xHeaderAvatarIcon = document.getElementById('x-header-avatar-icon');
    
    // Sheets
    const xEditProfileSheet = document.getElementById('x-edit-profile-sheet');
    const xVisitorsSheet = document.getElementById('x-visitors-sheet');

    // State
    let currentTab = 0; // 0: Home, 1: Search, 2: Notify, 3: Chat

    // --- 1. App Open/Close & Initialization ---
    const appXBtn = document.getElementById('app-x-btn') || document.querySelector('.x-app');
    
    if (appXBtn) {
        appXBtn.addEventListener('click', (e) => {
            if (window.isJiggleMode || window.preventAppClick) return;
            syncXUserData();
            if (window.openView) window.openView(xView);
        });
    }

    // --- 2. User Data Sync ---
    function syncXUserData() {
        if (!window.userState) return;
        
        // Ensure xData exists
        if (!window.userState.xData) {
            window.userState.xData = {
                name: window.userState.name || 'User',
                handle: window.userState.handle || '@user',
                bio: '点击编辑资料添加简介',
                location: '',
                following: '0',
                followers: '0',
                persona: '',
                avatar: window.userState.avatar || '', // Use global avatar as default
                banner: ''
            };
        }
        
        const x = window.userState.xData;
        
        // 1. Drawer Data
        setText('x-drawer-name', x.name);
        setText('x-drawer-handle', x.handle);
        setText('x-drawer-handle-bottom', x.handle); // Add bottom handle sync
        updateAvatar('x-drawer-avatar-img', 'x-drawer-avatar-icon', x.avatar);
        
        // Drawer Stats
        const drawerStats = document.querySelectorAll('.x-drawer-stat span');
        if (drawerStats.length >= 2) {
            drawerStats[0].textContent = x.following;
            drawerStats[1].textContent = x.followers;
        }

        // 2. Header Avatar
        updateAvatar('x-header-avatar-img', 'x-header-avatar-icon', x.avatar);

        // 3. User Profile View Data
        setText('x-profile-name-large', x.name);
        setText('x-profile-handle-large', x.handle);
        setText('x-profile-bio', x.bio || '点击编辑资料添加简介');
        
        // Location
        const locEl = document.getElementById('x-profile-location');
        if (locEl) {
            if (x.location) {
                locEl.style.display = 'flex';
                locEl.querySelector('span').textContent = x.location;
            } else {
                locEl.style.display = 'none';
            }
        }

        // Profile Stats
        setText('x-stat-following', x.following);
        setText('x-stat-followers', x.followers);
        
        // Large Avatar
        const largeAvatarImg = document.getElementById('x-profile-avatar-large-img');
        if (largeAvatarImg) {
            if (x.avatar) {
                largeAvatarImg.src = x.avatar;
                largeAvatarImg.style.display = 'block';
            } else {
                // Fallback if needed, currently just hides or shows broken image if no src
                largeAvatarImg.style.display = x.avatar ? 'block' : 'none'; 
            }
        }
        
        // Profile Banner
        const profileBannerImg = document.getElementById('x-profile-banner-img');
        if (profileBannerImg) {
            if (x.banner) {
                profileBannerImg.src = x.banner;
                profileBannerImg.style.display = 'block';
            } else {
                profileBannerImg.style.display = 'none';
            }
        }
        
        // Home Banner (Using global property for now as it was in previous code, or migrate to xData)
        // Let's stick to xData for consistency if possible, but the HTML logic used specific IDs.
        // We'll update the Home Banner based on xData.banner too? No, Home banner is usually Ads or Event. 
        // The prompt says "顶栏下面分类" but didn't explicitly say banner on Home. 
        // But my previous HTML added it. Let's keep it separate or use xData.banner? 
        // Actually, X profile banner is for profile. Home usually doesn't have a user banner. 
        // I will leave Home Banner logic separate if it was intended for customization.
        if (window.userState.xHomeBannerUrl) {
            const homeBannerImg = document.querySelector('#x-home-banner img');
            const homeBannerPlaceholder = document.querySelector('#x-home-banner .x-banner-placeholder');
            if (homeBannerImg) {
                homeBannerImg.src = window.userState.xHomeBannerUrl;
                homeBannerImg.style.display = 'block';
                if (homeBannerPlaceholder) homeBannerPlaceholder.style.display = 'none';
            }
        }
        
        // Search Banner
        if (window.userState.xSearchBannerUrl) {
            const searchBannerImg = document.querySelector('#x-search-banner img');
            const searchBannerPlaceholder = document.querySelector('#x-search-banner .x-banner-placeholder');
            if (searchBannerImg) {
                searchBannerImg.src = window.userState.xSearchBannerUrl;
                searchBannerImg.style.display = 'block';
                if (searchBannerPlaceholder) searchBannerPlaceholder.style.display = 'none';
            }
        }
    }
    
    // Helper: Set Text
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '';
    }
    
    // Helper: Update Avatar
    function updateAvatar(imgId, iconId, url) {
        const img = document.getElementById(imgId);
        const icon = document.getElementById(iconId);
        if (url) {
            if (img) { img.src = url; img.style.display = 'block'; }
            if (icon) icon.style.display = 'none';
        } else {
            if (img) img.style.display = 'none';
            if (icon) icon.style.display = 'block';
        }
    }

    // --- 3. Drawer Logic ---
    function openDrawer() {
        xDrawer.classList.add('active');
        xDrawerOverlay.classList.add('active');
    }

    function closeDrawer() {
        xDrawer.classList.remove('active');
        xDrawerOverlay.classList.remove('active');
    }

    if (xHeaderAvatarBtn) {
        xHeaderAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDrawer();
        });
    }

    if (xDrawerOverlay) {
        xDrawerOverlay.addEventListener('click', closeDrawer);
    }
    
    // Drawer Items
    // 1. Profile (Avatar/Name Click)
    const drawerProfileArea = document.querySelector('.x-drawer-header');
    if (drawerProfileArea) {
        drawerProfileArea.addEventListener('click', (e) => {
            // If clicked on "Main Page Visitors" button, don't open profile
            if (e.target.closest('#x-visitors-btn')) return;
            
            closeDrawer();
            openUserProfile();
        });
    }
    
    // 2. World Menu
    const worldMenuBtn = document.getElementById('x-menu-world');
    if (worldMenuBtn) {
        worldMenuBtn.addEventListener('click', () => {
            closeDrawer();
            const worldBookView = document.getElementById('world-book-view');
            if (worldBookView && window.openView) {
                window.openView(worldBookView);
            }
        });
    }
    
    // 3. Visitors Button
    const visitorsBtn = document.getElementById('x-visitors-btn');
    if (visitorsBtn) {
        visitorsBtn.addEventListener('click', () => {
            closeDrawer();
            openSheet(xVisitorsSheet);
        });
    }

    // 4. Exit App Button
    const exitAppBtn = document.getElementById('x-exit-app-btn');
    if (exitAppBtn) {
        exitAppBtn.addEventListener('click', () => {
            closeDrawer();
            // Assuming window.closeView exists in ios_emulator.js
            if (window.closeView) {
                window.closeView(xView);
            } else {
                xView.classList.remove('active');
            }
        });
    }

    // --- 4. User Profile View Logic ---
    function openUserProfile() {
        xUserProfileView.classList.add('active');
    }
    
    function closeUserProfile() {
        xUserProfileView.classList.remove('active');
    }
    
    const profileBackBtn = document.getElementById('x-profile-back-btn');
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', closeUserProfile);
    }
    
    // Edit Profile Button
    const profileEditBtn = document.getElementById('x-profile-edit-btn');
    if (profileEditBtn) {
        profileEditBtn.addEventListener('click', () => {
            populateEditSheet();
            openSheet(xEditProfileSheet);
        });
    }

    // --- 5. Edit Profile Sheet Logic ---
    function populateEditSheet() {
        const x = window.userState.xData || {};
        
        // Inputs
        document.getElementById('x-edit-name').value = x.name || '';
        document.getElementById('x-edit-handle').value = x.handle || '';
        document.getElementById('x-edit-bio').value = x.bio || '';
        document.getElementById('x-edit-location').value = x.location || '';
        document.getElementById('x-edit-following').value = x.following || '0';
        document.getElementById('x-edit-followers').value = x.followers || '0';
        document.getElementById('x-edit-persona').value = x.persona || '';
        
        // Images Preview
        const bannerPreview = document.getElementById('x-edit-banner-img');
        if (bannerPreview) {
            if (x.banner) {
                bannerPreview.src = x.banner;
                bannerPreview.style.display = 'block';
            } else {
                bannerPreview.style.display = 'none';
            }
        }
        
        const avatarPreview = document.getElementById('x-edit-avatar-img');
        if (avatarPreview) {
            if (x.avatar) {
                avatarPreview.src = x.avatar;
                avatarPreview.style.display = 'block';
            } else {
                avatarPreview.style.display = 'none';
            }
        }
    }
    
    // Image Upload Handlers
    const xBannerBtn = document.getElementById('x-edit-banner-btn');
    const xBannerInput = document.getElementById('x-banner-upload');
    if (xBannerBtn && xBannerInput) {
        xBannerBtn.addEventListener('click', () => xBannerInput.click());
        xBannerInput.addEventListener('change', (e) => handleImageUpload(e, 'x-edit-banner-img'));
    }
    
    const xAvatarBtn = document.getElementById('x-edit-avatar-wrapper');
    const xAvatarInput = document.getElementById('x-avatar-upload');
    if (xAvatarBtn && xAvatarInput) {
        xAvatarBtn.addEventListener('click', () => xAvatarInput.click());
        xAvatarInput.addEventListener('change', (e) => handleImageUpload(e, 'x-edit-avatar-img'));
    }
    
    function handleImageUpload(event, imgId) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById(imgId);
                if (img) {
                    img.src = e.target.result;
                    img.style.display = 'block';
                    // Store temporarily on the img element to save later
                    img.dataset.tempSrc = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    }
    
    // Save Button
    const xSaveProfileBtn = document.getElementById('x-save-profile-btn');
    if (xSaveProfileBtn) {
        xSaveProfileBtn.addEventListener('click', () => {
            const x = window.userState.xData;
            
            x.name = document.getElementById('x-edit-name').value;
            x.handle = document.getElementById('x-edit-handle').value;
            x.bio = document.getElementById('x-edit-bio').value;
            x.location = document.getElementById('x-edit-location').value;
            x.following = document.getElementById('x-edit-following').value;
            x.followers = document.getElementById('x-edit-followers').value;
            x.persona = document.getElementById('x-edit-persona').value;
            
            // Check for new images
            const bannerImg = document.getElementById('x-edit-banner-img');
            if (bannerImg && bannerImg.dataset.tempSrc) {
                x.banner = bannerImg.dataset.tempSrc;
                delete bannerImg.dataset.tempSrc;
            }
            
            const avatarImg = document.getElementById('x-edit-avatar-img');
            if (avatarImg && avatarImg.dataset.tempSrc) {
                x.avatar = avatarImg.dataset.tempSrc;
                delete avatarImg.dataset.tempSrc;
            }
            
            // Save to persistence
            if (window.saveGlobalData) window.saveGlobalData();
            
            // Update UI
            syncXUserData();
            closeSheet(xEditProfileSheet);
        });
    }

    // --- 6. Navigation & Tabs ---
    // Bottom Nav
    xBottomNavItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            switchTab(index);
        });
    });

    function updateXNavIndicator(index) {
        if (!xNavIndicator || !xBottomNavItems[index]) return;
        
        const activeItem = xBottomNavItems[index];
        const currentLeft = activeItem.offsetLeft;
        const initialOffset = 6; // Matches CSS .x-nav-indicator left: 6px
        const transformValue = currentLeft - initialOffset;
        
        xNavIndicator.style.transform = `translateX(${transformValue}px)`;
    }

    function switchTab(index) {
        currentTab = index;
        
        // Update Bottom Nav UI
        xBottomNavItems.forEach((nav, i) => {
            const icon = nav.querySelector('i');
            if (i === index) {
                nav.classList.add('active');
                if (icon) {
                    // Update icons based on index
                    if (i === 0) icon.className = 'fas fa-home';
                    if (i === 1) icon.className = 'fas fa-search';
                    if (i === 2) icon.className = 'fas fa-bell';
                    if (i === 3) icon.className = 'fas fa-envelope';
                }
            } else {
                nav.classList.remove('active');
                if (icon) {
                    if (i === 0) icon.className = 'fas fa-home'; 
                    if (i === 1) icon.className = 'fas fa-search';
                    if (i === 2) icon.className = 'far fa-bell';
                    if (i === 3) icon.className = 'far fa-envelope';
                }
            }
        });

        // Slide Main Container (4 tabs)
        if (xTabsContainer) {
            xTabsContainer.style.transform = `translateX(-${index * 25}%)`;
        }
        
        // Move Indicator
        updateXNavIndicator(index);
    }

    // Inner Tabs (For You / Following / Categories)
    function setupInnerTabs(prefix) {
        const tabs = document.querySelectorAll(`#${prefix}-top-tabs .x-top-tab`);
        const container = document.getElementById(`${prefix}-inner-container`);
        
        // Logic for sliding active tab into view in the scrollable top bar
        const tabsContainer = document.getElementById(`${prefix}-top-tabs`);

        tabs.forEach((tab, idx) => {
            tab.addEventListener('click', () => {
                // UI
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Scroll active tab into view
                if (tabsContainer) {
                    const scrollLeft = tab.offsetLeft - (tabsContainer.offsetWidth / 2) + (tab.offsetWidth / 2);
                    tabsContainer.scrollTo({
                        left: scrollLeft,
                        behavior: 'smooth'
                    });
                }

                // Note: Actual content sliding logic is simplified here. 
                // Since we added more categories but didn't necessarily add content containers for them in HTML yet,
                // we'll keep the visual selection logic. If you want content switching for "Tech", "Entertainment", etc.,
                // we would need to dynamically generate or unhide content.
                // For now, let's just keep the visual tab switching.
            });
        });
    }
    
    setupInnerTabs('x-home');
    setupInnerTabs('x-search');
    setupInnerTabs('x-notify');

    // --- Compose Modal Logic ---
    const xComposeModal = document.getElementById('x-compose-modal');
    const xComposeCancel = document.getElementById('x-compose-cancel');
    const xFabs = document.querySelectorAll('.x-fab');

    if (xComposeModal) {
        // Open modal from any FAB
        xFabs.forEach(fab => {
            fab.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent feed item click
                xComposeModal.classList.add('active');
                // Sync avatar to compose modal
                const composeAvatar = document.getElementById('x-compose-avatar-img');
                const x = window.userState?.xData || {};
                if (composeAvatar) {
                    if (x.avatar) {
                        composeAvatar.src = x.avatar;
                        composeAvatar.style.display = 'block';
                    } else {
                        composeAvatar.style.display = 'none';
                    }
                }
            });
        });

        // Close modal (Cancel btn)
        if (xComposeCancel) {
            xComposeCancel.addEventListener('click', () => {
                xComposeModal.classList.remove('active');
            });
        }

        // Close on blank space click (mask overlay)
        xComposeModal.addEventListener('click', (e) => {
            if (e.target === xComposeModal) {
                xComposeModal.classList.remove('active');
            }
        });
        
        // Optional: Post button logic (just closes for now)
        const xComposePost = document.getElementById('x-compose-post');
        if (xComposePost) {
            xComposePost.addEventListener('click', () => {
                const textarea = document.querySelector('.x-compose-textarea');
                if (textarea) textarea.value = ''; // clear
                xComposeModal.classList.remove('active');
                // Here you would typically append a new tweet to the feed
            });
        }
    }

    // --- 7. Banners on Home/Search (Click to upload) ---
    const homeBanner = document.getElementById('x-home-banner');
    if (homeBanner) {
        homeBanner.addEventListener('click', () => {
            triggerImageUpload((url) => {
                if (window.userState) {
                    window.userState.xHomeBannerUrl = url;
                    if (window.saveGlobalData) window.saveGlobalData();
                }
                syncXUserData();
            });
        });
    }
    
    const searchBanner = document.getElementById('x-search-banner');
    if (searchBanner) {
        searchBanner.addEventListener('click', () => {
            triggerImageUpload((url) => {
                if (window.userState) {
                    window.userState.xSearchBannerUrl = url;
                    if (window.saveGlobalData) window.saveGlobalData();
                }
                syncXUserData();
            });
        });
    }

    // --- 8. Helper: Image Upload ---
    function triggerImageUpload(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    callback(evt.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
    
    // --- 9. Sheet Helpers (Copied/Adapted from ios_emulator.js logic) ---
    function openSheet(sheet) {
        if (!sheet) return;
        const overlay = sheet.closest('.bottom-sheet-overlay') || sheet;
        overlay.classList.add('active');
        const sheetContent = overlay.querySelector('.bottom-sheet');
        if (sheetContent) sheetContent.classList.add('active');
    }
    
    function closeSheet(sheet) {
        if (!sheet) return;
        const overlay = sheet.closest('.bottom-sheet-overlay') || sheet;
        overlay.classList.remove('active');
        const sheetContent = overlay.querySelector('.bottom-sheet');
        if (sheetContent) sheetContent.classList.remove('active');
    }
    
    // Close sheets when clicking overlay
    document.querySelectorAll('.bottom-sheet-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeSheet(overlay);
            }
        });
    });

    // --- Tweet Detail Logic ---
    // Add click listeners to feed items to open detail view
    function attachFeedItemListeners() {
        const feedItems = document.querySelectorAll('.x-feed-item');
        feedItems.forEach(item => {
            item.addEventListener('click', () => {
                openTweetDetail(item);
            });
        });
    }

    function openTweetDetail(feedItemEl) {
        // Clone content to detail view or populate data
        // For simplicity, we'll extract data and build HTML
        
        const avatarSrc = feedItemEl.querySelector('.x-feed-avatar img')?.src;
        const name = feedItemEl.querySelector('.x-feed-header-name')?.innerHTML; // innerHTML to keep verified icon
        const handle = feedItemEl.querySelector('.x-feed-header-handle')?.textContent;
        const time = feedItemEl.querySelector('.x-feed-header-time')?.textContent; // Remove dot maybe
        const text = feedItemEl.querySelector('.x-feed-text')?.innerHTML;
        const mediaHtml = feedItemEl.querySelector('.x-feed-media')?.outerHTML || '';
        const stats = feedItemEl.querySelector('.x-feed-actions')?.innerHTML; // We might want to restyle stats
        
        // Build Detail HTML
        let detailHtml = `
            <div class="x-detail-scroll-content">
                <div class="x-detail-author-row">
                    <div class="x-detail-avatar">
                        <img src="${avatarSrc || ''}" style="${avatarSrc ? 'display:block' : 'display:none; background:#eee'}">
                    </div>
                    <div class="x-detail-author-info">
                        <div class="x-detail-name">${name || 'User'}</div>
                        <div class="x-detail-handle">${handle || '@user'}</div>
                    </div>
                    <div class="x-detail-more"><i class="fas fa-ellipsis-h"></i></div>
                </div>
                
                <div class="x-detail-text">
                    ${text || ''}
                </div>
                
                ${mediaHtml ? `<div class="x-detail-media-container">${mediaHtml}</div>` : ''}
                
                <div class="x-detail-meta">
                    <span class="x-detail-time">上午10:30 · 2026年3月18日</span>
                    <span class="x-detail-source">· 1,234 查看</span>
                </div>
                
                <div class="x-detail-stats-bar">
                    <div class="x-detail-stat"><b>42</b> <span>转推</span></div>
                    <div class="x-detail-stat"><b>5</b> <span>引用</span></div>
                    <div class="x-detail-stat"><b>175</b> <span>喜欢</span></div>
                    <div class="x-detail-stat"><b>1</b> <span>书签</span></div>
                </div>
                
                <div class="x-detail-action-bar">
                    <div class="x-detail-action"><i class="far fa-comment"></i></div>
                    <div class="x-detail-action"><i class="fas fa-retweet"></i></div>
                    <div class="x-detail-action"><i class="far fa-heart"></i></div>
                    <div class="x-detail-action"><i class="far fa-bookmark"></i></div>
                    <div class="x-detail-action"><i class="fas fa-share-square"></i></div>
                </div>
                
                <!-- Comments Placeholder -->
                <div class="x-detail-comments">
                    <!-- Comment 1 -->
                    <div class="x-comment-item">
                        <div class="x-comment-avatar"><img src="https://ui-avatars.com/api/?name=Fan&background=random&color=fff&rounded=true" style="width:100%;height:100%;object-fit:cover;"></div>
                        <div class="x-comment-content">
                            <div class="x-comment-header">
                                <span class="x-comment-name">Fan</span>
                                <span class="x-comment-handle">@fan123</span>
                                <span class="x-comment-time">· 1小时</span>
                            </div>
                            <div class="x-comment-text">太棒了！期待！</div>
                            <div class="x-comment-actions">
                                <i class="far fa-comment"></i>
                                <i class="fas fa-retweet"></i>
                                <i class="far fa-heart"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="height: 100px;"></div>
            </div>
        `;
        
        xDetailContent.innerHTML = detailHtml;
        
        // Sync user avatar to reply input
        const userAvatar = document.getElementById('x-detail-reply-avatar');
        if (userAvatar && window.userState?.xData?.avatar) {
            userAvatar.src = window.userState.xData.avatar;
            userAvatar.style.display = 'block';
        }
        
        xTweetDetailView.classList.add('active');
    }

    if (xDetailBackBtn) {
        xDetailBackBtn.addEventListener('click', () => {
            xTweetDetailView.classList.remove('active');
        });
    }

    // Initialize
    // Wait a bit for window.userState to be ready if it's async, but usually it's ready by DOMContentLoaded in this simplified emulator
    setTimeout(() => {
        syncXUserData();
        // Initialize indicator position
        updateXNavIndicator(currentTab);
        // Attach listeners
        attachFeedItemListeners();
    }, 100);
});
