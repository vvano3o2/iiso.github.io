
// ==========================================
// IMESSAGE: 4_chat_list.js
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const { apiConfig, userState } = window;
    window.imChat = window.imChat || {};
    const imChat = window.imChat;

function updateChatsView() {
        const emptyState = document.getElementById('chats-empty-state');
        const listContainer = document.getElementById('chats-list-container');
        const lineHeader = document.querySelector('.line-header');
        const chatsContent = document.getElementById('chats-content');
        const imBottomNavContainer = document.querySelector('.line-bottom-nav-container');
        
        if(chatsContent) {
            Array.from(chatsContent.children).forEach(child => {
                if (child.classList.contains('active-chat-interface')) {
                    child.style.display = 'none';
                }
            });
        }

        if (window.imData.currentActiveFriend) {
            if(emptyState) emptyState.style.display = 'none';
            if(listContainer) listContainer.style.display = 'none';
            if(imBottomNavContainer) imBottomNavContainer.style.display = 'none';
            if(lineHeader) lineHeader.style.display = 'none'; 
            
            const pageId = `chat-interface-${window.imData.currentActiveFriend.id}`;
            const page = document.getElementById(pageId);
            if (page) {
                page.style.display = 'flex';
                const container = page.querySelector('.ins-chat-messages');
                setTimeout(() => window.imChat.scrollToBottom(container), 50);
            }
        } else {
            if(imBottomNavContainer) imBottomNavContainer.style.display = 'flex';
            if(lineHeader) lineHeader.style.display = 'flex'; 
            
            window.imChat.renderChatsList();
            const hasChats = window.imData.friends.some(f => f.messages && f.messages.length > 0);
            if (hasChats) {
                if(emptyState) emptyState.style.display = 'none';
                if(listContainer) listContainer.style.display = 'block';
            } else {
                if(emptyState) emptyState.style.display = 'flex';
                if(listContainer) listContainer.style.display = 'none';
            }
        }
    }

function renderChatsList() {
        const chatsList = document.getElementById('chats-list');
        if (!chatsList) return;
        chatsList.innerHTML = '';
        
        const activeFriends = window.imData.friends.filter(f => (f.messages && f.messages.length > 0) || f.isPinned);
        
        activeFriends.sort((a, b) => {
            if (a.isPinned !== b.isPinned) {
                return a.isPinned ? -1 : 1;
            }
            const timeA = (a.messages && a.messages.length > 0) ? a.messages[a.messages.length - 1].timestamp : 0;
            const timeB = (b.messages && b.messages.length > 0) ? b.messages[b.messages.length - 1].timestamp : 0;
            return timeB - timeA;
        });

        const pinnedFriends = activeFriends.filter(f => f.isPinned);
        pinnedFriends.forEach(friend => {
            const lastMsg = (friend.messages && friend.messages.length > 0) ? friend.messages[friend.messages.length - 1] : null;
            let msgPreview = 'No messages';
            let timeStr = '';
            if (lastMsg) {
                msgPreview = lastMsg.content;
                timeStr = window.imApp.formatTime ? window.imApp.formatTime(lastMsg.timestamp) : '';
            }

            const item = document.createElement('div');
            item.className = 'chat-item pinned';
            
            let avatarHtml = '';
            if (friend.type === 'group') {
                avatarHtml = friend.avatarUrl 
                    ? `<img src="${friend.avatarUrl}">` 
                    : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #ff9a9e, #fecfef); color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 20px;">${friend.nickname.charAt(0).toUpperCase()}</div>`;
            } else {
                avatarHtml = friend.avatarUrl 
                    ? `<img src="${friend.avatarUrl}">` 
                    : `<i class="fas fa-user"></i>`;
            }
                
            const nameHtml = friend.type === 'group' 
                ? `${friend.nickname} <span style="background:#e5e5ea; color:#8e8e93; font-size:10px; padding:2px 6px; border-radius:10px; margin-left:6px; vertical-align: middle;">group</span>` 
                : friend.nickname;

            let unreadHtml = '';
            if (friend.unreadCount && friend.unreadCount > 0) {
                unreadHtml = `<div class="chat-unread-badge">${friend.unreadCount > 99 ? '99+' : friend.unreadCount}</div>`;
            }

            item.innerHTML = `
                <div class="chat-avatar">${avatarHtml}</div>
                <div class="chat-info">
                    <div class="chat-row-top">
                        <div class="chat-name">${nameHtml}</div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end;">
                            <div class="chat-time">${timeStr}</div>
                            ${unreadHtml}
                        </div>
                    </div>
                    <div class="chat-message">${msgPreview}</div>
                </div>
                <div class="pin-icon"><i class="fas fa-thumbtack"></i></div>
            `;
            
            item.addEventListener('click', () => {
                window.imChat.openChatTab(friend);
            });
            
            chatsList.appendChild(item);
        });

        const unpinnedFriends = activeFriends.filter(f => !f.isPinned);
        if (unpinnedFriends.length > 0) {
            const normalContainer = document.createElement('div');
            normalContainer.className = 'normal-chats-container';
            
            unpinnedFriends.forEach(friend => {
                const lastMsg = (friend.messages && friend.messages.length > 0) ? friend.messages[friend.messages.length - 1] : null;
                let msgPreview = 'No messages';
                let timeStr = '';
                if (lastMsg) {
                    msgPreview = lastMsg.content;
                    timeStr = window.imApp.formatTime ? window.imApp.formatTime(lastMsg.timestamp) : '';
                }

                const item = document.createElement('div');
                item.className = 'chat-item';
                
                let avatarHtml = '';
                if (friend.type === 'group') {
                    avatarHtml = friend.avatarUrl 
                        ? `<img src="${friend.avatarUrl}">` 
                        : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #ff9a9e, #fecfef); color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 20px;">${friend.nickname.charAt(0).toUpperCase()}</div>`;
                } else {
                    avatarHtml = friend.avatarUrl 
                        ? `<img src="${friend.avatarUrl}">` 
                        : `<i class="fas fa-user"></i>`;
                }

                const nameHtml = friend.type === 'group' 
                    ? `${friend.nickname} <span style="background:#e5e5ea; color:#8e8e93; font-size:10px; padding:2px 6px; border-radius:10px; margin-left:6px; vertical-align: middle;">group</span>` 
                    : friend.nickname;
                    
                let unreadHtml = '';
                if (friend.unreadCount && friend.unreadCount > 0) {
                    unreadHtml = `<div class="chat-unread-badge">${friend.unreadCount > 99 ? '99+' : friend.unreadCount}</div>`;
                }

                item.innerHTML = `
                    <div class="chat-avatar">${avatarHtml}</div>
                    <div class="chat-info">
                        <div class="chat-row-top">
                            <div class="chat-name">${nameHtml}</div>
                            <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                <div class="chat-time">${timeStr}</div>
                                ${unreadHtml}
                            </div>
                        </div>
                        <div class="chat-message">${msgPreview}</div>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    window.imChat.openChatTab(friend);
                });
                
                normalContainer.appendChild(item);
            });
            
            chatsList.appendChild(normalContainer);
        }
    }

    window.imChat.updateChatsView = updateChatsView;
    window.imChat.renderChatsList = renderChatsList;

});
