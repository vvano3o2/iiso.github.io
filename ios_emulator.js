document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. STATE MANAGEMENT
    // ==========================================
    const userState = {
        name: 'iis',
        phone: '13800000000',
        persona: 'Default User',
        avatarUrl: null
    };
    window.userState = userState;

    let accounts = [
        { id: 1, name: 'iis', phone: '13800000000', signature: 'Default User', persona: 'Default User', avatarUrl: null },
        { id: 2, name: 'User2', phone: '13912345678', signature: 'Work Persona', persona: 'Work Persona', avatarUrl: null }
    ];
    let currentAccountId = 1;
    
    // Detail View temp state
    let isCreatingNewAccount = false;
    let detailTempId = null;

    // API State
    let apiConfig = { endpoint: '', apiKey: '', model: 'gpt-3.5-turbo', temperature: 0.7 };
    let apiPresets = [
        { id: 1, name: 'Localhost', endpoint: 'http://localhost:5000', apiKey: 'sk-12345', model: 'llama-2', temp: 0.7 },
        { id: 2, name: 'OpenAI', endpoint: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4', temp: 1.0 }
    ];
    let fetchedModels = ['gpt-3.5-turbo', 'gpt-4', 'claude-v1'];

    // Theme State
    let themeState = {
        bgUrl: null,
        apps: [
            { id: 'app-icon-1', name: 'Pay', icon: null },
            { id: 'app-icon-2', name: 'TikTok', icon: null },
            { id: 'app-icon-3', name: 'Notes', icon: null },
            { id: 'app-icon-4', name: 'Calendar', icon: null },
            { id: 'dock-icon-settings', name: '设置', icon: null },
            { id: 'dock-icon-imessage', name: '信息', icon: null },
            { id: 'dock-icon-youtube', name: 'YouTube', icon: null }
        ]
    };
    let currentEditingAppIndex = -1;

    // World Book State
    let wbGroups = []; 
    let worldBooks = []; 
    window.getWorldBooks = () => worldBooks; 
    let editingBookId = null; 
    let tempEntries = []; 
    let activeEntryId = null; 

    // --- Data Persistence Helper ---
    function loadGlobalData() {
        try {
            const dataStr = localStorage.getItem('ios_emulator_global_data');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                if (data.userState) Object.assign(userState, data.userState);
                if (data.accounts) accounts = data.accounts;
                if (data.currentAccountId) currentAccountId = data.currentAccountId;
                if (data.apiConfig) Object.assign(apiConfig, data.apiConfig);
                if (data.apiPresets) apiPresets = data.apiPresets;
                if (data.fetchedModels) fetchedModels = data.fetchedModels;
                if (data.themeState) {
                    themeState = data.themeState;
                    // Migration for default app names
                    if (themeState.apps) {
                        const app1 = themeState.apps.find(a => a.id === 'app-icon-1');
                        if (app1 && app1.name === 'App 1') app1.name = 'Pay';
                        
                        const app2 = themeState.apps.find(a => a.id === 'app-icon-2');
                        if (app2 && app2.name === 'App 2') app2.name = 'TikTok';
                        
                        const app3 = themeState.apps.find(a => a.id === 'app-icon-3');
                        if (app3 && app3.name === 'App 3') app3.name = 'Notes';
                        
                        const app4 = themeState.apps.find(a => a.id === 'app-icon-4');
                        if (app4 && app4.name === 'App 4') app4.name = 'Calendar';
                    }
                }
                if (data.wbGroups) wbGroups = data.wbGroups;
                if (data.worldBooks) worldBooks = data.worldBooks;
                
                // Call external state restores if they registered a hook
                if (window.onGlobalDataLoaded) window.onGlobalDataLoaded(data);
            }
        } catch (e) {
            console.error('Failed to load global data', e);
        }
    }

    function saveGlobalData() {
        try {
            const data = {
                userState,
                accounts,
                currentAccountId,
                apiConfig,
                apiPresets,
                fetchedModels,
                themeState,
                wbGroups,
                worldBooks
            };
            
            // Allow other modules to inject their state
            if (window.onGlobalDataSave) {
                window.onGlobalDataSave(data);
            }
            
            localStorage.setItem('ios_emulator_global_data', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save global data', e);
        }
    }
    window.saveGlobalData = saveGlobalData;

    // Load at startup
    loadGlobalData();
    window.apiConfig = apiConfig;

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    const UI = {
        views: {
            settings: document.getElementById('settings-view'),
            edit: document.getElementById('edit-view'), // Apple ID Profile View
            worldBook: document.getElementById('world-book-view')
        },
        overlays: {
            accountSwitcher: document.getElementById('account-sheet-overlay'),
            personaDetail: document.getElementById('persona-detail-sheet'),
            apiConfig: document.getElementById('api-config-sheet'),
            themeConfig: document.getElementById('theme-config-sheet'),
            widgetGallery: document.getElementById('widget-gallery-sheet'),
            addFriend: document.getElementById('add-friend-sheet'),
            savePreset: document.getElementById('save-preset-name-sheet'),
            loadPreset: document.getElementById('load-preset-list-sheet'),
            modelPicker: document.getElementById('model-picker-sheet'),
            addGroup: document.getElementById('add-group-overlay'),
            addBook: document.getElementById('add-book-overlay'), // Also used for Edit
            bookGroupPicker: document.getElementById('book-group-picker-sheet')
        },
        displays: {
            homeName: document.querySelector('.username'),
            homeAvatarImg: createOrGetImg(document.querySelector('.avatar')),
            homeAvatarIcon: document.querySelector('.avatar i'),
            
            settingsName: document.getElementById('settings-name'),
            settingsAvatarImg: document.getElementById('settings-avatar-img'),
            settingsAvatarIcon: document.querySelector('.apple-id-avatar-small i'),

            displayName: document.getElementById('display-name'),
            displayPhone: document.getElementById('display-phone'),
            editAvatarImg: document.getElementById('edit-avatar-img'),
            editAvatarIcon: document.querySelector('#edit-avatar-preview i'),
        },
        inputs: {
            detailName: document.getElementById('detail-name-input'),
            detailPhone: document.getElementById('detail-phone-input'),
            detailSignature: document.getElementById('detail-signature-input'),
            detailPersona: document.getElementById('detail-persona-input'),
            detailAvatarImg: document.getElementById('detail-avatar-img'),
            detailAvatarIcon: document.querySelector('#detail-avatar-preview i'),
            
            friendRealName: document.getElementById('friend-realname-input'),
            friendNickname: document.getElementById('friend-nickname-input'),
            friendSignature: document.getElementById('friend-signature-input'),
            friendPersona: document.getElementById('friend-persona-input'),
            friendAvatarImg: document.getElementById('friend-avatar-img'),
            friendAvatarIcon: document.querySelector('#friend-avatar-preview i'),

            apiEndpoint: document.getElementById('api-endpoint-input'),
            apiKey: document.getElementById('api-key-input'),
            apiTemp: document.getElementById('api-temp-input'),
            apiModel: document.getElementById('api-model-input'),
            presetName: document.getElementById('preset-name-input'),
            
            themeBgUrl: document.getElementById('theme-bg-url-input'),
            themeAppList: document.getElementById('theme-app-list')
        },
        lists: {
            accounts: document.getElementById('account-list'),
            presets: document.getElementById('preset-list'),
            models: document.getElementById('model-list')
        }
    };
    window.UI = UI;

    // --- Helper: Get/Create Avatar Img Tag ---
    function createOrGetImg(parent) {
        if (!parent) return null;
        let img = parent.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            img.style.display = 'none';
            parent.appendChild(img);
        }
        return img;
    }

    // ==========================================
    // 3. UTILITY FUNCTIONS
    // ==========================================
    function openView(viewElement) {
        if(viewElement) viewElement.classList.add('active');
    }

    function closeView(viewElement) {
        if(viewElement) viewElement.classList.remove('active');
    }
    window.openView = openView;
    window.closeView = closeView;

    // Bind overlay click-to-close automatically
    Object.values(UI.overlays).forEach(overlay => {
        if(overlay) {
            overlay.addEventListener('mousedown', (e) => {
                if (e.target === overlay) closeView(overlay);
            });
        }
    });

    // --- Custom Modal System ---
    window.showCustomModal = function(options) {
        const overlay = document.getElementById('custom-modal-overlay');
        if (!overlay) return;

        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        
        if (titleEl) titleEl.textContent = options.title || '提示';
        if (messageEl) messageEl.textContent = options.message || '';
        
        if (cancelBtn) {
            cancelBtn.textContent = options.cancelText || '取消';
            cancelBtn.onclick = () => {
                closeView(overlay);
                if (options.onCancel) options.onCancel();
            };
        }
        
        if (confirmBtn) {
            confirmBtn.textContent = options.confirmText || '确定';
            if (options.isDestructive) {
                confirmBtn.style.color = '#ff3b30';
            } else {
                confirmBtn.style.color = '#007aff';
            }
            confirmBtn.onclick = () => {
                closeView(overlay);
                if (options.onConfirm) options.onConfirm();
            };
        }

        // Handle prompt vs confirm
        const promptContent = document.getElementById('modal-prompt-content');
        const confirmContent = document.getElementById('modal-confirm-content');
        const promptConfirmBtn = document.getElementById('modal-prompt-confirm-btn');
        const modalInput = document.getElementById('modal-input');

        if (options.type === 'prompt') {
            if (promptContent) promptContent.style.display = 'block';
            if (confirmContent) confirmContent.style.display = 'none';
            if (confirmBtn) confirmBtn.style.display = 'none';
            if (promptConfirmBtn) {
                promptConfirmBtn.style.display = 'block';
                promptConfirmBtn.textContent = options.confirmText || '确定';
                promptConfirmBtn.onclick = () => {
                    closeView(overlay);
                    if (options.onConfirm) options.onConfirm(modalInput ? modalInput.value : '');
                };
            }
            if (modalInput) {
                modalInput.placeholder = options.placeholder || '请输入';
                modalInput.value = options.defaultValue || '';
            }
        } else {
            if (promptContent) promptContent.style.display = 'none';
            if (confirmContent) confirmContent.style.display = 'block';
            if (confirmBtn) confirmBtn.style.display = 'block';
            if (promptConfirmBtn) promptConfirmBtn.style.display = 'none';
        }

        openView(overlay);
    };

    // --- Toast Notification System ---
    let toastTimeout = null;
    function showToast(message, duration = 2000) {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.className = 'toast-bubble';
            // Append to screen container to stay within phone frame
            const screen = document.querySelector('.screen');
            if (screen) {
                screen.appendChild(toast);
            } else {
                document.body.appendChild(toast);
            }
        }

        toast.textContent = message;
        toast.classList.remove('show');
        
        // Force reflow
        void toast.offsetWidth;
        
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
    window.showToast = showToast;

    // Handle generic swipe logic for any list
    function addSwipeLogic(card, onDelete) {
        let startX = 0, isDragging = false;
        
        // Find existing swiped card in the same list to close it
        const list = card.parentElement;

        const startSwipe = (x) => { startX = x; isDragging = true; };
        const moveSwipe = (x) => {
            if (!isDragging) return;
            const diff = startX - x;
            
            if (diff > 40) { 
                // Close others
                const others = list.querySelectorAll('.account-card.swiped');
                others.forEach(o => { if(o !== card) o.classList.remove('swiped') });
                
                card.classList.add('swiped');
                isDragging = false;
            } else if (diff < -40) { 
                card.classList.remove('swiped');
                isDragging = false;
            }
        };
        const endSwipe = () => { isDragging = false; };

        card.addEventListener('mousedown', (e) => startSwipe(e.clientX));
        card.addEventListener('mousemove', (e) => moveSwipe(e.clientX));
        card.addEventListener('mouseup', endSwipe);
        card.addEventListener('mouseleave', endSwipe);
        card.addEventListener('touchstart', (e) => startSwipe(e.touches[0].clientX));
        card.addEventListener('touchmove', (e) => moveSwipe(e.touches[0].clientX));
        card.addEventListener('touchend', endSwipe);

        // Delete Action
        card.querySelector('.delete-action').addEventListener('click', (e) => {
            e.stopPropagation();
            onDelete();
        });
    }

    // ==========================================
    // 4. CORE SYSTEM LOGIC
    // ==========================================
    // Clock
    function updateClock() {
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        document.getElementById('clock').textContent = timeString;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Phone Input Restriction
    if (UI.inputs.detailPhone) {
        UI.inputs.detailPhone.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 11);
        });
    }

    // ==========================================
    // 5. NAVIGATION EVENT LISTENERS
    // ==========================================
    // Main Settings
    const settingsBtn = document.getElementById('dock-icon-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            if (window.isJiggleMode || window.preventAppClick) { e.preventDefault(); e.stopPropagation(); return; }
            syncUIs();
            openView(UI.views.settings);
        });
    }
    document.getElementById('settings-title-back-btn').addEventListener('click', () => closeView(UI.views.settings));

    // Use Home Bar to close apps
    document.getElementById('home-bar').addEventListener('click', () => {
        closeView(UI.views.settings);
        closeView(UI.views.edit);
        closeView(UI.views.worldBook);
        // imessageView is handled in imessage.js now
        const imessageView = document.getElementById('imessage-view');
        if (imessageView) closeView(imessageView);
    });

    // ==========================================
    // World Book Logic
    // ==========================================
    const wbMainBtn = document.getElementById('world-book-main-btn');
    if (wbMainBtn) {
        wbMainBtn.addEventListener('click', () => {
            renderWorldBooks();
            openView(UI.views.worldBook);
        });
    }

    const wbBackBtn = document.getElementById('world-book-back-btn');
    if (wbBackBtn) {
        wbBackBtn.addEventListener('click', () => {
            closeView(UI.views.worldBook);
        });
    }

    // Tabs logic
    const wbSegmentBtns = document.querySelectorAll('.wb-segment-btn');
    const wbTabContents = document.querySelectorAll('.wb-tab-content');

    wbSegmentBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all
            wbSegmentBtns.forEach(b => b.classList.remove('active'));
            wbTabContents.forEach(c => c.style.display = 'none');
            
            // Add active to clicked
            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(`wb-tab-${targetTab}`);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });

    // Add Menu Logic
    const wbAddBtn = document.getElementById('world-book-add-btn');
    const wbAddMenu = document.getElementById('wb-add-menu');
    
    if (wbAddBtn && wbAddMenu) {
        wbAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            wbAddMenu.style.display = wbAddMenu.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (wbAddMenu.style.display === 'block' && !wbAddMenu.contains(e.target) && e.target !== wbAddBtn) {
                wbAddMenu.style.display = 'none';
            }
        });
    }

    // Add Group
    const btnAddGroup = document.getElementById('wb-add-group-btn');
    if (btnAddGroup) {
        btnAddGroup.addEventListener('click', () => {
            wbAddMenu.style.display = 'none';
            document.getElementById('add-group-name-input').value = '';
            openView(UI.overlays.addGroup);
        });
    }

    const confirmAddGroupBtn = document.getElementById('confirm-add-group-btn');
    if (confirmAddGroupBtn) {
        confirmAddGroupBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('add-group-name-input');
            const name = nameInput.value.trim();
            if (name) {
                if (!wbGroups.includes(name)) {
                    wbGroups.push(name);
                    renderWorldBooks(); // This will refresh the 'All' list
                    showToast('分组已添加');
                } else {
                    showToast('分组已存在');
                }
                nameInput.value = ''; // Clear input
            }
            closeView(UI.overlays.addGroup);
        });
    }

    // Add / Edit Book Logic
    const btnAddBook = document.getElementById('wb-add-book-btn');
    const addEntryBtn = document.getElementById('add-book-entry-btn');
    
    // New Buttons
    const wbEditActions = document.getElementById('wb-edit-actions');
    const deleteWorldBookBtn = document.getElementById('delete-world-book-btn');
    const wbImportBtn = document.getElementById('wb-import-btn');
    const wbExportBtn = document.getElementById('wb-export-btn');
    const wbImportFile = document.getElementById('wb-import-file');

    if (btnAddBook) {
        btnAddBook.addEventListener('click', () => {
            wbAddMenu.style.display = 'none';
            openBookModal(); // Open in create mode
        });
    }

    function openBookModal(book = null) {
        // Reset state
        if (book) {
            editingBookId = book.id;
            document.querySelector('#add-book-overlay .sheet-title').textContent = '编辑世界书';
            document.getElementById('add-book-name-input').value = book.name;
            document.getElementById('add-book-group-input').value = book.group;
            
            // Show Edit Actions
            if(wbEditActions) wbEditActions.style.display = 'flex';
            if(deleteWorldBookBtn) deleteWorldBookBtn.style.display = 'flex';

            // Clone entries deeply to avoid reference issues
            tempEntries = book.entries.map((e, idx) => ({ id: Date.now() + idx, keyword: e.keyword, content: e.content }));
            
            if (tempEntries.length > 0) {
                activeEntryId = tempEntries[0].id;
                renderEntries();
            } else {
                addEntry();
            }
        } else {
            editingBookId = null;
            document.querySelector('#add-book-overlay .sheet-title').textContent = '添加新书';
            document.getElementById('add-book-name-input').value = '';
            document.getElementById('add-book-group-input').value = '未分组';
            
            // Hide Edit Actions
            if(wbEditActions) wbEditActions.style.display = 'none';
            if(deleteWorldBookBtn) deleteWorldBookBtn.style.display = 'none';

            tempEntries = [];
            // Add initial empty entry
            addEntry();
        }
        
        openView(UI.overlays.addBook);
    }

    // Delete Logic
    if (deleteWorldBookBtn) {
        deleteWorldBookBtn.addEventListener('click', () => {
            if (!editingBookId) return;
            if (window.showCustomModal) {
                window.showCustomModal({
                    title: '删除世界书',
                    message: '确定要删除这本世界书吗？此操作不可恢复。',
                    isDestructive: true,
                    confirmText: '删除',
                    onConfirm: () => {
                        worldBooks = worldBooks.filter(b => b.id !== editingBookId);
                        renderWorldBooks();
                        closeView(UI.overlays.addBook);
                        showToast('世界书已删除');
                    }
                });
            } else {
                if (confirm('确定要删除这本世界书吗？此操作不可恢复。')) {
                    worldBooks = worldBooks.filter(b => b.id !== editingBookId);
                    renderWorldBooks();
                    closeView(UI.overlays.addBook);
                    showToast('世界书已删除');
                }
            }
        });
    }

    // Export Logic
    if (wbExportBtn) {
        wbExportBtn.addEventListener('click', () => {
            if (!editingBookId) return;
            const book = worldBooks.find(b => b.id === editingBookId);
            if (book) {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(book, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", (book.name || "worldbook") + ".json");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }
        });
    }

    // Import Logic
    if (wbImportBtn && wbImportFile) {
        wbImportBtn.addEventListener('click', () => {
            wbImportFile.click();
        });

        wbImportFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedBook = JSON.parse(event.target.result);
                    
                    // Fill inputs
                    if (importedBook.name) document.getElementById('add-book-name-input').value = importedBook.name;
                    if (importedBook.group) document.getElementById('add-book-group-input').value = importedBook.group;
                    
                    // Fill entries
                    if (importedBook.entries && Array.isArray(importedBook.entries)) {
                        tempEntries = importedBook.entries.map((e, idx) => ({ 
                            id: Date.now() + idx, 
                            keyword: e.keyword, 
                            content: e.content 
                        }));
                        if (tempEntries.length > 0) activeEntryId = tempEntries[0].id;
                        renderEntries();
                        showToast('导入成功');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('导入失败：格式错误');
                }
            };
            reader.readAsText(file);
            e.target.value = ''; // Reset
        });
    }

    function addEntry() {
        const newEntry = {
            id: Date.now(),
            keyword: `词条${tempEntries.length + 1}`,
            content: ''
        };
        tempEntries.push(newEntry);
        activeEntryId = newEntry.id;
        renderEntries();
    }

    function deleteEntry(id, e) {
        e.stopPropagation();
        tempEntries = tempEntries.filter(ent => ent.id !== id);
        if (activeEntryId === id) {
            activeEntryId = null;
        }
        renderEntries();
    }

    function renderEntries() {
        const listContainer = document.getElementById('wb-entries-list-container');
        if(!listContainer) return;
        listContainer.innerHTML = '';
        
        tempEntries.forEach(entry => {
            const isExpanded = entry.id === activeEntryId;
            const item = document.createElement('div');
            item.className = `wb-entry-item ${isExpanded ? 'expanded' : ''}`;
            
            item.innerHTML = `
                <div class="wb-entry-header">
                    <span class="wb-entry-title">${entry.keyword || '未命名词条'}</span>
                    <div class="wb-entry-actions">
                        <i class="fas fa-trash wb-entry-delete-btn"></i>
                        <i class="fas fa-chevron-down wb-entry-toggle-icon"></i>
                    </div>
                </div>
                <div class="wb-entry-body">
                    <input type="text" class="wb-entry-body-input" placeholder="关键词 (Key)" value="${entry.keyword}">
                    <textarea class="wb-entry-body-textarea" placeholder="输入详细设定内容...">${entry.content}</textarea>
                </div>
            `;
            
            const header = item.querySelector('.wb-entry-header');
            const deleteBtn = item.querySelector('.wb-entry-delete-btn');
            const keyInput = item.querySelector('.wb-entry-body-input');
            const contentInput = item.querySelector('.wb-entry-body-textarea');
            
            header.addEventListener('click', (e) => {
                if(e.target === deleteBtn || deleteBtn.contains(e.target)) return;
                // Toggle expand
                if (activeEntryId === entry.id) {
                    activeEntryId = null; // collapse
                } else {
                    activeEntryId = entry.id; // expand
                }
                renderEntries();
            });
            
            deleteBtn.addEventListener('click', (e) => {
                deleteEntry(entry.id, e);
            });
            
            keyInput.addEventListener('input', (e) => {
                entry.keyword = e.target.value;
                item.querySelector('.wb-entry-title').textContent = entry.keyword || '未命名词条';
            });
            
            contentInput.addEventListener('input', (e) => {
                entry.content = e.target.value;
            });
            
            listContainer.appendChild(item);
        });
    }

    if (addEntryBtn) {
        addEntryBtn.addEventListener('click', addEntry);
    }

    // Group Picker for Add Book
    const groupSelector = document.getElementById('book-group-selector');
    if (groupSelector) {
        groupSelector.addEventListener('click', () => {
            renderBookGroupPicker();
            openView(UI.overlays.bookGroupPicker);
        });
    }

    document.getElementById('close-book-group-picker-btn').addEventListener('click', () => {
        closeView(UI.overlays.bookGroupPicker);
    });

    function renderBookGroupPicker() {
        const list = document.getElementById('book-group-list');
        list.innerHTML = '';
        
        const allGroups = ['未分组', ...wbGroups];
        allGroups.forEach(g => {
            const item = document.createElement('div');
            item.className = 'account-card';
            item.innerHTML = `
                <div class="account-content" style="cursor: pointer; justify-content: center;">
                    <div class="account-name">${g}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                document.getElementById('add-book-group-input').value = g;
                closeView(UI.overlays.bookGroupPicker);
            });
            list.appendChild(item);
        });
    }

    // Confirm Add/Edit Book
    const confirmAddBookBtn = document.getElementById('confirm-add-book-btn');
    if (confirmAddBookBtn) {
        confirmAddBookBtn.addEventListener('click', () => {
            const name = document.getElementById('add-book-name-input').value.trim() || '未命名世界书';
            const group = document.getElementById('add-book-group-input').value;
            
            // Clean up entries (remove id used for UI)
            const finalEntries = tempEntries.map(e => ({ keyword: e.keyword, content: e.content }));

            if (editingBookId) {
                // Update existing
                const book = worldBooks.find(b => b.id === editingBookId);
                if (book) {
                    book.name = name;
                    book.group = group;
                    book.entries = finalEntries;
                    showToast('世界书已更新');
                }
            } else {
                // Create new
                worldBooks.push({
                    id: Date.now(),
                    name,
                    group: group === '未分组' ? '未分组' : group,
                    entries: finalEntries,
                    isGlobal: false,
                    attachedRoles: []
                });
                showToast('世界书已添加');
            }

            renderWorldBooks();
            closeView(UI.overlays.addBook);
        });
    }

    // Render World Books Helper
    function calculateTokens(entries) {
        // Very rough mock token calculation
        let text = entries.map(e => e.keyword + e.content).join('');
        return Math.ceil(text.length * 1.5) || 0;
    }
    window.calculateTokens = calculateTokens; // Export for imessage.js

    function createBookHtml(book, type) {
        let rightElementHtml = '';
        const tokens = calculateTokens(book.entries);

        if (type === 'all' || type === 'global') {
            rightElementHtml = `
                <div class="wb-book-meta">
                    <span class="wb-token-count">+${tokens} Tokens</span>
                    <label class="toggle-switch">
                        <input type="checkbox" class="wb-global-toggle" data-id="${book.id}" ${book.isGlobal ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
        } else if (type === 'local') {
            const avatarSrc = book.attachedRoles[0]?.avatarUrl || '';
            const avatarInner = avatarSrc ? `<img src="${avatarSrc}">` : `<i class="fas fa-user"></i>`;
            rightElementHtml = `
                <div class="wb-book-meta">
                    <span class="wb-token-count">+${tokens} Tokens</span>
                    <div class="wb-char-avatar">${avatarInner}</div>
                </div>
            `;
        }

        return `
            <div class="wb-book-item" data-id="${book.id}">
                <div class="wb-book-info">
                    <div class="wb-book-icon" style="background-color: #1c1c1e;"><i class="fas fa-book"></i></div>
                    <div class="wb-book-name">${book.name}</div>
                </div>
                ${rightElementHtml}
            </div>
        `;
    }

    function renderWorldBooks() {
        // Render All Tab
        const allList = document.getElementById('wb-all-list');
        if (!allList) return;
        allList.innerHTML = '';
        
        // Render Groups
        wbGroups.forEach(groupName => {
            const booksInGroup = worldBooks.filter(b => b.group === groupName);
            
            const groupDiv = document.createElement('div');
            groupDiv.className = 'wb-group-container';
            
            const booksHtml = booksInGroup.map(b => createBookHtml(b, 'all')).join('');
            
            groupDiv.innerHTML = `
                <div class="wb-group-header">
                    <div class="wb-group-title">${groupName} <span style="color:#8e8e93; font-weight:normal; font-size:14px; margin-left:5px;">(${booksInGroup.length})</span></div>
                    <i class="fas fa-chevron-down toggle-icon" style="color: #c7c7cc; transition: transform 0.3s;"></i>
                </div>
                <div class="wb-group-content open">
                    ${booksHtml}
                </div>
            `;
            
            // Toggle fold
            const header = groupDiv.querySelector('.wb-group-header');
            const content = groupDiv.querySelector('.wb-group-content');
            const icon = groupDiv.querySelector('.toggle-icon');
            header.addEventListener('click', () => {
                content.classList.toggle('open');
                if (content.classList.contains('open')) {
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    icon.style.transform = 'rotate(-90deg)';
                }
            });

            allList.appendChild(groupDiv);
        });

        // Render Ungrouped
        const unGroupedBooks = worldBooks.filter(b => b.group === '未分组');
        if (unGroupedBooks.length > 0) {
            const unGroupDiv = document.createElement('div');
            unGroupDiv.className = 'wb-group-container';
            const booksHtml = unGroupedBooks.map(b => createBookHtml(b, 'all')).join('');
            unGroupDiv.innerHTML = `
                <div class="wb-group-header">
                    <div class="wb-group-title">未分组 <span style="color:#8e8e93; font-weight:normal; font-size:14px; margin-left:5px;">(${unGroupedBooks.length})</span></div>
                    <i class="fas fa-chevron-down toggle-icon" style="color: #c7c7cc;"></i>
                </div>
                <div class="wb-group-content open">
                    ${booksHtml}
                </div>
            `;
            // Toggle fold
            const header = unGroupDiv.querySelector('.wb-group-header');
            const content = unGroupDiv.querySelector('.wb-group-content');
            const icon = unGroupDiv.querySelector('.toggle-icon');
            header.addEventListener('click', () => {
                content.classList.toggle('open');
                icon.style.transform = content.classList.contains('open') ? 'rotate(0deg)' : 'rotate(-90deg)';
            });

            allList.appendChild(unGroupDiv);
        }

        // Render Global Tab
        const globalList = document.getElementById('wb-global-list');
        if (globalList) {
            const globalBooks = worldBooks.filter(b => b.isGlobal);
            globalList.innerHTML = `<div style="padding: 10px 16px;">
                ${globalBooks.map(b => createBookHtml(b, 'global')).join('')}
            </div>`;
        }

        // Render Local Tab
        const localList = document.getElementById('wb-local-list');
        if (localList) {
            let localItemsHtml = '';
            
            // Get friends from imessage.js via global export if available
            const friends = window.getImFriends ? window.getImFriends() : [];
            
            worldBooks.forEach(book => {
                // Find all friends that have bound this book
                const boundFriends = friends.filter(f => f.boundBooks && f.boundBooks.includes(book.id));
                
                boundFriends.forEach(friend => {
                    const tokens = window.calculateTokens(book.entries);
                    const avatarSrc = friend.avatarUrl || '';
                    const avatarInner = avatarSrc ? `<img src="${avatarSrc}">` : `<i class="fas fa-user"></i>`;
                    
                    const rightElementHtml = `
                        <div class="wb-book-meta">
                            <span class="wb-token-count">+${tokens} Tokens</span>
                            <div class="wb-char-avatar">${avatarInner}</div>
                        </div>
                    `;
                    
                    localItemsHtml += `
                        <div class="wb-book-item" data-id="${book.id}">
                            <div class="wb-book-info">
                                <div class="wb-book-icon"><i class="fas fa-book"></i></div>
                                <div class="wb-book-name">${book.name}</div>
                            </div>
                            ${rightElementHtml}
                        </div>
                    `;
                });
            });
            
            if (localItemsHtml === '') {
                localList.innerHTML = `<div style="padding: 40px 16px; text-align: center; color: #8e8e93; font-size: 15px;">暂无绑定</div>`;
            } else {
                localList.innerHTML = `<div style="padding: 10px 16px; display: flex; flex-direction: column; gap: 10px;">
                    ${localItemsHtml}
                </div>`;
            }
        }
    }
    window.renderWorldBooks = renderWorldBooks; // Export for update

    // Global Click Listener for Edit Book (Event Delegation)
    document.addEventListener('click', (e) => {
        // Handle Edit Book Click
        const bookItem = e.target.closest('.wb-book-item');
        if (bookItem) {
            // Ensure we didn't click the toggle switch
            if (!e.target.closest('.toggle-switch')) {
                const bookId = parseInt(bookItem.getAttribute('data-id'));
                const book = worldBooks.find(b => b.id === bookId);
                if (book) {
                    if (wbAddMenu) wbAddMenu.style.display = 'none'; // Close menu if open
                    openBookModal(book);
                }
            }
        }
    });

    // Global Change Listener for Toggles
    document.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('wb-global-toggle')) {
            const bookId = parseInt(e.target.getAttribute('data-id'));
            const book = worldBooks.find(b => b.id === bookId);
            if (book) {
                book.isGlobal = e.target.checked;
                
                // Sync UI: update all switches for this book
                document.querySelectorAll(`.wb-global-toggle[data-id="${bookId}"]`).forEach(s => {
                    s.checked = book.isGlobal;
                });

                // If in Global tab and unchecking, remove item with animation
                if (!book.isGlobal) {
                    const globalList = document.getElementById('wb-global-list');
                    // Check if the event came from inside global list
                    if (globalList && globalList.contains(e.target)) {
                        const row = e.target.closest('.wb-book-item');
                        if (row) {
                            row.classList.add('removing');
                            setTimeout(() => {
                                row.remove();
                            }, 300);
                        }
                    } else {
                        // Unchecked from All tab, just refresh global list silently
                        if (globalList) {
                            const globalBooks = worldBooks.filter(b => b.isGlobal);
                            globalList.innerHTML = `<div style="padding: 10px 16px;">
                                ${globalBooks.map(b => createBookHtml(b, 'global')).join('')}
                            </div>`;
                        }
                    }
                } else {
                    // Checked from All tab, add to global list
                    const globalList = document.getElementById('wb-global-list');
                    if (globalList) {
                        const globalBooks = worldBooks.filter(b => b.isGlobal);
                        globalList.innerHTML = `<div style="padding: 10px 16px;">
                            ${globalBooks.map(b => createBookHtml(b, 'global')).join('')}
                        </div>`;
                    }
                }
            }
        }
    });


    // --- Bottom Nav Logic moved to imessage.js to avoid conflicts ---
    
    // --- Chat Sending Logic (Shared Helper Functions if needed) ---
    const chatInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('send-msg-btn');
    const micBtn = document.getElementById('mic-msg-btn');
    const chatMessagesContainer = document.getElementById('ins-chat-messages');

    function scrollToBottom() {
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    function appendUserMessage(msg) {
        if (!chatMessagesContainer) return;
        const row = document.createElement('div');
        row.className = 'chat-row user-row';
        row.innerHTML = `<div class="chat-bubble user-bubble">${msg}</div>`;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
    }

    function appendAiMessage(msg, friend) {
        if (!chatMessagesContainer) return;
        const row = document.createElement('div');
        row.className = 'chat-row ai-row';
        
        const avatarHtml = (friend && friend.avatarUrl) 
            ? `<img src="${friend.avatarUrl}">`
            : `<i class="fas fa-user"></i>`;

        row.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="chat-bubble ai-bubble">${msg}</div>
        `;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
    }

    function appendAiTyping(friend) {
        if (!chatMessagesContainer) return null;
        const row = document.createElement('div');
        row.className = 'chat-row ai-row typing-row';
        
        const avatarHtml = (friend && friend.avatarUrl) 
            ? `<img src="${friend.avatarUrl}">`
            : `<i class="fas fa-user"></i>`;

        row.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
        return row;
    }

    function handleSendMessage() {
        if (!chatInput) return;
        const msg = chatInput.value.trim();
        if (msg) {
            appendUserMessage(msg);
            chatInput.value = '';
        }
    }

    async function handleAiGenerate() {
        if (!currentActiveFriend) {
            showToast('No active friend selected.');
            return;
        }
        
        if (!apiConfig.endpoint || !apiConfig.apiKey) {
            showToast('请先配置 API Endpoint 和 Key');
            return;
        }

        const typingRow = appendAiTyping(currentActiveFriend);
        if(micBtn) micBtn.style.opacity = '0.5';

        const systemPrompt = `You are playing the role of ${currentActiveFriend.realName || currentActiveFriend.nickname}. 
Your persona is: ${currentActiveFriend.persona || 'No specific persona'}. 
You are talking to ${userState.name}, whose persona is: ${userState.persona || 'A normal user'}.
Reply naturally as your character in a chat app. Do not include your own name at the beginning.`;

        const messages = [{ role: 'system', content: systemPrompt }];
        
        if (chatMessagesContainer) {
            const rows = chatMessagesContainer.querySelectorAll('.chat-row');
            const recentRows = Array.from(rows).slice(-10);
            recentRows.forEach(row => {
                if (row.classList.contains('typing-row')) return;
                const bubble = row.querySelector('.chat-bubble');
                if (bubble) {
                    if (row.classList.contains('user-row')) {
                        messages.push({ role: 'user', content: bubble.textContent });
                    } else if (row.classList.contains('ai-row')) {
                        messages.push({ role: 'assistant', content: bubble.textContent });
                    }
                }
            });
        }
        
        if (messages.length === 1) {
            messages.push({ role: 'user', content: '你好' });
        }

        try {
            let endpoint = apiConfig.endpoint;
            // 确保 endpoint 结尾没有 /，且自动补全 /chat/completions 或 /v1/chat/completions 
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: apiConfig.model || 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: parseFloat(apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            const aiReply = data.choices[0].message.content;
            
            if (typingRow) typingRow.remove();
            appendAiMessage(aiReply, currentActiveFriend);

        } catch (error) {
            console.error(error);
            if (typingRow) typingRow.remove();
            showToast('API 请求失败，请检查配置或网络');
        } finally {
            if(micBtn) micBtn.style.opacity = '1';
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (micBtn) {
        micBtn.addEventListener('click', handleAiGenerate);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    // Apple ID Profile
    document.getElementById('apple-id-trigger').addEventListener('click', (e) => {
        e.stopPropagation(); 
        syncUIs();
        openView(UI.views.edit);
    });
    document.getElementById('edit-back-btn').addEventListener('click', () => closeView(UI.views.edit));

    // Main Edit Avatar Logic
    const mainEditAvatarWrapper = document.getElementById('main-edit-avatar-wrapper');
    const mainAvatarUpload = document.getElementById('main-avatar-upload');
    if (mainEditAvatarWrapper && mainAvatarUpload) {
        mainEditAvatarWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') mainAvatarUpload.click();
        });

        mainAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const url = event.target.result;
                    // Update user state
                    userState.avatarUrl = url;
                    
                    // Update current account in accounts array
                    const acc = accounts.find(a => a.id === currentAccountId);
                    if (acc) {
                        acc.avatarUrl = url;
                    }
                    
                    // Sync the UI immediately
                    syncUIs();
                    showToast('头像已更新');
                };
                reader.readAsDataURL(file);
            }
            e.target.value = ''; // Reset
        });
    }

    // ==========================================
    // 6. ACCOUNT MANAGEMENT
    // ==========================================
    // Open Switcher
    document.getElementById('switch-account-btn').addEventListener('click', () => {
        renderAccountList();
        openView(UI.overlays.accountSwitcher);
    });

    // Add New Account
    document.getElementById('add-account-btn').addEventListener('click', () => {
        isCreatingNewAccount = true;
        detailTempId = Date.now();
        UI.inputs.detailName.value = '';
        UI.inputs.detailPhone.value = '';
        if(UI.inputs.detailSignature) UI.inputs.detailSignature.value = '';
        UI.inputs.detailPersona.value = '';
        setDetailAvatar(null);
        openView(UI.overlays.personaDetail);
    });

    // Save Selected Account to Main State
    document.getElementById('save-id-btn').addEventListener('click', () => {
        const accToSync = accounts.find(a => a.id === currentAccountId);
        if (accToSync) {
            userState.name = accToSync.name;
            userState.phone = accToSync.phone;
            userState.persona = accToSync.signature || accToSync.persona; // Use signature for display
            userState.avatarUrl = accToSync.avatarUrl;
            syncUIs();
        }
        closeView(UI.overlays.accountSwitcher);
    });

    // Detail View Confirm
    document.getElementById('confirm-sync-btn').addEventListener('click', () => {
        const name = UI.inputs.detailName.value || 'New User';
        const phone = UI.inputs.detailPhone.value;
        const signature = UI.inputs.detailSignature ? UI.inputs.detailSignature.value : '';
        const persona = UI.inputs.detailPersona.value;
        const currentAvatarSrc = UI.inputs.detailAvatarImg.style.display === 'block' ? UI.inputs.detailAvatarImg.src : null;

        if (isCreatingNewAccount) {
            accounts.push({ id: detailTempId, name, phone, signature, persona, avatarUrl: currentAvatarSrc });
            currentAccountId = detailTempId; 
        } else {
            const acc = accounts.find(a => a.id === detailTempId);
            if (acc) {
                acc.name = name;
                acc.phone = phone;
                acc.signature = signature;
                acc.persona = persona;
                acc.avatarUrl = currentAvatarSrc;
            }
        }
        isCreatingNewAccount = false;
        saveGlobalData();
        renderAccountList(); 
        closeView(UI.overlays.personaDetail); 
    });

    // Avatar Upload Handler
    const userDetailAvatarWrapper = document.getElementById('user-detail-avatar-wrapper');
    if (userDetailAvatarWrapper) {
        userDetailAvatarWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') document.getElementById('detail-avatar-upload').click();
        });
    }

    document.getElementById('detail-avatar-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setDetailAvatar(e.target.result);
            reader.readAsDataURL(file);
        }
    });

    function setDetailAvatar(url) {
        if (url) {
            UI.inputs.detailAvatarImg.src = url;
            UI.inputs.detailAvatarImg.style.display = 'block';
            UI.inputs.detailAvatarIcon.style.display = 'none';
        } else {
            UI.inputs.detailAvatarImg.style.display = 'none';
            UI.inputs.detailAvatarIcon.style.display = 'block';
            UI.inputs.detailAvatarImg.src = '';
        }
    }

    function renderAccountList() {
        if(!UI.lists.accounts) return;
        UI.lists.accounts.innerHTML = '';

        accounts.forEach(acc => {
            const card = document.createElement('div');
            card.className = `account-card ${acc.id === currentAccountId ? 'selected' : ''}`;
            
            const avatarHtml = acc.avatarUrl ? `<img src="${acc.avatarUrl}" alt="">` : `<i class="fas fa-user"></i>`;
            card.innerHTML = `
                <div class="account-content">
                    <div class="account-avatar">${avatarHtml}</div>
                    <div class="account-info">
                        <div class="account-name">${acc.name}</div>
                        <div class="account-detail">${acc.phone || 'No Phone'}</div>
                    </div>
                    <i class="fas fa-times delete-icon"></i>
                </div>
            `;

            // Click to Open Detail View & Set Active
            card.querySelector('.account-content').addEventListener('click', (e) => {
                // If clicked on delete icon, do not open detail view
                if (e.target.classList.contains('delete-icon') || e.target.closest('.delete-icon')) return;

                currentAccountId = acc.id;
                renderAccountList(); // Refresh highlighting
                
                isCreatingNewAccount = false;
                detailTempId = acc.id;
                UI.inputs.detailName.value = acc.name || '';
                UI.inputs.detailPhone.value = acc.phone || '';
                if(UI.inputs.detailSignature) UI.inputs.detailSignature.value = acc.signature || acc.persona || '';
                UI.inputs.detailPersona.value = acc.persona || '';
                setDetailAvatar(acc.avatarUrl);
                
                openView(UI.overlays.personaDetail);
            });

            // Delete Action
            card.querySelector('.delete-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete account "${acc.name}"?`)) {
                    accounts = accounts.filter(a => a.id !== acc.id);
                    if (currentAccountId === acc.id) currentAccountId = accounts.length > 0 ? accounts[0].id : null;
                    saveGlobalData();
                    renderAccountList();
                }
            });

            UI.lists.accounts.appendChild(card);
        });
    }

    // ==========================================
    // 7. API CONFIGURATION
    // ==========================================
    // Open API Settings
    document.getElementById('api-config-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        UI.inputs.apiEndpoint.value = apiConfig.endpoint;
        UI.inputs.apiKey.value = apiConfig.apiKey;
        UI.inputs.apiModel.value = apiConfig.model;
        UI.inputs.apiTemp.value = apiConfig.temperature;
        openView(UI.overlays.apiConfig);
    });

    // Confirm API Settings
    document.getElementById('confirm-api-btn').addEventListener('click', () => {
        apiConfig.endpoint = UI.inputs.apiEndpoint.value;
        apiConfig.apiKey = UI.inputs.apiKey.value;
        apiConfig.model = UI.inputs.apiModel.value;
        apiConfig.temperature = parseFloat(UI.inputs.apiTemp.value) || 0.7;
        
        // Save globally
        window.apiConfig = apiConfig;
        saveGlobalData();
        
        closeView(UI.overlays.apiConfig);
        showToast('API Config Saved');
    });

    // Real Fetch Models Logic
    const btnApiFetch = document.getElementById('fetch-models-btn');
    btnApiFetch.addEventListener('click', async () => {
        const endpoint = UI.inputs.apiEndpoint.value.trim();
        const key = UI.inputs.apiKey.value.trim();
        
        if (!endpoint) {
            showToast('Please enter an endpoint');
            return;
        }

        const originalText = btnApiFetch.innerHTML;
        btnApiFetch.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
        
        try {
            // Clean up endpoint to point to /v1/models
            let url = endpoint;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/models')) {
                url = url.endsWith('/v1') ? url + '/models' : url + '/v1/models';
            }

            const headers = { 'Content-Type': 'application/json' };
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
            }

            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) throw new Error('Network response was not ok');
            
            const data = await res.json();
            
            if (data && data.data && Array.isArray(data.data)) {
                fetchedModels = data.data.map(m => m.id);
                saveGlobalData();
                showToast(`Fetched ${fetchedModels.length} models!`);
            } else {
                throw new Error('Invalid format');
            }
        } catch (error) {
            console.error('Fetch Models Error:', error);
            showToast('Failed to fetch models');
        } finally {
            btnApiFetch.innerHTML = originalText;
        }
    });

    // -- Presets --
    // Open Save Preset
    document.getElementById('save-preset-btn').addEventListener('click', () => {
        UI.inputs.presetName.value = '';
        openView(UI.overlays.savePreset);
    });

    // Confirm Save Preset
    document.getElementById('confirm-save-preset-btn').addEventListener('click', () => {
        apiPresets.push({
            id: Date.now(),
            name: UI.inputs.presetName.value || 'Untitled Preset',
            endpoint: UI.inputs.apiEndpoint.value,
            apiKey: UI.inputs.apiKey.value,
            model: UI.inputs.apiModel.value,
            temp: UI.inputs.apiTemp.value
        });
        saveGlobalData();
        closeView(UI.overlays.savePreset);
    });

    // Open Load Preset
    document.getElementById('load-preset-btn').addEventListener('click', () => {
        renderPresetList();
        openView(UI.overlays.loadPreset);
    });

    function renderPresetList() {
        if(!UI.lists.presets) return;
        UI.lists.presets.innerHTML = '';
        
        apiPresets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'account-card'; 
            item.innerHTML = `
                <div class="account-content" style="cursor: pointer;">
                    <div class="account-avatar" style="background-color: var(--blue-color); color: white;"><i class="fas fa-server"></i></div>
                    <div class="account-info">
                        <div class="account-name">${preset.name}</div>
                        <div class="account-detail" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${preset.endpoint}</div>
                    </div>
                    <i class="fas fa-times delete-icon"></i>
                </div>
            `;
            
            item.querySelector('.account-content').addEventListener('click', (e) => {
                // If clicked on delete icon, do not load preset
                if (e.target.classList.contains('delete-icon') || e.target.closest('.delete-icon')) return;

                UI.inputs.apiEndpoint.value = preset.endpoint;
                UI.inputs.apiKey.value = preset.apiKey;
                UI.inputs.apiModel.value = preset.model || 'gpt-3.5-turbo';
                UI.inputs.apiTemp.value = preset.temp || 0.7;
                closeView(UI.overlays.loadPreset);
            });

            // Delete Action
            item.querySelector('.delete-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete preset "${preset.name}"?`)) {
                    apiPresets = apiPresets.filter(p => p.id !== preset.id);
                    saveGlobalData();
                    renderPresetList();
                }
            });

            UI.lists.presets.appendChild(item);
        });
    }

    // -- Model Picker --
    UI.inputs.apiModel.addEventListener('click', () => {
        renderModelList();
        openView(UI.overlays.modelPicker);
    });

    function renderModelList() {
        if(!UI.lists.models) return;
        UI.lists.models.innerHTML = '';
        fetchedModels.forEach(model => {
            const item = document.createElement('div');
            item.className = 'account-card';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="account-content">
                    <div class="account-info">
                        <div class="account-name" style="text-align:center;">${model}</div>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => {
                UI.inputs.apiModel.value = model;
                closeView(UI.overlays.modelPicker);
            });
            UI.lists.models.appendChild(item);
        });
    }


    // ==========================================
    // 8. THEME CONFIGURATION
    // ==========================================
    // Open Theme Settings
    document.getElementById('theme-config-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        renderThemeAppList();
        openView(UI.overlays.themeConfig);
    });

    // Theme Background Upload
    document.getElementById('theme-bg-upload-btn').addEventListener('click', () => {
        document.getElementById('theme-bg-file-input').click();
    });
    
    // Theme Background Reset
    document.getElementById('theme-bg-reset-btn').addEventListener('click', () => {
        themeState.bgUrl = null;
        if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = '';
        showToast('背景已重置，点击保存生效');
    });

    document.getElementById('theme-bg-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Resize for background (max 1080p)
                if (window.compressImage) {
                    window.compressImage(event.target.result, 1080, 1920, (compressedUrl) => {
                        if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = compressedUrl;
                        themeState.bgUrl = compressedUrl;
                        showToast('背景已加载，点击保存生效');
                    });
                } else {
                    if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = event.target.result;
                    themeState.bgUrl = event.target.result;
                    showToast('背景已加载，点击保存生效');
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });
    
    // Background URL Input Change
    if (UI.inputs.themeBgUrl) {
        UI.inputs.themeBgUrl.addEventListener('input', (e) => {
            themeState.bgUrl = e.target.value;
        });
    }

    // Reset All Icons
    const resetAllIconsBtn = document.getElementById('theme-reset-all-icons-btn');
    if (resetAllIconsBtn) {
        resetAllIconsBtn.addEventListener('click', () => {
            themeState.apps.forEach(app => {
                app.icon = null;
            });
            renderThemeAppList();
            showToast('应用图标已全部重置，点击保存生效');
        });
    }

    // Render App List for Customization
    function renderThemeAppList() {
        if (!UI.inputs.themeAppList) return;
        UI.inputs.themeAppList.innerHTML = '';

        themeState.apps.forEach((app, index) => {
            const item = document.createElement('div');
            item.className = 'form-item';
            // Custom styling for app item
            item.style.padding = '8px 16px';
            item.style.height = '60px';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.borderBottom = '1px solid #f2f2f7';
            
            // Icon Preview (or placeholder)
            let iconHtml = '';
            if (app.icon) {
                iconHtml = `<div style="width: 40px; height: 40px; border-radius: 10px; background-image: url('${app.icon}'); background-size: cover; background-position: center; border: 1px solid #e5e5ea; flex-shrink: 0;"></div>`;
            } else {
                iconHtml = `<div style="width: 40px; height: 40px; border-radius: 10px; background-color: #f2f2f7; border: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: center; color: #c7c7cc; flex-shrink: 0;"><i class="fas fa-image"></i></div>`;
            }

            item.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1;">
                    ${iconHtml}
                    <div style="margin-left: 12px; font-size: 16px; font-weight: 500; color: #000;">${app.name}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <div class="reset-single-app-btn" style="width: 32px; height: 32px; border-radius: 50%; background: #ffebee; color: #ff3b30; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                        <i class="fas fa-undo" style="font-size: 14px;"></i>
                    </div>
                    <div class="upload-single-app-btn" style="width: 32px; height: 32px; border-radius: 50%; background: #e8f5e9; color: #34c759; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                        <i class="fas fa-upload" style="font-size: 14px;"></i>
                    </div>
                </div>
            `;
            
            // Click to reset
            const resetBtn = item.querySelector('.reset-single-app-btn');
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                themeState.apps[index].icon = null;
                renderThemeAppList();
            });

            // Click to upload
            const uploadBtn = item.querySelector('.upload-single-app-btn');
            uploadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentEditingAppIndex = index;
                document.getElementById('theme-app-file-input').click();
            });

            UI.inputs.themeAppList.appendChild(item);
        });
    }

    // Handle App Icon File Selection
    document.getElementById('theme-app-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && currentEditingAppIndex >= 0) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Compress icon to tiny size (150x150) to save space
                if (window.compressImage) {
                    window.compressImage(event.target.result, 150, 150, (compressedUrl) => {
                        themeState.apps[currentEditingAppIndex].icon = compressedUrl;
                        renderThemeAppList();
                    });
                } else {
                    themeState.apps[currentEditingAppIndex].icon = event.target.result;
                    renderThemeAppList();
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    });

    // Apply specific logic for app icon background to avoid overlay bug
    function applyAppIconStyles(app) {
        const el = document.getElementById(app.id);
        if (!el) return;
        
        // Target the inner .app-icon div rather than the wrapper
        const iconDiv = el.querySelector('.app-icon');
        const iEl = el.querySelector('i');
        const nameEl = el.querySelector('.app-name');
        
        if (nameEl && app.name) {
            nameEl.textContent = app.name;
        }

        if (!iconDiv) return;

        if (app.icon) {
            // Apply image, clear background color
            iconDiv.style.backgroundImage = `url(${app.icon})`;
            iconDiv.style.backgroundSize = 'cover';
            iconDiv.style.backgroundPosition = 'center';
            iconDiv.style.backgroundColor = 'transparent';
            if (iEl) iEl.style.display = 'none';
        } else {
            // Revert to original
            iconDiv.style.backgroundImage = 'none';
            // Restore original gradient/color using inline style if it was stripped, 
            // but normally removing backgroundImage is enough if CSS handles it.
            // We'll rely on the default inline style still being there under the hood or class defaults.
            if (app.id === 'dock-icon-settings') { iconDiv.style.background = 'linear-gradient(180deg, #e3e3e3 0%, #cfcfcf 100%)'; iconDiv.style.color = '#fff'; if (iEl) iEl.className = 'fas fa-cog'; }
            else if (app.id === 'dock-icon-imessage') { iconDiv.style.background = 'linear-gradient(180deg, #dfebd6 0%, #c8d8bd 100%)'; iconDiv.style.color = '#fff'; if (iEl) iEl.className = 'fas fa-comment'; }
            else if (app.id === 'dock-icon-youtube') { iconDiv.style.background = '#fdfaf9'; iconDiv.style.color = '#d1b8b8'; if (iEl) iEl.className = 'fab fa-youtube'; }
            else if (app.id === 'app-icon-1') { iconDiv.style.background = 'linear-gradient(180deg, #d3d9d3 0%, #b8c1b8 100%)'; iconDiv.style.color = 'white'; if (iEl) iEl.className = 'fas fa-wallet'; }
            else if (app.id === 'app-icon-2') { iconDiv.style.background = 'linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%)'; iconDiv.style.color = '#333'; if (iEl) iEl.className = 'fab fa-tiktok'; } // TikTok Style
            else if (app.id === 'app-icon-3') { iconDiv.style.background = 'linear-gradient(180deg, #ebdada 0%, #d8c8c8 100%)'; iconDiv.style.color = 'white'; if (iEl) iEl.className = 'fas fa-sticky-note'; }
            else if (app.id === 'app-icon-4') { iconDiv.style.background = '#f7f5f5'; iconDiv.style.color = '#b0a0a0'; if (iEl) iEl.className = 'fas fa-calendar-alt'; }
            
            if (iEl) iEl.style.display = '';
        }
    }

    // Confirm Theme Settings
    document.getElementById('confirm-theme-btn').addEventListener('click', () => {
        // Apply Background
        const bgUrl = (UI.inputs.themeBgUrl && UI.inputs.themeBgUrl.value) ? UI.inputs.themeBgUrl.value.trim() : themeState.bgUrl;
        const screenEl = document.querySelector('.screen');
        if (screenEl) {
            if (bgUrl) {
                // Remove nested quotes to avoid parsing errors with long base64 strings
                screenEl.style.backgroundImage = `url(${bgUrl})`;
                screenEl.style.backgroundSize = 'cover';
                screenEl.style.backgroundPosition = 'center';
            } else {
                screenEl.style.backgroundImage = 'none';
                screenEl.style.backgroundColor = '#000'; // Default fallback
            }
        }

        // Apply App Icons
        themeState.apps.forEach(app => {
            applyAppIconStyles(app);
        });

        saveGlobalData();
        closeView(UI.overlays.themeConfig);
        showToast('主题已应用！');
    });

    // Apply theme on load
    function applySavedTheme() {
        const screenEl = document.querySelector('.screen');
        if (screenEl) {
            if (themeState.bgUrl) {
                screenEl.style.backgroundImage = `url(${themeState.bgUrl})`;
                screenEl.style.backgroundSize = 'cover';
                screenEl.style.backgroundPosition = 'center';
            } else {
                screenEl.style.backgroundImage = 'none';
            }
        }
        themeState.apps.forEach(app => {
            applyAppIconStyles(app);
        });
    }

    // ==========================================
    // 8.5 DATA MANAGEMENT
    // ==========================================
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
        saveGlobalData(); // Ensure latest state is saved
        const dataStr = localStorage.getItem('ios_emulator_global_data');
        if (!dataStr) {
            showToast('暂无数据可导出');
            return;
        }
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emulator_data_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('导出成功');
    });

    const importDataBtn = document.getElementById('import-data-btn');
    const importDataFile = document.getElementById('import-data-file');
    
    if (importDataBtn && importDataFile) {
        importDataBtn.addEventListener('click', () => {
            importDataFile.click();
        });

        importDataFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (parsed && typeof parsed === 'object') {
                        localStorage.setItem('ios_emulator_global_data', event.target.result);
                        showToast('导入成功，即将刷新...');
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        showToast('无效的数据格式');
                    }
                } catch (err) {
                    showToast('文件解析失败');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    document.getElementById('clear-data-btn')?.addEventListener('click', () => {
        if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
            localStorage.removeItem('ios_emulator_global_data');
            showToast('数据已清空，即将刷新...');
            setTimeout(() => location.reload(), 1500);
        }
    });

    // ==========================================
    // 9. SYNCHRONIZATION HELPERS
    // ==========================================
    window.syncUIs = function syncUIs() {
        // Sync Home Screen
        if(UI.displays.homeName) UI.displays.homeName.textContent = userState.name;
        
        if (userState.avatarUrl) {
            if(UI.displays.homeAvatarImg) {
                UI.displays.homeAvatarImg.src = userState.avatarUrl;
                UI.displays.homeAvatarImg.style.display = 'block';
            }
            if(UI.displays.homeAvatarIcon) UI.displays.homeAvatarIcon.style.display = 'none';
        } else {
            if(UI.displays.homeAvatarImg) UI.displays.homeAvatarImg.style.display = 'none';
            if(UI.displays.homeAvatarIcon) UI.displays.homeAvatarIcon.style.display = 'block';
        }
        
        // Sync Main Settings Profile Card
        if(UI.displays.settingsName) UI.displays.settingsName.textContent = userState.name;
        
        if (userState.avatarUrl) {
            if(UI.displays.settingsAvatarImg) {
                UI.displays.settingsAvatarImg.src = userState.avatarUrl;
                UI.displays.settingsAvatarImg.style.display = 'block';
            }
            if(UI.displays.settingsAvatarIcon) UI.displays.settingsAvatarIcon.style.display = 'none';
        } else {
            if(UI.displays.settingsAvatarImg) UI.displays.settingsAvatarImg.style.display = 'none';
            if(UI.displays.settingsAvatarIcon) UI.displays.settingsAvatarIcon.style.display = 'block';
        }
        
        // Sync Apple ID View
        if(UI.displays.displayName) UI.displays.displayName.textContent = userState.name;
        if(UI.displays.displayPhone) UI.displays.displayPhone.textContent = userState.phone || 'No Phone';
        
        const displaySignature = document.getElementById('display-signature');
        if(displaySignature) displaySignature.textContent = userState.persona || 'No Signature';

        if (userState.avatarUrl) {
            if(UI.displays.editAvatarImg) {
                UI.displays.editAvatarImg.src = userState.avatarUrl;
                UI.displays.editAvatarImg.style.display = 'block';
            }
            if(UI.displays.editAvatarIcon) UI.displays.editAvatarIcon.style.display = 'none';
        } else {
            if(UI.displays.editAvatarImg) UI.displays.editAvatarImg.style.display = 'none';
            if(UI.displays.editAvatarIcon) UI.displays.editAvatarIcon.style.display = 'block';
        }

        // Sync iMessage (LINE Style) Profile
        const imName = document.getElementById('imessage-profile-name');
        const imSign = document.getElementById('imessage-profile-sign');
        const imAvatarImg = document.getElementById('imessage-avatar-img');
        const imAvatarIcon = document.getElementById('imessage-avatar-icon');

        if (imName) imName.textContent = userState.name;
        if (imSign) imSign.textContent = userState.persona || 'No Persona';

        if (userState.avatarUrl) {
            if (imAvatarImg) {
                imAvatarImg.src = userState.avatarUrl;
                imAvatarImg.style.display = 'block';
            }
            if (imAvatarIcon) imAvatarIcon.style.display = 'none';
        } else {
            if (imAvatarImg) imAvatarImg.style.display = 'none';
            if (imAvatarIcon) imAvatarIcon.style.display = 'block';
        }
    }

    // ==========================================
    // 10. JIGGLE MODE & DRAG AND DROP
    // ==========================================
    const homeScreen = document.querySelector('.screen');
    const dock = document.getElementById('dock');
    let pressTimer = null;
    window.isJiggleMode = false;
    let draggedElement = null;
    window.preventAppClick = false;

    // Use capturing phase to intercept clicks
    homeScreen.addEventListener('click', (e) => {
        if (e.target.closest('.jiggle-plus-btn')) return; // Allow plus button to work

        if (window.isJiggleMode || window.preventAppClick) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (window.isJiggleMode && (
            e.target === homeScreen || 
            e.target.classList.contains('main-grid') || 
            e.target.classList.contains('dock-container') || 
            e.target.id === 'dock' ||
            e.target.classList.contains('empty-slot') ||
            (e.target.classList.contains('app-icon') && e.target.parentNode.classList.contains('empty-slot'))
        )) {
            exitJiggleMode();
        }
    }, true);

    function setupDraggable(el) {
        if (el._dragSetup) return;
        el._dragSetup = true;

        // Clean up legacy dataset if it exists so it doesn't pollute saved HTML
        if (el.dataset.dragSetup) delete el.dataset.dragSetup;

        let isTouchDrag = false;
        let isMoved = false;
        let startX = 0;
        let startY = 0;

        el.addEventListener('pointerdown', (e) => {
            isMoved = false;
            startX = e.clientX;
            startY = e.clientY;

            // In jiggle mode, pointerdown immediately starts a drag
            if (window.isJiggleMode) {
                // Ignore empty slots for dragging
                if (el.classList.contains('empty-slot')) return;
                
                e.preventDefault(); // Prevent scrolling on mobile during drag start
                draggedElement = el;
                isTouchDrag = true;
                setTimeout(() => el.classList.add('dragging'), 0);
                
                // Create ghost for custom pointer dragging
                const ghost = el.cloneNode(true);
                ghost.id = 'drag-ghost';
                ghost.style.position = 'fixed';
                ghost.style.margin = '0';
                ghost.style.zIndex = '9999';
                ghost.style.opacity = '0.9';
                ghost.style.pointerEvents = 'none';
                ghost.style.transform = 'scale(1.05)';
                ghost.style.transition = 'none';
                
                const rect = el.getBoundingClientRect();
                ghost.dataset.offsetX = e.clientX - rect.left;
                ghost.dataset.offsetY = e.clientY - rect.top;
                
                ghost.style.left = (e.clientX - ghost.dataset.offsetX) + 'px';
                ghost.style.top = (e.clientY - ghost.dataset.offsetY) + 'px';
                
                document.body.appendChild(ghost);
                return;
            }

            window.preventAppClick = false;
            pressTimer = setTimeout(() => {
                if(!isMoved) {
                    window.preventAppClick = true;
                    enterJiggleMode();
                }
            }, 800); // 800ms to trigger jiggle mode
        });

        // Track movement to cancel long press if they swipe
        el.addEventListener('pointermove', (e) => {
            // Only count as movement if they moved more than a few pixels
            if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
                isMoved = true;
            }
        });

        const cancelPress = (e) => {
            clearTimeout(pressTimer);
            
            // If they didn't hold long enough, and didn't move, it's a click!
            if (!window.preventAppClick && !window.isJiggleMode && !isMoved) {
                // Fire a synthetic click since we might have prevented default somewhere,
                // or touch devices might swallow the native click.
                // We dispatch it manually to ensure listeners trigger.
                setTimeout(() => {
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    el.dispatchEvent(clickEvent);
                }, 10);
            } else if (window.preventAppClick && !window.isJiggleMode) {
                // Was long press, but jiggle hasn't started or we just cancelled it
                setTimeout(() => window.preventAppClick = false, 100);
            }

            // End drag if we were dragging
            if (isTouchDrag && window.isJiggleMode) {
                isTouchDrag = false;
                if(draggedElement) draggedElement.classList.remove('dragging');
                draggedElement = null;
                const ghost = document.getElementById('drag-ghost');
                if(ghost) ghost.remove();
                balanceGridSlots();
                if (window.saveDesktopState) window.saveDesktopState();
            }
        };
        
        el.addEventListener('pointerup', cancelPress);
        el.addEventListener('pointercancel', cancelPress);
        
        // Disable native drag and drop to use our custom pointer events
        el.addEventListener('dragstart', (e) => e.preventDefault());
}

function refreshDraggables() {
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .status-card-widget, .complex-music-widget').forEach(setupDraggable);
}
    
window.refreshDraggables = refreshDraggables;
refreshDraggables();

function getElementByMouse(container, x, y) {
    const elements = [...container.querySelectorAll('.app-item:not(.dragging):not(.empty-slot), .time-widget:not(.dragging), .ins-profile-widget:not(.dragging), .spotify-widget:not(.dragging), .pet-widget:not(.dragging), .status-card-widget:not(.dragging), .complex-music-widget:not(.dragging)')];
        for (let child of elements) {
            const box = child.getBoundingClientRect();
            if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
                return { element: child, isLeft: x < box.left + box.width / 2 };
            }
        }
        
        // Also check empty slots so we can insert before them
        const emptySlots = [...container.querySelectorAll('.empty-slot')];
        if (emptySlots.length > 0) {
            for (let child of emptySlots) {
                const box = child.getBoundingClientRect();
                if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
                    return { element: child, isLeft: true };
                }
            }
        }
        return null;
    }

    function swapNodes(node1, node2) {
        if (node1 === node2) return;
        const parent1 = node1.parentNode;
        const parent2 = node2.parentNode;
        const marker = document.createElement('div');
        parent1.insertBefore(marker, node1);
        parent2.insertBefore(node1, node2);
        marker.parentNode.insertBefore(node2, marker);
        marker.remove();
    }

// Custom Drag Tracking to bypass dataTransfer limitations and enable visual following
function recordPositions() {
    const positions = new Map();
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .status-card-widget, .complex-music-widget').forEach(el => {
        positions.set(el, el.getBoundingClientRect());
        el.style.transition = 'none';
        el.style.transform = '';
    });
    return positions;
}

function playAnimations(oldPositions) {
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .status-card-widget, .complex-music-widget').forEach(el => {
        if (el.classList.contains('dragging')) return;
        const oldPos = oldPositions.get(el);
            if (!oldPos) return;
            const newPos = el.getBoundingClientRect();
            
            const dx = oldPos.left - newPos.left;
            const dy = oldPos.top - newPos.top;
            
            if (dx !== 0 || dy !== 0) {
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                el.style.transition = 'none';
                
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        el.style.transform = '';
                        el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    });
                });
            }
        });
    }

    let lastEdgeScrollTime = 0;

    let dragMoveHandler = (e) => {
        if (!draggedElement || !window.isJiggleMode) return;
        
        // Prevent scrolling while dragging
        e.preventDefault();

        const ghost = document.getElementById('drag-ghost');
        if (ghost) {
            ghost.style.left = (e.clientX - parseFloat(ghost.dataset.offsetX)) + 'px';
            ghost.style.top = (e.clientY - parseFloat(ghost.dataset.offsetY)) + 'px';
        }

        // --- Edge Scrolling for Pages ---
        const pagesContainerEl = document.getElementById('pages-container');
        if (pagesContainerEl) {
            const rect = pagesContainerEl.getBoundingClientRect();
            const now = Date.now();
            if (now - lastEdgeScrollTime > 800) { // Throttle edge scrolling
                if (e.clientX > rect.right - 40) {
                    pagesContainerEl.scrollBy({ left: pagesContainerEl.clientWidth, behavior: 'smooth' });
                    lastEdgeScrollTime = now;
                } else if (e.clientX < rect.left + 40) {
                    pagesContainerEl.scrollBy({ left: -pagesContainerEl.clientWidth, behavior: 'smooth' });
                    lastEdgeScrollTime = now;
                }
            }
        }

        // Find which container we are over
        let targetContainer = null;
        
        const pageIndex = pagesContainerEl ? Math.round(pagesContainerEl.scrollLeft / pagesContainerEl.clientWidth) : 0;
        const currentGrid = document.getElementById(pageIndex === 0 ? 'main-grid-1' : 'main-grid-2');
        
        if (currentGrid) {
            const currentGridRect = currentGrid.getBoundingClientRect();
            if (e.clientY >= currentGridRect.top && e.clientY <= currentGridRect.bottom) {
                targetContainer = currentGrid;
            }
        }
        
    const dockRect = dock.getBoundingClientRect();
    if (!targetContainer && e.clientY >= dockRect.top - 20 && e.clientY <= dockRect.bottom + 20) {
        targetContainer = dock;
    }

    if (!targetContainer) return;
    
    // Constraints (Only allow regular app items in dock)
    if (targetContainer === dock && !draggedElement.classList.contains('app-item')) return;

    const targetInfo = getElementByMouse(targetContainer, e.clientX, e.clientY);
        
        let didSwap = false;
        let oldPositions = null;

        if (targetInfo && targetInfo.element !== draggedElement) {
            let targetEl = targetInfo.element;
            oldPositions = recordPositions();

            // Scenario 1: Same container or simple swap
            if (draggedElement.parentNode === targetEl.parentNode) {
                swapNodes(draggedElement, targetEl);
                didSwap = true;
            } 
            // Scenario 2: Dock -> Grid (Replace empty slot or Swap with App)
            else if (draggedElement.parentNode === dock && targetEl.parentNode === currentGrid) {
                if (targetEl.classList.contains('empty-slot')) {
                    targetEl.parentNode.insertBefore(draggedElement, targetEl);
                    targetEl.remove();
                } else {
                    swapNodes(draggedElement, targetEl);
                }
                didSwap = true;
            }
            // Scenario 3: Grid -> Dock
            else if (draggedElement.parentNode && draggedElement.parentNode.classList.contains('main-grid') && targetEl.parentNode === dock) {
                swapNodes(draggedElement, targetEl);
                didSwap = true;
            }

        } 
        // Hovering over empty space in dock
        else if (!targetInfo && targetContainer === dock && draggedElement.parentNode !== dock) {
            const currentItems = dock.querySelectorAll('.app-item:not(.dragging)').length;
            if (currentItems < 4) {
                oldPositions = recordPositions();
                // Leave an empty slot in grid
                const empty = document.createElement('div');
                empty.className = 'app-item empty-slot';
                empty.innerHTML = '<div class="app-icon" style="opacity:0;"></div>';
                draggedElement.parentNode.insertBefore(empty, draggedElement);
                
                dock.appendChild(draggedElement);
                setupDraggable(empty);
                didSwap = true;
            }
        }
        
        if (didSwap && oldPositions) {
            playAnimations(oldPositions);
        }
    };
    
    // Use pointermove globally to track dragging anywhere on screen
    document.addEventListener('pointermove', (e) => {
        // If we are dragging, handle it
        if (draggedElement && window.isJiggleMode) {
            dragMoveHandler(e);
        } else {
            // Cancel long press if moving too much before jiggle mode
            if (!window.isJiggleMode && pressTimer) {
                 clearTimeout(pressTimer);
            }
        }
    }, { passive: false });

    window.setupDraggable = setupDraggable;

    // We no longer strip and append empty slots dynamically to the end, 
    // because we want to preserve user-defined empty gaps.
    // However, we still need a function to ensure exactly 24 capacity on load or major changes.
function balanceGridSlots() {
    const grids = document.querySelectorAll('.main-grid');
    grids.forEach(grid => {
        let usedSlots = 0;
        [...grid.children].forEach(item => {
            if (item.classList.contains('ins-profile-widget') || item.classList.contains('spotify-widget') || item.classList.contains('complex-music-widget')) usedSlots += 16;
            else if (item.classList.contains('time-widget') || item.classList.contains('status-card-widget')) usedSlots += 8;
            else if (item.classList.contains('pet-widget')) usedSlots += 4;
            else usedSlots += 1;
        });

        if (usedSlots < 24) {
                for (let i = 0; i < 24 - usedSlots; i++) {
                    const empty = document.createElement('div');
                    empty.className = 'app-item empty-slot';
                    empty.innerHTML = '<div class="app-icon" style="opacity:0;"></div>';
                    grid.appendChild(empty);
                    setupDraggable(empty);
                }
            } else if (usedSlots > 24) {
                // Only prune empty slots from the end if we somehow overflowed
                const empties = [...grid.querySelectorAll('.empty-slot')];
                let excess = usedSlots - 24;
                for (let i = empties.length - 1; i >= 0 && excess > 0; i--) {
                    empties[i].remove();
                    excess--;
                }
            }
        });
    }
    window.balanceGridSlots = balanceGridSlots;

function enterJiggleMode() {
    window.isJiggleMode = true;
    document.body.classList.add('jiggle-mode');

    document.querySelectorAll('.app-item:not(.empty-slot), .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .status-card-widget, .complex-music-widget').forEach(el => {
        el.setAttribute('draggable', 'true');
    });

    // Add Plus button for widgets
        let plusBtn = document.querySelector('.jiggle-plus-btn');
        if (!plusBtn) {
            plusBtn = document.createElement('div');
            plusBtn.className = 'jiggle-plus-btn';
            plusBtn.innerHTML = '<i class="fas fa-plus"></i>';
            plusBtn.style.position = 'absolute';
            plusBtn.style.top = '20px';
            plusBtn.style.left = '24px';
            plusBtn.style.backgroundColor = 'rgba(255,255,255,0.5)';
            plusBtn.style.backdropFilter = 'blur(10px)';
            plusBtn.style.WebkitBackdropFilter = 'blur(10px)';
            plusBtn.style.width = '32px';
            plusBtn.style.height = '32px';
            plusBtn.style.borderRadius = '50%';
            plusBtn.style.display = 'flex';
            plusBtn.style.justifyContent = 'center';
            plusBtn.style.alignItems = 'center';
            plusBtn.style.color = '#000';
            plusBtn.style.fontSize = '16px';
            plusBtn.style.zIndex = '100';
            plusBtn.style.cursor = 'pointer';

            homeScreen.appendChild(plusBtn);
            plusBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openView(document.getElementById('widget-gallery-sheet'));
            });
        }
    }

function exitJiggleMode() {
    window.isJiggleMode = false;
    document.body.classList.remove('jiggle-mode');
    const plusBtn = document.querySelector('.jiggle-plus-btn');
    if (plusBtn) plusBtn.remove();

    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .status-card-widget, .complex-music-widget').forEach(el => {
        el.removeAttribute('draggable');
    });
    
    // Save state after arranging
    if (window.saveDesktopState) window.saveDesktopState();
}
window.enterJiggleMode = enterJiggleMode;
window.exitJiggleMode = exitJiggleMode;

    // ==========================================
    // 11. SWIPE / SCROLL NAVIGATION
    // ==========================================
    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) {
        let isDown = false;
        let startX;
        let scrollLeft;

        pagesContainer.addEventListener('pointerdown', (e) => {
            // Do not intercept if in jiggle mode or interacting with bottom sheets/buttons
            if (window.isJiggleMode || window.preventAppClick || e.target.closest('.bottom-sheet-overlay')) return;
            isDown = true;
            startX = e.pageX - pagesContainer.offsetLeft;
            scrollLeft = pagesContainer.scrollLeft;
        });

        pagesContainer.addEventListener('pointerleave', () => {
            if (!isDown) return;
            isDown = false;
            snapToNearestPage();
        });

        pagesContainer.addEventListener('pointerup', () => {
            if (!isDown) return;
            isDown = false;
            snapToNearestPage();
        });

        pagesContainer.addEventListener('pointermove', (e) => {
            if (!isDown) return;
            if (window.isJiggleMode) {
                isDown = false;
                return;
            }
            
            const x = e.pageX - pagesContainer.offsetLeft;
            const walk = (x - startX) * 1.5;
            
            if (Math.abs(walk) > 10) {
                // We are actually swiping
                e.preventDefault(); 
                pagesContainer.scrollLeft = scrollLeft - walk;
            }
        });

        function snapToNearestPage() {
            const pageIndex = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
            pagesContainer.scrollTo({
                left: pageIndex * pagesContainer.clientWidth,
                behavior: 'smooth'
            });
        }
        
        pagesContainer.addEventListener('scroll', () => {
            const pageIndex = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
            const dots = document.querySelectorAll('.page-indicators .dot');
            dots.forEach((dot, index) => {
                if (index === pageIndex) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        });
    }

    // Initial Bootstrap
    syncUIs();
    applySavedTheme();
    if (typeof syncInsWidgetToUserState === 'function') {
        syncInsWidgetToUserState();
    }
});
