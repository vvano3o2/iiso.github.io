// ==========================================
// TIKTOK: 3. HOME TAB & VIDEO FEED
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const feedContainer = document.getElementById('tk-feed-container');
    const apiGenBtn = document.getElementById('tk-api-generate-btn');

    // Render Home Feed
    window.tkRenderHome = function() {
        if (!feedContainer) return;
        
        // Render videos
        feedContainer.innerHTML = '';
        tkState.videos.forEach((video, index) => {
            const char = window.tkGetChar(video.authorId);
            const isFollowed = char ? char.isFollowed : false;
            const authorName = char ? (char.name || char.handle) : video.authorName;
            const avatarHtml = (char && char.avatar) 
                ? `<img src="${char.avatar}">` 
                : `<i class="fas fa-user"></i>`;

            const card = document.createElement('div');
            card.className = 'tk-video-card';
            card.innerHTML = `
                <div class="tk-video-text-content">
                    ${video.sceneText}
                </div>

                <div class="tk-right-actions">
                    <div class="tk-avatar-action" onclick="window.tkHandleProfileClick('${video.authorId}', event)">
                        ${avatarHtml}
                        <div class="tk-action-plus ${isFollowed ? 'followed' : ''}" onclick="window.tkHandleFollow('${video.authorId}', event)">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                    
                    <div class="tk-action-item ${video.isLiked ? 'liked' : ''}" onclick="window.tkHandleLike('${video.id}', this, event)">
                        <i class="fas fa-heart"></i>
                        <span>${video.likes || 0}</span>
                    </div>
                    
                    <div class="tk-action-item" onclick="window.tkOpenComments('${video.id}', event)">
                        <i class="fas fa-comment-dots"></i>
                        <span>${video.commentsCount || 0}</span>
                    </div>
                    
                    <div class="tk-action-item" onclick="window.tkOpenShare('${video.id}', event)">
                        <i class="fas fa-share" style="transform: scaleX(-1);"></i>
                        <span>${video.shares || 0}</span>
                    </div>
                </div>

                <div class="tk-bottom-info">
                    <div class="tk-video-author">@${authorName}</div>
                    <div class="tk-video-desc">${video.desc}</div>
                </div>
            `;
            feedContainer.appendChild(card);
        });
    };

    // Global Handlers for DOM inline events
    window.tkHandleProfileClick = function(authorId, e) {
        e.stopPropagation();
        // In a real app, this would open the user's profile.
        // For now, we just show a toast.
        const char = window.tkGetChar(authorId);
        if (char) {
            window.showToast(`打开了 ${char.name} 的主页`);
        }
    };

    window.tkHandleFollow = function(authorId, e) {
        e.stopPropagation();
        const char = window.tkGetChar(authorId);
        if (char && !char.isFollowed) {
            char.isFollowed = true;
            window.saveGlobalData();
            window.tkRenderHome();
            if (window.tkRenderChat) window.tkRenderChat(); // Update following bar
            window.showToast('已关注');
        } else if (!char) {
            // Auto create char if not exists
            const video = tkState.videos.find(v => v.authorId === authorId);
            if (video) {
                window.tkSaveChar({
                    id: authorId,
                    name: video.authorName,
                    handle: authorId,
                    avatar: null,
                    status: '刚刚发布了视频',
                    persona: '由 AI 自动生成的角色',
                    isFollowed: true
                });
                window.tkRenderHome();
                if (window.tkRenderChat) window.tkRenderChat();
                window.showToast('已关注');
            }
        }
    };

    window.tkHandleLike = function(videoId, el, e) {
        e.stopPropagation();
        const video = tkState.videos.find(v => v.id === videoId);
        if (video) {
            video.isLiked = !video.isLiked;
            video.likes += video.isLiked ? 1 : -1;
            window.saveGlobalData();
            
            if (video.isLiked) {
                el.classList.add('liked');
            } else {
                el.classList.remove('liked');
            }
            el.querySelector('span').textContent = video.likes;
        }
    };

    window.tkOpenComments = function(videoId, e) {
        e.stopPropagation();
        const video = tkState.videos.find(v => v.id === videoId);
        if (!video) return;

        const sheet = document.getElementById('tk-video-detail-sheet');
        const title = document.getElementById('tk-comments-title');
        const list = document.getElementById('tk-comments-list');

        title.textContent = `评论 (${video.commentsCount || 0})`;
        list.innerHTML = '';

        if (video.comments && video.comments.length > 0) {
            video.comments.forEach(c => {
                const item = document.createElement('div');
                item.className = 'tk-comment-item';
                // Add click event to open comment user modal
                const authorId = c.authorId || `commenter_${Math.floor(Math.random()*1000)}`;
                const authorName = c.authorName || 'User';
                
                item.innerHTML = `
                    <div class="tk-avatar-small" onclick="window.tkOpenCommentUserModal('${authorId}', '${authorName}', event)" style="cursor:pointer;"><i class="fas fa-user"></i></div>
                    <div class="tk-comment-content">
                        <div class="tk-comment-name" onclick="window.tkOpenCommentUserModal('${authorId}', '${authorName}', event)" style="cursor:pointer;">${authorName}</div>
                        <div class="tk-comment-text">${c.text}</div>
                        <div class="tk-comment-meta">
                            <span>刚刚</span>
                            <span>回复</span>
                        </div>
                    </div>
                    <div class="tk-comment-like">
                        <i class="far fa-heart"></i>
                        <span>${c.likes || 0}</span>
                    </div>
                `;
                list.appendChild(item);
            });
        } else {
            list.innerHTML = '<div style="text-align:center; padding: 40px; color: #999; font-size: 13px;">暂无评论，快来抢沙发吧</div>';
        }

        window.openView(sheet);

        // Add blank area click to close comments
        const sheetContent = sheet.querySelector('.detail-sheet-content');
        if (sheetContent) {
            // Remove old listener to avoid multiple bindings
            const newSheetContent = sheetContent.cloneNode(true);
            sheetContent.parentNode.replaceChild(newSheetContent, sheetContent);
            newSheetContent.addEventListener('click', (e) => {
                // If clicked exactly on the blank space (not on items)
                if (e.target === newSheetContent || e.target.classList.contains('tk-comments-list')) {
                    window.closeView(sheet);
                }
            });
            // Also need to update 'list' reference since we cloned
            const newList = newSheetContent.querySelector('.tk-comments-list');
            if(newList) {
                // Keep the content we just appended
            }
        }
    };
    
    // Share functionality
    window.tkOpenShare = function(videoId, e) {
        e.stopPropagation();
        const shareSheet = document.getElementById('tk-share-sheet');
        const shareList = document.getElementById('tk-share-list');
        if (!shareSheet || !shareList) return;
        
        shareList.innerHTML = '';
        
        // Combine chars and DMs for share list
        const friends = tkState.chars.filter(c => c.isFollowed);
        
        if (friends.length === 0) {
            shareList.innerHTML = '<div style="text-align:center; padding: 20px; color: #999; font-size: 13px;">暂无好友可分享</div>';
        } else {
            friends.forEach(friend => {
                const item = document.createElement('div');
                item.className = 'tk-import-item';
                const avatarHtml = friend.avatar ? `<img src="${friend.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : `<i class="fas fa-user"></i>`;
                
                item.innerHTML = `
                    <div class="tk-avatar-small" style="background: #f0f0f0;">${avatarHtml}</div>
                    <div style="flex: 1; font-weight: 500; font-size: 15px; color: #111;">${friend.name || friend.handle}</div>
                    <div class="tk-btn-primary" style="padding: 6px 16px; font-size: 13px;">发送</div>
                `;
                
                item.querySelector('.tk-btn-primary').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    // Send DM logic
                    let dm = tkState.dms.find(d => d.charId === friend.id);
                    if (!dm) {
                        dm = { charId: friend.id, messages: [] };
                        tkState.dms.push(dm);
                    }
                    dm.messages.push({
                        sender: 'user',
                        text: `[分享了视频] 快来看看这个！`
                    });
                    window.saveGlobalData();
                    if (window.tkRenderChat) window.tkRenderChat();
                    
                    window.showToast(`已发送给 ${friend.name || friend.handle}`);
                    window.closeView(shareSheet);
                });
                
                shareList.appendChild(item);
            });
        }
        
        window.openView(shareSheet);
    };

    // Comment User Modal Logic
    window.tkOpenCommentUserModal = function(authorId, authorName, e) {
        if(e) e.stopPropagation();
        const modal = document.getElementById('tk-comment-user-modal');
        const nameEl = document.getElementById('tk-comment-modal-name');
        const homeBtn = document.getElementById('tk-comment-modal-home-btn');
        
        if (!modal) return;
        
        nameEl.textContent = authorName;
        
        // Reset old listeners
        const newHomeBtn = homeBtn.cloneNode(true);
        homeBtn.parentNode.replaceChild(newHomeBtn, homeBtn);
        
        newHomeBtn.addEventListener('click', () => {
            window.closeView(modal);
            // Close comments sheet as well if open
            window.closeView(document.getElementById('tk-video-detail-sheet'));
            
            // Check if char exists
            let char = window.tkGetChar(authorId);
            if (!char) {
                // Call API to generate char if needed, or just create basic
                if (window.tkGenerateCharVideos) {
                    window.tkGenerateCharVideos(authorId, () => {
                        window.tkOpenSubProfile(authorId);
                    });
                } else {
                    window.tkSaveChar({
                        id: authorId,
                        name: authorName,
                        handle: authorId,
                        persona: '这是一个评论区随机出现的用户。',
                        isFollowed: false
                    });
                    window.tkOpenSubProfile(authorId);
                }
            } else {
                window.tkOpenSubProfile(authorId);
            }
        });
        
        window.openView(modal);
    };

    window.tkTriggerApiGenerate = function(e) {
        if(e) e.stopPropagation();
        generateVideos();
    };

    // Small API Button at Top Right
    const topbarRight = document.querySelector('.tk-home-topbar .tk-topbar-right');
    if (topbarRight && !document.getElementById('tk-home-api-gen-btn')) {
        const genBtn = document.createElement('i');
        genBtn.className = 'fas fa-magic';
        genBtn.id = 'tk-home-api-gen-btn';
        genBtn.style.marginRight = '15px';
        genBtn.style.cursor = 'pointer';
        genBtn.addEventListener('click', generateVideos);
        topbarRight.insertBefore(genBtn, topbarRight.firstChild);
    }

    // Top Bar Tabs logic (UI only)
    const topTabs = document.querySelectorAll('.tk-topbar-tab');
    topTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            topTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // API Logic
    async function generateVideos() {
        if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
            window.showToast('请在系统设置中配置 API');
            return;
        }

        window.showToast('正在生成内容...');
        
        // Collect World Book info if any exist globally
        let wbContext = '';
        if (window.getWorldBooks) {
            const allWb = window.getWorldBooks();
            const globalWb = allWb.filter(b => b.isGlobal);
            if (globalWb.length > 0) {
                wbContext = "世界观背景设定:\n";
                globalWb.forEach(b => {
                    b.entries.forEach(e => {
                        wbContext += `- ${e.keyword}: ${e.content}\n`;
                    });
                });
            }
        }

        const prompt = `
你现在是一个 TikTok 视频内容生成器。请根据以下世界观和默认偏好，生成 3-5 条 TikTok 视频数据。
要求：整体风格贴近日常生活或符合世界观，视频画面用文字描述，富有镜头感。
必须返回严格的 JSON 格式（不要有 markdown 代码块标记，不要多余文字），格式如下：
[
  {
    "authorName": "用户昵称",
    "handle": "user_id_123",
    "desc": "视频文案（简短，带tag）",
    "sceneText": "画面内容文字描述（例如：镜头由远及近，展示了一片海滩，风声很大，有人说了句'天气真好'）",
    "likes": 1234,
    "commentsCount": 5,
    "shares": 12,
    "comments": [
      { "authorName": "评论者A", "text": "评论内容", "likes": 12 }
    ]
  }
]

${wbContext}
`;

        try {
            let endpoint = window.apiConfig.endpoint;
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: window.apiConfig.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a helpful JSON data generator.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: parseFloat(window.apiConfig.temperature) || 0.8
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            let aiReply = data.choices[0].message.content;
            
            // Clean markdown blocks if present
            aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const parsedVideos = JSON.parse(aiReply);
            
            if (Array.isArray(parsedVideos)) {
                // Prepend to feed
                parsedVideos.forEach(v => {
                    tkState.videos.unshift({
                        id: 'v_' + Date.now() + Math.floor(Math.random() * 1000),
                        authorId: v.handle || ('user_' + Date.now()),
                        authorName: v.authorName || 'User',
                        desc: v.desc || '',
                        sceneText: v.sceneText || '',
                        likes: v.likes || Math.floor(Math.random() * 1000),
                        commentsCount: (v.comments && v.comments.length) || v.commentsCount || 0,
                        shares: v.shares || Math.floor(Math.random() * 100),
                        isLiked: false,
                        comments: v.comments || []
                    });
                });
                
                window.saveGlobalData();
                window.tkRenderHome();
                window.showToast('内容生成成功');
            } else {
                throw new Error('JSON is not an array');
            }

        } catch (error) {
            console.error('Gen Error:', error);
            window.showToast('生成失败，请检查 API 配置或返回格式');
        }
    }

});
