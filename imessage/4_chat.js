// ==========================================
// IMESSAGE: 4. CHAT INTERFACE & AI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const { apiConfig, userState, openView, closeView, showToast } = window;
    
    const chatsContent = document.getElementById('chats-content');
    const navChatsBtn = document.getElementById('nav-chats-btn');
    const imBottomNavContainer = document.querySelector('.line-bottom-nav-container');

    function updateChatsView() {
        const emptyState = document.getElementById('chats-empty-state');
        const listContainer = document.getElementById('chats-list-container');
        const lineHeader = document.querySelector('.line-header');
        
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
                setTimeout(() => scrollToBottom(container), 50);
            }
        } else {
            if(imBottomNavContainer) imBottomNavContainer.style.display = 'flex';
            if(lineHeader) lineHeader.style.display = 'flex'; 
            
            renderChatsList();
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
            
            const avatarHtml = friend.avatarUrl 
                ? `<img src="${friend.avatarUrl}">` 
                : `<i class="fas fa-user"></i>`;
                
            item.innerHTML = `
                <div class="chat-avatar">${avatarHtml}</div>
                <div class="chat-info">
                    <div class="chat-row-top">
                        <div class="chat-name">${friend.nickname}</div>
                        <div class="chat-time">${timeStr}</div>
                    </div>
                    <div class="chat-message">${msgPreview}</div>
                </div>
                <div class="pin-icon"><i class="fas fa-thumbtack"></i></div>
            `;
            
            item.addEventListener('click', () => {
                openChatTab(friend);
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
                
                const avatarHtml = friend.avatarUrl 
                    ? `<img src="${friend.avatarUrl}">` 
                    : `<i class="fas fa-user"></i>`;
                    
                item.innerHTML = `
                    <div class="chat-avatar">${avatarHtml}</div>
                    <div class="chat-info">
                        <div class="chat-row-top">
                            <div class="chat-name">${friend.nickname}</div>
                            <div class="chat-time">${timeStr}</div>
                        </div>
                        <div class="chat-message">${msgPreview}</div>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    openChatTab(friend);
                });
                
                normalContainer.appendChild(item);
            });
            
            chatsList.appendChild(normalContainer);
        }
    }

    function openChatTab(friend) {
        window.imData.currentActiveFriend = friend;
        let pageId = `chat-interface-${friend.id}`;
        let page = document.getElementById(pageId);

        if (page) {
            const msgContainer = page.querySelector('.ins-chat-messages');
            if (msgContainer) msgContainer.innerHTML = '';
        }

        if (!page) {
            page = document.createElement('div');
            page.id = pageId;
            page.className = 'active-chat-interface';
            page.style.display = 'none';
            
            const avatarHtml = friend.avatarUrl 
                ? `<img src="${friend.avatarUrl}" style="display: block;">` 
                : `<i class="fas fa-user"></i>`;

            page.innerHTML = `
                <div class="chat-sticky-container" style="background-color: #ffffff; border-bottom: 1px solid #f2f2f7; padding-bottom: 5px;">
                    <div class="chat-top-bar" style="position: relative; top: 0; padding: 0 16px; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            <div class="chat-back-btn" style="cursor: pointer; padding: 5px 5px 5px 0;"><i class="fas fa-chevron-left"></i></div>
                            <div style="position: relative; display: inline-block;">
                                <div class="ins-chat-avatar" style="margin: 0; width: 44px; height: 44px;">
                                    ${avatarHtml}
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; justify-content: center;">
                                <div class="ins-chat-name" style="font-size: 18px; line-height: 1.2;">${friend.nickname}</div>
                                <div class="ins-chat-sign" style="font-size: 13px; color: #8e8e93; display: flex; align-items: center; gap: 4px;">在线</div>
                            </div>
                        </div>
                        <div class="chat-menu-btn" style="cursor: pointer; padding: 5px;"><i class="fas fa-bars"></i></div>
                    </div>
                </div>
                <div class="ins-chat-messages"></div>
                <div class="ins-chat-input-container">
                    <div class="ins-chat-input-wrapper">
                        <div class="ins-input-icon plus-btn"><i class="fas fa-plus"></i></div>
                        <input type="text" placeholder="发送消息..." class="ins-message-input chat-input">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <div class="send-btn-icon send-btn"><i class="fas fa-paper-plane"></i></div>
                            <div class="send-btn-icon mic-btn"><i class="fas fa-microphone"></i></div>
                        </div>
                    </div>
                </div>
            `;

            if(chatsContent) chatsContent.appendChild(page);

            const backBtn = page.querySelector('.chat-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.imData.currentActiveFriend = null;
                    updateChatsView();
                });
            }

            // Status Bar UI Injection
            let statusBarContainer = page.querySelector('.chat-status-bar-container');
            if (!statusBarContainer) {
                statusBarContainer = document.createElement('div');
                statusBarContainer.className = 'chat-status-bar-container';
                statusBarContainer.style.display = 'none';
                statusBarContainer.style.position = 'absolute';
                statusBarContainer.style.top = '60px'; // Below sticky header
                statusBarContainer.style.left = '0';
                statusBarContainer.style.width = '100%';
                statusBarContainer.style.zIndex = '50';
                statusBarContainer.style.overflowX = 'auto';
                statusBarContainer.style.scrollSnapType = 'x mandatory';
                statusBarContainer.style.display = 'flex';
                statusBarContainer.style.padding = '10px 16px';
                statusBarContainer.style.boxSizing = 'border-box';
                statusBarContainer.style.gap = '10px';
                statusBarContainer.style.opacity = '0';
                statusBarContainer.style.transition = 'opacity 0.3s';
                statusBarContainer.style.pointerEvents = 'none';
                statusBarContainer.style.scrollbarWidth = 'none'; // hide scrollbar Firefox
                
                // hide scrollbar Webkit
                const styleEl = document.createElement('style');
                styleEl.innerHTML = `.chat-status-bar-container::-webkit-scrollbar { display: none; }`;
                statusBarContainer.appendChild(styleEl);

                // Insert right after sticky container
                const stickyContainer = page.querySelector('.chat-sticky-container');
                if (stickyContainer && stickyContainer.parentNode) {
                    stickyContainer.parentNode.insertBefore(statusBarContainer, stickyContainer.nextSibling);
                }
            }

            const avatarContainer = page.querySelector('.ins-chat-avatar');
            if (avatarContainer) {
                avatarContainer.style.cursor = 'pointer';
                avatarContainer.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止冒泡，避免触发页面的空白点击
                    if (!friend.statusBar || !friend.statusBar.enabled) {
                        if(window.showToast) window.showToast('该角色未启用状态栏');
                        return;
                    }
                    
                    if (statusBarContainer.style.opacity === '0' || statusBarContainer.style.pointerEvents === 'none') {
                        renderStatusBarHistory(friend, statusBarContainer);
                        statusBarContainer.style.display = 'flex';
                        // 强制触发回流以保证动画生效
                        statusBarContainer.offsetHeight; 
                        statusBarContainer.style.opacity = '1';
                        statusBarContainer.style.pointerEvents = 'auto';
                        // Scroll to end
                        setTimeout(() => {
                            statusBarContainer.scrollLeft = statusBarContainer.scrollWidth;
                        }, 50);
                    } else {
                        statusBarContainer.style.opacity = '0';
                        statusBarContainer.style.pointerEvents = 'none';
                        setTimeout(() => {
                            if (statusBarContainer.style.opacity === '0') {
                                statusBarContainer.style.display = 'none';
                            }
                        }, 300);
                    }
                });
            }

            // 点击空白处关闭状态栏逻辑
            page.addEventListener('click', (e) => {
                if (statusBarContainer && statusBarContainer.style.opacity === '1') {
                    // 如果点击的目标不在状态栏卡片内容区域内
                    if (!e.target.closest('.status-card-custom')) {
                        statusBarContainer.style.opacity = '0';
                        statusBarContainer.style.pointerEvents = 'none';
                        setTimeout(() => {
                            if (statusBarContainer.style.opacity === '0') {
                                statusBarContainer.style.display = 'none';
                            }
                        }, 300);
                    }
                }
            });

            const menuBtn = page.querySelector('.chat-menu-btn');
            if (menuBtn) {
                menuBtn.addEventListener('click', () => {
                    const chatSettingsSheet = document.getElementById('chat-settings-sheet');
                    if (chatSettingsSheet) {
                        const settingsAvatarImg = document.getElementById('chat-settings-avatar-img');
                        const settingsAvatarIcon = document.getElementById('chat-settings-avatar-icon');
                        const settingsName = document.getElementById('chat-settings-name');
                        
                        if (friend.avatarUrl) {
                            if(settingsAvatarImg) { settingsAvatarImg.src = friend.avatarUrl; settingsAvatarImg.style.display = 'block'; }
                            if(settingsAvatarIcon) settingsAvatarIcon.style.display = 'none';
                        } else {
                            if(settingsAvatarImg) { settingsAvatarImg.style.display = 'none'; settingsAvatarImg.src = ''; }
                            if(settingsAvatarIcon) settingsAvatarIcon.style.display = 'block';
                        }
                        if (settingsName) settingsName.textContent = friend.nickname;

                        openView(chatSettingsSheet);
                        if(window.imApp.initChatSettingsForFriend) window.imApp.initChatSettingsForFriend(friend);
                    }
                });
            }

            const input = page.querySelector('.chat-input');
            const sendBtn = page.querySelector('.send-btn');
            const micBtn = page.querySelector('.mic-btn');
            const msgContainer = page.querySelector('.ins-chat-messages');

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    handleSend(friend, input, msgContainer);
                }
            });

            sendBtn.addEventListener('click', () => {
                handleSend(friend, input, msgContainer);
            });

            micBtn.addEventListener('click', () => {
                handleAiReply(friend, msgContainer, micBtn);
            });

            renderChatHistory(friend, msgContainer);
        } else {
             const msgContainer = page.querySelector('.ins-chat-messages');
             renderChatHistory(friend, msgContainer);
        }

        if(window.imApp.applyFriendBg) window.imApp.applyFriendBg(friend);
        if(window.imApp.initTimestampSetting) window.imApp.initTimestampSetting(friend);
        
        if(page) {
            if(friend.showTimestamp) page.classList.add('show-timestamps');
            else page.classList.remove('show-timestamps');
            
            if(friend.isPinned) page.classList.add('pinned-chat');
            else page.classList.remove('pinned-chat');
            
            // Re-apply status bar css
            if(window.imApp.applyFriendStatusBarCss) window.imApp.applyFriendStatusBarCss(friend);
        }

        if (navChatsBtn) {
            if (navChatsBtn.classList.contains('active')) updateChatsView();
            else navChatsBtn.click();
        }
    }

    function applyFriendStatusBarCss(friend) {
        let styleTag = document.getElementById(`status-bar-style-${friend.id}`);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = `status-bar-style-${friend.id}`;
            document.head.appendChild(styleTag);
        }

        if (friend.statusBar && friend.statusBar.enabled && friend.statusBar.style) {
            const prefix = `#chat-interface-${friend.id} .chat-status-bar-container `;
            // Simple replacement for .status-card-custom
            let css = friend.statusBar.style.replace(/\.status-card-custom/g, `${prefix} .status-card-custom`);
            styleTag.innerHTML = css;
        } else {
            styleTag.innerHTML = '';
        }
    }
    window.imApp.applyFriendStatusBarCss = applyFriendStatusBarCss;

    function renderStatusBarHistory(friend, container) {
        // Clear previous except style tag
        Array.from(container.children).forEach(child => {
            if (child.tagName !== 'STYLE') child.remove();
        });

        if (!friend.statusBar || !friend.statusBar.history || friend.statusBar.history.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'status-card-custom';
            emptyEl.style.flex = '0 0 100%';
            emptyEl.style.scrollSnapAlign = 'center';
            emptyEl.textContent = '暂无状态记录';
            container.appendChild(emptyEl);
            return;
        }

        friend.statusBar.history.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'status-card-custom';
            card.style.flex = '0 0 calc(100% - 32px)'; // leave some margin
            card.style.scrollSnapAlign = 'center';
            card.style.position = 'relative';
            card.style.minHeight = '60px';
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'center';

            const textEl = document.createElement('div');
            textEl.style.width = '100%';
            textEl.style.wordBreak = 'break-word';
            // 简单处理 | 符号使其换行，使其更美观
            textEl.innerHTML = item.text.replace(/\|/g, '<br>');
            
            // Actions
            const actionsEl = document.createElement('div');
            actionsEl.style.position = 'absolute';
            actionsEl.style.top = '8px';
            actionsEl.style.right = '12px';
            actionsEl.style.display = 'flex';
            actionsEl.style.gap = '12px';
            actionsEl.style.opacity = '0.3';
            actionsEl.style.transition = 'opacity 0.2s';
            
            card.addEventListener('mouseenter', () => actionsEl.style.opacity = '0.8');
            card.addEventListener('mouseleave', () => actionsEl.style.opacity = '0.3');

            const editBtn = document.createElement('i');
            editBtn.className = 'fas fa-edit';
            editBtn.style.cursor = 'pointer';
            editBtn.style.fontSize = '12px';
            
            const delBtn = document.createElement('i');
            delBtn.className = 'fas fa-times';
            delBtn.style.cursor = 'pointer';
            delBtn.style.fontSize = '12px';

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(window.showCustomModal) {
                    window.showCustomModal({
                        type: 'prompt',
                        title: '编辑状态',
                        placeholder: '修改状态内容...',
                        confirmText: '保存',
                        onConfirm: (newVal) => {
                            if (newVal !== null) {
                                friend.statusBar.history[index].text = newVal;
                                if(window.imApp.saveFriends) window.imApp.saveFriends();
                                renderStatusBarHistory(friend, container);
                            }
                        }
                    });
                    // pre-fill via hack
                    setTimeout(() => {
                        const input = document.getElementById('modal-input');
                        if(input) input.value = item.text;
                    }, 50);
                }
            });

            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                friend.statusBar.history.splice(index, 1);
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                renderStatusBarHistory(friend, container);
            });

            actionsEl.appendChild(editBtn);
            actionsEl.appendChild(delBtn);

            card.appendChild(textEl);
            card.appendChild(actionsEl);

            container.appendChild(card);
        });
    }

    function renderChatHistory(friend, container) {
        let lastTime = 0;
        if (friend.messages && friend.messages.length > 0) {
            friend.messages.forEach(msg => {
                const msgTime = msg.timestamp || 0;
                if (msgTime - lastTime > 300000) { 
                    renderTimestamp(msgTime, container);
                    lastTime = msgTime;
                }
                
                if (msg.type === 'moment_forward') {
                    renderMomentForwardBubble(msg, friend, container, msgTime);
                } else if (msg.role === 'user') {
                    renderUserBubble(msg.content, container, msgTime);
                } else if (msg.role === 'assistant') {
                    renderAiBubble(msg.content, friend, container, msgTime);
                }
            });
        }
    }

    function scrollToBottom(container) {
        if(container) container.scrollTop = container.scrollHeight;
    }

    function renderTimestamp(timestamp, container) {
        if (!timestamp) return;
        const div = document.createElement('div');
        div.className = 'chat-timestamp';
        let timeStr = window.imApp.formatTime ? window.imApp.formatTime(timestamp) : '';
        div.innerHTML = `<span>${timeStr}</span>`;
        container.appendChild(div);
    }

    function renderUserBubble(text, container, timestamp = Date.now()) {
        const lastRow = container.lastElementChild;
        let hasPrev = false;
        if (lastRow && lastRow.classList.contains('user-row')) {
            hasPrev = true;
            lastRow.classList.add('has-next');
        }

        const row = document.createElement('div');
        row.className = `chat-row user-row ${hasPrev ? 'has-prev' : ''}`;
        
        let contentHtml = text;
        const date = new Date(timestamp);
        const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        contentHtml += `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span><i class="fas fa-check-double bubble-read-icon"></i></span>`;

        row.innerHTML = `<div class="chat-bubble user-bubble">${contentHtml}</div>`;
        container.appendChild(row);
        scrollToBottom(container);
    }

    function renderAiBubble(text, friend, container, timestamp = Date.now()) {
        const lastRow = container.lastElementChild;
        let hasPrev = false;
        if (lastRow && lastRow.classList.contains('ai-row') && !lastRow.classList.contains('typing-row')) {
            hasPrev = true;
            lastRow.classList.add('has-next');
        }

        const row = document.createElement('div');
        row.className = `chat-row ai-row ${hasPrev ? 'has-prev' : ''}`;
        
        const avatarHtml = (friend && friend.avatarUrl) 
            ? `<img src="${friend.avatarUrl}">`
            : `<i class="fas fa-user"></i>`;
            
        let contentHtml = text;
        const date = new Date(timestamp);
        const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        contentHtml += `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span></span>`;

        row.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="chat-bubble ai-bubble">${contentHtml}</div>
        `;
        container.appendChild(row);
        scrollToBottom(container);
    }

    function renderMomentForwardBubble(msg, friend, container, timestamp = Date.now()) {
        let momentData = {};
        try {
            momentData = JSON.parse(msg.content);
        } catch (e) {
            momentData = { text: '[解析错误]' };
        }

        const isUser = msg.role === 'user';
        const lastRow = container.lastElementChild;
        let hasPrev = false;
        
        if (lastRow) {
            if (isUser && lastRow.classList.contains('user-row')) {
                hasPrev = true;
                lastRow.classList.add('has-next');
            } else if (!isUser && lastRow.classList.contains('ai-row')) {
                hasPrev = true;
                lastRow.classList.add('has-next');
            }
        }

        const row = document.createElement('div');
        row.className = `chat-row ${isUser ? 'user-row' : 'ai-row'} ${hasPrev ? 'has-prev' : ''}`;
        
        const hasImg = !!momentData.img;
        let mediaHtml = '';
        if (hasImg) {
            mediaHtml = `<img src="${momentData.img}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.5);">`;
        } else {
             mediaHtml = `<div style="width: 40px; height: 40px; border-radius: 4px; background: #f2f2f7; display: flex; align-items: center; justify-content: center; color: #666; font-size: 10px; padding: 4px; overflow: hidden; text-align: left; line-height: 1.2; flex-shrink: 0; word-break: break-all;">${(momentData.text || '').substring(0, 8)}...</div>`;
        }
        
        const contentHtml = `
            <div style="display: flex; flex-direction: column; gap: 6px; cursor: pointer; text-align: left;">
                <div style="display: flex; gap: 10px; align-items: center; max-width: 200px;">
                    ${mediaHtml}
                    <div style="font-size: 14px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; line-height: 1.4; flex: 1;">
                        ${momentData.text || (hasImg ? '分享了图片' : '朋友圈')}
                    </div>
                </div>
            </div>
        `;

        const date = new Date(timestamp);
        const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        if (isUser) {
            let metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span><i class="fas fa-check-double bubble-read-icon"></i></span>`;
            row.innerHTML = `<div class="chat-bubble user-bubble moment-forward-bubble">${contentHtml}${metaHtml}</div>`;
        } else {
            const avatarHtml = (friend && friend.avatarUrl) 
                ? `<img src="${friend.avatarUrl}">`
                : `<i class="fas fa-user"></i>`;
            let metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span></span>`;
            row.innerHTML = `
                <div class="chat-avatar-small">${avatarHtml}</div>
                <div class="chat-bubble ai-bubble moment-forward-bubble">${contentHtml}${metaHtml}</div>
            `;
        }
        
        row.querySelector('.moment-forward-bubble').addEventListener('click', () => {
            const foundMoment = window.imData.moments.find(m => m.id == momentData.id);
            if (foundMoment) {
                if(window.imApp.openMomentDetail) window.imApp.openMomentDetail(foundMoment);
            } else {
                if(window.showToast) window.showToast('该朋友圈已删除或不存在');
            }
        });

        container.appendChild(row);
        scrollToBottom(container);
    }

    function handleSend(friend, inputEl, container) {
        const text = inputEl.value.trim();
        if (!text) return;

        const now = Date.now();
        const lastMsg = friend.messages && friend.messages.length > 0 
            ? friend.messages[friend.messages.length - 1] 
            : null;
        
        if (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000)) {
            renderTimestamp(now, container);
        }

        renderUserBubble(text, container, now);
        inputEl.value = '';

        if (!friend.messages) friend.messages = [];
        friend.messages.push({ role: 'user', content: text, timestamp: now });
        if(window.imApp.saveFriends) window.imApp.saveFriends();
    }

    async function handleAiReply(friend, container, btnEl) {
        if (!apiConfig.endpoint || !apiConfig.apiKey) {
            if(window.showToast) window.showToast('请先在设置中配置 API');
            return;
        }

        const typingRow = document.createElement('div');
        typingRow.className = 'chat-row ai-row typing-row';
        const avatarHtml = (friend && friend.avatarUrl) ? `<img src="${friend.avatarUrl}">` : `<i class="fas fa-user"></i>`;
        typingRow.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        `;
        container.appendChild(typingRow);
        scrollToBottom(container);
        
        if(btnEl) btnEl.style.opacity = '0.5';

        friend.memory = window.imApp.normalizeFriendData(friend).memory;

        const relationshipText = friend.memory.relationships && friend.memory.relationships.length > 0
            ? friend.memory.relationships.map(rel => {
                const npc = window.imData.friends.find(item => String(item.id) === String(rel.npcId));
                return `${npc ? npc.nickname : 'Unknown NPC'}: ${rel.relation}`;
            }).join('\n')
            : 'None';

        const memorySections = [
            friend.memory.overview ? `Overview:\n${friend.memory.overview}` : '',
            friend.memory.anniversaries ? `Anniversaries:\n${friend.memory.anniversaries}` : '',
            friend.memory.longTerm ? `Long-term Memory:\n${friend.memory.longTerm}` : '',
            friend.memory.cherished ? `Cherished Memories:\n${friend.memory.cherished}` : '',
            friend.memory.context?.notes ? `Extra Context Notes:\n${friend.memory.context.notes}` : '',
            friend.memory.summary?.enabled && friend.memory.summary?.prompt ? `Auto Summary Prompt:\n${friend.memory.summary.prompt}` : '',
            `Relationship Network:\n${relationshipText}`,
            (() => {
                const mounted = friend.mountedStickers || [];
                if (mounted.length === 0) return '';
                const allStickers = window.imData.stickers || [];
                const stickerLines = [];
                mounted.forEach(catName => {
                    const cat = allStickers.find(c => c.categoryName === catName);
                    if (cat && cat.items.length > 0) {
                        const names = cat.items.map(s => s.name).join(', ');
                        stickerLines.push(`[${catName}]: ${names}`);
                    }
                });
                if (stickerLines.length === 0) return '';
                return `Available Stickers (both you and user can use, describe sticker usage with {{sticker:name}} format):\n${stickerLines.join('\n')}`;
            })(),
            (friend.statusBar && friend.statusBar.enabled && friend.statusBar.prompt) 
                ? `[System Note for Status Bar]:\n${friend.statusBar.prompt}` 
                : ''
        ].filter(Boolean).join('\n\n');

        const systemPrompt = `You are playing the role of ${friend.realName || friend.nickname}. 
Your persona is: ${friend.persona || 'No specific persona'}. 
You are talking to ${userState.name}, whose persona is: ${userState.persona || 'A normal user'}.
Reply naturally as your character in a chat app. Do not include your own name at the beginning.

Character Memory:
${memorySections || 'None'}`;

        const messages = [{ role: 'system', content: systemPrompt }];
        if (friend.messages) {
            const contextLimit = friend.memory?.context?.enabled === false
                ? 0
                : (Number(friend.memory?.context?.limit) > 0 ? Number(friend.memory.context.limit) : 30);
            const recent = contextLimit > 0 ? friend.messages.slice(-contextLimit) : [];
            recent.forEach(m => messages.push({ role: m.role, content: m.content }));
        }
        if (messages.length === 1) messages.push({ role: 'user', content: 'Hello' });

        try {
            let endpoint = apiConfig.endpoint;
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` },
                body: JSON.stringify({
                    model: apiConfig.model || 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: parseFloat(apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            let fullReply = data.choices[0].message.content;

            if (typingRow) typingRow.remove();

            // Status Bar Regex Extraction
            if (friend.statusBar && friend.statusBar.enabled && friend.statusBar.regex) {
                try {
                    const regex = new RegExp(friend.statusBar.regex, 'g');
                    let match;
                    let lastMatch = null;
                    while ((match = regex.exec(fullReply)) !== null) {
                        lastMatch = match;
                    }

                    if (lastMatch && lastMatch[1]) {
                        const statusText = lastMatch[1].trim();
                        // Add to history
                        if (!friend.statusBar.history) friend.statusBar.history = [];
                        friend.statusBar.history.push({ id: Date.now(), text: statusText });
                        
                        // Remove all matches from fullReply so it doesn't show in chat bubble
                        fullReply = fullReply.replace(regex, '').trim();

                        // Refresh status bar UI if it's currently open
                        const page = document.getElementById(`chat-interface-${friend.id}`);
                        if (page) {
                            const statusBarContainer = page.querySelector('.chat-status-bar-container');
                            if (statusBarContainer && statusBarContainer.style.opacity === '1') {
                                renderStatusBarHistory(friend, statusBarContainer);
                                setTimeout(() => {
                                    statusBarContainer.scrollLeft = statusBarContainer.scrollWidth;
                                }, 50);
                            } else if (statusBarContainer) {
                                // Auto pop it out
                                renderStatusBarHistory(friend, statusBarContainer);
                                statusBarContainer.style.display = 'flex';
                                statusBarContainer.style.opacity = '1';
                                statusBarContainer.style.pointerEvents = 'auto';
                                setTimeout(() => {
                                    statusBarContainer.scrollLeft = statusBarContainer.scrollWidth;
                                }, 50);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Status Bar Regex Error:", e);
                }
            }

            if (!fullReply) {
                // If the entire reply was just the status
                if(btnEl) btnEl.style.opacity = '1';
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                return;
            }

            let sentences = fullReply.split(/(?<=[。！？.!?\n])/).map(s => s.trim()).filter(s => s.length > 0);
            
            if (sentences.length > 7) {
                while (sentences.length > 7) {
                    let minLen = Infinity;
                    let minIdx = 0;
                    for (let i = 0; i < sentences.length - 1; i++) {
                        let len = sentences[i].length + sentences[i+1].length;
                        if (len < minLen) {
                            minLen = len;
                            minIdx = i;
                        }
                    }
                    sentences[minIdx] = sentences[minIdx] + ' ' + sentences[minIdx+1];
                    sentences.splice(minIdx + 1, 1);
                }
            } else if (sentences.length < 3 && fullReply.length > 30) {
                sentences = fullReply.split(/(?<=[。！？.!?\n，,])/).map(s => s.trim()).filter(s => s.length > 0);
                if (sentences.length > 7) sentences = sentences.slice(0, 7);
            }
            
            if (sentences.length === 0) sentences = [fullReply];

            let qIndex = 0;
            const now = Date.now();
            const lastMsg = friend.messages[friend.messages.length - 1]; 
            if (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000)) {
                renderTimestamp(now, container);
            }

            async function processNextSentence() {
                if (qIndex >= sentences.length) {
                    if(window.imApp.saveFriends) window.imApp.saveFriends();
                    if(btnEl) btnEl.style.opacity = '1';
                    return;
                }

                const text = sentences[qIndex];
                
                const tr = document.createElement('div');
                tr.className = 'chat-row ai-row typing-row';
                const avatarHtml = (friend && friend.avatarUrl) ? `<img src="${friend.avatarUrl}">` : `<i class="fas fa-user"></i>`;
                tr.innerHTML = `
                    <div class="chat-avatar-small">${avatarHtml}</div>
                    <div class="typing-indicator">
                        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                    </div>
                `;
                
                const lastRow = container.lastElementChild;
                if (lastRow && lastRow.classList.contains('ai-row') && !lastRow.classList.contains('typing-row')) {
                    lastRow.classList.add('has-next');
                    tr.classList.add('has-prev');
                }
                
                container.appendChild(tr);
                scrollToBottom(container);

                const delay = Math.max(500, Math.min(2000, text.length * 50));
                await new Promise(res => setTimeout(res, delay));
                
                tr.remove(); 
                renderAiBubble(text, friend, container, Date.now());

                if (!friend.messages) friend.messages = [];
                friend.messages.push({ role: 'assistant', content: text, timestamp: Date.now() });

                qIndex++;
                processNextSentence();
            }

            processNextSentence();

        } catch (error) {
            if (typingRow) typingRow.remove();
            if(window.showToast) window.showToast('API 请求失败');
            console.error(error);
            if(btnEl) btnEl.style.opacity = '1';
        }
    }

    // --- Context Menu Logic ---
    const msgContextOverlay = document.getElementById('msg-context-overlay');
    const msgContextMenu = document.getElementById('msg-context-menu');

    if (chatsContent) {
        let startX, startY;
        
        const startPress = (e) => {
            if (!e.type.includes('touch')) return;
            const row = e.target.closest('.chat-row');
            if (!row) return;
            
            if (window.imData.longPressTimer) clearTimeout(window.imData.longPressTimer);
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;

            window.imData.longPressTimer = setTimeout(() => {
                showContextMenu(row, e);
            }, 500);
        };

        const cancelPress = (e) => {
            if (window.imData.longPressTimer) {
                clearTimeout(window.imData.longPressTimer);
                window.imData.longPressTimer = null;
            }
        };

        const movePress = (e) => {
            if (!window.imData.longPressTimer) return;
            const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            const currentY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
            if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) {
                cancelPress();
            }
        };

        chatsContent.addEventListener('touchstart', startPress, {passive: true});
        chatsContent.addEventListener('touchend', cancelPress);
        chatsContent.addEventListener('touchmove', movePress, {passive: true});
        chatsContent.addEventListener('mousedown', startPress);
        chatsContent.addEventListener('mouseup', cancelPress);
        chatsContent.addEventListener('mousemove', movePress);
    }

    function showContextMenu(row, e) {
        if (!msgContextOverlay || !msgContextMenu) return;
        
        if (navigator.vibrate) navigator.vibrate(50);
        
        window.imData.currentActiveRow = row;
        row.classList.add('message-active');
        
        const bubble = row.querySelector('.chat-bubble');
        if (!bubble) return;
        
        const screenEl = document.querySelector('.screen') || document.body;
        const screenRect = screenEl.getBoundingClientRect();
        
        // Clone bubble into context menu
        const bubbleClone = document.getElementById('msg-context-bubble-clone');
        if (bubbleClone) {
            bubbleClone.innerHTML = '';
            const clonedBubble = bubble.cloneNode(true);
            clonedBubble.style.margin = '0';
            clonedBubble.style.maxWidth = '100%';
            bubbleClone.appendChild(clonedBubble);
        }
        
        // Reset more actions
        const moreActions = document.getElementById('msg-context-more-actions');
        const mainActions = document.getElementById('msg-context-actions');
        if (moreActions) moreActions.style.display = 'none';
        if (mainActions) mainActions.style.display = 'flex';
        
        // Determine alignment based on user/ai row
        const isUserRow = row.classList.contains('user-row');
        
        msgContextOverlay.style.display = 'flex';
        msgContextOverlay.style.opacity = '1';
        
        // Position the menu centered or aligned
        const menuWidth = Math.min(screenRect.width - 32, 300);
        msgContextMenu.style.width = menuWidth + 'px';
        
        if (isUserRow) {
            msgContextMenu.style.alignItems = 'flex-end';
            msgContextMenu.style.right = '16px';
            msgContextMenu.style.left = 'auto';
        } else {
            msgContextMenu.style.alignItems = 'flex-start';
            msgContextMenu.style.left = '16px';
            msgContextMenu.style.right = 'auto';
        }
        
        // Vertical centering: place bubble roughly at its original position
        const bubbleRect = bubble.getBoundingClientRect();
        const bubbleCenterY = bubbleRect.top + bubbleRect.height / 2 - screenRect.top;
        
        // Estimate menu total height (reaction bar ~50 + bubble + actions ~200)
        const estimatedMenuHeight = 50 + bubbleRect.height + 220;
        let topOffset = bubbleCenterY - estimatedMenuHeight / 2;
        
        // Clamp to screen bounds
        if (topOffset < 60) topOffset = 60;
        if (topOffset + estimatedMenuHeight > screenRect.height - 20) {
            topOffset = screenRect.height - estimatedMenuHeight - 20;
        }
        if (topOffset < 60) topOffset = 60;
        
        msgContextMenu.style.top = topOffset + 'px';
        
        msgContextMenu.style.transformOrigin = isUserRow ? 'top right' : 'top left';
        
        requestAnimationFrame(() => {
            msgContextMenu.style.opacity = '1';
            msgContextMenu.style.transform = 'scale(1)';
        });
    }

    function closeContextMenu() {
        if (!msgContextOverlay || !msgContextMenu) return;
        msgContextMenu.style.opacity = '0';
        msgContextMenu.style.transform = 'scale(0.85)';
        
        if (window.imData.currentActiveRow) {
            window.imData.currentActiveRow.classList.remove('message-active');
            window.imData.currentActiveRow = null;
        }
        
        setTimeout(() => {
            msgContextOverlay.style.display = 'none';
            // Clean up cloned bubble
            const bubbleClone = document.getElementById('msg-context-bubble-clone');
            if (bubbleClone) bubbleClone.innerHTML = '';
        }, 250);
    }

    if (msgContextOverlay) {
        msgContextOverlay.addEventListener('click', (e) => {
            if (e.target === msgContextOverlay) closeContextMenu();
        });
    }

    // Use event delegation for menu items (since HTML structure changed)
    if (msgContextMenu) {
        msgContextMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.msg-menu-item');
            if (menuItem) {
                const action = menuItem.getAttribute('data-action');
                
                if (action === 'more') {
                    // Toggle more actions visibility
                    const moreActions = document.getElementById('msg-context-more-actions');
                    const mainActions = document.getElementById('msg-context-actions');
                    if (moreActions && mainActions) {
                        mainActions.style.display = 'none';
                        moreActions.style.display = 'flex';
                    }
                    return;
                }
                
                if (action === 'delete') {
                    if (window.imData.currentActiveRow) {
                        window.imData.currentActiveRow.remove();
                        if(window.showToast) window.showToast('已删除该消息');
                    }
                } else if (action === 'copy') {
                    // Copy bubble text
                    if (window.imData.currentActiveRow) {
                        const bubble = window.imData.currentActiveRow.querySelector('.chat-bubble');
                        if (bubble) {
                            const text = bubble.innerText || bubble.textContent;
                            navigator.clipboard.writeText(text).then(() => {
                                if(window.showToast) window.showToast('已复制');
                            }).catch(() => {
                                if(window.showToast) window.showToast('已复制');
                            });
                        }
                    }
                } else {
                    if(window.showToast) window.showToast(action + ' 功能未实现');
                }
                closeContextMenu();
                return;
            }
            
            const reaction = e.target.closest('.msg-reaction');
            if (reaction) {
                const emoji = reaction.getAttribute('data-emoji') || reaction.textContent.trim();
                if(window.showToast) window.showToast('已回应: ' + emoji);
                closeContextMenu();
                return;
            }
        });
    }

    // Expose Functions
    window.imApp.updateChatsView = updateChatsView;
    window.imApp.renderChatsList = renderChatsList;
    window.imApp.openChatTab = openChatTab;
    window.imApp.scrollToBottom = scrollToBottom;
    window.imApp.renderTimestamp = renderTimestamp;
    window.imApp.renderMomentForwardBubble = renderMomentForwardBubble;
});
