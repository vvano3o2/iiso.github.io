// ==========================================
// IMESSAGE: 4. CHAT INTERFACE & AI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const { apiConfig, userState, openView, closeView, showToast } = window;
    
    const chatsContent = document.getElementById('chats-content');
    const navChatsBtn = document.getElementById('nav-chats-btn');
    const imBottomNavContainer = document.querySelector('.line-bottom-nav-container');

    if (!document.getElementById('chat-status-bar-scroll-style')) {
        const statusBarStyle = document.createElement('style');
        statusBarStyle.id = 'chat-status-bar-scroll-style';
        statusBarStyle.innerHTML = `.chat-status-bar-container::-webkit-scrollbar { display: none; }`;
        document.head.appendChild(statusBarStyle);
    }

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
                    openChatTab(friend);
                });
                
                normalContainer.appendChild(item);
            });
            
            chatsList.appendChild(normalContainer);
        }
    }

    function getStatusBarUiState(friend) {
        if (!friend.statusBar) friend.statusBar = {};
        if (!friend.statusBar.uiState) {
            friend.statusBar.uiState = {
                currentPage: 0,
                flippedStates: {}
            };
        }
        if (!friend.statusBar.uiState.flippedStates) {
            friend.statusBar.uiState.flippedStates = {};
        }
        if (!Number.isInteger(friend.statusBar.uiState.currentPage) || friend.statusBar.uiState.currentPage < 0) {
            friend.statusBar.uiState.currentPage = 0;
        }
        return friend.statusBar.uiState;
    }

    function setStatusBarPage(friend, nextPage) {
        if (!friend || !friend.statusBar || !Array.isArray(friend.statusBar.history)) return 0;
        const uiState = getStatusBarUiState(friend);
        const total = friend.statusBar.history.length;
        if (total <= 0) {
            uiState.currentPage = 0;
            return 0;
        }
        const safePage = Math.max(0, Math.min(nextPage, total - 1));
        uiState.currentPage = safePage;
        return safePage;
    }

    function getThoughtText(statusData) {
        if (!statusData || typeof statusData !== 'object') return '此刻我只想更靠近你一点。';
        const thought = typeof statusData.thought === 'string' ? statusData.thought.trim() : '';
        return thought || '此刻我只想更靠近你一点。';
    }

    function getStatusBarType(friend) {
        return friend && friend.statusBar && friend.statusBar.type === 'icity' ? 'icity' : 'ins';
    }

    function getStatusBarComments(statusData) {
        if (!statusData || typeof statusData !== 'object') return [];
        if (Array.isArray(statusData.comments) && statusData.comments.length > 0) {
            return statusData.comments
                .map(item => ({
                    user: item && typeof item.user === 'string' ? item.user.trim() : '',
                    text: item && typeof item.text === 'string' ? item.text.trim() : ''
                }))
                .filter(item => item.user || item.text)
                .slice(0, 2);
        }

        const fallbackText = typeof statusData.comment === 'string' ? statusData.comment.trim() : '';
        const fallbackUser = typeof statusData.commentUser === 'string' ? statusData.commentUser.trim() : '';
        if (fallbackText || fallbackUser) {
            return [{
                user: fallbackUser || 'friend',
                text: fallbackText || '路过 留下一个小纸条。'
            }];
        }

        return [];
    }

    function getStatusBarMainText(statusData) {
        if (!statusData || typeof statusData !== 'object') return '';
        const text = typeof statusData.text === 'string' ? statusData.text.trim() : '';
        const thought = typeof statusData.thought === 'string' ? statusData.thought.trim() : '';
        return text || thought || '';
    }

    function applyStatusCardSnapshotStyle(card, cardId, styleText) {
        if (!card || !cardId || !styleText) return;
        card.setAttribute('data-status-card-id', cardId);

        const styleEl = document.createElement('style');
        const selector = `.status-card-custom[data-status-card-id="${cardId}"]`;
        styleEl.textContent = styleText.replace(/\.status-card-custom/g, selector);
        card.appendChild(styleEl);
    }

    function syncStatusBarView(friend, container, options = {}) {
        if (!friend || !container) return;

        const page = container.closest('.active-chat-interface');
        const pager = page ? page.querySelector('.chat-status-bar-pager') : null;
        const prevBtn = page ? page.querySelector('.chat-status-bar-nav.prev') : null;
        const nextBtn = page ? page.querySelector('.chat-status-bar-nav.next') : null;
        const slides = container.querySelectorAll('.status-card-slide');
        const total = slides.length;
        const uiState = getStatusBarUiState(friend);
        const safePage = total > 0 ? Math.max(0, Math.min(uiState.currentPage || 0, total - 1)) : 0;

        uiState.currentPage = safePage;

        if (pager) {
            pager.textContent = total > 0 ? `${safePage + 1}/${total}` : '0/0';
            pager.style.opacity = total > 0 && container.style.opacity === '1' ? '1' : '0';
        }

        if (prevBtn) prevBtn.disabled = total <= 1 || safePage <= 0;
        if (nextBtn) nextBtn.disabled = total <= 1 || safePage >= total - 1;

        slides.forEach((slide, index) => {
            const mediaFlip = slide.querySelector('.status-card-media-flip');
            if (!mediaFlip) return;
            const flipped = !!uiState.flippedStates[index];
            mediaFlip.classList.toggle('is-flipped', flipped);
        });

        if (options.scroll !== false && total > 0) {
            const targetLeft = safePage * (container.clientWidth || 0);
            if (Math.abs(container.scrollLeft - targetLeft) > 2) {
                container.scrollTo({ left: targetLeft, behavior: options.instant ? 'auto' : 'smooth' });
            }
        }
    }

    function goStatusBarPage(friend, container, delta) {
        if (!friend || !container || !friend.statusBar || !Array.isArray(friend.statusBar.history) || friend.statusBar.history.length <= 1) return;
        const nextPage = setStatusBarPage(friend, getStatusBarUiState(friend).currentPage + delta);
        syncStatusBarView(friend, container, { scroll: true });
        return nextPage;
    }

    function toggleStatusBarThought(friend, container, index) {
        if (!friend || !container) return;
        const uiState = getStatusBarUiState(friend);
        uiState.flippedStates[index] = !uiState.flippedStates[index];
        syncStatusBarView(friend, container, { scroll: false });
    }

    function ensureTransferDetailOverlayForExistingPage(page, friend) {
        if (!page || page.querySelector('.pay-transfer-detail-overlay')) return;

        page.insertAdjacentHTML('beforeend', `
                <div class="pay-transfer-detail-overlay" style="display:none; position:absolute; inset:0; z-index:1200; background:rgba(0,0,0,0.28); align-items:center; justify-content:center; padding:20px; box-sizing:border-box;">
                    <div class="pay-transfer-detail-card" style="width:100%; max-width:320px; border-radius:28px; background:rgba(255,255,255,0.96); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); box-shadow:0 18px 45px rgba(0,0,0,0.18); padding:20px 18px 16px; box-sizing:border-box;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                            <div class="pay-transfer-detail-avatar" style="width:52px; height:52px; border-radius:50%; overflow:hidden; background:#e5e5ea; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <i class="fas fa-user" style="color:#8e8e93; font-size:20px;"></i>
                            </div>
                            <div style="min-width:0;">
                                <div class="pay-transfer-detail-name" style="font-size:17px; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">付款人</div>
                                <div style="font-size:12px; color:#8e8e93; margin-top:3px;">向你转账</div>
                            </div>
                        </div>
                        <div class="pay-transfer-detail-amount" style="font-size:34px; line-height:1.1; font-weight:800; color:#111; text-align:center; margin:8px 0 10px;">¥0.00</div>
                        <div class="pay-transfer-detail-desc" style="font-size:14px; color:#666; text-align:center; line-height:1.5; min-height:21px; margin-bottom:18px;">转账说明</div>
                        <div style="border-radius:18px; background:#f7f7fa; padding:12px 14px; margin-bottom:16px;">
                            <div style="font-size:12px; color:#8e8e93; margin-bottom:6px;">转账详情</div>
                            <div class="pay-transfer-detail-summary" style="font-size:14px; color:#222; line-height:1.5;">付款人向你转账</div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button type="button" class="pay-transfer-detail-reject-btn" style="flex:1; height:46px; border:none; border-radius:16px; background:#f2f2f7; color:#666; font-size:16px; font-weight:600; cursor:pointer;">退回</button>
                            <button type="button" class="pay-transfer-detail-claim-btn" style="flex:1; height:46px; border:none; border-radius:16px; background:#111; color:#fff; font-size:16px; font-weight:700; cursor:pointer;">收下</button>
                        </div>
                    </div>
                </div>
        `);

        const transferDetailOverlay = page.querySelector('.pay-transfer-detail-overlay');
        const transferDetailAvatar = page.querySelector('.pay-transfer-detail-avatar');
        const transferDetailName = page.querySelector('.pay-transfer-detail-name');
        const transferDetailAmount = page.querySelector('.pay-transfer-detail-amount');
        const transferDetailDesc = page.querySelector('.pay-transfer-detail-desc');
        const transferDetailSummary = page.querySelector('.pay-transfer-detail-summary');
        const transferDetailRejectBtn = page.querySelector('.pay-transfer-detail-reject-btn');
        const transferDetailClaimBtn = page.querySelector('.pay-transfer-detail-claim-btn');
        const msgContainerProxy = page.querySelector('.ins-chat-messages');
        let pendingTransferMsg = null;

        function closeTransferDetailOverlay() {
            pendingTransferMsg = null;
            if (transferDetailOverlay) transferDetailOverlay.style.display = 'none';
        }

        function openTransferDetailOverlay(targetMsg) {
            if (!transferDetailOverlay || !targetMsg) return;

            pendingTransferMsg = targetMsg;
            const senderName = friend.nickname || friend.realName || '对方';
            const amount = Number(targetMsg.amount) || 0;
            const description = targetMsg.description || '转账';

            if (transferDetailName) transferDetailName.textContent = senderName;
            if (transferDetailAmount) transferDetailAmount.textContent = `¥${amount.toFixed(2)}`;
            if (transferDetailDesc) transferDetailDesc.textContent = description;
            if (transferDetailSummary) transferDetailSummary.textContent = `${senderName} 向你转账，备注：${description}`;

            if (transferDetailAvatar) {
                if (friend.avatarUrl) {
                    transferDetailAvatar.innerHTML = `<img src="${friend.avatarUrl}" style="width:100%; height:100%; object-fit:cover; display:block;">`;
                } else {
                    transferDetailAvatar.innerHTML = `<i class="fas fa-user" style="color:#8e8e93; font-size:20px;"></i>`;
                }
            }

            transferDetailOverlay.style.display = 'flex';
        }

        page._openTransferDetailOverlay = openTransferDetailOverlay;
        page._closeTransferDetailOverlay = closeTransferDetailOverlay;

        if (msgContainerProxy) {
            msgContainerProxy.addEventListener('click', (e) => {
                const row = e.target.closest('.chat-row');
                if (!row) return;

                const messageId = row.getAttribute('data-message-id');
                const ts = row.getAttribute('data-timestamp');
                if ((!messageId && !ts) || !friend.messages) return;

                const msg = friend.messages.find(item => {
                    if (messageId && String(item.id) === String(messageId)) return true;
                    return String(item.timestamp) === String(ts);
                });
                if (!msg || msg.type !== 'pay_transfer' || msg.payKind !== 'char_to_user_pending') return;

                const bubble = e.target.closest('.chat-bubble.pay-transfer-bubble, .pay-transfer-card');
                if (!bubble) return;

                e.preventDefault();
                e.stopPropagation();
                openTransferDetailOverlay(msg);
            }, true);
        }

        if (transferDetailOverlay) {
            transferDetailOverlay.addEventListener('click', (e) => {
                if (e.target === transferDetailOverlay) {
                    closeTransferDetailOverlay();
                }
            });
        }

        if (transferDetailRejectBtn) {
            transferDetailRejectBtn.addEventListener('click', () => {
                closeTransferDetailOverlay();
            });
        }

        if (transferDetailClaimBtn) {
            transferDetailClaimBtn.addEventListener('click', () => {
                const targetMsg = pendingTransferMsg;
                closeTransferDetailOverlay();
                if (targetMsg) {
                    claimIncomingTransfer(friend, targetMsg);
                }
            });
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
            page.style.position = 'relative';
            
            let avatarHtml;
            if (friend.type === 'group') {
                avatarHtml = friend.avatarUrl 
                    ? `<img src="${friend.avatarUrl}" style="display: block;">` 
                    : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #ff9a9e, #fecfef); color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 20px;">${friend.nickname.charAt(0).toUpperCase()}</div>`;
            } else {
                avatarHtml = friend.avatarUrl 
                    ? `<img src="${friend.avatarUrl}" style="display: block;">` 
                    : `<i class="fas fa-user"></i>`;
            }

            const headerStyle = friend.type === 'group' 
                ? `position: relative; top: 0; padding: 0 16px; align-items: center; justify-content: space-between; display: flex; pointer-events: none; width: 100%;`
                : `position: relative; top: 0; padding: 0 16px; align-items: center;`;
                
            const titleHtml = friend.type === 'group' 
                ? `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 0; padding: 4px 16px; background: rgba(242, 242, 247, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); pointer-events: auto;">
                        <div class="ins-chat-name" style="font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${friend.nickname}</div>
                        <div class="ins-chat-sign" style="font-size: 11px; font-weight: 500; color: #8e8e93; margin-top: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">${(friend.members ? friend.members.length : 0) + 1} member${(friend.members ? friend.members.length : 0) + 1 > 1 ? 's' : ''}</div>
                   </div>`
                : `<div style="position: relative; display: inline-block;">
                        <div class="ins-chat-avatar" style="margin: 0; width: 44px; height: 44px;">
                            ${avatarHtml}
                        </div>
                   </div>
                   <div style="display: flex; flex-direction: column; justify-content: center;">
                        <div class="ins-chat-name" style="font-size: 18px; line-height: 1.2;">${friend.nickname}</div>
                        <div class="ins-chat-sign" style="font-size: 13px; color: #8e8e93; display: flex; align-items: center; gap: 4px;">在线</div>
                   </div>`;

            // Make the right avatar a floating bubble as well
            const groupRightAvatarHtml = friend.type === 'group'
                ? `<div class="group-header-right-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(242, 242, 247, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; justify-content: center; align-items: center; overflow: hidden; flex-shrink: 0; pointer-events: auto; cursor: pointer;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; display: flex; justify-content: center; align-items: center; background: #e5e5ea;">${avatarHtml}</div>
                   </div>`
                : `<div class="chat-call-btn" style="cursor: pointer; padding: 5px; font-size: 18px;"><i class="fas fa-phone-alt"></i></div>
                   <div class="chat-menu-btn" style="cursor: pointer; padding: 5px; font-size: 18px;"><i class="fas fa-bars"></i></div>
                   <div class="chat-cancel-batch-btn" style="display:none; cursor: pointer; padding: 5px; color: #007aff; font-size: 16px; font-weight: 500;">取消</div>`;

            const backBtnHtml = friend.type === 'group'
                ? `<div class="chat-back-btn" style="cursor: pointer; width: 36px; height: 36px; background: rgba(242, 242, 247, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; justify-content: center; align-items: center; pointer-events: auto;">
                        <i class="fas fa-chevron-left" style="pointer-events: none; margin-right: 2px;"></i>
                   </div>`
                : `<div class="chat-back-btn" style="cursor: pointer; padding: 5px 0 5px 0; width: 24px; display: flex; justify-content: center; align-items: center;"><i class="fas fa-chevron-left" style="pointer-events: none;"></i></div>`;

            let topBarHtml = '';
            if (friend.type === 'group') {
                topBarHtml = `
                    <div class="chat-top-bar" style="${headerStyle}">
                        ${backBtnHtml}
                        <div style="display: flex; align-items: center; justify-content: center; flex: 1; pointer-events: none;" class="ins-chat-header" id="active-chat-header">
                            ${titleHtml}
                        </div>
                        <div id="active-chat-right-avatar-container">
                            ${groupRightAvatarHtml}
                        </div>
                    </div>
                `;
            } else {
                topBarHtml = `
                    <div class="chat-top-bar" style="${headerStyle}; padding-left: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            ${backBtnHtml}
                            <div style="display: flex; align-items: center; justify-content: flex-start; flex: 1; cursor: pointer; pointer-events: auto;" class="ins-chat-header">
                                ${titleHtml}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${groupRightAvatarHtml}
                        </div>
                    </div>
                `;
            }

            page.innerHTML = `
                <div class="chat-sticky-container" style="${friend.type === 'group' ? 'background: transparent; padding-bottom: 5px; pointer-events: none;' : 'background-color: #ffffff; border-bottom: 1px solid #f2f2f7; padding-bottom: 5px;'}">
                    ${topBarHtml}
                </div>
                <div class="ins-chat-messages"></div>
                <div class="ins-chat-input-container">
                    <div class="reply-preview-container" style="display:none; padding: 10px 14px; background: #f2f2f7; border-radius: 18px; margin-bottom: 10px; font-size: 13px; color: #8e8e93; position: relative; margin-left: 10px; margin-right: 10px; max-width: fit-content; border: 1px solid #e5e5ea; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div class="reply-preview-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 24px; color: #333; max-width: 250px;"></div>
                        <div class="reply-cancel-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border-radius: 50%; background: #ccc; color: #fff; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 10px;"><i class="fas fa-times"></i></div>
                    </div>
                    <div class="ins-chat-input-wrapper">
                        <div class="ins-input-icon plus-btn"><i class="fas fa-plus"></i></div>
                        <input type="text" placeholder="发送消息..." class="ins-message-input chat-input">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <div class="send-btn-icon send-btn"><i class="fas fa-paper-plane"></i></div>
                            <div class="send-btn-icon mic-btn"><i class="fas fa-microphone"></i></div>
                        </div>
                    </div>
                    <div class="chat-batch-action-bar" style="display:none; justify-content: space-between; align-items: center; padding: 15px 40px; padding-bottom: max(15px, env(safe-area-inset-bottom)); background: rgba(242, 242, 247, 0.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-top: 1px solid rgba(0,0,0,0.1); position: absolute; bottom: 0; left: 0; width: 100%; z-index: 100; box-sizing: border-box;">
                        <i class="fas fa-share batch-forward-btn" style="font-size: 22px; color: #8e8e93; cursor: pointer;"></i>
                        <i class="far fa-star batch-star-btn" style="font-size: 22px; color: #8e8e93; cursor: pointer;"></i>
                        <i class="far fa-trash-alt batch-delete-btn" style="font-size: 22px; color: #ff3b30; cursor: pointer;"></i>
                    </div>
                </div>
                <div class="pay-transfer-detail-overlay" style="display:none; position:absolute; inset:0; z-index:1200; background:rgba(0,0,0,0.28); align-items:center; justify-content:center; padding:20px; box-sizing:border-box;">
                    <div class="pay-transfer-detail-card" style="width:100%; max-width:320px; border-radius:28px; background:rgba(255,255,255,0.96); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); box-shadow:0 18px 45px rgba(0,0,0,0.18); padding:20px 18px 16px; box-sizing:border-box;">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                            <div class="pay-transfer-detail-avatar" style="width:52px; height:52px; border-radius:50%; overflow:hidden; background:#e5e5ea; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                <i class="fas fa-user" style="color:#8e8e93; font-size:20px;"></i>
                            </div>
                            <div style="min-width:0;">
                                <div class="pay-transfer-detail-name" style="font-size:17px; font-weight:700; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">付款人</div>
                                <div style="font-size:12px; color:#8e8e93; margin-top:3px;">向你转账</div>
                            </div>
                        </div>
                        <div class="pay-transfer-detail-amount" style="font-size:34px; line-height:1.1; font-weight:800; color:#111; text-align:center; margin:8px 0 10px;">¥0.00</div>
                        <div class="pay-transfer-detail-desc" style="font-size:14px; color:#666; text-align:center; line-height:1.5; min-height:21px; margin-bottom:18px;">转账说明</div>
                        <div style="border-radius:18px; background:#f7f7fa; padding:12px 14px; margin-bottom:16px;">
                            <div style="font-size:12px; color:#8e8e93; margin-bottom:6px;">转账详情</div>
                            <div class="pay-transfer-detail-summary" style="font-size:14px; color:#222; line-height:1.5;">付款人向你转账</div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button type="button" class="pay-transfer-detail-reject-btn" style="flex:1; height:46px; border:none; border-radius:16px; background:#f2f2f7; color:#666; font-size:16px; font-weight:600; cursor:pointer;">退回</button>
                            <button type="button" class="pay-transfer-detail-claim-btn" style="flex:1; height:46px; border:none; border-radius:16px; background:#111; color:#fff; font-size:16px; font-weight:700; cursor:pointer;">收下</button>
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

            const cancelBatchBtn = page.querySelector('.chat-cancel-batch-btn');
            const menuBtn = page.querySelector('.chat-menu-btn');
            const callBtn = page.querySelector('.chat-call-btn');
            const batchActionBar = page.querySelector('.chat-batch-action-bar');
            const inputWrapper = page.querySelector('.ins-chat-input-wrapper');
            const batchDeleteBtn = page.querySelector('.batch-delete-btn');
            const transferDetailOverlay = page.querySelector('.pay-transfer-detail-overlay');
            const transferDetailAvatar = page.querySelector('.pay-transfer-detail-avatar');
            const transferDetailName = page.querySelector('.pay-transfer-detail-name');
            const transferDetailAmount = page.querySelector('.pay-transfer-detail-amount');
            const transferDetailDesc = page.querySelector('.pay-transfer-detail-desc');
            const transferDetailSummary = page.querySelector('.pay-transfer-detail-summary');
            const transferDetailRejectBtn = page.querySelector('.pay-transfer-detail-reject-btn');
            const transferDetailClaimBtn = page.querySelector('.pay-transfer-detail-claim-btn');
            let pendingTransferMsg = null;

            function exitBatchSelectMode() {
                window.imData.batchSelectMode = false;
                if (cancelBatchBtn) cancelBatchBtn.style.display = 'none';
                if (menuBtn) menuBtn.style.display = 'block';
                if (callBtn) callBtn.style.display = 'block';
                if (batchActionBar) batchActionBar.style.display = 'none';
                if (inputWrapper) inputWrapper.style.display = 'flex';

                const checkboxes = page.querySelectorAll('.chat-checkbox-wrapper');
                checkboxes.forEach(cb => {
                    cb.style.display = 'none';
                    const icon = cb.querySelector('i');
                    if (icon) {
                        icon.className = 'far fa-circle';
                        icon.style.color = '#c7c7cc';
                    }
                });
            }

            function closeTransferDetailOverlay() {
                pendingTransferMsg = null;
                if (transferDetailOverlay) transferDetailOverlay.style.display = 'none';
            }

            function openTransferDetailOverlay(targetMsg) {
                if (!transferDetailOverlay || !targetMsg) return;

                pendingTransferMsg = targetMsg;
                const senderName = friend.nickname || friend.realName || '对方';
                const amount = Number(targetMsg.amount) || 0;
                const description = targetMsg.description || '转账';

                if (transferDetailName) transferDetailName.textContent = senderName;
                if (transferDetailAmount) transferDetailAmount.textContent = `¥${amount.toFixed(2)}`;
                if (transferDetailDesc) transferDetailDesc.textContent = description;
                if (transferDetailSummary) transferDetailSummary.textContent = `${senderName} 向你转账，备注：${description}`;

                if (transferDetailAvatar) {
                    if (friend.avatarUrl) {
                        transferDetailAvatar.innerHTML = `<img src="${friend.avatarUrl}" style="width:100%; height:100%; object-fit:cover; display:block;">`;
                    } else {
                        transferDetailAvatar.innerHTML = `<i class="fas fa-user" style="color:#8e8e93; font-size:20px;"></i>`;
                    }
                }

                transferDetailOverlay.style.display = 'flex';
            }

            page._openTransferDetailOverlay = openTransferDetailOverlay;
            page._closeTransferDetailOverlay = closeTransferDetailOverlay;

            if (callBtn) {
                callBtn.addEventListener('click', () => {
                    if (window.showCustomModal) {
                        window.showCustomModal({
                            title: '选择通话方式',
                            message: '请选择你想与对方进行的通话类型',
                            confirmText: '视频通话',
                            cancelText: '语音通话',
                            onConfirm: () => {
                                if(window.showToast) window.showToast('视频通话功能开发中...');
                            },
                            onCancel: () => {
                                if(window.showToast) window.showToast('语音通话功能开发中...');
                            }
                        });
                    } else if(window.showToast) {
                        window.showToast('通话功能暂未开放');
                    }
                });
            }

            if (cancelBatchBtn) {
                cancelBatchBtn.addEventListener('click', () => {
                    exitBatchSelectMode();
                });
            }

            if (batchDeleteBtn) {
                batchDeleteBtn.addEventListener('click', () => {
                    const selectedIcons = page.querySelectorAll('.chat-checkbox-wrapper i.fa-check-circle');
                    const selected = Array.from(selectedIcons).map(icon => icon.getAttribute('data-timestamp'));
                    if (selected.length === 0) {
                        if(window.showToast) window.showToast('请选择要删除的消息');
                        return;
                    }
                    if (window.showCustomModal) {
                        window.showCustomModal({
                            title: '删除消息',
                            message: `确定要删除选中的 ${selected.length} 条消息吗？`,
                            confirmText: '删除',
                            cancelText: '取消',
                            onConfirm: () => {
                                friend.messages = friend.messages.filter(m => !selected.includes(String(m.timestamp)));
                                if(window.imApp.saveFriends) window.imApp.saveFriends();
                                const container = page.querySelector('.ins-chat-messages');
                                if(container) {
                                    container.innerHTML = '';
                                    renderChatHistory(friend, container);
                                    scrollToBottom(container);
                                }
                                exitBatchSelectMode();
                            }
                        });
                    }
                });
            }

            const msgContainerProxy = page.querySelector('.ins-chat-messages');
            if (msgContainerProxy) {
                msgContainerProxy.addEventListener('click', (e) => {
                    const row = e.target.closest('.chat-row');

                    if (window.imData.batchSelectMode) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (row) {
                            const icon = row.querySelector('.chat-checkbox-wrapper i');
                            if (icon) {
                                if (icon.classList.contains('fa-circle')) {
                                    icon.className = 'fas fa-check-circle';
                                    icon.style.color = '#007aff';
                                } else {
                                    icon.className = 'far fa-circle';
                                    icon.style.color = '#c7c7cc';
                                }
                            }
                        }
                        return;
                    }

                    if (!row) return;

                    const messageId = row.getAttribute('data-message-id');
                    const ts = row.getAttribute('data-timestamp');
                    if ((!messageId && !ts) || !friend.messages) return;

                    const msg = friend.messages.find(item => {
                        if (messageId && String(item.id) === String(messageId)) return true;
                        return String(item.timestamp) === String(ts);
                    });
                    if (!msg || msg.type !== 'pay_transfer' || msg.payKind !== 'char_to_user_pending') return;

                    const bubble = e.target.closest('.chat-bubble.pay-transfer-bubble, .pay-transfer-card');
                    if (!bubble) return;

                    e.preventDefault();
                    e.stopPropagation();
                    openTransferDetailOverlay(msg);
                }, true);
            }

            if (transferDetailOverlay) {
                transferDetailOverlay.addEventListener('click', (e) => {
                    if (e.target === transferDetailOverlay) {
                        closeTransferDetailOverlay();
                    }
                });
            }

            if (transferDetailRejectBtn) {
                transferDetailRejectBtn.addEventListener('click', () => {
                    closeTransferDetailOverlay();
                });
            }

            if (transferDetailClaimBtn) {
                transferDetailClaimBtn.addEventListener('click', () => {
                    const targetMsg = pendingTransferMsg;
                    closeTransferDetailOverlay();
                    if (targetMsg) {
                        claimIncomingTransfer(friend, targetMsg);
                    }
                });
            }

            const replyCancelBtn = page.querySelector('.reply-cancel-btn');
            if (replyCancelBtn) {
                replyCancelBtn.addEventListener('click', () => {
                    window.imData.currentReplyText = null;
                    const preview = page.querySelector('.reply-preview-container');
                    if(preview) preview.style.display = 'none';
                });
            }

            // Status Bar UI Injection
            let statusBarContainer = page.querySelector('.chat-status-bar-container');
            if (!statusBarContainer) {
                statusBarContainer = document.createElement('div');
                statusBarContainer.className = 'chat-status-bar-container';
                statusBarContainer.style.display = 'none';
                statusBarContainer.style.position = 'absolute';
                statusBarContainer.style.top = '50px';
                statusBarContainer.style.left = '0';
                statusBarContainer.style.width = '100%';
                statusBarContainer.style.zIndex = '50';
                statusBarContainer.style.overflowX = 'auto';
                statusBarContainer.style.overflowY = 'hidden';
                statusBarContainer.style.scrollSnapType = 'x mandatory';
                statusBarContainer.style.display = 'flex';
                statusBarContainer.style.padding = '10px 0 34px';
                statusBarContainer.style.boxSizing = 'border-box';
                statusBarContainer.style.gap = '0';
                statusBarContainer.style.opacity = '0';
                statusBarContainer.style.transition = 'opacity 0.3s';
                statusBarContainer.style.pointerEvents = 'none';
                statusBarContainer.style.scrollbarWidth = 'none';
                statusBarContainer.style.msOverflowStyle = 'none';
                statusBarContainer.style.webkitOverflowScrolling = 'touch';
                statusBarContainer.style.scrollBehavior = 'smooth';
                statusBarContainer.style.overscrollBehaviorX = 'contain';

                const statusBarControls = document.createElement('div');
                statusBarControls.className = 'chat-status-bar-controls';
                statusBarControls.style.position = 'absolute';
                statusBarControls.style.left = '50%';
                statusBarControls.style.bottom = '6px';
                statusBarControls.style.transform = 'translateX(-50%)';
                statusBarControls.style.display = 'flex';
                statusBarControls.style.alignItems = 'center';
                statusBarControls.style.gap = '10px';
                statusBarControls.style.opacity = '0';
                statusBarControls.style.transition = 'opacity 0.2s';
                statusBarControls.style.pointerEvents = 'none';

                const prevBtn = document.createElement('button');
                prevBtn.className = 'chat-status-bar-nav prev';
                prevBtn.type = 'button';
                prevBtn.setAttribute('aria-label', '上一页');
                prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';

                const statusBarPager = document.createElement('div');
                statusBarPager.className = 'chat-status-bar-pager';
                statusBarPager.textContent = '1/1';

                const nextBtn = document.createElement('button');
                nextBtn.className = 'chat-status-bar-nav next';
                nextBtn.type = 'button';
                nextBtn.setAttribute('aria-label', '下一页');
                nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goStatusBarPage(friend, statusBarContainer, -1);
                });

                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goStatusBarPage(friend, statusBarContainer, 1);
                });

                let statusBarScrollTimer = null;
                statusBarContainer.addEventListener('scroll', () => {
                    const total = statusBarContainer.querySelectorAll('.status-card-slide').length;
                    if (total <= 0) return;
                    const pageWidth = statusBarContainer.clientWidth || 1;
                    const currentPage = Math.max(0, Math.min(total - 1, Math.round(statusBarContainer.scrollLeft / pageWidth)));
                    setStatusBarPage(friend, currentPage);
                    syncStatusBarView(friend, statusBarContainer, { scroll: false });

                    if (statusBarScrollTimer) clearTimeout(statusBarScrollTimer);
                    statusBarScrollTimer = setTimeout(() => {
                        syncStatusBarView(friend, statusBarContainer, { scroll: true });
                    }, 90);
                });

                statusBarControls.appendChild(prevBtn);
                statusBarControls.appendChild(statusBarPager);
                statusBarControls.appendChild(nextBtn);

                // Insert right after sticky container
                const stickyContainer = page.querySelector('.chat-sticky-container');
                if (stickyContainer && stickyContainer.parentNode) {
                    stickyContainer.parentNode.insertBefore(statusBarContainer, stickyContainer.nextSibling);
                    stickyContainer.parentNode.insertBefore(statusBarControls, statusBarContainer.nextSibling);
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
                        const statusBarControls = page.querySelector('.chat-status-bar-controls');
                        if (statusBarControls) {
                            statusBarControls.style.opacity = '1';
                            statusBarControls.style.pointerEvents = 'auto';
                        }
                        requestAnimationFrame(() => {
                            syncStatusBarView(friend, statusBarContainer, { scroll: true, instant: true });
                        });
                    } else {
                        statusBarContainer.style.opacity = '0';
                        statusBarContainer.style.pointerEvents = 'none';
                        const statusBarControls = page.querySelector('.chat-status-bar-controls');
                        if (statusBarControls) {
                            statusBarControls.style.opacity = '0';
                            statusBarControls.style.pointerEvents = 'none';
                        }
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
                        const statusBarControls = page.querySelector('.chat-status-bar-controls');
                        if (statusBarControls) {
                            statusBarControls.style.opacity = '0';
                            statusBarControls.style.pointerEvents = 'none';
                        }
                        setTimeout(() => {
                            if (statusBarContainer.style.opacity === '0') {
                                statusBarContainer.style.display = 'none';
                            }
                        }, 300);
                    }
                }
            });

            if (friend.type === 'group') {
                const rightAvatar = page.querySelector('.group-header-right-avatar');
                if (rightAvatar) {
                    rightAvatar.addEventListener('click', () => {
                        if (window.imApp.openGroupDetails) {
                            window.imApp.openGroupDetails(friend);
                        }
                    });
                }
                const header = page.querySelector('.ins-chat-header');
                if (header) {
                    header.addEventListener('click', () => {
                        if (window.imApp.openGroupDetails) {
                            window.imApp.openGroupDetails(friend);
                        }
                    });
                }
            }
            
            // Re-bind menuBtn properly for chat settings (whether single or group if needed, but per request it's mainly single chat setting missing)
            if (menuBtn && friend.type !== 'group') {
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

                        if (window.openView) {
                            window.openView(chatSettingsSheet);
                        } else {
                            chatSettingsSheet.style.display = 'flex';
                            setTimeout(() => {
                                chatSettingsSheet.style.opacity = '1';
                                const bottomSheet = chatSettingsSheet.querySelector('.bottom-sheet');
                                if(bottomSheet) bottomSheet.style.transform = 'translateY(0)';
                            }, 10);
                        }
                        
                        if(window.imApp.initChatSettingsForFriend) window.imApp.initChatSettingsForFriend(friend);
                    }
                });
            }

            const input = page.querySelector('.chat-input');
            const sendBtn = page.querySelector('.send-btn');
            const micBtn = page.querySelector('.mic-btn');
            const plusBtn = page.querySelector('.plus-btn');
            const msgContainer = page.querySelector('.ins-chat-messages');

            if (plusBtn) {
                plusBtn.addEventListener('click', () => {
                    if (window.imApp.openAttachmentSheet) {
                        window.imApp.openAttachmentSheet();
                    }
                });
            }

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
             ensureTransferDetailOverlayForExistingPage(page, friend);
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

        styleTag.innerHTML = '';
    }
    window.imApp.applyFriendStatusBarCss = applyFriendStatusBarCss;

    function renderStatusBarHistory(friend, container) {
        container.innerHTML = '';

        const page = container.closest('.active-chat-interface');
        const pager = page ? page.querySelector('.chat-status-bar-pager') : null;

        const uiState = getStatusBarUiState(friend);

        if (!friend.statusBar || !friend.statusBar.history || friend.statusBar.history.length === 0) {
            const emptySlide = document.createElement('div');
            emptySlide.className = 'status-card-slide';
            emptySlide.style.flex = '0 0 100%';
            emptySlide.style.width = '100%';
            emptySlide.style.display = 'flex';
            emptySlide.style.justifyContent = 'center';
            emptySlide.style.padding = '0 16px';
            emptySlide.style.boxSizing = 'border-box';
            emptySlide.style.scrollSnapAlign = 'start';
            emptySlide.style.scrollSnapStop = 'always';

            const emptyEl = document.createElement('div');
            emptyEl.className = 'status-card-custom';
            emptyEl.style.width = '300px';
            emptyEl.style.maxWidth = '100%';
            emptyEl.textContent = '暂无状态记录';

            emptySlide.appendChild(emptyEl);
            container.appendChild(emptySlide);
            setStatusBarPage(friend, 0);
            syncStatusBarView(friend, container, { scroll: true, instant: true });
            return;
        }

        friend.statusBar.history.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'status-card-slide';
            slide.style.flex = '0 0 100%';
            slide.style.width = '100%';
            slide.style.display = 'flex';
            slide.style.justifyContent = 'center';
            slide.style.padding = '0 16px';
            slide.style.boxSizing = 'border-box';
            slide.style.scrollSnapAlign = 'start';
            slide.style.scrollSnapStop = 'always';

            const card = document.createElement('div');
            card.className = 'status-card-custom';
            card.style.width = '300px';
            card.style.maxWidth = '100%';
            card.style.padding = '0';
            card.style.position = 'relative';
            card.style.overflow = 'hidden';
            card.style.background = '#fff';
            card.style.borderRadius = '16px';

            let statusData = null;
            let isJson = false;
            try {
                let cleanText = item.text.trim();
                if (cleanText.startsWith('```json')) {
                    cleanText = cleanText.substring(7);
                } else if (cleanText.startsWith('```')) {
                    cleanText = cleanText.substring(3);
                }
                if (cleanText.endsWith('```')) {
                    cleanText = cleanText.substring(0, cleanText.length - 3);
                }
                cleanText = cleanText.trim();

                statusData = JSON.parse(cleanText);
                isJson = typeof statusData === 'object' && statusData !== null;
            } catch(e) {
                console.warn('Status Bar JSON parse failed:', e, item.text);
                isJson = false;
            }

            if (isJson) {
                const snapshotType = item.type === 'icity' ? 'icity' : (item.type === 'ins' ? 'ins' : getStatusBarType(friend));
                const snapshotStyle = typeof item.styleSnapshot === 'string' ? item.styleSnapshot : ((friend.statusBar && friend.statusBar.style) || '');
                const cardSnapshotId = `${friend.id}-${item.id || index}`;
                const text = getStatusBarMainText(statusData);
                const img = statusData.img || `https://picsum.photos/seed/${snapshotType === 'icity' ? 'icity' : 'vibe'}/300/300${snapshotType === 'icity' ? '?grayscale' : ''}`;
                const loc = statusData.loc || '';
                const thought = getThoughtText(statusData);
                const comments = getStatusBarComments(statusData);
                const uName = friend.nickname || 'user';
                const uAvatar = friend.avatarUrl || 'https://picsum.photos/seed/char/100/100';

                if (snapshotType === 'icity') {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hour = String(now.getHours()).padStart(2, '0');
                    const minute = String(now.getMinutes()).padStart(2, '0');
                    const earthDays = Math.max(
                        1,
                        Math.floor((now.getTime() - new Date(2005, 2, 14).getTime()) / 86400000)
                    );
                    const commentListHtml = comments.length > 0
                        ? comments.map(commentItem => `
                            <div style="display:flex; align-items:flex-start; padding-bottom:8px;">
                                <img src="${uAvatar}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; margin-right:10px; border:1px solid #eee;">
                                <div style="flex:1;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <div style="font-weight:700; font-size:13px; color:#000;">${commentItem.user || 'friend'}</div>
                                        <div style="color:#c0c0c0; font-size:11px; display:flex; align-items:center;">
                                            <span style="margin-right:4px; font-size:11px;">🕒</span> 刚刚 <span style="margin-left:10px; font-size:14px; transform:translateY(-2px);">⋮</span>
                                        </div>
                                    </div>
                                    <div style="font-size:14px; color:#111; font-weight:500; line-height:1.55;">
                                        ${commentItem.text || '想给你留一句话。'}
                                    </div>
                                </div>
                            </div>
                        `).join('')
                        : `
                            <div style="display:flex; align-items:flex-start; padding-bottom:8px;">
                                <img src="${uAvatar}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; margin-right:10px; border:1px solid #eee;">
                                <div style="flex:1;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <div style="font-weight:700; font-size:13px; color:#000;">路过的人</div>
                                        <div style="color:#c0c0c0; font-size:11px;">刚刚</div>
                                    </div>
                                    <div style="font-size:14px; color:#111; font-weight:500; line-height:1.55;">
                                        留下一张安静的小纸条。
                                    </div>
                                </div>
                            </div>
                        `;

                    card.innerHTML = `
                        <div class="status-card-shell">
                            <div style="display:flex; align-items:center; justify-content:center; padding:14px 16px; border-bottom:1px solid #f5f5f5; position:relative;">
                                <div style="position:absolute; left:16px; color:#999; font-size:20px; font-weight:300; transform:scaleY(1.2);">&#8249;</div>
                                <div style="font-weight:600; font-size:15px; color:#111;">${uName} · 日记</div>
                            </div>
                            <div style="padding:16px;">
                                <div style="display:flex; align-items:center; margin-bottom:14px;">
                                    <img src="${uAvatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; margin-right:12px; border:1px solid #eee;">
                                    <div style="display:flex; flex-direction:column; justify-content:center;">
                                        <div style="font-weight:700; font-size:15px; color:#000; margin-bottom:2px;">${uName}</div>
                                        <div style="color:#a0a0a0; font-size:13px;">@${String(uName).replace(/\s+/g, '').toLowerCase() || 'icity'}</div>
                                    </div>
                                </div>
                                <div style="font-size:16px; line-height:1.65; font-weight:500; margin-bottom:16px; color:#1a1a1a;">
                                    ${text || thought}
                                </div>
                                <div style="color:#c0c0c0; font-size:12px; margin-bottom:18px; display:flex; align-items:center; font-weight:400;">
                                    <span style="margin-right:4px; font-size:12px;">🕒</span> ${year}-${month}-${day} ${hour}:${minute}${loc ? ` <span style="margin:0 6px;">|</span> ${loc}` : ''} <span style="margin:0 6px;">|</span> 来到地球第 <b style="font-weight:600;">${earthDays}</b> 天
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f5f5f5; padding-bottom:16px; margin-bottom:16px;">
                                    <div class="like-btn" style="color:#a0a0a0; font-size:13px; display:flex; align-items:center; cursor:pointer; transition:all 0.2s;">
                                        <span class="like-icon" style="margin-right:6px; font-size:15px;">♡</span> 喜欢
                                    </div>
                                    <div style="color:#a0a0a0; font-size:13px; display:flex; align-items:center;">
                                        <span style="margin-right:6px; font-size:15px;">⚑</span> 小纸条
                                    </div>
                                    <div style="color:#a0a0a0; font-size:13px; display:flex; align-items:center;">
                                        <span style="margin-right:6px; font-size:15px;">⎘</span> 存为图片
                                    </div>
                                    <div style="color:#a0a0a0; font-size:13px; display:flex; align-items:center;">
                                        <span style="font-size:16px; letter-spacing:1px;">•••</span>
                                    </div>
                                </div>
                                <div style="color:#a0a0a0; font-size:13px; margin-bottom:16px; display:flex; align-items:center;">
                                    <span style="margin-right:6px; font-size:14px;">💬</span> ${comments.length || 1} 条评论 <span style="margin-left:6px; font-size:10px; transform:scale(1.5, 1);">⌄</span>
                                </div>
                                ${commentListHtml}
                            </div>
                        </div>
                    `;

                    let isLiked = false;
                    const likeBtn = card.querySelector('.like-btn');
                    const likeIcon = card.querySelector('.like-icon');

                    const toggleLike = (e) => {
                        if (e) e.stopPropagation();
                        isLiked = !isLiked;
                        if (isLiked) {
                            likeBtn.style.color = '#ff5a5f';
                            likeBtn.style.transform = 'scale(1.08)';
                            likeIcon.textContent = '❤️';
                            setTimeout(() => likeBtn.style.transform = 'scale(1)', 200);
                        } else {
                            likeBtn.style.color = '#a0a0a0';
                            likeIcon.textContent = '♡';
                        }
                    };

                    if (likeBtn) likeBtn.addEventListener('click', toggleLike);

                    applyStatusCardSnapshotStyle(card, cardSnapshotId, snapshotStyle);
                } else {
                    const comment = comments[0] ? comments[0].text : '';
                    const commentUser = comments[0] ? (comments[0].user || 'friend') : '';

                    card.innerHTML = `
                        <div class="status-card-shell">
                            <!-- 顶部导航 -->
                            <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #fafafa; background: #fff;">
                                <div style="font-family:'Grand Hotel', cursive, sans-serif; font-size:24px; letter-spacing:0.5px;">Instagram</div>
                                <div style="display:flex; gap:16px;">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </div>
                            </div>
                            <!-- 用户信息 -->
                            <div style="padding:12px 16px; display:flex; align-items:center; justify-content:space-between; background: #fff;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <div style="padding:2px; background:linear-gradient(45deg, #d6249f, #285AEB); border-radius:50%;">
                                        <img src="${uAvatar}" style="width:34px; height:34px; border-radius:50%; border:2px solid #fff; display:block; object-fit:cover;">
                                    </div>
                                    <div>
                                        <div style="font-weight:600; font-size:13px; letter-spacing:0.3px; color:#262626;">${uName}</div>
                                        ${loc ? `<div style="font-size:11px; color:#999; letter-spacing:0.2px;">${loc}</div>` : ''}
                                    </div>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                            </div>
                            <!-- 图片区域 -->
                            <div class="post-img-area status-card-image-hit">
                                <div class="status-card-media-flip">
                                    <div class="status-card-media-face status-card-media-front" style="position:relative; width:300px; height:300px; background:#f8f8f8; overflow:hidden;">
                                        <img src="${img}" style="width:100%; height:100%; object-fit:cover; transition:opacity 0.4s ease;">
                                        <div class="big-heart" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0); transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity:0; pointer-events:none;">
                                            <svg width="90" height="90" viewBox="0 0 24 24" fill="white" stroke="none" style="filter:drop-shadow(0 5px 15px rgba(0,0,0,0.2));"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                                        </div>
                                    </div>
                                    <div class="status-card-media-face status-card-media-back">
                                        <div class="status-card-thought-wrap">
                                            <div class="status-card-thought-label">心声</div>
                                            <div class="status-card-thought-text">${thought}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- 操作栏 -->
                            <div style="padding:12px 16px 8px; display:flex; justify-content:space-between; background: #fff;">
                                <div style="display:flex; gap:16px;">
                                    <div class="like-btn" style="cursor:pointer; transition:transform 0.2s;">
                                        <svg class="like-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                                    </div>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </div>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            <!-- 文字内容 -->
                            <div style="padding:0 16px 16px; text-align:left; background: #fff;">
                                <div style="font-weight:600; font-size:13px; margin-bottom:6px; color:#262626;">Liked by <span class="like-count">others</span></div>
                                <div style="font-size:13px; line-height:1.4; margin-bottom:8px; color:#262626; word-break:break-word;">
                                    <span style="font-weight:600; margin-right:6px;">${uName}</span>
                                    <span>${text}</span>
                                </div>
                                ${comment ? `
                                <div style="color:#999; font-size:13px; margin-bottom:6px; cursor:pointer;">View all comments</div>
                                <div style="font-size:13px; color:#262626; word-break:break-word;">
                                    <span style="font-weight:600; margin-right:6px;">${commentUser}</span>
                                    <span>${comment}</span>
                                </div>
                                ` : ''}
                                <div style="color:#aaa; font-size:10px; margin-top:8px; letter-spacing:0.5px; text-transform:uppercase;">JUST NOW</div>
                            </div>
                        </div>
                    `;

                    let isLiked = false;
                    const postImgArea = card.querySelector('.post-img-area');
                    const likeBtn = card.querySelector('.like-btn');
                    const likeIcon = card.querySelector('.like-icon');
                    const bigHeart = card.querySelector('.big-heart');
                    const likeCount = card.querySelector('.like-count');

                    const toggleLike = (e) => {
                        if (e) e.stopPropagation();
                        isLiked = !isLiked;
                        if(isLiked) {
                            likeIcon.setAttribute('fill', '#ed4956');
                            likeIcon.setAttribute('stroke', '#ed4956');
                            likeBtn.style.transform = "scale(1.1)";
                            setTimeout(() => likeBtn.style.transform = "scale(1)", 200);

                            bigHeart.style.opacity = "0.9";
                            bigHeart.style.transform = "translate(-50%, -50%) scale(1.1)";
                            setTimeout(() => {
                                bigHeart.style.opacity = "0";
                                bigHeart.style.transform = "translate(-50%, -50%) scale(0)";
                            }, 800);

                            likeCount.innerText = "you and others";
                        } else {
                            likeIcon.setAttribute('fill', 'none');
                            likeIcon.setAttribute('stroke', '#262626');
                            likeCount.innerText = "others";
                        }
                    };

                    likeBtn.addEventListener('click', toggleLike);
                    postImgArea.addEventListener('dblclick', toggleLike);
                    postImgArea.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggleStatusBarThought(friend, container, index);
                    });

                    applyStatusCardSnapshotStyle(card, cardSnapshotId, snapshotStyle);
                }
            } else {
                const uName = friend.nickname || 'user';
                const uAvatar = friend.avatarUrl || 'https://picsum.photos/seed/char/100/100';

                card.innerHTML = `
                    <div style="padding:12px 16px; display:flex; align-items:center; gap:10px; border-bottom:1px solid #fafafa; background: #fff;">
                        <img src="${uAvatar}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                        <div style="font-weight:600; font-size:13px; color:#262626;">${uName}</div>
                    </div>
                    <div style="padding: 20px 16px; min-height: 100px; display: flex; align-items: center; justify-content: center; background: #fff;">
                        <div style="width: 100%; word-break: break-word; text-align: center; color: #262626; font-size: 14px; line-height: 1.5;">
                            ${item.text.replace(/\|/g, '<br>')}
                        </div>
                    </div>
                `;
            }

            const actionsEl = document.createElement('div');
            actionsEl.style.position = 'absolute';
            actionsEl.style.top = '12px';
            actionsEl.style.right = '12px';
            actionsEl.style.display = 'flex';
            actionsEl.style.gap = '12px';
            actionsEl.style.opacity = '0';
            actionsEl.style.transition = 'opacity 0.2s';
            actionsEl.style.background = 'rgba(255,255,255,0.8)';
            actionsEl.style.padding = '4px 8px';
            actionsEl.style.borderRadius = '12px';
            actionsEl.style.zIndex = '10';

            card.addEventListener('mouseenter', () => actionsEl.style.opacity = '1');
            card.addEventListener('mouseleave', () => actionsEl.style.opacity = '0');

            const editBtn = document.createElement('i');
            editBtn.className = 'fas fa-edit';
            editBtn.style.cursor = 'pointer';
            editBtn.style.fontSize = '14px';
            editBtn.style.color = '#333';

            const delBtn = document.createElement('i');
            delBtn.className = 'fas fa-times';
            delBtn.style.cursor = 'pointer';
            delBtn.style.fontSize = '14px';
            delBtn.style.color = '#ff3b30';

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(window.showCustomModal) {
                    const currentText = isJson ? getStatusBarMainText(statusData) : item.text;

                    window.showCustomModal({
                        type: 'prompt',
                        title: '编辑心声',
                        placeholder: '修改心声内容...',
                        confirmText: '保存',
                        onConfirm: (newVal) => {
                            if (newVal !== null && newVal.trim() !== '') {
                                if (isJson) {
                                    const newData = { ...statusData };
                                    newData.text = newVal;
                                    newData.thought = newVal; 
                                    friend.statusBar.history[index].text = JSON.stringify(newData);
                                } else {
                                    friend.statusBar.history[index].text = newVal;
                                }
                                if(window.imApp.saveFriends) window.imApp.saveFriends();
                                renderStatusBarHistory(friend, container);
                            }
                        }
                    });
                    setTimeout(() => {
                        const input = document.getElementById('modal-input');
                        if(input) {
                            input.value = currentText;
                        }
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
            card.appendChild(actionsEl);

            slide.appendChild(card);
            container.appendChild(slide);
        });

        setStatusBarPage(friend, uiState.currentPage || 0);
        syncStatusBarView(friend, container, { scroll: true, instant: true });
    }

    function getGroupMemberFriends(group) {
        if (!group || group.type !== 'group' || !Array.isArray(group.members)) return [];
        return group.members
            .map(memberRef => {
                return window.imData.friends.find(item => {
                    if (!item || item.type === 'group') return false;
                    return String(item.id) === String(memberRef) || item.nickname === memberRef;
                });
            })
            .filter(Boolean);
    }

    function normalizeGroupSpeaker(group, rawSpeakerName) {
        if (!group || group.type !== 'group' || !rawSpeakerName) return null;
        const safeName = String(rawSpeakerName).trim();
        if (!safeName) return null;

        const groupMembers = getGroupMemberFriends(group);
        if (groupMembers.length === 0) return null;

        const exactMatch = groupMembers.find(member => member.nickname === safeName);
        if (exactMatch) return exactMatch;

        const normalizedTarget = safeName.toLowerCase();
        const fuzzyMatch = groupMembers.find(member => String(member.nickname || '').trim().toLowerCase() === normalizedTarget);
        return fuzzyMatch || null;
    }

    function getSafeGroupSpeaker(group, preferredSpeakerName = null) {
        const normalized = normalizeGroupSpeaker(group, preferredSpeakerName);
        if (normalized) return normalized;

        const members = getGroupMemberFriends(group);
        return members.length > 0 ? members[0] : null;
    }

    function createMessageId(prefix = 'msg') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function ensureMessageId(msg, prefix = 'msg') {
        if (!msg || typeof msg !== 'object') return '';
        if (!msg.id) msg.id = createMessageId(prefix);
        return msg.id;
    }

    function renderChatHistory(friend, container) {
        let lastTime = 0;
            if (friend.messages && friend.messages.length > 0) {
                friend.messages.forEach(msg => {
                    ensureMessageId(msg, msg.type === 'pay_transfer' ? 'pay' : 'msg');
                    const msgTime = msg.timestamp || 0;
                    if (msgTime - lastTime > 300000) { 
                        renderTimestamp(msgTime, container);
                        lastTime = msgTime;
                    }
                    
                    if (msg.type === 'moment_forward') {
                        renderMomentForwardBubble(msg, friend, container, msgTime);
                    } else if (msg.type === 'image') {
                        renderImageBubble(msg, friend, container, msgTime);
                    } else if (msg.type === 'pay_transfer') {
                        renderPayTransferBubble(msg, friend, container, msgTime);
                    } else if (msg.role === 'user') {
                        renderUserBubble(msg.content, container, msgTime, msg.replyTo, msg.translation, msg.showTranslation, msg.id);
                    } else if (msg.role === 'assistant') {
                        let safeSpeakerName = msg.speaker || null;
                        let speakerAvatar = null;

                        if (friend.type === 'group') {
                            const safeSpeaker = getSafeGroupSpeaker(friend, msg.speaker);
                            if (safeSpeaker) {
                                safeSpeakerName = safeSpeaker.nickname;
                                speakerAvatar = safeSpeaker.avatarUrl || null;
                            } else {
                                safeSpeakerName = null;
                            }
                        }

                        renderAiBubble(msg.content, friend, container, msgTime, msg.translation, msg.showTranslation, msg.replyTo, safeSpeakerName, speakerAvatar, msg.id);
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

    function renderUserBubble(text, container, timestamp = Date.now(), replyTo = null, translation = null, showTranslation = false, messageId = null) {
        const lastRow = container.lastElementChild;
        let hasPrev = false;
        if (lastRow && lastRow.classList.contains('user-row')) {
            hasPrev = true;
            lastRow.classList.add('has-next');
        }

        const row = document.createElement('div');
        row.className = `chat-row user-row ${hasPrev ? 'has-prev' : ''}`;
        row.setAttribute('data-timestamp', timestamp);
        row.setAttribute('data-message-id', messageId || createMessageId('msg'));
        
        let contentHtml = '';
        if (replyTo) {
            contentHtml += `<div class="msg-reply-quote" style="font-size: 13px; color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 14px; margin-bottom: 8px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${replyTo}</div>`;
        }
        contentHtml += text;
        if (translation && showTranslation) {
            contentHtml += `<div class="msg-translation" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.4; word-wrap: break-word; white-space: normal;">${translation}</div>`;
        }

        const date = new Date(timestamp);
        const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        contentHtml += `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span><i class="fas fa-check-double bubble-read-icon"></i></span>`;

        row.innerHTML = `
            <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
            </div>
            <div style="flex: 1; display: flex; justify-content: flex-end; align-items: flex-end; min-width: 0;">
                <div class="chat-bubble user-bubble">${contentHtml}</div>
            </div>
        `;
        container.appendChild(row);
        scrollToBottom(container);
    }

    function renderAiBubble(text, friend, container, timestamp = Date.now(), translation = null, showTranslation = false, replyTo = null, speakerName = null, speakerAvatar = null, messageId = null) {
        const rows = Array.from(container.children).filter(el => !el.classList.contains('chat-timestamp') && !el.classList.contains('typing-row'));
        const lastRow = rows.length > 0 ? rows[rows.length - 1] : null;
        const isGroupMessage = friend.type === 'group' && !!speakerName;
        let hasPrev = false;
        let sameSpeaker = false;

        if (lastRow && lastRow.classList.contains('ai-row')) {
            const prevSpeaker = lastRow.getAttribute('data-speaker') || null;
            if (isGroupMessage) {
                if (prevSpeaker === speakerName) {
                    hasPrev = true;
                    sameSpeaker = true;
                    lastRow.classList.add('has-next');
                }
            } else if (!prevSpeaker) {
                hasPrev = true;
                sameSpeaker = true;
                lastRow.classList.add('has-next');
            }
        }

        const row = document.createElement('div');
        row.className = `chat-row ai-row ${hasPrev ? 'has-prev' : ''} ${isGroupMessage ? 'group-ai-row' : ''} ${isGroupMessage && sameSpeaker ? 'group-ai-row-continuous' : ''}`;
        row.setAttribute('data-timestamp', timestamp);
        row.setAttribute('data-message-id', messageId || createMessageId('msg'));
        if (speakerName) {
            row.setAttribute('data-speaker', speakerName);
        }
        
        let contentHtml = '';
        if (replyTo) {
            contentHtml += `<div class="msg-reply-quote" style="font-size: 13px; color: rgba(0,0,0,0.6); background: rgba(0,0,0,0.05); padding: 8px 12px; border-radius: 14px; margin-bottom: 8px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${replyTo}</div>`;
        }
        contentHtml += text;
        if (translation && showTranslation) {
            contentHtml += `<div class="msg-translation" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 13px; color: #8e8e93; line-height: 1.4; word-wrap: break-word; white-space: normal;">${translation}</div>`;
        }
        
        const date = new Date(timestamp);
        const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        contentHtml += `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span></span>`;

        let bubbleWrapperHtml = '';
        if (isGroupMessage) {
            const avatarInitial = String(speakerName).trim().charAt(0) || '?';
            const avatarImg = speakerAvatar
                ? `<img src="${speakerAvatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">`
                : `<div class="chat-avatar-small">${avatarInitial}</div>`;

            bubbleWrapperHtml = `
                <div class="group-ai-bubble-wrap">
                    ${sameSpeaker ? '' : `<div class="group-ai-speaker-name">${speakerName}</div>`}
                    <div class="group-ai-bubble-row">
                        <div class="group-ai-avatar-slot">${sameSpeaker ? '<div class="group-ai-avatar-placeholder"></div>' : avatarImg}</div>
                        <div class="chat-bubble ai-bubble">${contentHtml}</div>
                    </div>
                </div>
            `;
        } else {
            bubbleWrapperHtml = `<div class="chat-bubble ai-bubble">${contentHtml}</div>`;
        }

        row.innerHTML = `
            <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
            </div>
            <div style="flex: 1; display: flex; justify-content: flex-start; align-items: flex-end; min-width: 0;">
                ${bubbleWrapperHtml}
            </div>
        `;
        container.appendChild(row);
        scrollToBottom(container);
    }

    function renderImageBubble(msg, friend, container, timestamp = Date.now()) {
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
        row.setAttribute('data-timestamp', timestamp);
        row.setAttribute('data-message-id', ensureMessageId(msg, 'img'));
        
        // Use a standard max-width constraint with padding for the bubble
        const contentHtml = `
            <img src="${msg.content}" style="max-width: 200px; max-height: 300px; border-radius: 12px; object-fit: cover; display: block; background: #e5e5ea;">
        `;

        const date = new Date(timestamp);
        const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        if (isUser) {
            let metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span><i class="fas fa-check-double bubble-read-icon"></i></span>`;
            row.innerHTML = `
                <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                    <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-end; align-items: flex-end; min-width: 0;">
                    <div class="chat-bubble user-bubble" style="padding: 4px;">${contentHtml}${metaHtml}</div>
                </div>
            `;
        } else {
            let metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span></span>`;
            row.innerHTML = `
                <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                    <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-start; align-items: flex-end; min-width: 0;">
                    <div class="chat-bubble ai-bubble" style="padding: 4px;">${contentHtml}${metaHtml}</div>
                </div>
            `;
        }

        container.appendChild(row);
        scrollToBottom(container);
    }

    function claimIncomingTransfer(friend, msg) {
        if (!friend || !msg || msg.payKind !== 'char_to_user_pending' || msg.claimed) return;

        const amount = Number(msg.amount) || 0;
        const description = msg.description || '转账';
        const senderName = friend.nickname || friend.realName || '对方';
        const receiverName = userState.name || '你';

        if (amount <= 0) {
            if (window.showToast) window.showToast('金额无效');
            return;
        }

        const activeFriend = window.imData.currentActiveFriend;
        const activePage = document.getElementById(`chat-interface-${friend.id}`);
        const activeContainer = activePage ? activePage.querySelector('.ins-chat-messages') : null;
        const existingRow = activeContainer && msg.id
            ? activeContainer.querySelector(`.chat-row[data-message-id="${msg.id}"]`)
            : null;

        const incomeSuccess = typeof window.addPayTransaction === 'function'
            ? window.addPayTransaction(
                amount,
                `${description} · ${senderName}`,
                'income'
            )
            : false;

        if (!incomeSuccess) {
            if (window.showToast) window.showToast('收款失败');
            return;
        }

        msg.claimed = true;
        msg.payKind = 'char_to_user_claimed';
        msg.cardTitle = `${receiverName}已收款`;
        msg.targetName = senderName;
        msg.content = `[对方转账已领取] ${description} ¥${amount.toFixed(2)}`;

        const receiveTimestamp = Date.now();
        const receiveMsg = {
            id: createMessageId('pay'),
            role: 'user',
            type: 'pay_transfer',
            payKind: 'user_received_from_char',
            amount,
            description,
            targetName: senderName,
            cardTitle: '收款',
            payStatus: 'completed',
            content: `[收款] ${description} ¥${amount.toFixed(2)}`,
            timestamp: receiveTimestamp
        };

        if (!friend.messages) friend.messages = [];
        friend.messages.push(receiveMsg);

        if (activeFriend && String(activeFriend.id) === String(friend.id) && activeContainer) {
            if (existingRow) {
                const replaceHost = document.createElement('div');
                renderPayTransferBubble(msg, friend, replaceHost, msg.timestamp || receiveTimestamp);
                const updatedClaimedRow = replaceHost.querySelector('.chat-row');

                if (updatedClaimedRow) {
                    existingRow.replaceWith(updatedClaimedRow);
                }

                const appendHost = document.createElement('div');
                const lastMsgBeforeReceive = friend.messages.length > 1 ? friend.messages[friend.messages.length - 2] : null;

                if (!lastMsgBeforeReceive || (receiveTimestamp - (lastMsgBeforeReceive.timestamp || 0) > 300000)) {
                    renderTimestamp(receiveTimestamp, appendHost);
                }

                renderPayTransferBubble(receiveMsg, friend, appendHost, receiveTimestamp);

                while (appendHost.firstChild) {
                    activeContainer.appendChild(appendHost.firstChild);
                }

                scrollToBottom(activeContainer);
            } else {
                activeContainer.innerHTML = '';
                renderChatHistory(friend, activeContainer);
                scrollToBottom(activeContainer);
            }
        }

        if (window.imApp.saveFriends) window.imApp.saveFriends();
    }

    function renderPayTransferBubble(msg, friend, container, timestamp = Date.now()) {
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
        row.setAttribute('data-timestamp', timestamp);
        row.setAttribute('data-message-id', ensureMessageId(msg, 'pay'));

        const amount = Number(msg.amount) || 0;
        const amountText = `¥${amount.toFixed(2)}`;
        const description = msg.description || '转账';
        const targetName = msg.targetName || (friend.nickname || '对方');
        const payKind = msg.payKind || (isUser ? 'user_to_char' : 'char_received');

        let cardTitle = msg.cardTitle || 'Pay 转账';
        let subtitle = `向 ${targetName} 转账`;
        let extraClass = '';

        if (payKind === 'char_received') {
            cardTitle = msg.cardTitle || '收款';
            subtitle = `来自 ${targetName}`;
            extraClass = ' is-received';
        } else if (payKind === 'char_to_user_pending') {
            cardTitle = msg.cardTitle || '转账';
            subtitle = `${targetName} 向你转账`;
            extraClass = ' is-pending';
        } else if (payKind === 'char_to_user_claimed') {
            cardTitle = msg.cardTitle || `${userState.name || '你'}已收款`;
            subtitle = `${targetName} 的转账已领取`;
            extraClass = ' is-income';
        } else if (payKind === 'user_received_from_char') {
            cardTitle = msg.cardTitle || '收款';
            subtitle = `已领取 ${targetName} 的转账`;
            extraClass = ' is-income';
        }

        const contentHtml = `
            <div class="pay-transfer-card${extraClass}">
                <div class="pay-transfer-card-top">
                    <div class="pay-transfer-card-icon"><i class="fas fa-wallet"></i></div>
                    <div class="pay-transfer-card-meta">
                        <div class="pay-transfer-card-title">${cardTitle}</div>
                        <div class="pay-transfer-card-subtitle">${subtitle}</div>
                    </div>
                </div>
                <div class="pay-transfer-card-amount">${amountText}</div>
                <div class="pay-transfer-card-desc">${description}</div>
            </div>
        `;

        const date = new Date(timestamp);
        const timeStr = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

        if (isUser) {
            const metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span><i class="fas fa-check-double bubble-read-icon"></i></span>`;
            row.innerHTML = `
                <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                    <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-end; align-items: flex-end; min-width: 0;">
                    <div class="chat-bubble user-bubble pay-transfer-bubble">${contentHtml}${metaHtml}</div>
                </div>
            `;
        } else {
            const metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span></span>`;
            row.innerHTML = `
                <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                    <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-start; align-items: flex-end; min-width: 0;">
                    <div class="chat-bubble ai-bubble pay-transfer-bubble">${contentHtml}${metaHtml}</div>
                </div>
            `;
        }

        container.appendChild(row);

        if (!isUser && payKind === 'char_to_user_pending') {
            const clickableBubble = row.querySelector('.chat-bubble.pay-transfer-bubble') || row.querySelector('.pay-transfer-card');
            if (clickableBubble) {
                clickableBubble.style.cursor = 'pointer';
                clickableBubble.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const activePage = container.closest('.active-chat-interface');
                    if (!activePage) {
                        if (window.showToast) window.showToast('未找到聊天页面');
                        return;
                    }

                    if (!activePage._openTransferDetailOverlay) {
                        ensureTransferDetailOverlayForExistingPage(activePage, friend);
                    }

                    if (activePage._openTransferDetailOverlay) {
                        activePage._openTransferDetailOverlay(msg);
                    } else if (window.showToast) {
                        window.showToast('详情卡片初始化失败');
                    }
                });
            }
        }

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
        row.setAttribute('data-message-id', ensureMessageId(msg, 'moment'));
        
        const hasImg = !!momentData.img;
        let mediaHtml = '';
        if (hasImg) {
            mediaHtml = `<img src="${momentData.img}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.5);">`;
        } else {
             mediaHtml = `<div style="width: 40px; height: 40px; border-radius: 4px; background: #f2f2f7; display: flex; align-items: center; justify-content: center; color: #666; font-size: 10px; padding: 4px; overflow: hidden; text-align: left; line-height: 1.2; flex-shrink: 0; word-break: break-all;">${(momentData.text || '').substring(0, 8)}...</div>`;
        }
        
        const contentHtml = `
            <div style="display: flex; flex-direction: column; gap: 6px; cursor: pointer; text-align: left;">
                <div style="font-size: 12px; opacity: 0.8; margin-bottom: 2px;">分享了一条朋友圈</div>
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
            row.innerHTML = `
                <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                    <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-end; align-items: flex-end; min-width: 0;">
                    <div class="chat-bubble user-bubble moment-forward-bubble">${contentHtml}${metaHtml}</div>
                </div>
            `;
        } else {
            let metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span></span>`;
            row.innerHTML = `
                <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                    <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-start; align-items: flex-end; min-width: 0;">
                    <div class="chat-bubble ai-bubble moment-forward-bubble">${contentHtml}${metaHtml}</div>
                </div>
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

        const replyToText = window.imData.currentReplyText || null;

        const msgObj = {
            id: createMessageId('msg'),
            role: 'user',
            content: text,
            timestamp: now,
            replyTo: replyToText
        };

        renderUserBubble(text, container, now, replyToText, null, false, msgObj.id);
        inputEl.value = '';

        if (!friend.messages) friend.messages = [];
        friend.messages.push(msgObj);
        if(window.imApp.saveFriends) window.imApp.saveFriends();

        window.imData.currentReplyText = null;
        const page = document.getElementById(`chat-interface-${friend.id}`);
        if (page) {
            const preview = page.querySelector('.reply-preview-container');
            if (preview) preview.style.display = 'none';
        }
    }

    function extractTaggedBlock(text, tagName) {
        if (!text || !tagName) return null;
        const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        const match = String(text).match(regex);
        return match ? match[1].trim() : null;
    }

    function removeTaggedBlock(text, tagName) {
        if (!text || !tagName) return text;
        const regex = new RegExp(`<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'i');
        return String(text).replace(regex, '').trim();
    }

    function parseJsonArrayFromText(rawText) {
        if (!rawText || typeof rawText !== 'string') return null;
        let cleanText = rawText.trim();

        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }

        cleanText = cleanText.trim();
        if (!cleanText) return null;

        try {
            const parsed = JSON.parse(cleanText);
            return Array.isArray(parsed) ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    async function handleAiReply(friend, container, btnEl) {
        if (!apiConfig.endpoint || !apiConfig.apiKey) {
            if(window.showToast) window.showToast('请先在设置中配置 API');
            return;
        }

        const typingRow = document.createElement('div');
        typingRow.className = 'chat-row ai-row typing-row';
        typingRow.innerHTML = `
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
            
        const commonMemorySections = [
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

        const statusBarRequirement = (friend.statusBar && friend.statusBar.enabled)
            ? (getStatusBarType(friend) === 'icity'
                ? `\n\nStatus Bar Requirement:\n- 本次回复必须且只能额外生成 1 个当下状态栏\n- 状态栏内容必须使用 <status> 和 </status> 包裹\n- <status> 内必须是合法 JSON，不能有 markdown 代码块，不能有额外解释文字\n- JSON 必须包含以下字段：text、loc、thought、comments\n- text 必须是 50-100 字的心声正文，严格结合当前聊天上下文体现当前内心想法，user的话对你产生了什么情绪？\n- thought 必须是 50-100 字，使用第一人称，像日记里的内心独白\n- comments 必须是 1-2 条评论，格式为 [{"user":"评论人","text":"评论内容"}]\n- comments 中的评论必须和当前聊天上下文有关，像真的有人看完会留下的小纸条\n- 除聊天气泡正文外，你必须输出 1 个状态栏，禁止省略`
                : `\n\nStatus Bar Requirement:\n- 本次回复必须且只能额外生成 1 个当下状态栏\n- 状态栏内容必须使用 <status> 和 </status> 包裹\n- <status> 内必须是合法 JSON，不能有 markdown 代码块，不能有额外解释文字\n- JSON 必须包含以下字段：text、img、loc、comment、commentUser、thought\n- text 必须体现你此刻基于聊天上下文的内心想法/状态\n- thought 必须是 50-100 字，使用第一人称，严格基于你的人设与当前聊天上下文，描述你对 user 的想法与感受\n- comment 和 commentUser 必须和当前聊天上下文有关，像是真的有人会对这条动态留言\n- 除聊天气泡正文外，你必须输出 1 个状态栏，禁止省略`)
            : '';

        let systemPrompt = '';
        
        if (friend.type === 'group') {
            const globalWorldBookContext = window.getGlobalWorldBookContext ? window.getGlobalWorldBookContext() : '';
            const worldbookStr = globalWorldBookContext ? `\n\nWorldbook / Background:\n${globalWorldBookContext}` : '';
            const groupMembers = getGroupMemberFriends(friend);
            const allowedSpeakerNames = groupMembers.map(member => member.nickname).filter(Boolean);
            const membersInfo = groupMembers.length > 0
                ? groupMembers.map(member => {
                    return `Name: ${member.nickname}\nPersona: ${member.persona || 'None'}\nOverview: ${member.memory?.overview || 'None'}`;
                }).join('\n\n')
                : 'None';
                
            systemPrompt = `你正在模拟一个名为 "${friend.nickname}" 的群聊。
你正在与 ${userState.name} 聊天，其人设为: ${userState.persona || '一个普通用户'}。

此群内允许发言的成员名单（除用户外）：
${membersInfo}

只允许以下这些成员发言：
${allowedSpeakerNames.length > 0 ? allowedSpeakerNames.join('、') : 'None'}${worldbookStr}

群聊特定规则：
1. 请根据上下文和群成员性格进行回复，所有群员都必须参与回复，除非群聊人数大于10人则挑选5-8人回复。
2. 每位发声的成员必须发送 2-5 条连贯的消息气泡。标点符号多用空格来代替逗号，一句话分开发成多个气泡，且语句简短。
3. 对话要具有思维流和非连续性，像真人一样可以跳跃、有顿悟、有小情绪的流露。不要机械式回答，要有群聊的插科打诨和生活感。
4. 你会在下面看到带说话人标记的最近聊天记录。你必须认真参考“谁刚刚说了什么”，不能忽略成员自己的上一轮发言，不能像失忆一样重复、改口或无缘无故换立场。
5. 同一个成员如果刚刚表达过观点、情绪、计划、态度、称呼对象，本轮继续发言时必须与其最近发言保持连续性，除非有明确的新消息让他改变想法。
6. 回复时优先承接最近几条消息中的具体对象、话题、称呼、问题和情绪，不要只对最后一条做泛泛回应。
7. 【强限制】：严禁使用名单之外的名字发言，严禁虚构新成员，严禁让 User 冒充群成员发言。
8. 【输出格式】：必须把聊天气泡放在 <chat_json> 和 </chat_json> 标签内，标签内只能是合法 JSON 数组，不能有 markdown 代码块，不能有解释文字。
9. JSON 数组中的每一个对象都严格对应“一个独立气泡”，绝对禁止把多条气泡合并到同一个 text 字段里。
10. 每个对象格式必须为 {"speaker":"成员名","text":"气泡内容","translation":"该条气泡的中文翻译或空字符串","quote":"被引用内容或空字符串"}。
11. speaker 必须且只能使用以上允许发言名单中的完整准确名字。
12. translation 只能翻译当前这一条 text；如果 text 本身是中文，translation 必须是空字符串。
13. quote 只有在你确实想引用用户或上一条消息时才填写，否则必须是空字符串。
14. 除 <chat_json> 外，不要输出任何聊天正文；若启用了状态栏，则继续额外输出 1 个 <status>...</status>。
群聊的背景与关系记忆:
${commonMemorySections || 'None'}`;

        } else {
            const globalWorldBookContext = window.getGlobalWorldBookContext ? window.getGlobalWorldBookContext() : '';

            systemPrompt = `You are playing the role of ${friend.realName || friend.nickname}. 
Your persona is: ${friend.persona || 'No specific persona'}. 
You are talking to ${userState.name}, whose persona is: ${userState.persona || 'A normal user'}.
Reply naturally as your character in a chat app.
请根据上下文，记忆，人设进行回复，一次按需求回复2-8条气泡。
强制遵循以下角色自然对话原则，模拟真人聊天的自然感：
1. 你的回复应该具有思维流和非连续性，像真人一样可以跳跃、有顿悟、有小情绪的流露，摒弃 AI 典型的“总-分-总”或机械式的应答结构，不要总是试图提供完美或完整的解答。
2. 标点符号多用空格来代替逗号，一句话会分开发成多个气泡，且语句简短。不需要对用户的每句话都进行回应，保持一定的选择性和重点。
3. 回复不完全依赖于对用户消息的直接回应，可以根据上下文和记忆中的信息进行自由发挥和创造，甚至可以引入一些新的话题或元素来丰富对话。
4. 语言风格要符合现代即时通讯软件的习惯（如简短、随性），以第一人称视角进行回复，避免过于正式或书面化的表达。
5. 如果用户刚刚给你转账，你可以选择正常文字回复，也可以额外输出 1 个支付对象表示“收下转账”；如果你想给用户转账，也可以输出 1 个支付对象表示“你向用户转账”。
6. 【输出格式】必须把聊天气泡放在 <chat_json> 和 </chat_json> 标签内，标签内只能是合法 JSON 数组，不能有 markdown 代码块，不能有解释文字。
7. JSON 数组中的每一个对象都严格对应“一个独立气泡”或“一个独立支付卡片”，绝对禁止把多条气泡合并到同一个 text 字段里。
8. 普通文本对象格式必须为 {"type":"text","text":"气泡内容","translation":"该条气泡的中文翻译或空字符串","quote":"被引用内容或空字符串"}。
9. 支付对象格式必须为 {"type":"payment","paymentAction":"receive|transfer","amount":88.88,"description":"原因或备注"}。
10. 当 paymentAction 为 receive 时，表示你收下了用户刚刚给你的钱；当 paymentAction 为 transfer 时，表示你给用户转账。
11. translation 只能翻译当前这一条 text；如果 text 本身是中文，translation 必须是空字符串。
12. quote 只有在你确实想引用用户某句消息时才填写，否则必须是空字符串。
13. 除 <chat_json> 外，不要输出任何聊天正文；若启用了状态栏，则继续额外输出 1 个 <status>...</status>。

Character Memory:
${commonMemorySections || 'None'}${globalWorldBookContext ? `\n\nGlobal World Book:\n${globalWorldBookContext}` : ''}`;
        }

        const messages = [{ role: 'system', content: systemPrompt }];
        if (friend.messages) {
            const defaultContextLimit = friend.type === 'group' ? 50 : 30;
            const contextLimit = friend.memory?.context?.enabled === false
                ? 0
                : (Number(friend.memory?.context?.limit) > 0 ? Number(friend.memory.context.limit) : defaultContextLimit);
            const recent = contextLimit > 0 ? friend.messages.slice(-contextLimit) : [];

            recent.forEach(m => {
                let apiContent = m.content;

                if (m.type === 'moment_forward') {
                    try {
                        const momentData = JSON.parse(m.content);
                        apiContent = `[分享了一条朋友圈: ${momentData.text || ''}]`;
                        if (momentData.img) apiContent += ` (附带图片)`;
                    } catch(e) {
                        apiContent = `[分享了一条朋友圈]`;
                    }
                } else if (m.type === 'image') {
                    apiContent = `[发送了一张图片: ${m.text || '无描述'}]`;
                } else if (m.type === 'pay_transfer') {
                    const payAmount = Number(m.amount) || 0;
                    const payDesc = m.description || '转账';
                    const payTarget = m.targetName || friend.nickname || '对方';

                    if (m.payKind === 'user_to_char') {
                        apiContent = `[用户刚刚向你转账 ¥${payAmount.toFixed(2)}，备注：${payDesc}，对象：${payTarget}。你可以收下这笔钱，也可以正常回复。]`;
                    } else if (m.payKind === 'char_received') {
                        apiContent = `[你刚刚收下了用户的一笔转账 ¥${payAmount.toFixed(2)}，备注：${payDesc}。]`;
                    } else if (m.payKind === 'char_to_user_pending') {
                        apiContent = `[你刚刚向用户发起了一笔转账 ¥${payAmount.toFixed(2)}，备注：${payDesc}，等待用户领取。]`;
                    } else if (m.payKind === 'char_to_user_claimed' || m.payKind === 'user_received_from_char') {
                        apiContent = `[用户刚刚领取了你转给他的 ¥${payAmount.toFixed(2)}，备注：${payDesc}。]`;
                    }
                }

                if (friend.type === 'group') {
                    if (m.role === 'user') {
                        const userLabel = `User(${userState.name || 'User'})`;
                        if (m.replyTo) {
                            apiContent = `[引用了消息："${m.replyTo}"]\n${apiContent}`;
                        }
                        messages.push({
                            role: 'user',
                            content: `${userLabel}: ${apiContent}`
                        });
                    } else {
                        const assistantSpeaker = typeof m.speaker === 'string' && m.speaker.trim()
                            ? m.speaker.trim()
                            : ((m.role === 'assistant' && friend.type === 'group')
                                ? (getSafeGroupSpeaker(friend)?.nickname || '群成员')
                                : 'Assistant');

                        if (m.replyTo) {
                            apiContent = `[引用了消息："${m.replyTo}"]\n${apiContent}`;
                        }

                        messages.push({
                            role: 'assistant',
                            content: `${assistantSpeaker}: ${apiContent}`
                        });
                    }
                } else {
                    if (m.role === 'user' && m.replyTo) {
                        apiContent = `[用户引用了消息："${m.replyTo}"]\n${m.content}`;
                    }
                    messages.push({ role: m.role, content: apiContent });
                }
            });
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
                    model: apiConfig.model || '',
                    messages: messages,
                    temperature: parseFloat(apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            let fullReply = data.choices[0].message.content;

            if (typingRow) typingRow.remove();

            // Status Bar Regex Extraction
            let statusExtracted = false;
            if (friend.statusBar && friend.statusBar.enabled && friend.statusBar.regex) {
                try {
                    const regex = new RegExp(friend.statusBar.regex, 'g');
                    let match;
                    let lastMatch = null;
                    while ((match = regex.exec(fullReply)) !== null) {
                        lastMatch = match;
                    }

                    if (lastMatch && lastMatch[1]) {
                        statusExtracted = true;
                        const statusText = lastMatch[1].trim();
                        // Add to history
                        if (!friend.statusBar.history) friend.statusBar.history = [];
                        friend.statusBar.history.push({
                            id: Date.now(),
                            text: statusText,
                            type: getStatusBarType(friend),
                            styleSnapshot: friend.statusBar.style || ''
                        });
                        
                        // Remove all matches from fullReply so it doesn't show in chat bubble
                        fullReply = fullReply.replace(regex, '').trim();

                        // Refresh status bar UI only if it's already open
                        const page = document.getElementById(`chat-interface-${friend.id}`);
                        if (page) {
                            const statusBarContainer = page.querySelector('.chat-status-bar-container');
                        if (statusBarContainer && statusBarContainer.style.opacity === '1') {
                            setStatusBarPage(friend, friend.statusBar.history.length - 1);
                            renderStatusBarHistory(friend, statusBarContainer);
                            requestAnimationFrame(() => {
                                syncStatusBarView(friend, statusBarContainer, { scroll: true });
                            });
                        }
                        }
                    } else {
                        if (window.showToast) window.showToast('本次回复未生成状态栏');
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

            let structuredItems = null;
            const chatJsonBlock = extractTaggedBlock(fullReply, 'chat_json');
            if (chatJsonBlock) {
                structuredItems = parseJsonArrayFromText(chatJsonBlock);
                fullReply = removeTaggedBlock(fullReply, 'chat_json');
            }

            if (!structuredItems) {
                const directJsonArray = parseJsonArrayFromText(fullReply);
                if (directJsonArray) {
                    structuredItems = directJsonArray;
                    fullReply = '';
                }
            }

            let queueItems = [];

            if (structuredItems && structuredItems.length > 0) {
                queueItems = structuredItems.map(item => {
                    if (!item || typeof item !== 'object') return null;

                    const itemType = typeof item.type === 'string' ? item.type.trim().toLowerCase() : '';
                    if (itemType === 'payment' || item.paymentAction) {
                        const amount = Number(item.amount);
                        if (!Number.isFinite(amount) || amount <= 0) return null;

                        return {
                            kind: 'payment',
                            paymentAction: item.paymentAction === 'transfer' ? 'transfer' : 'receive',
                            amount,
                            description: typeof item.description === 'string' ? item.description.trim() || '转账' : '转账'
                        };
                    }

                    const text = typeof item.text === 'string' ? item.text.trim() : '';
                    if (!text) return null;

                    return {
                        kind: 'text',
                        text,
                        translation: typeof item.translation === 'string'
                            ? item.translation.trim()
                            : (typeof item.trans === 'string' ? item.trans.trim() : ''),
                        replyTo: typeof item.quote === 'string' ? item.quote.trim() : '',
                        speaker: typeof item.speaker === 'string' ? item.speaker.trim() : ''
                    };
                }).filter(Boolean);
            }

            if (queueItems.length === 0) {
                let fullTranslation = null;
                const transRegex = /<translation>([\s\S]*?)<\/translation>/i;
                const transMatch = fullReply.match(transRegex);
                if (transMatch) {
                    fullTranslation = transMatch[1].trim();
                    fullReply = fullReply.replace(transRegex, '').trim();
                }

                let sentences = [];
                if (friend.type === 'group') {
                    sentences = fullReply.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0);
                } else if (fullTranslation) {
                    sentences = [fullReply];
                } else {
                    sentences = fullReply.split(/(?<=[。！？.!?\n])/).map(s => s.trim()).filter(s => s.length > 0);
                    
                    if (sentences.length > 7) {
                        while (sentences.length > 7) {
                            let minLen = Infinity;
                            let minIdx = 0;
                            for (let i = 0; i < sentences.length - 1; i++) {
                                let len = sentences[i].length + sentences[i + 1].length;
                                if (len < minLen) {
                                    minLen = len;
                                    minIdx = i;
                                }
                            }
                            sentences[minIdx] = sentences[minIdx] + ' ' + sentences[minIdx + 1];
                            sentences.splice(minIdx + 1, 1);
                        }
                    } else if (sentences.length < 3 && fullReply.length > 30) {
                        sentences = fullReply.split(/(?<=[。！？.!?\n，,])/).map(s => s.trim()).filter(s => s.length > 0);
                        if (sentences.length > 7) sentences = sentences.slice(0, 7);
                    }
                }

                if (sentences.length === 0 && fullReply) sentences = [fullReply];

                queueItems = sentences.map(text => ({
                    text,
                    translation: fullTranslation || '',
                    replyTo: '',
                    speaker: ''
                }));
            }

            if (queueItems.length === 0) {
                if(btnEl) btnEl.style.opacity = '1';
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                return;
            }

            let qIndex = 0;
            const now = Date.now();
            const bannerPreviewText = queueItems.map(item => item.text).filter(Boolean).join(' ').trim() || fullReply;
            
            // Re-fetch the container safely in case user navigated away
            const getSafeContainer = () => {
                const pageId = `chat-interface-${friend.id}`;
                const page = document.getElementById(pageId);
                return page ? page.querySelector('.ins-chat-messages') : null;
            };

            const safeContainer = getSafeContainer();
            const lastMsg = friend.messages[friend.messages.length - 1]; 
            if (safeContainer && (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000))) {
                renderTimestamp(now, safeContainer);
            }

            let lastGroupSpeaker = null;

            async function processNextSentence() {
                if (qIndex >= queueItems.length) {
                    if (window.imApp.saveFriends) window.imApp.saveFriends();
                    if (btnEl) btnEl.style.opacity = '1';
                    
                    // Check if we need to show banner notification AFTER ALL sentences processed
                    if (!window.imData.currentActiveFriend || String(window.imData.currentActiveFriend.id) !== String(friend.id)) {
                        if (window.imApp.showBannerNotification) {
                            window.imApp.showBannerNotification(friend, bannerPreviewText);
                        }
                    }
                    
                    // If user is on the main list view, we need to update the preview text
                    if (window.imApp.updateChatsView && !window.imData.currentActiveFriend) {
                        window.imApp.updateChatsView();
                    }
                    
                    return;
                }

                const currentItem = queueItems[qIndex] || {};

                if (currentItem.kind === 'payment') {
                    const paymentAction = currentItem.paymentAction === 'transfer' ? 'transfer' : 'receive';
                    const paymentAmount = Number(currentItem.amount) || 0;
                    const paymentDescription = currentItem.description || '转账';

                    if (paymentAmount > 0) {
                        const nowMsg = Date.now();
                        const paymentMsg = {
                            id: createMessageId('pay'),
                            role: 'assistant',
                            type: 'pay_transfer',
                            payKind: paymentAction === 'transfer' ? 'char_to_user_pending' : 'char_received',
                            amount: paymentAmount,
                            description: paymentDescription,
                            targetName: paymentAction === 'transfer'
                                ? (friend.nickname || friend.realName || '对方')
                                : (userState.name || '用户'),
                            cardTitle: paymentAction === 'transfer' ? '转账' : '收款',
                            payStatus: 'completed',
                            content: paymentAction === 'transfer'
                                ? `[角色转账] ${paymentDescription} ¥${paymentAmount.toFixed(2)}`
                                : `[收下转账] ${paymentDescription} ¥${paymentAmount.toFixed(2)}`,
                            timestamp: nowMsg
                        };

                        const freshContainer = getSafeContainer();
                        const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && freshContainer;

                        if (!friend.messages) friend.messages = [];
                        friend.messages.push(paymentMsg);

                        if (isUserStillLooking) {
                            renderPayTransferBubble(paymentMsg, friend, freshContainer, nowMsg);
                        }
                    }

                    qIndex++;
                    processNextSentence();
                    return;
                }

                let text = typeof currentItem.text === 'string' ? currentItem.text.trim() : '';
                let aiReplyTo = typeof currentItem.replyTo === 'string' && currentItem.replyTo.trim() ? currentItem.replyTo.trim() : null;
                const itemTranslation = typeof currentItem.translation === 'string' && currentItem.translation.trim()
                    ? currentItem.translation.trim()
                    : null;

                if (!text) {
                    qIndex++;
                    processNextSentence();
                    return;
                }

                if (!structuredItems) {
                    const quoteRegex = /<quote>([\s\S]*?)<\/quote>/i;
                    const quoteMatch = text.match(quoteRegex);
                    if (quoteMatch) {
                        aiReplyTo = quoteMatch[1].trim();
                        text = text.replace(quoteRegex, '').trim();
                    }
                }

                let currentSpeakerName = null;
                let currentSpeakerAvatar = null;
                if (friend.type === 'group') {
                    let detectedSpeaker = null;

                    if (structuredItems && currentItem.speaker) {
                        detectedSpeaker = normalizeGroupSpeaker(friend, currentItem.speaker);
                    } else {
                        const nameRegex = /^([a-zA-Z0-9\u4e00-\u9fa5\s_\-.]+)[：:]\s*/;
                        const nameMatch = text.match(nameRegex);

                        if (nameMatch) {
                            detectedSpeaker = normalizeGroupSpeaker(friend, nameMatch[1].trim());
                            text = text.substring(nameMatch[0].length).trim();
                        } else if (lastGroupSpeaker) {
                            detectedSpeaker = normalizeGroupSpeaker(friend, lastGroupSpeaker);
                        }
                    }

                    if (!detectedSpeaker) {
                        detectedSpeaker = getSafeGroupSpeaker(friend, lastGroupSpeaker);
                    }

                    if (detectedSpeaker) {
                        currentSpeakerName = detectedSpeaker.nickname;
                        currentSpeakerAvatar = detectedSpeaker.avatarUrl || null;
                        lastGroupSpeaker = currentSpeakerName;
                    }
                }
                
                if (!text) {
                    qIndex++;
                    processNextSentence();
                    return;
                }

                const delay = Math.max(500, Math.min(2000, text.length * 50));
                
                // Only show typing animation if the user is STILL in this chat
                const currentContainer = getSafeContainer();
                const isUserLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && currentContainer;
                
                let tr = null;
                if (isUserLooking) {
                    tr = document.createElement('div');
                    tr.className = 'chat-row ai-row typing-row';
                    tr.innerHTML = `
                        <div class="typing-indicator">
                            <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                        </div>
                    `;
                    
                    const lastRow = currentContainer.lastElementChild;
                    if (lastRow && lastRow.classList.contains('ai-row') && !lastRow.classList.contains('typing-row')) {
                        lastRow.classList.add('has-next');
                        tr.classList.add('has-prev');
                    }
                    
                    currentContainer.appendChild(tr);
                    scrollToBottom(currentContainer);
                }

                await new Promise(res => setTimeout(res, delay));
                
                if (tr && tr.parentNode) {
                    tr.remove(); 
                }

                const nowMsg = Date.now();
                const msgObj = { id: createMessageId('msg'), role: 'assistant', content: text, timestamp: nowMsg, replyTo: aiReplyTo };
                if (currentSpeakerName) msgObj.speaker = currentSpeakerName;
                if (itemTranslation) {
                    msgObj.translation = itemTranslation;
                    msgObj.showTranslation = false;
                }
                
                // Only attempt to render bubble if user is STILL in this chat
                const freshContainer = getSafeContainer();
                const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && freshContainer;
                
                if (isUserStillLooking) {
                    renderAiBubble(text, friend, freshContainer, nowMsg, msgObj.translation, msgObj.showTranslation, msgObj.replyTo, currentSpeakerName, currentSpeakerAvatar, msgObj.id);
                }

                // ALWAYS push data to history regardless of where user is
                if (!friend.messages) friend.messages = [];
                friend.messages.push(msgObj);

                qIndex++;
                processNextSentence();
            }

            processNextSentence();

        } catch (error) {
            if (typingRow && typingRow.parentNode) typingRow.remove();
            if (window.showToast) window.showToast('API 请求失败');
            console.error(error);
            if (btnEl) btnEl.style.opacity = '1';
        }
    }

    // --- Context Menu Logic ---
    const msgContextOverlay = document.getElementById('msg-context-overlay');
    const msgContextMenu = document.getElementById('msg-context-menu');

    if (chatsContent) {
        let startX, startY;
        
        const startPress = (e) => {
            const row = e.target.closest('.chat-row');
            if (!row) return;
            
            if (window.imData.longPressTimer) clearTimeout(window.imData.longPressTimer);
            
            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

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
        chatsContent.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.chat-row')) {
                e.preventDefault();
            }
        });
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
                
                if (action === 'reply') {
                    if (window.imData.currentActiveRow) {
                        const bubble = window.imData.currentActiveRow.querySelector('.chat-bubble');
                        if (bubble) {
                            const clone = bubble.cloneNode(true);
                            const meta = clone.querySelector('.bubble-meta');
                            if(meta) meta.remove();
                            const quote = clone.querySelector('.msg-reply-quote');
                            if(quote) quote.remove();
                            const reaction = clone.querySelector('.bubble-reaction-icon');
                            if(reaction) reaction.remove();

                            const text = clone.innerText || clone.textContent;
                            
                            window.imData.currentReplyText = text.trim();
                            
                            const page = document.querySelector('.active-chat-interface[style*="display: flex"]');
                            if (page) {
                                const previewContainer = page.querySelector('.reply-preview-container');
                                const previewText = page.querySelector('.reply-preview-text');
                                const input = page.querySelector('.chat-input');
                                
                                if (previewContainer && previewText) {
                                    previewText.textContent = text.trim();
                                    previewContainer.style.display = 'block';
                                }
                                if (input) {
                                    input.focus();
                                }
                            }
                        }
                    }
                    closeContextMenu();
                    return;
                }

                if (action === 'select') {
                    if (window.imData.currentActiveRow) {
                        const row = window.imData.currentActiveRow;
                        const ts = row.getAttribute('data-timestamp');
                        
                        window.imData.batchSelectMode = true;
                        
                        const page = document.querySelector('.active-chat-interface[style*="display: flex"]');
                        if (page) {
                            const cancelBatchBtn = page.querySelector('.chat-cancel-batch-btn');
                            const topMenuBtn = page.querySelector('.chat-menu-btn');
                            const topCallBtn = page.querySelector('.chat-call-btn');
                            const batchActionBar = page.querySelector('.chat-batch-action-bar');
                            const inputWrapper = page.querySelector('.ins-chat-input-wrapper');
                            
                            if (cancelBatchBtn) cancelBatchBtn.style.display = 'block';
                            if (topMenuBtn) topMenuBtn.style.display = 'none';
                            if (topCallBtn) topCallBtn.style.display = 'none';
                            if (batchActionBar) batchActionBar.style.display = 'flex';
                            if (inputWrapper) inputWrapper.style.display = 'none';
                            
                            const checkboxes = page.querySelectorAll('.chat-checkbox-wrapper');
                            checkboxes.forEach(cb => {
                                cb.style.display = 'flex';
                                const icon = cb.querySelector('i');
                                if (icon && ts && icon.getAttribute('data-timestamp') === ts) {
                                    icon.className = 'fas fa-check-circle chat-checkbox';
                                    icon.style.color = '#007aff';
                                }
                            });
                        }
                    }
                    closeContextMenu();
                    return;
                }

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
                } else if (action === 'translate') {
                    if (window.imData.currentActiveRow) {
                        const row = window.imData.currentActiveRow;
                        const ts = row.getAttribute('data-timestamp');
                        if (ts && window.imData.currentActiveFriend) {
                            const msg = window.imData.currentActiveFriend.messages.find(m => String(m.timestamp) === String(ts));
                            if (msg) {
                                if (msg.translation) {
                                    msg.showTranslation = !msg.showTranslation;
                                    if (window.imApp.saveFriends) window.imApp.saveFriends();
                                    
                                    // In-place DOM update instead of full clear and re-render
                                    const bubbleInner = row.querySelector('.chat-bubble');
                                    if (bubbleInner) {
                                        // Find existing translation element
                                        const existingTranslationNode = bubbleInner.querySelector('.msg-translation');
                                        
                                        if (msg.showTranslation) {
                                            // If it should show but doesn't exist, create it
                                            if (!existingTranslationNode) {
                                                const metaNode = bubbleInner.querySelector('.bubble-meta');
                                                const transNode = document.createElement('div');
                                                transNode.className = 'msg-translation';
                                                
                                                if (row.classList.contains('user-row')) {
                                                    transNode.style.cssText = 'margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.4; word-wrap: break-word; white-space: normal;';
                                                } else {
                                                    transNode.style.cssText = 'margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 13px; color: #8e8e93; line-height: 1.4; word-wrap: break-word; white-space: normal;';
                                                }
                                                transNode.innerHTML = msg.translation;
                                                
                                                if (metaNode) {
                                                    bubbleInner.insertBefore(transNode, metaNode);
                                                } else {
                                                    bubbleInner.appendChild(transNode);
                                                }
                                            }
                                        } else {
                                            // If it should hide and exists, remove it
                                            if (existingTranslationNode) {
                                                existingTranslationNode.remove();
                                            }
                                        }
                                    }
                                } else {
                                    if (window.showToast) window.showToast('该消息无需翻译或暂无翻译');
                                }
                            }
                        }
                    }
                    closeContextMenu();
                    return;
                } else if (action === 'edit') {
                    if (window.imData.currentActiveRow) {
                        const row = window.imData.currentActiveRow;
                        const ts = row.getAttribute('data-timestamp');
                        if (ts && window.imData.currentActiveFriend) {
                            const msg = window.imData.currentActiveFriend.messages.find(m => String(m.timestamp) === String(ts));
                            if (msg) {
                                if (window.showCustomModal) {
                                    window.showCustomModal({
                                        type: 'prompt',
                                        title: '编辑消息',
                                        placeholder: '修改内容...',
                                        confirmText: '保存',
                                        onConfirm: (newVal) => {
                                            const textarea = document.getElementById('modal-textarea');
                                            const textareaGroup = document.getElementById('modal-textarea-group');
                                            let finalVal = newVal;
                                            
                                            if (textarea && textareaGroup && textareaGroup.style.display !== 'none') {
                                                finalVal = textarea.value;
                                            }
                                            
                                            if (finalVal !== null && finalVal.trim() !== '') {
                                                msg.content = finalVal.trim();
                                                if (window.imApp.saveFriends) window.imApp.saveFriends();
                                                
                                                const container = row.closest('.ins-chat-messages');
                                                if (container) {
                                                    container.innerHTML = '';
                                                    window.imApp.renderChatHistory(window.imData.currentActiveFriend, container);
                                                    window.imApp.scrollToBottom(container);
                                                }
                                            }
                                        }
                                    });
                                    
                                    setTimeout(() => {
                                        const inputGroup = document.getElementById('modal-input-group');
                                        const textareaGroup = document.getElementById('modal-textarea-group');
                                        const textarea = document.getElementById('modal-textarea');
                                        
                                        if (inputGroup && textareaGroup && textarea) {
                                            inputGroup.style.display = 'none';
                                            textareaGroup.style.display = 'block';
                                            textarea.value = msg.content;
                                        }
                                    }, 10);
                                }
                            }
                        }
                    }
                    closeContextMenu();
                    return;
                } else {
                    if(window.showToast) window.showToast(action + ' 功能未实现');
                }
                closeContextMenu();
                return;
            }
            
            const reaction = e.target.closest('.msg-reaction');
            if (reaction) {
                const htmlContent = reaction.innerHTML;
                
                if (window.imData.currentActiveRow) {
                    const bubble = window.imData.currentActiveRow.querySelector('.chat-bubble');
                    if (bubble) {
                        // Remove any existing reaction
                        const existingReaction = bubble.querySelector('.bubble-reaction-icon');
                        if (existingReaction) {
                            existingReaction.remove();
                        }
                        
                        // Create new reaction badge
                        const reactionBadge = document.createElement('div');
                        reactionBadge.className = 'bubble-reaction-icon';
                        reactionBadge.innerHTML = htmlContent;
                        
                        // Set inline styles for the badge to match iOS iMessage look
                        reactionBadge.style.position = 'absolute';
                        reactionBadge.style.bottom = '-8px';
                        reactionBadge.style.left = '-8px';
                        reactionBadge.style.width = '24px';
                        reactionBadge.style.height = '24px';
                        reactionBadge.style.backgroundColor = '#f2f2f7';
                        reactionBadge.style.border = '2px solid #ffffff';
                        reactionBadge.style.borderRadius = '50%';
                        reactionBadge.style.display = 'flex';
                        reactionBadge.style.justifyContent = 'center';
                        reactionBadge.style.alignItems = 'center';
                        reactionBadge.style.fontSize = '12px';
                        reactionBadge.style.color = '#8e8e93';
                        reactionBadge.style.zIndex = '10';
                        reactionBadge.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        
                        // Ensure bubble is positioned relative to anchor the absolute badge
                        bubble.style.position = 'relative';
                        
                        // If it's a user bubble (right side), adjust position to bottom right
                        if (window.imData.currentActiveRow.classList.contains('user-row')) {
                            reactionBadge.style.left = 'auto';
                            reactionBadge.style.right = '-8px';
                        }
                        
                        // Specific tweak for the HAHA text to fit in the small circle
                        if (reactionBadge.textContent.includes('HA')) {
                            reactionBadge.style.fontSize = '8px';
                            reactionBadge.style.fontWeight = '900';
                            reactionBadge.style.lineHeight = '0.9';
                            reactionBadge.style.letterSpacing = '-0.5px';
                            reactionBadge.style.fontFamily = 'sans-serif';
                        }
                        
                        bubble.appendChild(reactionBadge);
                    }
                }
                
                closeContextMenu();
                return;
            }
        });
    }

    // --- Attachment Sheet Logic ---
    let attachmentSheet = null;

    function createAttachmentSheet(page) {
        if (attachmentSheet) {
            // Ensure it's appended to the correct page if switching chats
            if (attachmentSheet.parentNode !== page) {
                page.appendChild(attachmentSheet);
            }
            return attachmentSheet;
        }
        
        attachmentSheet = document.createElement('div');
        attachmentSheet.id = 'chat-attachment-sheet';
        attachmentSheet.style.position = 'absolute';
        attachmentSheet.style.inset = '0';
        attachmentSheet.style.zIndex = '1000';
        attachmentSheet.style.display = 'none';
        attachmentSheet.style.flexDirection = 'column';
        attachmentSheet.style.justifyContent = 'flex-end';
        attachmentSheet.style.overflow = 'hidden';
        
        const fakeImages = Array.from({length: 21}, (_, i) => `https://picsum.photos/seed/gall${i}/300/300`);
        let fakeHtml = '';
        fakeImages.forEach(src => {
            fakeHtml += `
                <div class="grid-item fake-img" data-src="${src}" style="aspect-ratio: 1; background: url(${src}) center/cover; position: relative; cursor: pointer;">
                     <div style="position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border: 1.5px solid #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
                </div>
            `;
        });

        attachmentSheet.innerHTML = `
            <div class="sheet-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.3s;"></div>
            <div class="sheet-content" style="position: relative; height: 85%; width: 100%; background: #fff; border-radius: 24px 24px 0 0; display: flex; flex-direction: column; overflow: hidden; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1); box-shadow: 0 -5px 15px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 10;">
                    <div class="close-sheet-btn" style="width: 32px; height: 32px; background: #f2f2f7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; color: #000;"><i class="fas fa-times"></i></div>
                    <div style="font-weight: 600; font-size: 18px; color: #000;">Recents <i class="fas fa-chevron-down" style="font-size: 12px; color: #8e8e93; margin-left: 4px;"></i></div>
                    <div style="width: 32px;"></div>
                </div>
                
                <!-- Views Container -->
                <div style="flex: 1; position: relative; overflow: hidden; background: #fff;">
                    <!-- Gallery View -->
                    <div class="sheet-view view-gallery" style="position: absolute; inset: 0; overflow-y: auto; padding: 2px; padding-bottom: 120px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; align-content: flex-start; scrollbar-width: none;">
                        <div class="grid-item virtual-upload" style="aspect-ratio: 1; background: #f2f2f7; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
                            <i class="fas fa-magic" style="font-size: 28px; color: #007aff; margin-bottom: 8px;"></i>
                            <span style="font-size: 12px; color: #8e8e93; font-weight: 500;">虚拟照片</span>
                        </div>
                        <div class="grid-item real-upload" style="aspect-ratio: 1; background: #f2f2f7; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; position: relative;">
                            <i class="fas fa-camera" style="font-size: 28px; color: #34c759; margin-bottom: 8px;"></i>
                            <span style="font-size: 12px; color: #8e8e93; font-weight: 500;">真实相册</span>
                            <input type="file" accept="image/*" class="real-file-input" style="position: absolute; inset: 0; opacity: 0; cursor: pointer;">
                        </div>
                        ${fakeHtml}
                    </div>

                    <!-- File View Placeholder -->
                    <div class="sheet-view view-file" style="position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center; background: #fff; padding-bottom: 60px;">
                        <i class="fas fa-folder-open" style="font-size: 64px; color: #c7c7cc; margin-bottom: 16px;"></i>
                        <div style="font-size: 16px; color: #8e8e93; font-weight: 500;">File Manager</div>
                        <div style="font-size: 13px; color: #aeaeb2; margin-top: 4px;">Coming soon</div>
                    </div>

                    <!-- Location View Placeholder -->
                    <div class="sheet-view view-location" style="position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center; background: #fff; padding-bottom: 60px;">
                        <i class="fas fa-map-marked-alt" style="font-size: 64px; color: #c7c7cc; margin-bottom: 16px;"></i>
                        <div style="font-size: 16px; color: #8e8e93; font-weight: 500;">Location Picker</div>
                        <div style="font-size: 13px; color: #aeaeb2; margin-top: 4px;">Coming soon</div>
                    </div>

                    <!-- Poll View Placeholder -->
                    <div class="sheet-view view-poll" style="position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center; background: #fff; padding-bottom: 60px;">
                        <i class="fas fa-chart-pie" style="font-size: 64px; color: #c7c7cc; margin-bottom: 16px;"></i>
                        <div style="font-size: 16px; color: #8e8e93; font-weight: 500;">Create a Poll</div>
                        <div style="font-size: 13px; color: #aeaeb2; margin-top: 4px;">Coming soon</div>
                    </div>

                    <!-- More View -->
                    <div class="sheet-view view-more" style="position: absolute; inset: 0; display: none; flex-direction: column; align-items: flex-start; justify-content: flex-start; background: #fff; padding: 20px 18px 120px; gap: 14px;">
                        <div class="attachment-more-icon-grid">
                            <div class="attachment-more-pay-entry">
                                <div class="attachment-more-pay-icon">
                                    <i class="fas fa-wallet"></i>
                                </div>
                                <div class="attachment-more-pay-label">Pay</div>
                            </div>
                        </div>
                    </div>

                    <div class="pay-transfer-form-overlay" style="position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.18); z-index: 20; padding: 20px;">
                        <div class="pay-transfer-form-card">
                            <div class="pay-transfer-form-title">Pay 转账</div>
                            <input type="number" class="pay-transfer-amount-input" placeholder="金额，例如 88.88" min="0" step="0.01">
                            <input type="text" class="pay-transfer-desc-input" placeholder="描述，例如 奶茶钱 / 晚餐AA">
                            <div class="pay-transfer-form-actions">
                                <div class="pay-transfer-cancel-btn">取消</div>
                                <div class="pay-transfer-submit-btn">发送</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Tabs (Floating Pill, Left Aligned, Tap to Select) -->
                <div class="sheet-tabs-container" style="position: absolute; bottom: max(16px, env(safe-area-inset-bottom)); left: 20px; right: 20px; border-radius: 40px; display: flex; padding: 10px 16px; overflow-x: auto; background: rgba(250, 250, 250, 0.75); backdrop-filter: blur(35px); -webkit-backdrop-filter: blur(35px); box-shadow: 0 4px 20px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.8); scrollbar-width: none; gap: 24px; align-items: center; justify-content: flex-start; scroll-behavior: smooth;">
                    <style>
                        #chat-attachment-sheet ::-webkit-scrollbar { display: none; }
                        .sheet-tab-item {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 3px;
                            min-width: 44px;
                            cursor: pointer;
                            transition: transform 0.2s, opacity 0.2s;
                            flex-shrink: 0;
                        }
                        .sheet-tab-icon {
                            font-size: 24px;
                            color: #8e8e93;
                            transition: color 0.2s, transform 0.2s;
                        }
                        .sheet-tab-text {
                            font-size: 10px;
                            color: #8e8e93;
                            font-weight: 500;
                            transition: color 0.2s;
                        }
                        .sheet-tab-item.active .sheet-tab-icon {
                            color: #007aff;
                            transform: scale(1.1);
                        }
                        .sheet-tab-item.active .sheet-tab-text {
                            color: #007aff;
                            font-weight: 600;
                        }
                    </style>
                    
                    <div class="sheet-tab-item active" data-tab="gallery">
                        <i class="fas fa-image sheet-tab-icon"></i>
                        <span class="sheet-tab-text">Gallery</span>
                    </div>
                    <div class="sheet-tab-item" data-tab="file">
                        <i class="fas fa-file-alt sheet-tab-icon"></i>
                        <span class="sheet-tab-text">File</span>
                    </div>
                    <div class="sheet-tab-item" data-tab="location">
                        <i class="fas fa-map-marker-alt sheet-tab-icon"></i>
                        <span class="sheet-tab-text">Location</span>
                    </div>
                    <div class="sheet-tab-item" data-tab="poll">
                        <i class="fas fa-chart-bar sheet-tab-icon"></i>
                        <span class="sheet-tab-text">Poll</span>
                    </div>
                    <div class="sheet-tab-item" data-tab="more">
                        <i class="fas fa-ellipsis-h sheet-tab-icon"></i>
                        <span class="sheet-tab-text">More</span>
                    </div>
                </div>
            </div>
        `;
        page.appendChild(attachmentSheet);

        const overlay = attachmentSheet.querySelector('.sheet-overlay');
        const content = attachmentSheet.querySelector('.sheet-content');
        const closeBtn = attachmentSheet.querySelector('.close-sheet-btn');
        const tabsContainer = attachmentSheet.querySelector('.sheet-tabs-container');
        const tabItems = attachmentSheet.querySelectorAll('.sheet-tab-item');
        const payEntry = attachmentSheet.querySelector('.attachment-more-pay-entry');
        const payFormOverlay = attachmentSheet.querySelector('.pay-transfer-form-overlay');
        const payAmountInput = attachmentSheet.querySelector('.pay-transfer-amount-input');
        const payDescInput = attachmentSheet.querySelector('.pay-transfer-desc-input');
        const payCancelBtn = attachmentSheet.querySelector('.pay-transfer-cancel-btn');
        const paySubmitBtn = attachmentSheet.querySelector('.pay-transfer-submit-btn');

        const sheetViews = attachmentSheet.querySelectorAll('.sheet-view');

        // Click listener to set active tab and ensure it is fully visible in the container
        tabItems.forEach(item => {
            item.addEventListener('click', () => {
                // 1. Update active tab UI
                tabItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // 2. Scroll into view if partially hidden
                const containerRect = tabsContainer.getBoundingClientRect();
                const itemRect = item.getBoundingClientRect();
                
                if (itemRect.left < containerRect.left) {
                    tabsContainer.scrollBy({ left: itemRect.left - containerRect.left - 16, behavior: 'smooth' });
                } else if (itemRect.right > containerRect.right) {
                    tabsContainer.scrollBy({ left: itemRect.right - containerRect.right + 16, behavior: 'smooth' });
                }

                // 3. Switch View Panels
                const targetTab = item.getAttribute('data-tab');
                sheetViews.forEach(view => {
                    if (view.classList.contains(`view-${targetTab}`)) {
                        if (targetTab === 'gallery') {
                            view.style.display = 'grid';
                        } else {
                            view.style.display = 'flex';
                        }
                    } else {
                        view.style.display = 'none';
                    }
                });
            });
        });

        const closePayTransferForm = () => {
            if (!payFormOverlay) return;
            payFormOverlay.style.display = 'none';
            if (payAmountInput) payAmountInput.value = '';
            if (payDescInput) payDescInput.value = '';
        };

        const openPayTransferForm = () => {
            if (!payFormOverlay) return;
            payFormOverlay.style.display = 'flex';
            if (payAmountInput) payAmountInput.value = '';
            if (payDescInput) payDescInput.value = '';
            setTimeout(() => {
                if (payAmountInput) payAmountInput.focus();
            }, 30);
        };

        const closeSheet = () => {
            closePayTransferForm();
            overlay.style.opacity = '0';
            content.style.transform = 'translateY(100%)';
            setTimeout(() => {
                attachmentSheet.style.display = 'none';
            }, 300);
        };

        const submitPayTransfer = () => {
            const amount = Number(payAmountInput ? payAmountInput.value : '');
            const description = String(payDescInput ? payDescInput.value : '').trim() || '转账';

            if (!Number.isFinite(amount) || amount <= 0) {
                if (window.showToast) window.showToast('金额无效');
                return;
            }

            const balance = typeof window.getPayBalance === 'function' ? window.getPayBalance() : 0;
            if (amount > balance) {
                if (window.showToast) window.showToast('余额不足');
                return;
            }

            const activeFriend = window.imData.currentActiveFriend;
            if (!activeFriend) {
                if (window.showToast) window.showToast('当前聊天不存在');
                return;
            }

            const activePageId = `chat-interface-${activeFriend.id}`;
            const activePage = document.getElementById(activePageId);
            const activeContainer = activePage ? activePage.querySelector('.ins-chat-messages') : null;
            const targetName = activeFriend.type === 'group'
                ? (activeFriend.nickname || '群聊')
                : (activeFriend.nickname || activeFriend.realName || '对方');

            const success = typeof window.addPayTransaction === 'function'
                ? window.addPayTransaction(amount, `${description} · ${targetName}`, 'expense')
                : false;

            if (!success) {
                if (window.showToast) window.showToast('转账失败');
                return;
            }

            const now = Date.now();
            const lastMsg = activeFriend.messages && activeFriend.messages.length > 0
                ? activeFriend.messages[activeFriend.messages.length - 1]
                : null;

            closeSheet();

            if (activeContainer && (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000))) {
                renderTimestamp(now, activeContainer);
            }

            const payMsg = {
                id: createMessageId('pay'),
                role: 'user',
                type: 'pay_transfer',
                payKind: 'user_to_char',
                amount,
                description,
                targetName,
                cardTitle: 'Pay 转账',
                payStatus: 'completed',
                content: `[用户转账] ${description} ¥${amount.toFixed(2)}`,
                timestamp: now
            };

            if (!activeFriend.messages) activeFriend.messages = [];
            activeFriend.messages.push(payMsg);

            if (activeContainer) {
                renderPayTransferBubble(payMsg, activeFriend, activeContainer, now);
            }

            if (window.imApp.saveFriends) window.imApp.saveFriends();
        };

        overlay.addEventListener('click', closeSheet);
        closeBtn.addEventListener('click', closeSheet);

        if (payEntry) {
            payEntry.addEventListener('click', () => {
                openPayTransferForm();
            });
        }

        if (payFormOverlay) {
            payFormOverlay.addEventListener('click', (e) => {
                if (e.target === payFormOverlay) closePayTransferForm();
            });
        }

        if (payCancelBtn) {
            payCancelBtn.addEventListener('click', () => {
                closePayTransferForm();
            });
        }

        if (paySubmitBtn) {
            paySubmitBtn.addEventListener('click', () => {
                submitPayTransfer();
            });
        }

        if (payAmountInput) {
            payAmountInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitPayTransfer();
                }
            });
        }

        if (payDescInput) {
            payDescInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitPayTransfer();
                }
            });
        }

        // Upload Virtual Photo
        const virtualUpload = attachmentSheet.querySelector('.virtual-upload');
        virtualUpload.addEventListener('click', () => {
            closeSheet();
            if (window.showCustomModal) {
                window.showCustomModal({
                    type: 'prompt',
                    title: '发送虚拟照片',
                    placeholder: '描述这张照片的内容(供AI理解)',
                    confirmText: '发送',
                    onConfirm: (desc) => {
                        if (desc && desc.trim()) {
                            sendImageMessage(
                                `https://picsum.photos/seed/${Math.random()}/300/400`, 
                                desc.trim()
                            );
                        }
                    }
                });
            }
        });

        // Upload Real Photo
        const realFileInput = attachmentSheet.querySelector('.real-file-input');
        realFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                closeSheet();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    sendImageMessage(ev.target.result, file.name);
                };
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });

        // Fake photos click
        const fakeImgs = attachmentSheet.querySelectorAll('.fake-img');
        fakeImgs.forEach(img => {
            img.addEventListener('click', () => {
                const src = img.getAttribute('data-src');
                closeSheet();
                sendImageMessage(src, '一张相册里的照片');
            });
        });

        return attachmentSheet;
    }

    function sendImageMessage(imgUrl, description) {
        if (!window.imData.currentActiveFriend) return;
        const friend = window.imData.currentActiveFriend;
        const pageId = `chat-interface-${friend.id}`;
        const page = document.getElementById(pageId);
        if (!page) return;
        const container = page.querySelector('.ins-chat-messages');

        const now = Date.now();
        const lastMsg = friend.messages && friend.messages.length > 0 
            ? friend.messages[friend.messages.length - 1] 
            : null;
        
        if (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000)) {
            renderTimestamp(now, container);
        }

        const msgObj = {
            id: createMessageId('img'),
            role: 'user',
            type: 'image',
            content: imgUrl,
            text: description,
            timestamp: now
        };

        renderImageBubble(msgObj, friend, container, now);

        if (!friend.messages) friend.messages = [];
        friend.messages.push(msgObj);
        if(window.imApp.saveFriends) window.imApp.saveFriends();
    }

    function openAttachmentSheet() {
        if (!window.imData.currentActiveFriend) return;
        const pageId = `chat-interface-${window.imData.currentActiveFriend.id}`;
        const page = document.getElementById(pageId);
        if (!page) return;

        const sheet = createAttachmentSheet(page);
        sheet.style.display = 'flex';
        // force reflow
        sheet.offsetHeight;
        const overlay = sheet.querySelector('.sheet-overlay');
        const content = sheet.querySelector('.sheet-content');
        overlay.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }

    // --- Banner Notification Logic ---
    let notificationBanner = null;
    let bannerTimeout = null;

    function showBannerNotification(friend, messageText) {
        const appContainer = document.querySelector('.app-container') || document.body;

        if (!notificationBanner) {
            notificationBanner = document.createElement('div');
            notificationBanner.id = 'ios-banner-notification';
            // Styling exactly like the uploaded image capsule, constrained to appContainer
            notificationBanner.style.position = 'absolute';
            notificationBanner.style.top = '10px'; // Starts slightly below top
            notificationBanner.style.left = '50%';
            notificationBanner.style.transform = 'translate(-50%, -150%)'; // Hidden initially
            notificationBanner.style.width = 'calc(100% - 32px)';
            notificationBanner.style.maxWidth = '360px'; // Keep it tight like a mobile banner
            notificationBanner.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            notificationBanner.style.backdropFilter = 'blur(20px)';
            notificationBanner.style.webkitBackdropFilter = 'blur(20px)';
            notificationBanner.style.borderRadius = '40px'; // Deep capsule pill shape
            notificationBanner.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,1)';
            notificationBanner.style.display = 'flex';
            notificationBanner.style.alignItems = 'center';
            notificationBanner.style.padding = '8px 16px 8px 8px'; // Asymmetric padding to match image (avatar left)
            notificationBanner.style.zIndex = '9999';
            notificationBanner.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)';
            notificationBanner.style.cursor = 'pointer';

            appContainer.appendChild(notificationBanner);

            // Global click handler to jump to chat
            notificationBanner.addEventListener('click', () => {
                hideBannerNotification();
                if (window.imApp.openChatTab && notificationBanner.currentFriend) {
                    window.imApp.openChatTab(notificationBanner.currentFriend);
                }
            });
        }

        notificationBanner.currentFriend = friend;

        const avatar = friend.avatarUrl || 'https://picsum.photos/seed/char/100/100';
        const name = friend.nickname || 'Unknown';
        
        // Remove markdown or code blocks from preview
        let previewText = messageText.replace(/<[^>]*>?/gm, '').trim();
        if (previewText.length > 30) previewText = previewText.substring(0, 30) + '...';

        // Get current time
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

        notificationBanner.innerHTML = `
            <img src="${avatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <div style="flex: 1; min-width: 0; margin-left: 14px; display: flex; flex-direction: column; justify-content: center;">
                <div style="font-weight: 700; font-size: 15px; color: #1c1c1e; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
                <div style="font-size: 13px; color: #8e8e93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${previewText}</div>
            </div>
            <div style="font-size: 12px; color: #8e8e93; font-weight: 500; margin-left: 10px; flex-shrink: 0;">
                ${timeStr}
            </div>
        `;

        // Clear previous timeout
        if (bannerTimeout) clearTimeout(bannerTimeout);

        // Slide down
        requestAnimationFrame(() => {
            notificationBanner.style.transform = 'translate(-50%, max(env(safe-area-inset-top), 10px))';
        });

        // Slide up after 4 seconds
        bannerTimeout = setTimeout(() => {
            hideBannerNotification();
        }, 4000);
    }

    function hideBannerNotification() {
        if (notificationBanner) {
            notificationBanner.style.transform = 'translate(-50%, -150%)';
        }
    }

    // Expose Functions
    window.imApp.updateChatsView = updateChatsView;
    window.imApp.renderChatsList = renderChatsList;
    window.imApp.openChatTab = openChatTab;
    window.imApp.scrollToBottom = scrollToBottom;
    window.imApp.renderTimestamp = renderTimestamp;
    window.imApp.renderMomentForwardBubble = renderMomentForwardBubble;
    window.imApp.renderImageBubble = renderImageBubble;
    window.imApp.renderPayTransferBubble = renderPayTransferBubble;
    window.imApp.openAttachmentSheet = openAttachmentSheet;
    window.imApp.showBannerNotification = showBannerNotification;
});
