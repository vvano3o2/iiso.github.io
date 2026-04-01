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

if(document.getElementById('close-book-group-picker-btn')) {
    document.getElementById('close-book-group-picker-btn').addEventListener('click', () => {
        closeView(UI.overlays.bookGroupPicker);
    });
}

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

// Auto-save summary to World Book globally
window.autoSaveSummaryToWorldBook = function(title, summaryText) {
    const newBook = {
        id: Date.now(),
        name: title || '自动总结',
        group: '未分组',
        entries: [{ keyword: '总结内容', content: summaryText }],
        isGlobal: true,
        attachedRoles: []
    };
    
    worldBooks.push(newBook);
    saveGlobalData();
    renderWorldBooks();
    showToast('已自动生成全局世界书');
};

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
                if (window.wbAddMenu) window.wbAddMenu.style.display = 'none'; // Close menu if open
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

// Initial Bootstrap for Emulator
setTimeout(() => {
    if (typeof syncUIs === 'function') syncUIs();
    if (typeof applySavedTheme === 'function') applySavedTheme();
    if (typeof syncInsWidgetToUserState === 'function') syncInsWidgetToUserState();
}, 100);
