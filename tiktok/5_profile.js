// ==========================================
// TIKTOK: 5. PROFILE TAB
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const avatarImg = document.getElementById('tk-profile-avatar-img');
    const avatarIcon = document.getElementById('tk-profile-avatar-icon');
    const statusBubble = document.getElementById('tk-profile-status-bubble');
    const nameEl = document.getElementById('tk-profile-name');
    const handleEl = document.getElementById('tk-profile-handle');
    const bioEl = document.getElementById('tk-profile-bio');
    
    const statFollowing = document.getElementById('tk-stat-following');
    const statFollowers = document.getElementById('tk-stat-followers');
    const statLikes = document.getElementById('tk-stat-likes');
    
    const editBtn = document.getElementById('tk-profile-edit-btn');
    const msgBtn = document.getElementById('tk-profile-msg-btn');
    const profileBackBtn = document.getElementById('tk-profile-back-btn');
    const editSheet = document.getElementById('tk-edit-profile-sheet');
    const saveProfileBtn = document.getElementById('tk-save-profile-btn');
    
    // Edit Form Elements
    const editNameInput = document.getElementById('tk-edit-name');
    const editHandleInput = document.getElementById('tk-edit-handle');
    const editBioInput = document.getElementById('tk-edit-bio');
    const editPersonaInput = document.getElementById('tk-edit-persona');
    
    // Stats Form Elements
    const editFollowingInput = document.getElementById('tk-edit-following');
    const editFollowersInput = document.getElementById('tk-edit-followers');
    const editLikesInput = document.getElementById('tk-edit-likes');

    // Avatar Upload in Profile
    const avatarBtn = document.getElementById('tk-profile-avatar-btn');
    const avatarUpload = document.getElementById('tk-profile-avatar-upload');

    // Sub Profile Elements
    const subProfileView = document.getElementById('tk-sub-profile-view');
    const subProfileBackBtn = document.getElementById('tk-sub-profile-back-btn');
    const subProfileAvatarImg = document.getElementById('tk-sub-profile-avatar-img');
    const subProfileAvatarIcon = document.getElementById('tk-sub-profile-avatar-icon');
    const subProfileStatusBubble = document.getElementById('tk-sub-profile-status-bubble');
    const subProfileName = document.getElementById('tk-sub-profile-name');
    const subProfileHandle = document.getElementById('tk-sub-profile-handle');
    const subStatFollowing = document.getElementById('tk-sub-stat-following');
    const subStatFollowers = document.getElementById('tk-sub-stat-followers');
    const subStatLikes = document.getElementById('tk-sub-stat-likes');
    const subProfileBio = document.getElementById('tk-sub-profile-bio');
    const subProfileFollowBtn = document.getElementById('tk-sub-profile-follow-btn');
    const subProfileMsgBtn = document.getElementById('tk-sub-profile-msg-btn');
    const subProfileApiBtn = document.getElementById('tk-sub-profile-api-btn');
    const subProfileGrid = document.getElementById('tk-sub-profile-grid');
    
    let currentSubCharId = null;

    if (subProfileBackBtn && subProfileView) {
        subProfileBackBtn.addEventListener('click', () => {
            subProfileView.classList.remove('active');
            currentSubCharId = null;
        });
    }

    // Open Sub Profile Function
    window.tkOpenSubProfile = function(charId) {
        const char = window.tkGetChar(charId);
        if (!char || !subProfileView) return;
        currentSubCharId = charId;

        // Render info
        subProfileName.textContent = char.name || 'User';
        subProfileHandle.textContent = '@' + (char.handle || charId);
        subProfileBio.textContent = char.persona || '暂无简介';
        
        if (char.status) {
            subProfileStatusBubble.style.display = 'block';
            subProfileStatusBubble.textContent = char.status;
        } else {
            subProfileStatusBubble.style.display = 'none';
        }

        subStatFollowing.textContent = Math.floor(Math.random() * 100);
        subStatFollowers.textContent = Math.floor(Math.random() * 10000);
        subStatLikes.textContent = Math.floor(Math.random() * 50000);

        if (char.avatar) {
            subProfileAvatarImg.src = char.avatar;
            subProfileAvatarImg.style.display = 'block';
            subProfileAvatarIcon.style.display = 'none';
        } else {
            subProfileAvatarImg.src = '';
            subProfileAvatarImg.style.display = 'none';
            subProfileAvatarIcon.style.display = 'block';
        }

        // Follow Btn State
        if (char.isFollowed) {
            subProfileFollowBtn.textContent = '已关注';
            subProfileFollowBtn.className = 'tk-btn-secondary';
        } else {
            subProfileFollowBtn.textContent = '关注';
            subProfileFollowBtn.className = 'tk-btn-primary';
        }

        // Generate Grid Content
        if (subProfileGrid) {
            const charVideos = tkState.videos.filter(v => v.authorId === charId);
            subProfileGrid.innerHTML = '';
            if (charVideos.length > 0) {
                charVideos.forEach(v => {
                    const el = document.createElement('div');
                    el.className = 'tk-grid-item';
                    el.innerHTML = `
                        <div class="tk-grid-text">${v.sceneText ? v.sceneText.substring(0, 20) + '...' : '视频片段'}</div>
                        <div class="tk-grid-views"><i class="fas fa-play"></i> ${v.likes || 0}</div>
                    `;
                    subProfileGrid.appendChild(el);
                });
            } else {
                subProfileGrid.innerHTML = '<div style="grid-column: span 3; padding: 40px 0; text-align: center; color: #999; font-size: 13px;">点击右上角魔法棒生成内容</div>';
            }
        }

        subProfileView.classList.add('active');
    };

    if (subProfileFollowBtn) {
        subProfileFollowBtn.addEventListener('click', () => {
            if (!currentSubCharId) return;
            const char = window.tkGetChar(currentSubCharId);
            if (char) {
                char.isFollowed = !char.isFollowed;
                window.saveGlobalData();
                if (char.isFollowed) {
                    subProfileFollowBtn.textContent = '已关注';
                    subProfileFollowBtn.className = 'tk-btn-secondary';
                    window.showToast('已关注');
                } else {
                    subProfileFollowBtn.textContent = '关注';
                    subProfileFollowBtn.className = 'tk-btn-primary';
                    window.showToast('已取消关注');
                }
                if (window.tkRenderHome) window.tkRenderHome();
                if (window.tkRenderChat) window.tkRenderChat();
            }
        });
    }

    if (subProfileApiBtn) {
        subProfileApiBtn.addEventListener('click', () => {
            if (!currentSubCharId) return;
            // Trigger API specifically for this char
            if (window.tkGenerateCharVideos) {
                window.tkGenerateCharVideos(currentSubCharId, () => {
                    // re-render after generation
                    window.tkOpenSubProfile(currentSubCharId);
                });
            } else {
                window.showToast('生成功能未绑定');
            }
        });
    }

    // Add tkGenerateCharVideos to global scope
    window.tkGenerateCharVideos = async function(charId, callback) {
        if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
            window.showToast('请在系统设置中配置 API');
            return;
        }

        const char = window.tkGetChar(charId);
        if(!char) return;

        window.showToast('正在生成内容...');
        
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
你现在是一个 TikTok 视频内容生成器。请根据以下角色的设定和世界观，生成 3 条关于这个角色的 TikTok 视频数据。
角色名字：${char.name}
角色设定：${char.persona}
要求：整体风格符合该角色的性格和设定，视频画面用文字描述，富有镜头感。
必须返回严格的 JSON 格式（不要有 markdown 代码块标记，不要多余文字），格式如下：
[
  {
    "desc": "视频文案（简短，带tag）",
    "sceneText": "画面内容文字描述（例如：镜头特写...）",
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
            
            aiReply = aiReply.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedVideos = JSON.parse(aiReply);
            
            if (Array.isArray(parsedVideos)) {
                parsedVideos.forEach(v => {
                    tkState.videos.unshift({
                        id: 'v_' + Date.now() + Math.floor(Math.random() * 1000),
                        authorId: charId,
                        authorName: char.name,
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
                if(window.tkRenderHome) window.tkRenderHome();
                window.showToast('生成成功');
                if(callback) callback();
            } else {
                throw new Error('JSON is not an array');
            }

        } catch (error) {
            console.error('Gen Error:', error);
            window.showToast('生成失败，请检查 API 配置');
        }
    };

    window.tkRenderProfile = function() {
        const p = tkState.profile;
        
        // Render Info
        if (nameEl) nameEl.textContent = p.name || 'User';
        if (handleEl) handleEl.textContent = '@' + (p.handle || 'user123');
        if (bioEl) bioEl.textContent = p.bio || '点击添加个人简介';
        
        if (p.status) {
            if(statusBubble) {
                statusBubble.style.display = 'block';
                statusBubble.textContent = p.status;
            }
        } else {
            if(statusBubble) statusBubble.style.display = 'none';
        }

        statFollowing.textContent = p.following || 0;
        statFollowers.textContent = p.followers || 0;
        statLikes.textContent = p.likes || 0;

        // Render Avatar
        if (p.avatar) {
            avatarImg.src = p.avatar;
            avatarImg.style.display = 'block';
            avatarIcon.style.display = 'none';
        } else {
            avatarImg.src = '';
            avatarImg.style.display = 'none';
            avatarIcon.style.display = 'block';
        }

        renderGrid();
    };

    // Edit Status
    if (statusBubble) {
        statusBubble.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.showCustomModal) {
                window.showCustomModal({
                    title: '设置状态',
                    type: 'prompt',
                    placeholder: '输入你的当前状态...',
                    defaultValue: tkState.profile.status,
                    onConfirm: (val) => {
                        tkState.profile.status = val;
                        window.saveGlobalData();
                        window.tkRenderProfile();
                        if (window.tkRenderChat) window.tkRenderChat(); // update chat self item
                    }
                });
            } else {
                const ns = prompt('输入你的当前状态:', tkState.profile.status);
                if (ns !== null) {
                    tkState.profile.status = ns;
                    window.saveGlobalData();
                    window.tkRenderProfile();
                }
            }
        });
    }

    // Avatar Upload Logic
    if (avatarBtn && avatarUpload) {
        avatarBtn.addEventListener('click', (e) => {
            // Prevent opening upload if clicked on status bubble or plus icon
            if (e.target === statusBubble || e.target.closest('.tk-avatar-plus')) {
                // If plus clicked, also trigger upload
                if (e.target.closest('.tk-avatar-plus')) {
                    avatarUpload.click();
                }
                return;
            }
            avatarUpload.click();
        });

        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    tkState.profile.avatar = event.target.result;
                    // Also sync to main emulator user state if needed
                    if (window.userState) {
                        window.userState.avatarUrl = event.target.result;
                    }
                    window.saveGlobalData();
                    window.tkRenderProfile();
                    if (window.tkRenderChat) window.tkRenderChat();
                    window.showToast('头像已更新');
                };
                reader.readAsDataURL(file);
            }
            e.target.value = '';
        });
    }

    // Top Left Button -> Add Character / Import
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', () => {
            if (window.tkOpenImportSheet) window.tkOpenImportSheet();
        });
    }

    // Edit Profile Logic
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const p = tkState.profile;
            editNameInput.value = p.name || '';
            editHandleInput.value = p.handle || '';
            editBioInput.value = p.bio || '';
            editPersonaInput.value = p.persona || '';
            
            if(editFollowingInput) editFollowingInput.value = p.following || 0;
            if(editFollowersInput) editFollowersInput.value = p.followers || 0;
            if(editLikesInput) editLikesInput.value = p.likes || 0;
            
            window.openView(editSheet);
        });
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            tkState.profile.name = editNameInput.value.trim() || 'User';
            tkState.profile.handle = editHandleInput.value.trim() || 'user123';
            tkState.profile.bio = editBioInput.value.trim() || '';
            tkState.profile.persona = editPersonaInput.value.trim() || '';
            
            if(editFollowingInput) tkState.profile.following = parseInt(editFollowingInput.value) || 0;
            if(editFollowersInput) tkState.profile.followers = parseInt(editFollowersInput.value) || 0;
            if(editLikesInput) tkState.profile.likes = parseInt(editLikesInput.value) || 0;

            // Sync to main
            if (window.userState) {
                window.userState.name = tkState.profile.name;
            }

            window.saveGlobalData();
            window.tkRenderProfile();
            window.closeView(editSheet);
            window.showToast('资料已保存');
        });
    }

    // Message Button Logic (Placeholder)
    if (msgBtn) {
        msgBtn.addEventListener('click', () => {
            document.querySelector('.tk-bottom-nav .tk-nav-item[data-target="tk-chat-tab"]').click();
        });
    }

    // Grid Tabs Logic
    const profileTabs = document.querySelectorAll('.tk-ptab');
    const indicator = document.querySelector('.tk-ptab-indicator');
    const gridContainer = document.getElementById('tk-profile-grid');

    profileTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            profileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            indicator.style.transform = `translateX(${index * 100}%)`;
            
            // Re-render grid based on tab
            const target = tab.getAttribute('data-target');
            renderGrid(target);
        });
    });

    function renderGrid(target = 'videos') {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';
        
        let items = [];
        if (target === 'videos') {
            items = tkState.profile.posts || [];
        } else if (target === 'liked') {
            items = tkState.videos.filter(v => v.isLiked);
        }
        
        if (items.length === 0) {
            gridContainer.innerHTML = '<div style="grid-column: span 3; padding: 40px 0; text-align: center; color: #999; font-size: 13px;">暂无内容</div>';
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'tk-grid-item';
            // Simple mockup of a video cover
            el.innerHTML = `
                <div class="tk-grid-text">${item.sceneText ? item.sceneText.substring(0, 20) + '...' : '视频片段'}</div>
                <div class="tk-grid-views"><i class="fas fa-play"></i> ${item.likes || Math.floor(Math.random()*1000)}</div>
            `;
            gridContainer.appendChild(el);
        });
    }
});
