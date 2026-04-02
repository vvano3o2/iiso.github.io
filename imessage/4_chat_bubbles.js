
// ==========================================
// IMESSAGE: 4_chat_bubbles.js
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const { apiConfig, userState } = window;
    window.imChat = window.imChat || {};
    const imChat = window.imChat;

function renderSystemNoticeBubble(msg, friend, container, timestamp = Date.now()) {
        const row = document.createElement('div');
        row.className = 'chat-system-row';
        row.setAttribute('data-timestamp', timestamp);
        row.setAttribute('data-message-id', window.imChat.ensureMessageId(msg, 'notice'));
        row.innerHTML = `
            <div style="width:100%; display:flex; justify-content:center; padding:2px 0;">
                <div style="max-width:80%; padding:7px 12px; border-radius:999px; background:rgba(142,142,147,0.16); color:#8e8e93; font-size:12px; line-height:1.35; text-align:center;">
                    ${msg.text || '系统提示'}
                </div>
            </div>
        `;
        container.appendChild(row);
        window.imChat.scrollToBottom(container);
    }

function renderGroupRedPacketBubble(msg, friend, container, timestamp = Date.now()) {
        window.imChat.normalizeGroupRedPacketState(msg, friend);

        const isUser = msg.role === 'user';
        const isGroupMessage = friend.type === 'group' && !isUser;
        const speakerName = msg.senderName || msg.speaker || '群成员';
        const speakerAvatar = msg.senderAvatarUrl || null;

        const lastRow = container.lastElementChild;
        let hasPrev = false;
        let sameSpeaker = false;

        if (lastRow) {
            if (isUser && lastRow.classList.contains('user-row')) {
                hasPrev = true;
                lastRow.classList.add('has-next');
            } else if (!isUser && lastRow.classList.contains('ai-row')) {
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
        }

        const row = document.createElement('div');
        row.className = `chat-row ${isUser ? 'user-row' : 'ai-row'} ${hasPrev ? 'has-prev' : ''} ${isGroupMessage ? 'group-ai-row' : ''} ${isGroupMessage && sameSpeaker ? 'group-ai-row-continuous' : ''}`;
        row.setAttribute('data-timestamp', timestamp);
        row.setAttribute('data-message-id', window.imChat.ensureMessageId(msg, 'packet'));
        if (speakerName) {
            row.setAttribute('data-speaker', speakerName);
        }

        const totalAmount = Number(msg.totalAmount) || 0;
        const packetCount = parseInt(msg.packetCount, 10) || 0;
        const claimedCount = Array.isArray(msg.claimRecords) ? msg.claimRecords.length : 0;
        const subtitle = msg.currentUserClaimed
            ? `已领取 · ${claimedCount}/${packetCount}`
            : (msg.isFinished ? `${claimedCount}/${packetCount} 已领取` : '点击领取红包');

        const contentHtml = `
            <div class="group-red-packet-card" style="width:100%; min-width:0; max-width:268px; border-radius:18px; padding:12px 14px; background:#fff; color:#111; box-shadow:0 2px 10px rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.08); cursor:pointer;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:14px; background:#111; color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;">
                        <i class="fas fa-gift"></i>
                    </div>
                    <div style="min-width:0; flex:1;">
                        <div style="font-size:15px; font-weight:800; color:#111; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg.description || '恭喜发财'}</div>
                        <div style="font-size:12px; color:#8e8e93; margin-top:4px;">${subtitle}</div>
                    </div>
                </div>
                <div style="margin-top:10px; font-size:26px; font-weight:800; color:#111; letter-spacing:0.2px;">¥${totalAmount.toFixed(2)}</div>
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
                    <div class="chat-bubble user-bubble pay-transfer-bubble group-red-packet-bubble" style="padding:6px;">${contentHtml}${metaHtml}</div>
                </div>
            `;
        } else {
            const metaHtml = `<span class="bubble-meta"><span class="bubble-time">${timeStr}</span></span>`;
            
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
                            <div class="chat-bubble ai-bubble pay-transfer-bubble group-red-packet-bubble" style="padding:6px;">${contentHtml}${metaHtml}</div>
                        </div>
                    </div>
                `;
            } else {
                bubbleWrapperHtml = `<div class="chat-bubble ai-bubble pay-transfer-bubble group-red-packet-bubble" style="padding:6px;">${contentHtml}${metaHtml}</div>`;
            }

            row.innerHTML = `
                <div class="chat-checkbox-wrapper" style="display: ${window.imData.batchSelectMode ? 'flex' : 'none'}; width: 40px; justify-content: center; align-items: flex-end; padding-bottom: 10px; flex-shrink: 0; cursor: pointer; transition: all 0.2s;">
                    <i class="far fa-circle chat-checkbox" data-timestamp="${timestamp}" style="color: #c7c7cc; font-size: 22px;"></i>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-start; align-items: flex-end; min-width: 0;">
                    ${bubbleWrapperHtml}
                </div>
            `;
        }

        const clickableBubble = row.querySelector('.group-red-packet-card');
        if (clickableBubble) {
            clickableBubble.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const activePage = container.closest('.active-chat-interface');
                if (!activePage) return;
                if (!activePage._openGroupRedPacketInteraction) {
                    window.imChat.ensureRedPacketDetailOverlayForExistingPage(activePage, friend);
                }
                if (activePage._openGroupRedPacketInteraction) {
                    activePage._openGroupRedPacketInteraction(msg);
                }
            });
        }

        container.appendChild(row);
        window.imChat.scrollToBottom(container);
    }

function renderChatHistory(friend, container) {
        let lastTime = 0;
            if (friend.messages && friend.messages.length > 0) {
                friend.messages.forEach(msg => {
                    window.imChat.ensureMessageId(msg, msg.type === 'pay_transfer' ? 'pay' : 'msg');
                    const msgTime = msg.timestamp || 0;
                    if (msgTime - lastTime > 300000) { 
                        window.imChat.renderTimestamp(msgTime, container);
                        lastTime = msgTime;
                    }
                    
                    if (msg.type === 'moment_forward') {
                        window.imChat.renderMomentForwardBubble(msg, friend, container, msgTime);
                    } else if (msg.type === 'image') {
                        window.imChat.renderImageBubble(msg, friend, container, msgTime);
                    } else if (msg.type === 'pay_transfer') {
                        window.imChat.renderPayTransferBubble(msg, friend, container, msgTime);
                    } else if (msg.type === 'group_red_packet') {
                        window.imChat.renderGroupRedPacketBubble(msg, friend, container, msgTime);
                    } else if (msg.type === 'system_notice') {
                        window.imChat.renderSystemNoticeBubble(msg, friend, container, msgTime);
                    } else if (msg.role === 'user') {
                        window.imChat.renderUserBubble(msg.content, container, msgTime, msg.replyTo, msg.translation, msg.showTranslation, msg.id);
                    } else if (msg.role === 'assistant') {
                        let safeSpeakerName = msg.speaker || null;
                        let speakerAvatar = null;

                        if (friend.type === 'group') {
                            const safeSpeaker = window.imChat.getSafeGroupSpeaker(friend, msg.speaker);
                            if (safeSpeaker) {
                                safeSpeakerName = safeSpeaker.nickname;
                                speakerAvatar = safeSpeaker.avatarUrl || null;
                            } else {
                                safeSpeakerName = null;
                            }
                        }

                        window.imChat.renderAiBubble(msg.content, friend, container, msgTime, msg.translation, msg.showTranslation, msg.replyTo, safeSpeakerName, speakerAvatar, msg.id);
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
        row.setAttribute('data-message-id', messageId || window.imChat.createMessageId('msg'));
        
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
        window.imChat.scrollToBottom(container);
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
        row.setAttribute('data-message-id', messageId || window.imChat.createMessageId('msg'));
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
        window.imChat.scrollToBottom(container);
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
        row.setAttribute('data-message-id', window.imChat.ensureMessageId(msg, 'img'));
        
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
        window.imChat.scrollToBottom(container);
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
        row.setAttribute('data-message-id', window.imChat.ensureMessageId(msg, 'pay'));

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
                        window.imChat.ensureTransferDetailOverlayForExistingPage(activePage, friend);
                    }

                    if (activePage._openTransferDetailOverlay) {
                        activePage._openTransferDetailOverlay(msg);
                    } else if (window.showToast) {
                        window.showToast('详情卡片初始化失败');
                    }
                });
            }
        }

        window.imChat.scrollToBottom(container);
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
        row.setAttribute('data-message-id', window.imChat.ensureMessageId(msg, 'moment'));
        
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
        window.imChat.scrollToBottom(container);
    }

    window.imChat.renderSystemNoticeBubble = renderSystemNoticeBubble;
    window.imChat.renderGroupRedPacketBubble = renderGroupRedPacketBubble;
    window.imChat.renderChatHistory = renderChatHistory;
    window.imChat.scrollToBottom = scrollToBottom;
    window.imChat.renderTimestamp = renderTimestamp;
    window.imChat.renderUserBubble = renderUserBubble;
    window.imChat.renderAiBubble = renderAiBubble;
    window.imChat.renderImageBubble = renderImageBubble;
    window.imChat.renderPayTransferBubble = renderPayTransferBubble;
    window.imChat.renderMomentForwardBubble = renderMomentForwardBubble;

});
