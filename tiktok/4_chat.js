// ==========================================
// TIKTOK: 4. CHAT & FOLLOWING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const followingBar = document.getElementById('tk-following-bar');
    const addCharBtn = document.getElementById('tk-chat-add-btn');
    const editCharSheet = document.getElementById('tk-edit-char-sheet');
    const dmsContainer = document.getElementById('tk-chat-dms-container');
    
    // Form Inputs
    const charAvatarImg = document.getElementById('tk-char-avatar-img');
    const charAvatarIcon = document.querySelector('#tk-char-avatar-preview i');
    const charNameInput = document.getElementById('tk-char-name');
    const charStatusInput = document.getElementById('tk-char-status');
    const charPersonaInput = document.getElementById('tk-char-persona');
    const saveCharBtn = document.getElementById('tk-save-char-btn');
    const deleteCharBtn = document.getElementById('tk-delete-char-btn');
    
    let editingCharId = null;

    window.tkRenderChat = function() {
        if (!followingBar) return;
        
        // 1. Render Following Bar
        followingBar.innerHTML = '';
        
        // Render Self First
        const selfAvatarHtml = tkState.profile.avatar 
            ? `<img src="${tkState.profile.avatar}">` 
            : `<i class="fas fa-user"></i>`;
            
        const selfItem = document.createElement('div');
        selfItem.className = 'tk-follow-item';
        selfItem.innerHTML = `
            <div class="tk-follow-avatar">
                ${selfAvatarHtml}
                <div class="tk-follow-plus"><i class="fas fa-plus"></i></div>
            </div>
            ${tkState.profile.status ? `<div class="tk-follow-bubble">${tkState.profile.status}</div>` : ''}
            <div class="tk-follow-name">我的状态</div>
        `;
        selfItem.addEventListener('click', () => {
            // Trigger profile tab or edit status
            if (window.tkRenderProfile) {
                // Switch to profile tab
                document.querySelector('.tk-bottom-nav .tk-nav-item[data-target="tk-profile-tab"]').click();
            }
        });
        followingBar.appendChild(selfItem);

        // Render followed chars
        const followedChars = tkState.chars.filter(c => c.isFollowed);
        followedChars.forEach(char => {
            const charAvatarHtml = char.avatar 
                ? `<img src="${char.avatar}">` 
                : `<i class="fas fa-user"></i>`;
                
            const charItem = document.createElement('div');
            charItem.className = 'tk-follow-item';
            charItem.innerHTML = `
                <div class="tk-follow-avatar">
                    ${charAvatarHtml}
                </div>
                ${char.status ? `<div class="tk-follow-bubble">${char.status}</div>` : ''}
                <div class="tk-follow-name">${char.name || char.handle}</div>
            `;
            
            charItem.addEventListener('click', () => {
                openEditChar(char.id);
            });
            
            followingBar.appendChild(charItem);
        });

        // 2. Render DMs
        if (dmsContainer) {
            dmsContainer.innerHTML = '';
            tkState.dms.forEach(dm => {
                const char = window.tkGetChar(dm.charId);
                if (!char) return;
                
                const lastMsg = dm.messages.length > 0 ? dm.messages[dm.messages.length - 1].text : '开始聊天吧';
                
                const charAvatarHtml = char.avatar 
                    ? `<img src="${char.avatar}">` 
                    : `<i class="fas fa-user"></i>`;
                    
                const dmItem = document.createElement('div');
                dmItem.className = 'tk-activity-item';
                dmItem.innerHTML = `
                    <div class="tk-activity-icon" style="background: #f0f0f0; color: #999;">
                        ${charAvatarHtml}
                    </div>
                    <div class="tk-activity-text">
                        <div class="tk-activity-title">${char.name || char.handle}</div>
                        <div class="tk-activity-desc">${lastMsg}</div>
                    </div>
                    <i class="fas fa-camera arrow" style="font-size: 20px;"></i>
                `;
                
                dmsContainer.appendChild(dmItem);
            });
            
            if (tkState.dms.length === 0) {
                dmsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 13px;">暂无消息记录</div>';
            }
        }
    };

    // Add / Edit Char logic
    const importSheet = document.getElementById('tk-import-char-sheet');
    const importList = document.getElementById('tk-import-list');
    const closeImportBtn = document.getElementById('tk-close-import-btn');

    if (addCharBtn) {
        addCharBtn.addEventListener('click', () => {
            window.tkOpenImportSheet();
        });
    }
    
    if (closeImportBtn) {
        closeImportBtn.addEventListener('click', () => {
            window.closeView(importSheet);
        });
    }

    window.tkOpenImportSheet = function() {
        if (!importList) return;
        importList.innerHTML = '';

        // Add "Create New" button
        const createNewBtn = document.createElement('div');
        createNewBtn.className = 'tk-import-item';
        createNewBtn.innerHTML = `
            <div class="tk-avatar-small" style="background: #333; color: white;"><i class="fas fa-plus"></i></div>
            <div style="flex: 1; font-weight: 600; color: #111;">创建新角色</div>
        `;
        createNewBtn.addEventListener('click', () => {
            window.closeView(importSheet);
            openEditChar();
        });
        importList.appendChild(createNewBtn);

        // Fetch iMessage friends
        const imFriends = window.getImFriends ? window.getImFriends() : [];
        if (imFriends.length > 0) {
            const separator = document.createElement('div');
            separator.style.fontSize = '13px';
            separator.style.color = '#888';
            separator.style.marginTop = '10px';
            separator.style.marginBottom = '5px';
            separator.textContent = '从信息应用导入:';
            importList.appendChild(separator);

            imFriends.forEach(friend => {
                // Check if already imported
                const alreadyExists = tkState.chars.some(c => c.id === friend.id);
                
                const item = document.createElement('div');
                item.className = 'tk-import-item';
                item.style.opacity = alreadyExists ? '0.5' : '1';
                
                const avatarHtml = friend.avatarUrl 
                    ? `<img src="${friend.avatarUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
                    : `<i class="fas fa-user"></i>`;
                    
                item.innerHTML = `
                    <div class="tk-avatar-small">${avatarHtml}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #111; font-size: 15px;">${friend.nickname || friend.realName}</div>
                        <div style="color: #888; font-size: 12px; margin-top: 2px;">${friend.signature || ''}</div>
                    </div>
                    ${alreadyExists ? '<div style="font-size:12px; color:#999;">已添加</div>' : '<i class="fas fa-download" style="color:#111;"></i>'}
                `;

                if (!alreadyExists) {
                    item.addEventListener('click', () => {
                        // Import it
                        window.tkSaveChar({
                            id: friend.id,
                            name: friend.nickname || friend.realName,
                            handle: (friend.realName || friend.nickname || 'user').toLowerCase().replace(/\s+/g, '') + '_' + Math.floor(Math.random()*100),
                            avatar: friend.avatarUrl,
                            status: friend.signature || '刚来到 TikTok',
                            persona: friend.persona || '',
                            isFollowed: true
                        });
                        window.tkRenderChat();
                        window.closeView(importSheet);
                        window.showToast('导入成功');
                    });
                }
                importList.appendChild(item);
            });
        }
        
        window.openView(importSheet);
    };

    function openEditChar(charId = null) {
        editingCharId = charId;
        const title = document.getElementById('tk-char-sheet-title');
        
        if (charId) {
            title.textContent = '编辑角色';
            const char = window.tkGetChar(charId);
            if (char) {
                charNameInput.value = char.name || '';
                charStatusInput.value = char.status || '';
                charPersonaInput.value = char.persona || '';
                setCharAvatarPreview(char.avatar);
                deleteCharBtn.style.display = 'block';
            }
        } else {
            title.textContent = '添加新角色';
            charNameInput.value = '';
            charStatusInput.value = '';
            charPersonaInput.value = '';
            setCharAvatarPreview(null);
            deleteCharBtn.style.display = 'none';
        }
        
        window.openView(editCharSheet);
    }
    
    // Avatar Upload
    const avatarWrapper = document.getElementById('tk-char-avatar-wrapper');
    const avatarUpload = document.getElementById('tk-char-avatar-upload');
    
    if (avatarWrapper && avatarUpload) {
        avatarWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => setCharAvatarPreview(event.target.result);
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }
    
    function setCharAvatarPreview(url) {
        if (url) {
            charAvatarImg.src = url;
            charAvatarImg.style.display = 'block';
            charAvatarIcon.style.display = 'none';
        } else {
            charAvatarImg.src = '';
            charAvatarImg.style.display = 'none';
            charAvatarIcon.style.display = 'block';
        }
    }
    
    // Save
    if (saveCharBtn) {
        saveCharBtn.addEventListener('click', () => {
            const name = charNameInput.value.trim() || 'User_' + Date.now();
            const status = charStatusInput.value.trim();
            const persona = charPersonaInput.value.trim();
            const avatar = charAvatarImg.style.display === 'block' ? charAvatarImg.src : null;
            
            if (editingCharId) {
                const char = window.tkGetChar(editingCharId);
                if (char) {
                    char.name = name;
                    char.status = status;
                    char.persona = persona;
                    char.avatar = avatar;
                }
            } else {
                const newId = 'char_' + Date.now();
                window.tkSaveChar({
                    id: newId,
                    name: name,
                    handle: newId,
                    status: status,
                    persona: persona,
                    avatar: avatar,
                    isFollowed: true
                });
            }
            
            window.saveGlobalData();
            window.tkRenderChat();
            window.closeView(editCharSheet);
            window.showToast('已保存');
        });
    }
    
    // Delete
    if (deleteCharBtn) {
        deleteCharBtn.addEventListener('click', () => {
            if (editingCharId) {
                if (confirm('确定删除此角色吗？')) {
                    tkState.chars = tkState.chars.filter(c => c.id !== editingCharId);
                    window.saveGlobalData();
                    window.tkRenderChat();
                    window.closeView(editCharSheet);
                    window.showToast('已删除');
                }
            }
        });
    }
});
