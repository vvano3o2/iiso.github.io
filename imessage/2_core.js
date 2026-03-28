// ==========================================
// IMESSAGE: 2. CORE SYSTEM & NAVIGATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const { UI, userState, apiConfig, openView, closeView, showToast, syncUIs } = window;

    // --- Custom Modal Logic ---
    const customModalOverlay = document.getElementById('custom-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalConfirmContent = document.getElementById('modal-confirm-content');
    const modalPromptContent = document.getElementById('modal-prompt-content');
    const modalMessage = document.getElementById('modal-message');
    const modalInput = document.getElementById('modal-input');
    
    // Buttons
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalPromptConfirmBtn = document.getElementById('modal-prompt-confirm-btn');

    let currentModalCallback = null;

    function showCustomModal(options) {
        if (!customModalOverlay) return;
        
        modalTitle.textContent = options.title || '提示';
        currentModalCallback = options.onConfirm;

        if (options.type === 'prompt') {
            modalConfirmBtn.style.display = 'none';
            modalPromptConfirmBtn.style.display = 'block';
            modalConfirmContent.style.display = 'none';
            modalPromptContent.style.display = 'block';
            
            modalMessage.textContent = options.message || '';
            modalInput.value = options.defaultValue || '';
            modalInput.placeholder = options.placeholder || '';
            modalPromptConfirmBtn.textContent = options.confirmText || '确认';
        } else {
            modalConfirmBtn.style.display = 'block';
            modalPromptConfirmBtn.style.display = 'none';
            modalConfirmContent.style.display = 'block';
            modalPromptContent.style.display = 'none';
            
            modalMessage.textContent = options.message || '';
            modalConfirmBtn.textContent = options.confirmText || '确认';
            modalConfirmBtn.style.color = options.isDestructive ? '#ff3b30' : '#2c2c2e';
        }

        customModalOverlay.style.display = 'flex';
        void customModalOverlay.offsetWidth; // force reflow
        customModalOverlay.classList.add('active');
        
        const sheet = customModalOverlay.querySelector('.bottom-sheet');
        if(sheet) sheet.style.transform = 'translateY(0)';

        if (options.type === 'prompt') {
            setTimeout(() => modalInput.focus(), 300);
        }
    }

    function closeCustomModal() {
        if (!customModalOverlay) return;
        customModalOverlay.classList.remove('active');
        setTimeout(() => {
            customModalOverlay.style.display = 'none';
        }, 300);
        currentModalCallback = null;
    }

    window.imApp.showCustomModal = showCustomModal;
    window.imApp.closeCustomModal = closeCustomModal;

    // Export for legacy compatibility if any other app uses it directly
    window.showCustomModal = showCustomModal;
    window.closeCustomModal = closeCustomModal;

    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeCustomModal);
    
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', () => {
            if (currentModalCallback) currentModalCallback(true);
            closeCustomModal();
        });
    }

    if (modalPromptConfirmBtn) {
        modalPromptConfirmBtn.addEventListener('click', () => {
            if (currentModalCallback) currentModalCallback(modalInput.value);
            closeCustomModal();
        });
    }

    if (customModalOverlay) {
        customModalOverlay.addEventListener('click', (e) => {
            if (e.target === customModalOverlay) closeCustomModal();
        });
    }

    // --- iMessage (LINE Style) View Initialization ---
    const imessageView = document.getElementById('imessage-view');
    const dockIcon = document.getElementById('dock-icon-imessage');
    
    if (dockIcon) {
        dockIcon.addEventListener('click', (e) => {
            if (window.isJiggleMode || window.preventAppClick) { e.preventDefault(); e.stopPropagation(); return; }
            if (syncUIs) syncUIs();
            openView(imessageView);
            
            // Sync user avatar
            if (window.imApp.syncMomentsUser) window.imApp.syncMomentsUser();
            // Render friends to ensure up to date
            if (window.imApp.renderFriendsList) window.imApp.renderFriendsList();
        });
    }

    const imHeaderLeft = document.querySelector('.line-header-left');
    if (imHeaderLeft) {
        imHeaderLeft.addEventListener('click', () => {
            closeView(imessageView);
        });
    }

    const imHeaderRight = document.querySelector('.line-header-right');
    if (imHeaderRight) {
        const bookmarkBtn = imHeaderRight.querySelector('.fa-bookmark');
        const settingsBtn = imHeaderRight.querySelector('.fa-cog');

        if(bookmarkBtn) bookmarkBtn.addEventListener('click', () => { if(window.showToast) window.showToast('Bookmark clicked'); });
        if(settingsBtn) settingsBtn.addEventListener('click', () => { if(window.showToast) window.showToast('Settings clicked'); });
    }

    const imServiceItems = document.querySelectorAll('.line-service-item');
    imServiceItems.forEach(item => {
        item.addEventListener('click', () => {
            const spanText = item.querySelector('span')?.textContent?.trim() || '';
            // Check if this is the Stickers button
            if (spanText === 'Stickers') {
                // Open stickers view
                const stickersViewEl = document.getElementById('stickers-view');
                if (stickersViewEl && window.openView) {
                    stickersViewEl.style.display = 'flex';
                    window.openView(stickersViewEl);
                    if (typeof renderStickersView === 'function') {
                        renderStickersView();
                    }
                } else {
                    console.error('Stickers view or openView not found');
                }
            } else {
                if(window.showToast) window.showToast('Service clicked');
            }
        });
    });

    // --- Stickers Feature Logic ---
    const stickersView = document.getElementById('stickers-view');
    const stickersBackBtn = document.getElementById('stickers-back-btn');
    const stickersAddBtn = document.getElementById('stickers-add-btn');
    const stickersEditBtn = document.getElementById('stickers-edit-btn');
    const addStickerSheet = document.getElementById('add-sticker-sheet');
    const stickersListContainer = document.getElementById('stickers-list-container');
    const stickerCategoryNameInput = document.getElementById('sticker-category-name');
    const stickerLocalUploadBtn = document.getElementById('sticker-local-upload-btn');
    const stickerLocalUploadInput = document.getElementById('sticker-local-upload-input');
    const stickerLocalPreview = document.getElementById('sticker-local-preview');
    const stickerUrlInput = document.getElementById('sticker-url-input');
    const confirmAddStickerBtn = document.getElementById('confirm-add-sticker-btn');

    // Temporary storage for local uploaded images
    let pendingLocalStickers = [];

    // Stickers back btn removed - no back button in new design

    // Open add sticker sheet
    if (stickersAddBtn) {
        stickersAddBtn.addEventListener('click', () => {
            if (addStickerSheet) {
                addStickerSheet.style.display = 'flex';
                void addStickerSheet.offsetWidth;
                addStickerSheet.classList.add('active');
                const sheet = addStickerSheet.querySelector('.bottom-sheet');
                if (sheet) sheet.style.transform = 'translateY(0)';
                // Reset form
                if (stickerCategoryNameInput) stickerCategoryNameInput.value = '';
                if (stickerUrlInput) stickerUrlInput.value = '';
                if (stickerLocalPreview) {
                    stickerLocalPreview.innerHTML = '';
                    stickerLocalPreview.style.display = 'none';
                }
                pendingLocalStickers = [];
            }
        });
    }

    // Close add sticker sheet
    function closeAddStickerSheet() {
        if (addStickerSheet) {
            addStickerSheet.classList.remove('active');
            setTimeout(() => {
                addStickerSheet.style.display = 'none';
            }, 300);
        }
    }

    if (addStickerSheet) {
        addStickerSheet.addEventListener('click', (e) => {
            if (e.target === addStickerSheet) closeAddStickerSheet();
        });
    }

    // Local file upload trigger
    if (stickerLocalUploadBtn && stickerLocalUploadInput) {
        stickerLocalUploadBtn.addEventListener('click', () => {
            stickerLocalUploadInput.click();
        });

        stickerLocalUploadInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            pendingLocalStickers = [];
            if (stickerLocalPreview) {
                stickerLocalPreview.innerHTML = '';
                stickerLocalPreview.style.display = 'flex';
                stickerLocalPreview.style.flexWrap = 'wrap';
                stickerLocalPreview.style.gap = '10px';
            }

            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const dataUrl = evt.target.result;
                    const name = file.name.replace(/\.[^/.]+$/, '') || `sticker_${index + 1}`;
                    
                    // Store with temporary index, will update name from input
                    const stickerObj = { name, url: dataUrl };
                    pendingLocalStickers.push(stickerObj);

                    // Show preview with name input
                    if (stickerLocalPreview) {
                        const previewContainer = document.createElement('div');
                        previewContainer.className = 'sticker-preview-item';
                        previewContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 5px; width: 80px;';
                        
                        const previewImg = document.createElement('img');
                        previewImg.src = dataUrl;
                        previewImg.className = 'sticker-preview-img';
                        previewImg.style.cssText = 'width: 60px; height: 60px; object-fit: cover; border-radius: 8px;';
                        
                        const nameInput = document.createElement('input');
                        nameInput.type = 'text';
                        nameInput.value = name;
                        nameInput.className = 'sticker-name-input';
                        nameInput.style.cssText = 'width: 70px; font-size: 11px; padding: 3px 5px; border: 1px solid #e5e5ea; border-radius: 5px; text-align: center; outline: none;';
                        nameInput.placeholder = '名称';
                        
                        // Update name when input changes
                        nameInput.addEventListener('input', () => {
                            const idx = pendingLocalStickers.findIndex(s => s.url === dataUrl);
                            if (idx !== -1) {
                                pendingLocalStickers[idx].name = nameInput.value || name;
                            }
                        });
                        
                        previewContainer.appendChild(previewImg);
                        previewContainer.appendChild(nameInput);
                        stickerLocalPreview.appendChild(previewContainer);
                    }
                };
                reader.readAsDataURL(file);
            });

            // Reset input for re-upload
            stickerLocalUploadInput.value = '';
        });
    }

    // Confirm add sticker
    if (confirmAddStickerBtn) {
        confirmAddStickerBtn.addEventListener('click', () => {
            const categoryName = stickerCategoryNameInput ? stickerCategoryNameInput.value.trim() : '';
            if (!categoryName) {
                if (showToast) showToast('请输入分类名称');
                return;
            }

            // Parse URL input
            const urlStickers = [];
            if (stickerUrlInput) {
                const lines = stickerUrlInput.value.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    const parts = trimmed.split(/\s+/);
                    if (parts.length >= 2) {
                        const name = parts[0];
                        const url = parts.slice(1).join(' ');
                        urlStickers.push({ name, url });
                    }
                });
            }

            // Combine all stickers
            const allNewStickers = [...pendingLocalStickers, ...urlStickers];
            if (allNewStickers.length === 0) {
                if (showToast) showToast('请添加至少一张表情');
                return;
            }

            // Find or create category
            if (!window.imData.stickers) window.imData.stickers = [];
            let category = window.imData.stickers.find(c => c.categoryName === categoryName);
            if (category) {
                // Add to existing category
                category.items = category.items.concat(allNewStickers);
            } else {
                // Create new category
                window.imData.stickers.push({
                    categoryName,
                    items: allNewStickers
                });
            }

            // Save and re-render
            if (window.imApp.saveStickers) window.imApp.saveStickers();
            renderStickersView();
            closeAddStickerSheet();
            if (showToast) showToast(`已添加 ${allNewStickers.length} 张表情到 "${categoryName}"`);
        });
    }

    // Batch delete mode state
    let batchDeleteMode = false;
    let selectedStickers = new Set();

    // Edit button to toggle batch delete mode
    if (stickersEditBtn) {
        stickersEditBtn.addEventListener('click', () => {
            batchDeleteMode = !batchDeleteMode;
            selectedStickers.clear();
            stickersEditBtn.innerHTML = batchDeleteMode ? '<i class="fas fa-check"></i>' : '<i class="fas fa-pen"></i>';
            renderStickersView(batchDeleteMode);
        });
    }

    // Render stickers view
    function renderStickersView(keepBatchMode) {
        if (!stickersListContainer) return;
        stickersListContainer.innerHTML = '';
        
        // If not explicitly keeping batch mode, reset it
        if (!keepBatchMode) {
            batchDeleteMode = false;
            selectedStickers.clear();
            if (stickersEditBtn) stickersEditBtn.innerHTML = '<i class="fas fa-pen"></i>';
        }

        const stickers = window.imData.stickers || [];
        if (stickers.length === 0) {
            stickersListContainer.innerHTML = '<div style="text-align: center; color: #8e8e93; padding: 40px;">No stickers yet. Tap + to add.</div>';
            return;
        }

        // Floating batch delete bar (fixed at bottom when in batch mode)
        if (batchDeleteMode) {
            const batchBar = document.createElement('div');
            batchBar.id = 'batch-delete-bar';
            batchBar.style.cssText = 'position: sticky; top: 0; z-index: 50; display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 16px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);';
            
            const selectInfo = document.createElement('div');
            selectInfo.id = 'batch-select-info';
            selectInfo.style.cssText = 'font-size: 14px; color: #8e8e93; font-weight: 500;';
            selectInfo.textContent = `已选择 ${selectedStickers.size} 项`;
            
            const batchDeleteBtn = document.createElement('div');
            batchDeleteBtn.id = 'batch-delete-toggle';
            batchDeleteBtn.style.cssText = 'background: #ff3b30; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;';
            batchDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除所选';
            batchDeleteBtn.addEventListener('click', () => {
                if (selectedStickers.size === 0) {
                    if (showToast) showToast('请先选择要删除的表情');
                    return;
                }
                // Sort selected keys in reverse order to safely splice
                const sortedKeys = Array.from(selectedStickers).sort((a, b) => {
                    const [aCat, aIdx] = a.split('-').map(Number);
                    const [bCat, bIdx] = b.split('-').map(Number);
                    if (aCat !== bCat) return bCat - aCat;
                    return bIdx - aIdx;
                });
                const count = sortedKeys.length;
                sortedKeys.forEach(key => {
                    const [catIdx, stickerIdx] = key.split('-').map(Number);
                    if (window.imData.stickers[catIdx]?.items[stickerIdx]) {
                        window.imData.stickers[catIdx].items.splice(stickerIdx, 1);
                    }
                });
                // Remove empty categories
                window.imData.stickers = window.imData.stickers.filter(c => c.items.length > 0);
                if (window.imApp.saveStickers) window.imApp.saveStickers();
                batchDeleteMode = false;
                selectedStickers.clear();
                if (stickersEditBtn) stickersEditBtn.innerHTML = '<i class="fas fa-pen"></i>';
                renderStickersView();
                if (showToast) showToast(`已删除 ${count} 张表情`);
            });
            
            batchBar.appendChild(selectInfo);
            batchBar.appendChild(batchDeleteBtn);
            stickersListContainer.appendChild(batchBar);
        }

        stickers.forEach((category, catIndex) => {
            const card = document.createElement('div');
            card.className = 'sticker-category-card';
            card.style.cssText = 'background: #fff; border-radius: 16px; padding: 0 12px; overflow: hidden;';

            // Header: title center, collapse arrow right
            const header = document.createElement('div');
            header.className = 'sticker-category-header';
            header.style.cssText = 'display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; min-height: 38px; padding: 6px 0;';

            // Center: title (absolutely positioned for true centering)
            const title = document.createElement('div');
            title.className = 'sticker-category-title';
            title.textContent = category.categoryName;
            title.style.cssText = 'position: absolute; left: 50%; transform: translateX(-50%); font-size: 14px; font-weight: 600; color: #000; white-space: nowrap; pointer-events: none;';

            // Right side container: delete btn + collapse icon
            const rightContainer = document.createElement('div');
            rightContainer.style.cssText = 'display: flex; align-items: center; gap: 4px; margin-left: auto;';

            // Delete category button (only visible when expanded)
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'sticker-category-delete';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.style.cssText = 'color: #ff3b30; cursor: pointer; font-size: 14px; padding: 6px 8px; display: none; border-radius: 8px; transition: background 0.2s;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`删除分类 "${category.categoryName}" ?`)) {
                    window.imData.stickers.splice(catIndex, 1);
                    if (window.imApp.saveStickers) window.imApp.saveStickers();
                    renderStickersView();
                    if (showToast) showToast(`已删除分类 "${category.categoryName}"`);
                }
            });

            // Collapse indicator
            const collapseIcon = document.createElement('div');
            collapseIcon.className = 'sticker-category-collapse-icon';
            collapseIcon.style.cssText = 'color: #8e8e93; font-size: 13px; transition: transform 0.3s; padding: 6px;';
            collapseIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';

            rightContainer.appendChild(deleteBtn);
            rightContainer.appendChild(collapseIcon);

            header.appendChild(title);
            header.appendChild(rightContainer);

            // Sticker grid
            const grid = document.createElement('div');
            grid.className = 'sticker-grid';
            
            // Track collapsed state
            let isCollapsed = category.collapsed || false;
            if (isCollapsed) {
                grid.style.display = 'none';
                collapseIcon.querySelector('i').style.transform = 'rotate(-90deg)';
                deleteBtn.style.display = 'none';
            } else {
                deleteBtn.style.display = 'block';
            }

            // Toggle collapse on header click
            header.addEventListener('click', (e) => {
                if (e.target.closest('.sticker-category-delete')) return;
                
                isCollapsed = !isCollapsed;
                category.collapsed = isCollapsed;
                grid.style.display = isCollapsed ? 'none' : 'grid';
                collapseIcon.querySelector('i').style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
                deleteBtn.style.display = isCollapsed ? 'none' : 'block';
            });

            category.items.forEach((sticker, stickerIndex) => {
                const item = document.createElement('div');
                item.className = 'sticker-item';
                item.style.position = 'relative';
                
                const img = document.createElement('img');
                img.src = sticker.url;
                img.alt = sticker.name;
                img.title = sticker.name;

                // Selection checkbox for batch delete
                if (batchDeleteMode) {
                    const checkbox = document.createElement('div');
                    checkbox.className = 'sticker-select-checkbox';
                    checkbox.dataset.key = `${catIndex}-${stickerIndex}`;
                    const isSelected = selectedStickers.has(`${catIndex}-${stickerIndex}`);
                    checkbox.style.cssText = `position: absolute; top: 4px; left: 4px; width: 22px; height: 22px; border-radius: 50%; background: ${isSelected ? '#007aff' : 'rgba(255,255,255,0.9)'}; border: 2px solid ${isSelected ? '#007aff' : '#ccc'}; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #fff; cursor: pointer; z-index: 5; box-shadow: 0 1px 3px rgba(0,0,0,0.2);`;
                    if (isSelected) {
                        checkbox.innerHTML = '<i class="fas fa-check"></i>';
                        item.style.outline = '2px solid #007aff';
                        item.style.borderRadius = '8px';
                    }
                    
                    const toggleSelect = (e) => {
                        if (e) e.stopPropagation();
                        const key = `${catIndex}-${stickerIndex}`;
                        if (selectedStickers.has(key)) {
                            selectedStickers.delete(key);
                            checkbox.innerHTML = '';
                            checkbox.style.borderColor = '#ccc';
                            checkbox.style.background = 'rgba(255,255,255,0.9)';
                            item.style.outline = 'none';
                        } else {
                            selectedStickers.add(key);
                            checkbox.innerHTML = '<i class="fas fa-check"></i>';
                            checkbox.style.borderColor = '#007aff';
                            checkbox.style.background = '#007aff';
                            item.style.outline = '2px solid #007aff';
                        }
                        // Update count display
                        const info = document.getElementById('batch-select-info');
                        if (info) info.textContent = `已选择 ${selectedStickers.size} 项`;
                    };
                    
                    checkbox.addEventListener('click', toggleSelect);
                    item.addEventListener('click', () => toggleSelect());
                    item.appendChild(checkbox);
                }

                item.appendChild(img);

                // Long press or right click to enter batch mode when not already in it
                if (!batchDeleteMode) {
                    let pressTimer;
                    item.addEventListener('touchstart', () => {
                        pressTimer = setTimeout(() => {
                            batchDeleteMode = true;
                            selectedStickers.add(`${catIndex}-${stickerIndex}`);
                            if (stickersEditBtn) stickersEditBtn.innerHTML = '<i class="fas fa-check"></i>';
                            renderStickersView(true);
                        }, 800);
                    });
                    item.addEventListener('touchend', () => clearTimeout(pressTimer));
                    item.addEventListener('touchmove', () => clearTimeout(pressTimer));
                    
                    item.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        batchDeleteMode = true;
                        selectedStickers.add(`${catIndex}-${stickerIndex}`);
                        if (stickersEditBtn) stickersEditBtn.innerHTML = '<i class="fas fa-check"></i>';
                        renderStickersView(true);
                    });
                }

                grid.appendChild(item);
            });

            card.appendChild(header);
            card.appendChild(grid);
            stickersListContainer.appendChild(card);
        });
    }

    // Export render function
    window.imApp.renderStickersView = renderStickersView;

    const groupsToggle = document.getElementById('groups-toggle');
    if (groupsToggle) {
        groupsToggle.addEventListener('click', () => {
            groupsToggle.parentElement.classList.toggle('collapsed');
        });
    }

    const friendsToggle = document.getElementById('friends-toggle');
    if (friendsToggle) {
        friendsToggle.addEventListener('click', () => {
            friendsToggle.parentElement.classList.toggle('collapsed');
        });
    }

    const npcsToggle = document.getElementById('npcs-toggle');
    if (npcsToggle) {
        npcsToggle.addEventListener('click', () => {
            npcsToggle.parentElement.classList.toggle('collapsed');
        });
    }

    // --- Bottom Nav Logic ---
    const navHomeBtn = document.getElementById('nav-home-btn');
    const navChatsBtn = document.getElementById('nav-chats-btn');
    const navMomentsBtn = document.getElementById('nav-moments-btn');
    const lineNavIndicator = document.getElementById('line-nav-indicator');
    const imBottomNavContainer = document.querySelector('.line-bottom-nav-container');
    
    const imContent = document.querySelector('.line-content'); 
    const chatsContent = document.getElementById('chats-content');
    const momentsContent = document.getElementById('moments-content');

    function updateLineNavIndicator(activeItem) {
        if (!activeItem || !lineNavIndicator) return;
        const containerRect = activeItem.parentElement.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const relativeLeft = itemRect.left - containerRect.left;
        
        lineNavIndicator.style.width = `${itemRect.width}px`;
        lineNavIndicator.style.left = `${relativeLeft}px`;
    }

    setTimeout(() => {
        if(navHomeBtn && navHomeBtn.classList.contains('active')) updateLineNavIndicator(navHomeBtn);
    }, 100);

    function hideAllTabs() {
        if(imContent) imContent.style.display = 'none';
        if(chatsContent) chatsContent.style.display = 'none';
        if(momentsContent) momentsContent.style.display = 'none';
        
        if(navHomeBtn) navHomeBtn.classList.remove('active');
        if(navChatsBtn) navChatsBtn.classList.remove('active');
        if(navMomentsBtn) navMomentsBtn.classList.remove('active');
        
        const imHeaderRight = document.querySelector('.line-header-right');
        if (imHeaderRight) imHeaderRight.style.display = 'flex'; 
    }

    if (navHomeBtn) {
        navHomeBtn.addEventListener('click', () => {
            hideAllTabs();
            if(imContent) imContent.style.display = 'block';
            if(imBottomNavContainer) imBottomNavContainer.style.display = 'flex';
            navHomeBtn.classList.add('active');
            updateLineNavIndicator(navHomeBtn);
            if (window.imApp.renderFriendsList) window.imApp.renderFriendsList();
        });
    }

    if (navChatsBtn) {
        navChatsBtn.addEventListener('click', () => {
            hideAllTabs();
            if(chatsContent) {
                chatsContent.style.display = 'flex';
                chatsContent.style.flexDirection = 'column';
                if (window.imApp.updateChatsView) window.imApp.updateChatsView();
            }
            navChatsBtn.classList.add('active');
            updateLineNavIndicator(navChatsBtn);
        });
    }

    if (navMomentsBtn) {
        navMomentsBtn.addEventListener('click', () => {
            hideAllTabs();
            if(momentsContent) {
                momentsContent.style.display = 'flex';
                momentsContent.style.flexDirection = 'column';
                if (window.imApp.renderMoments) window.imApp.renderMoments();
                
                if(imBottomNavContainer) imBottomNavContainer.style.display = 'flex';
                
                const imHeaderRight = document.querySelector('.line-header-right');
                if (imHeaderRight) imHeaderRight.style.display = 'none';
            }
            navMomentsBtn.classList.add('active');
            updateLineNavIndicator(navMomentsBtn);
        });
    }

    // Initialize saved CSS for all friends on boot
    setTimeout(() => {
        if (window.imApp.applyAllSavedCss) window.imApp.applyAllSavedCss();
    }, 100);
});
