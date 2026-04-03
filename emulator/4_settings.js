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
    } else {
        userState.name = '';
        userState.phone = '';
        userState.persona = '';
        userState.avatarUrl = null;
    }
    saveGlobalData();
    syncUIs();
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

const bindRoleBtn = document.getElementById('bind-role-btn');
const bindRoleBtnCount = document.getElementById('bind-role-btn-count');
const bindRoleSheet = document.getElementById('bind-role-sheet');
const bindRoleList = document.getElementById('bind-role-list');
const bindRoleEmpty = document.getElementById('bind-role-empty');
const bindRoleSheetAccountName = document.getElementById('bind-role-sheet-account-name');
const bindRoleSheetAccountDesc = document.getElementById('bind-role-sheet-account-desc');
const confirmBindRoleBtn = document.getElementById('confirm-bind-role-btn');

let tempBoundRoleIds = [];

function getCurrentAppleAccount() {
    return accounts.find(acc => String(acc.id) === String(currentAccountId)) || null;
}

function getBindableRoles() {
    return (window.imData?.friends || []).filter(friend => friend && friend.type !== 'group');
}

function getRolesBoundToCurrentAccount() {
    return getBindableRoles().filter(friend => String(friend.boundAccountId || '') === String(currentAccountId || ''));
}

function updateBindRoleEntryPoints() {
    if (!bindRoleBtnCount) return;
    const count = currentAccountId ? getRolesBoundToCurrentAccount().length : 0;
    bindRoleBtnCount.textContent = count > 0 ? `${count}个角色` : '';
}

