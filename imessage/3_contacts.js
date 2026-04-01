// ==========================================
// IMESSAGE: 3. CONTACTS & ADD FRIEND
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const { UI, openView, closeView, showToast } = window;

    // Add Friend Modal Buttons from Header
    const addCharBtn = document.getElementById('add-char-btn');
    if(addCharBtn) {
        addCharBtn.addEventListener('click', () => {
            if(UI && UI.inputs) {
                if(UI.inputs.friendRealName) UI.inputs.friendRealName.value = '';
                if(UI.inputs.friendNickname) UI.inputs.friendNickname.value = '';
                if(UI.inputs.friendSignature) UI.inputs.friendSignature.value = '';
                if(UI.inputs.friendPersona) UI.inputs.friendPersona.value = '';
            }
            setFriendAvatar(null);
            
            // Explicitly try to find and open the add friend sheet
            const addFriendSheet = document.getElementById('add-friend-sheet');
            if (addFriendSheet) {
                if (typeof window.openView === 'function') {
                    window.openView(addFriendSheet);
                } else {
                    // Fallback to simple display flex if openView is undefined
                    addFriendSheet.style.display = 'flex';
                    const bottomSheet = addFriendSheet.querySelector('.bottom-sheet');
                    if (bottomSheet) {
                        setTimeout(() => bottomSheet.style.transform = 'translateY(0)', 10);
                    }
                }
            } else if (UI && UI.overlays && UI.overlays.addFriend) {
                if (typeof window.openView === 'function') {
                    window.openView(UI.overlays.addFriend);
                }
            }
        });
    }

    // Avatar Upload Logic
    const friendAvatarWrapper = document.getElementById('friend-avatar-wrapper');
    if(friendAvatarWrapper) {
        friendAvatarWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') document.getElementById('friend-avatar-upload').click();
        });
    }

    const friendAvatarUpload = document.getElementById('friend-avatar-upload');
    if(friendAvatarUpload) {
        friendAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => setFriendAvatar(e.target.result);
                reader.readAsDataURL(file);
            }
        });
    }

    function setFriendAvatar(url) {
        if (!UI.inputs.friendAvatarImg || !UI.inputs.friendAvatarIcon) return;
        if (url) {
            UI.inputs.friendAvatarImg.src = url;
            UI.inputs.friendAvatarImg.style.display = 'block';
            UI.inputs.friendAvatarIcon.style.display = 'none';
        } else {
            UI.inputs.friendAvatarImg.style.display = 'none';
            UI.inputs.friendAvatarIcon.style.display = 'block';
            UI.inputs.friendAvatarImg.src = '';
        }
    }

    // Confirm Add Friend/NPC
    const confirmAddFriendBtn = document.getElementById('confirm-add-friend-btn');
    const confirmAddNpcBtn = document.getElementById('confirm-add-npc-btn');

    if(confirmAddFriendBtn) {
        confirmAddFriendBtn.addEventListener('click', () => {
            const friend = window.imApp.normalizeFriendData({
                id: Date.now(),
                type: 'char',
                realName: document.getElementById('friend-realname-input') ? document.getElementById('friend-realname-input').value : '',
                nickname: document.getElementById('friend-nickname-input') ? document.getElementById('friend-nickname-input').value || 'New Friend' : 'New Friend',
                signature: document.getElementById('friend-signature-input') ? document.getElementById('friend-signature-input').value || 'No Signature' : 'No Signature',
                persona: document.getElementById('friend-persona-input') ? document.getElementById('friend-persona-input').value : '',
                avatarUrl: (document.getElementById('friend-avatar-img') && document.getElementById('friend-avatar-img').style.display === 'block') ? document.getElementById('friend-avatar-img').src : null,
                messages: [],
                chatBg: null,
                customCssEnabled: false,
                customCss: '',
                isPinned: false,
                memory: window.imApp.createDefaultMemory()
            });
            
            window.imData.friends.push(friend);
            window.imApp.saveFriends();
            renderFriendsList();
            closeView(document.getElementById('add-friend-sheet'));
            if(window.showToast) window.showToast(`已添加 Char: ${friend.nickname}`);
        });
    }

    if(confirmAddNpcBtn) {
        confirmAddNpcBtn.addEventListener('click', () => {
            const npc = window.imApp.normalizeFriendData({
                id: Date.now(),
                type: 'npc',
                realName: document.getElementById('friend-realname-input') ? document.getElementById('friend-realname-input').value : '',
                nickname: document.getElementById('friend-nickname-input') ? document.getElementById('friend-nickname-input').value || 'New NPC' : 'New NPC',
                signature: document.getElementById('friend-signature-input') ? document.getElementById('friend-signature-input').value || 'No Signature' : 'No Signature',
                persona: document.getElementById('friend-persona-input') ? document.getElementById('friend-persona-input').value : '',
                avatarUrl: (document.getElementById('friend-avatar-img') && document.getElementById('friend-avatar-img').style.display === 'block') ? document.getElementById('friend-avatar-img').src : null,
                messages: [],
                chatBg: null,
                customCssEnabled: false,
                customCss: '',
                isPinned: false,
                memory: window.imApp.createDefaultMemory()
            });
            
            window.imData.friends.push(npc);
            window.imApp.saveFriends();
            renderFriendsList();
            closeView(document.getElementById('add-friend-sheet'));
            if(window.showToast) window.showToast(`已添加 NPC: ${npc.nickname}`);

            const relationshipSheet = document.getElementById('relationship-sheet');
            if (window.imData.currentSettingsFriend && relationshipSheet && relationshipSheet.style.display !== 'none') {
                window.imData.currentSettingsFriend.memory = window.imData.currentSettingsFriend.memory || window.imApp.createDefaultMemory();
                if (!Array.isArray(window.imData.currentSettingsFriend.memory.relationships)) {
                    window.imData.currentSettingsFriend.memory.relationships = [];
                }
                if(window.imApp.renderRelationshipSheet) window.imApp.renderRelationshipSheet(window.imData.currentSettingsFriend);
                openView(relationshipSheet);
            }
        });
    }

    function renderFriendsList() {
        const friendsContent = document.getElementById('friends-content');
        const npcsContent = document.getElementById('npcs-content');
        
        if (friendsContent) friendsContent.innerHTML = '';
        if (npcsContent) npcsContent.innerHTML = '';
        
        window.imData.friends.forEach(friend => {
            if (friend.type === 'group') return; // Do not show groups in Friends/NPCs lists

            const item = document.createElement('div');
            item.className = 'line-list-item';
            
            const avatarHtml = friend.avatarUrl 
                ? `<img src="${friend.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` 
                : (friend.type === 'npc' ? `<i class="fas fa-robot"></i>` : `<i class="fas fa-user"></i>`);
                
            item.innerHTML = `
                <div class="line-item-avatar">${avatarHtml}</div>
                <div class="line-item-text">${friend.nickname}</div>
            `;
            
            item.addEventListener('click', () => {
                if(window.imApp.openChatTab) window.imApp.openChatTab(friend);
            });

            if (friend.type === 'npc') {
                if (npcsContent) npcsContent.appendChild(item);
            } else {
                if (friendsContent) friendsContent.appendChild(item);
            }
        });
    }

    window.imApp.renderFriendsList = renderFriendsList;

    // Initial render
    renderFriendsList();

    // ==========================================
    // GROUP CHAT LOGIC
    // ==========================================
    
    // Data Structure:
    // A group is a special friend with type: 'group'
    // members: [array of user/npc ids]

    const createGroupSheet = document.getElementById('create-group-sheet');
    const groupDetailsView = document.getElementById('group-details-view');
    
    // Create Group Trigger
    const createGroupTrigger = document.querySelector('#groups-content .line-list-item');
    if (createGroupTrigger) {
        createGroupTrigger.addEventListener('click', () => {
            openCreateGroupSheet();
        });
    }

    let tempGroupMembers = [];

    function openCreateGroupSheet() {
        tempGroupMembers = [];
        const nameInput = document.getElementById('group-name-input');
        const confirmBtn = document.getElementById('confirm-create-group-btn');
        if(nameInput) nameInput.value = '';
        setGroupAvatar(null);
        renderCreateGroupMembersList();
        updateCreateGroupConfirmBtn();
        openView(createGroupSheet);
    }

    const cancelCreateGroupBtn = document.getElementById('cancel-create-group-btn');
    if(cancelCreateGroupBtn) {
        cancelCreateGroupBtn.addEventListener('click', () => {
            closeView(createGroupSheet);
        });
    }

    // Group Avatar Upload
    const groupAvatarWrapper = document.getElementById('group-avatar-wrapper');
    const groupAvatarUpload = document.getElementById('group-avatar-upload');
    if(groupAvatarWrapper && groupAvatarUpload) {
        groupAvatarWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') groupAvatarUpload.click();
        });
        groupAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => setGroupAvatar(e.target.result);
                reader.readAsDataURL(file);
            }
        });
    }

    function setGroupAvatar(url) {
        const img = document.getElementById('group-avatar-img');
        const icon = document.getElementById('group-avatar-icon');
        if (!img || !icon) return;
        if (url) {
            img.src = url;
            img.style.display = 'block';
            icon.style.display = 'none';
        } else {
            img.src = '';
            img.style.display = 'none';
            icon.style.display = 'block';
        }
    }

    function renderCreateGroupMembersList() {
        const list = document.getElementById('create-group-members-list');
        if(!list) return;
        list.innerHTML = '';
        
        const allFriends = window.imData.friends.filter(f => f.type !== 'group');
        
        allFriends.forEach(friend => {
            const item = document.createElement('div');
            item.className = 'line-list-item';
            
            const isSelected = tempGroupMembers.includes(friend.id);
            
            const avatarHtml = friend.avatarUrl 
                ? `<img src="${friend.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` 
                : (friend.type === 'npc' ? `<i class="fas fa-robot"></i>` : `<i class="fas fa-user"></i>`);
                
            item.innerHTML = `
                <div style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid ${isSelected ? '#007aff' : '#c7c7cc'}; background: ${isSelected ? '#007aff' : 'transparent'}; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 12px; margin-right: 5px;">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="line-item-avatar">${avatarHtml}</div>
                <div class="line-item-text" style="flex: 1;">${friend.nickname}</div>
            `;
            
            item.addEventListener('click', () => {
                if(isSelected) {
                    tempGroupMembers = tempGroupMembers.filter(id => id !== friend.id);
                } else {
                    tempGroupMembers.push(friend.id);
                }
                renderCreateGroupMembersList();
                updateCreateGroupConfirmBtn();
            });
            
            list.appendChild(item);
        });
    }

    function updateCreateGroupConfirmBtn() {
        const confirmBtn = document.getElementById('confirm-create-group-btn');
        if(!confirmBtn) return;
        if(tempGroupMembers.length > 0) {
            confirmBtn.style.opacity = '1';
            confirmBtn.style.pointerEvents = 'auto';
        } else {
            confirmBtn.style.opacity = '0.5';
            confirmBtn.style.pointerEvents = 'none';
        }
    }

    // Confirm Create Group
    const confirmCreateGroupBtn = document.getElementById('confirm-create-group-btn');
    if(confirmCreateGroupBtn) {
        confirmCreateGroupBtn.addEventListener('click', () => {
            if(tempGroupMembers.length === 0) return;
            
            let groupName = document.getElementById('group-name-input').value.trim();
            if(!groupName) {
                // Generate default name from members
                const memberNames = tempGroupMembers.map(id => {
                    const f = window.imData.friends.find(x => x.id === id);
                    return f ? f.nickname : '';
                }).filter(Boolean);
                groupName = memberNames.join(', ');
                if(groupName.length > 20) groupName = groupName.substring(0, 20) + '...';
            }

            const img = document.getElementById('group-avatar-img');
            const avatarUrl = (img && img.style.display === 'block') ? img.src : null;

            const group = window.imApp.normalizeFriendData({
                id: 'group_' + Date.now(),
                type: 'group',
                realName: groupName,
                nickname: groupName,
                signature: 'Group Chat',
                persona: '',
                avatarUrl: avatarUrl,
                members: [...tempGroupMembers],
                messages: [],
                chatBg: null,
                customCssEnabled: false,
                customCss: '',
                isPinned: false,
                memory: window.imApp.createDefaultMemory()
            });

            window.imData.friends.push(group);
            if(window.imApp.saveFriends) window.imApp.saveFriends();
            renderGroupsList();
            closeView(createGroupSheet);
            
            if(window.showToast) {
                window.showToast('Created a group', 'Groups can have:\n✓ Up to 200,000 members\n✓ Persistent chat history\n✓ Public links such as t.me/title\n✓ Admins with different rights', 3000);
            }
        });
    }

    function renderGroupsList() {
        const groupsContent = document.getElementById('groups-content');
        if(!groupsContent) return;
        
        // Keep the Create group button
        groupsContent.innerHTML = `
            <div class="line-list-item" id="create-group-trigger">
                <div class="line-item-icon bg-light"><i class="fas fa-users"></i></div>
                <div class="line-item-text">Create group</div>
            </div>
        `;
        
        // Re-bind the create button
        document.getElementById('create-group-trigger').addEventListener('click', () => {
            openCreateGroupSheet();
        });

        const groups = window.imData.friends.filter(f => f.type === 'group');
        groups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'line-list-item';
            
            const avatarHtml = group.avatarUrl 
                ? `<img src="${group.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">` 
                : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #ff9a9e, #fecfef); color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 20px;">${group.nickname.charAt(0).toUpperCase()}</div>`;
                
            item.innerHTML = `
                <div class="line-item-avatar">${avatarHtml}</div>
                <div class="line-item-text">${group.nickname}</div>
            `;
            
            item.addEventListener('click', () => {
                if(window.imApp.openChatTab) window.imApp.openChatTab(group);
            });
            
            groupsContent.appendChild(item);
        });
    }

    // Call initially and export
    window.imApp.renderGroupsList = renderGroupsList;
    renderGroupsList();

    // Group Details View Logic
    const groupDetailsSheet = document.getElementById('group-details-sheet');
    let currentViewingGroup = null;

    if (groupDetailsSheet) {
        groupDetailsSheet.addEventListener('click', (e) => {
            if (e.target === groupDetailsSheet) closeView(groupDetailsSheet);
        });
    }

    const groupEditSheet = document.getElementById('group-edit-sheet');
    const groupDetailsEditBtn = document.getElementById('group-details-edit-btn');
    const groupDetailsSettingsBtn = document.getElementById('group-details-settings-btn');
    const groupContextSettingsSheet = document.getElementById('group-context-settings-sheet');
    const groupContextEnabledToggle = document.getElementById('group-context-enabled-toggle');
    const groupContextLimitInput = document.getElementById('group-context-limit-input');
    const confirmGroupContextBtn = document.getElementById('confirm-group-context-btn');
    const confirmGroupEditBtn = document.getElementById('confirm-group-edit-btn');
    const groupEditNameInput = document.getElementById('group-edit-name-input');
    const groupBgUploadIcon = document.getElementById('group-bg-upload-icon');
    const groupBgResetIcon = document.getElementById('group-bg-reset-icon');
    const groupBgUpload = document.getElementById('group-bg-upload');

    function openGroupEditSheet() {
        if (!currentViewingGroup || !groupEditSheet) return;
        if (groupEditNameInput) {
            groupEditNameInput.value = currentViewingGroup.nickname || '';
        }
        openView(groupEditSheet);
    }

    function openGroupContextSettingsSheet() {
        if (!currentViewingGroup || !groupContextSettingsSheet) return;

        currentViewingGroup.memory = currentViewingGroup.memory || window.imApp.createDefaultMemory();
        currentViewingGroup.memory.context = currentViewingGroup.memory.context || {};

        const enabled = typeof currentViewingGroup.memory.context.enabled === 'boolean'
            ? currentViewingGroup.memory.context.enabled
            : true;
        const limit = Number(currentViewingGroup.memory.context.limit) > 0
            ? Number(currentViewingGroup.memory.context.limit)
            : 50;

        if (groupContextEnabledToggle) {
            groupContextEnabledToggle.checked = enabled;
        }

        if (groupContextLimitInput) {
            groupContextLimitInput.value = limit;
        }

        openView(groupContextSettingsSheet);
    }

    if (groupEditSheet) {
        groupEditSheet.addEventListener('click', (e) => {
            if (e.target === groupEditSheet) closeView(groupEditSheet);
        });
    }

    if (groupContextSettingsSheet) {
        groupContextSettingsSheet.addEventListener('click', (e) => {
            if (e.target === groupContextSettingsSheet) closeView(groupContextSettingsSheet);
        });
    }

    if (groupDetailsEditBtn) {
        groupDetailsEditBtn.addEventListener('click', () => {
            openGroupEditSheet();
        });
    }

    if (groupDetailsSettingsBtn) {
        groupDetailsSettingsBtn.addEventListener('click', () => {
            openGroupContextSettingsSheet();
        });
    }

    if (confirmGroupEditBtn) {
        confirmGroupEditBtn.addEventListener('click', () => {
            if (!currentViewingGroup) return;
            const newName = groupEditNameInput ? groupEditNameInput.value.trim() : '';
            if (newName) {
                currentViewingGroup.nickname = newName;
                currentViewingGroup.realName = newName;
                
                // Update UI right away
                const nameEl = document.getElementById('group-details-name');
                if (nameEl) nameEl.textContent = newName;
                
                // Also update chat header if open
                const chatNameEl = document.getElementById('active-chat-name');
                const groupChatHeaderEl = document.getElementById('active-chat-header');
                
                if (window.imData.currentActiveFriend && window.imData.currentActiveFriend.id === currentViewingGroup.id) {
                    if (chatNameEl) {
                        chatNameEl.textContent = newName;
                    }
                    if (groupChatHeaderEl) {
                        const nameDiv = groupChatHeaderEl.querySelector('.ins-chat-name');
                        if (nameDiv) nameDiv.textContent = newName;
                    }
                }
                
                if (window.imApp.saveFriends) window.imApp.saveFriends();
                renderGroupsList();
            }
            closeView(groupEditSheet);
        });
    }

    if (confirmGroupContextBtn) {
        confirmGroupContextBtn.addEventListener('click', () => {
            if (!currentViewingGroup) return;

            currentViewingGroup.memory = currentViewingGroup.memory || window.imApp.createDefaultMemory();
            currentViewingGroup.memory.context = currentViewingGroup.memory.context || {};

            const enabled = !!(groupContextEnabledToggle && groupContextEnabledToggle.checked);
            let limit = groupContextLimitInput ? Number(groupContextLimitInput.value) : 50;

            if (!Number.isFinite(limit) || limit <= 0) {
                limit = 50;
            }

            limit = Math.max(1, Math.floor(limit));

            currentViewingGroup.memory.context.enabled = enabled;
            currentViewingGroup.memory.context.limit = limit;

            if (groupContextLimitInput) {
                groupContextLimitInput.value = limit;
            }

            if (window.imApp.saveFriends) window.imApp.saveFriends();
            closeView(groupContextSettingsSheet);
            if (window.showToast) window.showToast('群聊上下文已更新');
        });
    }

    if (groupBgUploadIcon && groupBgUpload) {
        groupBgUploadIcon.addEventListener('click', () => {
            groupBgUpload.click();
        });
        groupBgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && currentViewingGroup) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    currentViewingGroup.chatBg = ev.target.result;
                    if (window.imApp.saveFriends) window.imApp.saveFriends();
                    
                    // Update if currently active
                    if (window.imData.currentActiveFriend && window.imData.currentActiveFriend.id === currentViewingGroup.id) {
                        if (window.imApp.applyFriendBg) window.imApp.applyFriendBg(currentViewingGroup);
                    }
                    if (window.showToast) window.showToast('群聊背景已更新');
                };
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }

    if (groupBgResetIcon) {
        groupBgResetIcon.addEventListener('click', () => {
            if (currentViewingGroup) {
                currentViewingGroup.chatBg = null;
                if (window.imApp.saveFriends) window.imApp.saveFriends();
                
                // Update if currently active
                if (window.imData.currentActiveFriend && window.imData.currentActiveFriend.id === currentViewingGroup.id) {
                    if (window.imApp.applyFriendBg) window.imApp.applyFriendBg(currentViewingGroup);
                }
                if (window.showToast) window.showToast('群聊背景已重置');
            }
        });
    }

    const groupAvatarUploadBtn = document.getElementById('group-details-avatar-upload-btn');
    const groupAvatarInput = document.getElementById('group-details-avatar-input');
    if (groupAvatarUploadBtn && groupAvatarInput) {
        groupAvatarUploadBtn.addEventListener('click', () => {
            groupAvatarInput.click();
        });
        
        groupAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && currentViewingGroup) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const newUrl = ev.target.result;
                    currentViewingGroup.avatarUrl = newUrl;
                    
                    const avatarImg = document.getElementById('group-details-avatar-img');
                    const avatarText = document.getElementById('group-details-avatar-text');
                    
                    if (avatarImg) {
                        avatarImg.src = newUrl;
                        avatarImg.style.display = 'block';
                    }
                    if (avatarText) avatarText.style.display = 'none';

                    // Update chat header if open
                    const chatAvatarImg = document.querySelector(`#chat-interface-${currentViewingGroup.id} .ins-chat-avatar img`);
                    if (chatAvatarImg) chatAvatarImg.src = newUrl;
                    const groupHeaderRightImg = document.querySelector(`#active-chat-right-avatar-container img`);
                    if (groupHeaderRightImg) {
                        groupHeaderRightImg.src = newUrl;
                        groupHeaderRightImg.style.display = 'block';
                        groupHeaderRightImg.parentElement.innerHTML = `<img src="${newUrl}" style="display: block;">`;
                    }
                    
                    if (window.imApp.saveFriends) window.imApp.saveFriends();
                    renderGroupsList();
                };
                reader.readAsDataURL(file);
            }
            e.target.value = ''; // reset
        });
    }

    window.imApp.openGroupDetails = function(group) {
        if(!group || group.type !== 'group') return;
        currentViewingGroup = group;
        
        const avatarText = document.getElementById('group-details-avatar-text');
        const avatarImg = document.getElementById('group-details-avatar-img');
        if(group.avatarUrl) {
            avatarImg.src = group.avatarUrl;
            avatarImg.style.display = 'block';
            avatarText.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarText.style.display = 'block';
            avatarText.textContent = group.nickname.charAt(0).toUpperCase();
        }

        document.getElementById('group-details-name').textContent = group.nickname;
        
        // Members count includes self
        const count = (group.members ? group.members.length : 0) + 1;
        document.getElementById('group-details-count').textContent = `${count} member${count > 1 ? 's' : ''}`;

        // Render member list in details
        const listContainer = document.getElementById('group-details-members-list');
        
        const myName = window.userState ? window.userState.name : 'Me';
        const myAvatarUrl = window.userState && window.userState.avatar ? window.userState.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random`;

        let membersHtml = `
            <div style="padding: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f2f2f7;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #e5e5ea; display: flex; justify-content: center; align-items: center; overflow: hidden;">
                        <img src="${myAvatarUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div>
                        <div style="font-size: 16px; font-weight: 600; color: #000;">${myName}</div>
                        <div style="font-size: 12px; color: #007aff;">online</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #8e8e93; background: #f2f2f7; padding: 2px 8px; border-radius: 10px; color: #c084fc; background: #f3e8ff;">owner</div>
            </div>
        `;
        
        if(group.members) {
            group.members.forEach(id => {
                const f = window.imData.friends.find(x => x.id === id);
                if(!f) return;
                const avatar = f.avatarUrl ? `<img src="${f.avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="color: #fff;"></i>`;
                membersHtml += `
                    <div style="padding: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f2f2f7;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: #c7c7cc; display: flex; justify-content: center; align-items: center; overflow: hidden;">
                                ${avatar}
                            </div>
                            <div>
                                <div style="font-size: 16px; font-weight: 600; color: #000;">${f.nickname}</div>
                                <div style="font-size: 12px; color: #8e8e93;">offline</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        if (listContainer) {
            listContainer.innerHTML = membersHtml;
        }

        if (groupDetailsSheet) {
            openView(groupDetailsSheet);
        }
    };

});
