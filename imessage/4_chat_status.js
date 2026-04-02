
// ==========================================
// IMESSAGE: 4_chat_status.js
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const { apiConfig, userState } = window;
    window.imChat = window.imChat || {};
    const imChat = window.imChat;

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
        const uiState = window.imChat.getStatusBarUiState(friend);
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
        const uiState = window.imChat.getStatusBarUiState(friend);
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
        const nextPage = window.imChat.setStatusBarPage(friend, window.imChat.getStatusBarUiState(friend).currentPage + delta);
        window.imChat.syncStatusBarView(friend, container, { scroll: true });
        return nextPage;
    }

function toggleStatusBarThought(friend, container, index) {
        if (!friend || !container) return;
        const uiState = window.imChat.getStatusBarUiState(friend);
        uiState.flippedStates[index] = !uiState.flippedStates[index];
        window.imChat.syncStatusBarView(friend, container, { scroll: false });
    }

function renderStatusBarHistory(friend, container) {
        container.innerHTML = '';

        const page = container.closest('.active-chat-interface');
        const pager = page ? page.querySelector('.chat-status-bar-pager') : null;

        const uiState = window.imChat.getStatusBarUiState(friend);

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
            window.imChat.setStatusBarPage(friend, 0);
            window.imChat.syncStatusBarView(friend, container, { scroll: true, instant: true });
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
                const snapshotType = item.type === 'icity' ? 'icity' : (item.type === 'ins' ? 'ins' : window.imChat.getStatusBarType(friend));
                const snapshotStyle = typeof item.styleSnapshot === 'string' ? item.styleSnapshot : ((friend.statusBar && friend.statusBar.style) || '');
                const cardSnapshotId = `${friend.id}-${item.id || index}`;
                const text = window.imChat.getStatusBarMainText(statusData);
                const img = statusData.img || `https://picsum.photos/seed/${snapshotType === 'icity' ? 'icity' : 'vibe'}/300/300${snapshotType === 'icity' ? '?grayscale' : ''}`;
                const loc = statusData.loc || '';
                const thought = window.imChat.getThoughtText(statusData);
                const comments = window.imChat.getStatusBarComments(statusData);
                const uName = friend.nickname || 'user';
                const uAvatar = friend.avatarUrl || 'https://picsum.photos/seed/char/100/100';

                if (snapshotType === 'icity') {
                    const now = new Date(item.id || Date.now());
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hour = String(now.getHours()).padStart(2, '0');
                    const minute = String(now.getMinutes()).padStart(2, '0');
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
                                    <span style="margin-right:4px; font-size:12px;">🕒</span> ${year}-${month}-${day} ${hour}:${minute}${loc ? ` <span style="margin:0 6px;">|</span> ${loc}` : ''}
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

                    window.imChat.applyStatusCardSnapshotStyle(card, cardSnapshotId, snapshotStyle);
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
                                            <div class="status-card-thought-label" style="text-align:center; width:100%; display:block;">心声</div>
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
                        window.imChat.toggleStatusBarThought(friend, container, index);
                    });

                    window.imChat.applyStatusCardSnapshotStyle(card, cardSnapshotId, snapshotStyle);
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
                    const currentText = isJson ? window.imChat.getStatusBarMainText(statusData) : item.text;

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
                                window.imChat.renderStatusBarHistory(friend, container);
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
                window.imChat.renderStatusBarHistory(friend, container);
            });

            actionsEl.appendChild(editBtn);
            actionsEl.appendChild(delBtn);
            card.appendChild(actionsEl);

            slide.appendChild(card);
            container.appendChild(slide);
        });

        window.imChat.setStatusBarPage(friend, uiState.currentPage || 0);
        window.imChat.syncStatusBarView(friend, container, { scroll: true, instant: true });
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

    window.imChat.getStatusBarUiState = getStatusBarUiState;
    window.imChat.setStatusBarPage = setStatusBarPage;
    window.imChat.getThoughtText = getThoughtText;
    window.imChat.getStatusBarType = getStatusBarType;
    window.imChat.getStatusBarComments = getStatusBarComments;
    window.imChat.getStatusBarMainText = getStatusBarMainText;
    window.imChat.applyStatusCardSnapshotStyle = applyStatusCardSnapshotStyle;
    window.imChat.syncStatusBarView = syncStatusBarView;
    window.imChat.goStatusBarPage = goStatusBarPage;
    window.imChat.toggleStatusBarThought = toggleStatusBarThought;
    window.imChat.renderStatusBarHistory = renderStatusBarHistory;
    window.imChat.applyFriendStatusBarCss = applyFriendStatusBarCss;

});