function renderBindRoleList() {
    if (!bindRoleList || !bindRoleEmpty) return;

    const roles = getBindableRoles();
    const currentAcc = getCurrentAppleAccount();
    const boundRoles = getRolesBoundToCurrentAccount();
    tempBoundRoleIds = boundRoles.map(friend => String(friend.id));

    if (bindRoleSheetAccountName) {
        bindRoleSheetAccountName.textContent = currentAcc ? (currentAcc.name || '当前 ID') : '未选择 Apple ID';
    }
    if (bindRoleSheetAccountDesc) {
        bindRoleSheetAccountDesc.textContent = currentAcc
            ? `已绑定 ${boundRoles.length} 个角色`
            : '请先创建并选中一个 Apple ID';
    }

    bindRoleList.innerHTML = '';

    if (!currentAcc || roles.length === 0) {
        bindRoleList.style.display = 'none';
        bindRoleEmpty.style.display = 'block';
        bindRoleEmpty.textContent = currentAcc ? '暂无可绑定角色' : '请先在 Apple ID 中选择一个账号';
        return;
    }

    bindRoleList.style.display = 'flex';
    bindRoleEmpty.style.display = 'none';

    roles.forEach(friend => {
        const isSelected = tempBoundRoleIds.includes(String(friend.id));
        const alreadyBoundAccount = window.imApp?.getBoundAccountByFriend
            ? window.imApp.getBoundAccountByFriend(friend)
            : null;

        const item = document.createElement('div');
        item.className = 'account-card';
        item.style.padding = '14px 16px';
        item.style.height = 'auto';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '16px';
        item.style.border = isSelected ? '2px solid #007aff' : '2px solid transparent';
        item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

        item.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#f2f2f7; overflow:hidden; display:flex; align-items:center; justify-content:center; color:#8e8e93; flex-shrink:0;">
                        ${friend.avatarUrl ? `<img src="${friend.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-user"></i>'}
                    </div>
                    <div style="min-width:0;">
                        <div style="font-size:15px; font-weight:600; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${friend.nickname || '未命名角色'}</div>
                        <div style="font-size:12px; color:#8e8e93; margin-top:3px;">${friend.realName || friend.signature || '角色'}</div>
                        <div style="font-size:12px; color:#666; margin-top:4px; line-height:1.45;">当前绑定：${alreadyBoundAccount ? (alreadyBoundAccount.name || '某个ID') : '未绑定'}</div>
                    </div>
                </div>
                <div style="width:22px; height:22px; border-radius:50%; border:1px solid ${isSelected ? '#007aff' : '#c7c7cc'}; background:${isSelected ? '#007aff' : 'transparent'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; flex-shrink:0;">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;

        item.addEventListener('click', () => {
            const friendId = String(friend.id);
            if (tempBoundRoleIds.includes(friendId)) {
                tempBoundRoleIds = tempBoundRoleIds.filter(id => id !== friendId);
            } else {
                tempBoundRoleIds.push(friendId);
            }
            renderBindRoleListFromDraft();
        });

        bindRoleList.appendChild(item);
    });
}

function renderBindRoleListFromDraft() {
    if (!bindRoleList) return;
    const currentAcc = getCurrentAppleAccount();
    const roles = getBindableRoles();

    bindRoleList.innerHTML = '';
    roles.forEach(friend => {
        const isSelected = tempBoundRoleIds.includes(String(friend.id));
        const alreadyBoundAccount = window.imApp?.getBoundAccountByFriend
            ? window.imApp.getBoundAccountByFriend(friend)
            : null;

        const item = document.createElement('div');
        item.className = 'account-card';
        item.style.padding = '14px 16px';
        item.style.height = 'auto';
        item.style.cursor = 'pointer';
        item.style.borderRadius = '16px';
        item.style.border = isSelected ? '2px solid #007aff' : '2px solid transparent';
        item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

        item.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#f2f2f7; overflow:hidden; display:flex; align-items:center; justify-content:center; color:#8e8e93; flex-shrink:0;">
                        ${friend.avatarUrl ? `<img src="${friend.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-user"></i>'}
                    </div>
                    <div style="min-width:0;">
                        <div style="font-size:15px; font-weight:600; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${friend.nickname || '未命名角色'}</div>
                        <div style="font-size:12px; color:#8e8e93; margin-top:3px;">${friend.realName || friend.signature || '角色'}</div>
                        <div style="font-size:12px; color:#666; margin-top:4px; line-height:1.45;">目标绑定：${isSelected ? (currentAcc?.name || '当前ID') : (alreadyBoundAccount ? alreadyBoundAccount.name : '未绑定')}</div>
                    </div>
                </div>
                <div style="width:22px; height:22px; border-radius:50%; border:1px solid ${isSelected ? '#007aff' : '#c7c7cc'}; background:${isSelected ? '#007aff' : 'transparent'}; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; flex-shrink:0;">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            </div>
        `;

        item.addEventListener('click', () => {
            const friendId = String(friend.id);
            if (tempBoundRoleIds.includes(friendId)) {
                tempBoundRoleIds = tempBoundRoleIds.filter(id => id !== friendId);
            } else {
                tempBoundRoleIds.push(friendId);
            }
            renderBindRoleListFromDraft();
        });

        bindRoleList.appendChild(item);
    });

    if (bindRoleSheetAccountDesc && currentAcc) {
        bindRoleSheetAccountDesc.textContent = `已选择 ${tempBoundRoleIds.length} 个角色`;
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
            if (window.setCurrentAccountId) window.setCurrentAccountId(acc.id);
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
                if (currentAccountId === acc.id) {
                    currentAccountId = accounts.length > 0 ? accounts[0].id : null;
                    if (window.setCurrentAccountId) window.setCurrentAccountId(currentAccountId);
                    const nextAccount = accounts.find(a => a.id === currentAccountId);
                    userState.name = nextAccount?.name || '';
                    userState.phone = nextAccount?.phone || '';
                    userState.persona = nextAccount?.signature || nextAccount?.persona || '';
                    userState.avatarUrl = nextAccount?.avatarUrl || null;
                }
                saveGlobalData();
                syncUIs();
                renderAccountList();
            }
        });

        UI.lists.accounts.appendChild(card);
    });
    updateBindRoleEntryPoints();
}

if (bindRoleSheet) {
    bindRoleSheet.addEventListener('click', (e) => {
        if (e.target === bindRoleSheet) closeView(bindRoleSheet);
    });
}

if (bindRoleBtn) {
    bindRoleBtn.addEventListener('click', () => {
        updateBindRoleEntryPoints();
        const count = currentAccountId ? getRolesBoundToCurrentAccount().length : 0;
        showToast(currentAccountId ? `当前 ID 已绑定 ${count} 个角色` : '请先选择一个 Apple ID');
    });
}

if (confirmBindRoleBtn) {
    confirmBindRoleBtn.addEventListener('click', () => {
        const roles = getBindableRoles();
        const selectedIds = new Set(tempBoundRoleIds.map(String));

        roles.forEach(friend => {
            if (selectedIds.has(String(friend.id))) {
                friend.boundAccountId = currentAccountId || null;
            } else if (String(friend.boundAccountId || '') === String(currentAccountId || '')) {
                friend.boundAccountId = null;
            }
        });

        if (window.imApp?.saveFriends) window.imApp.saveFriends();
        if (window.imApp?.updateChatBindIdLabel && window.imData?.currentSettingsFriend) {
            window.imApp.updateChatBindIdLabel(window.imData.currentSettingsFriend);
        }
        updateBindRoleEntryPoints();
        showToast('角色绑定已更新');
        closeView(bindRoleSheet);
    });
}

window.updateBindRoleEntryPoints = updateBindRoleEntryPoints;
window.renderBindRoleList = renderBindRoleList;

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
    if (confirm('确定要清空缓存数据吗？此操作不可恢复，但会保留 API 配置。')) {
        let preservedApiConfig = { endpoint: '', apiKey: '', model: '', temperature: 0.7 };

        try {
            const dataStr = localStorage.getItem('ios_emulator_global_data');
            if (dataStr) {
                const parsed = JSON.parse(dataStr);
                if (parsed && parsed.apiConfig && typeof parsed.apiConfig === 'object') {
                    preservedApiConfig = {
                        endpoint: parsed.apiConfig.endpoint || '',
                        apiKey: parsed.apiConfig.apiKey || '',
                        model: parsed.apiConfig.model || '',
                        temperature: parseFloat(parsed.apiConfig.temperature) || 0.7
                    };
                }
            }
        } catch (err) {
            console.error('Failed to preserve api config before clearing data', err);
        }

        localStorage.setItem('ios_emulator_global_data', JSON.stringify({
            apiConfig: preservedApiConfig
        }));
        showToast('缓存已清空，API 配置已保留，即将刷新...');
        setTimeout(() => location.reload(), 1500);
    }
});
