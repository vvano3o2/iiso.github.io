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
// 8.5 DATA MANAGEMENT (Export / Import / Clear)
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
