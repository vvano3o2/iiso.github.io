// ==========================================
// IMESSAGE: 3. CONTACTS & ADD FRIEND
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const { UI, openView, closeView, showToast } = window;

    // Add Friend Modal Buttons from Header
    const imHeaderRight = document.querySelector('.line-header-right');
    if (imHeaderRight) {
        const addCharBtn = document.getElementById('add-char-btn');
        if(addCharBtn) {
            addCharBtn.addEventListener('click', () => {
                if(UI.inputs.friendRealName) UI.inputs.friendRealName.value = '';
                if(UI.inputs.friendNickname) UI.inputs.friendNickname.value = '';
                if(UI.inputs.friendSignature) UI.inputs.friendSignature.value = '';
                if(UI.inputs.friendPersona) UI.inputs.friendPersona.value = '';
                setFriendAvatar(null);
                openView(UI.overlays.addFriend);
            });
        }
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
});
