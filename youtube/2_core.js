// 2. DOM Elements
    const ytView = document.getElementById('youtube-view');
    const subChannelView = document.getElementById('sub-channel-view');
    const dockIconYt = document.getElementById('dock-icon-youtube');
    const backBtn = document.getElementById('yt-back-btn');
    
    // Bottom Nav
    const navItems = document.querySelectorAll('.yt-nav-item');
    const navIndicator = document.getElementById('yt-nav-indicator');
    const tabContents = document.querySelectorAll('.yt-tab-content');

    // Home Tab Elements
    const subsList = document.getElementById('yt-subs-list');
    const liveSection = document.getElementById('yt-live-section');
    const emptyState = document.getElementById('yt-empty-state');
    const filterBubbles = document.querySelectorAll('.yt-filter-bubble');

    // Profile Tab Elements
    const profileName = document.getElementById('yt-profile-name');
    const profileHandle = document.getElementById('yt-profile-handle');
    const profileAvatarImg = document.getElementById('yt-profile-avatar-img');
    const profileAvatarIcon = document.querySelector('.yt-profile-avatar i');
    const profileHeaderBg = document.querySelector('.yt-profile-header-bg');
    const profileSubs = document.getElementById('yt-profile-subs');
    const profileVideos = document.getElementById('yt-profile-videos');
    const profileTabIndicator = document.getElementById('profile-tab-indicator');
    
    // Edit Channel Elements
    const editChannelBtn = document.getElementById('yt-edit-channel-btn');
    const editChannelSheet = document.getElementById('yt-edit-channel-sheet');
    const confirmEditBtn = document.getElementById('confirm-yt-edit-btn');

    // Edit Inputs
    const editNameInput = document.getElementById('yt-edit-name-input');
    const editHandleInput = document.getElementById('yt-edit-handle-input');
    const editUrlInput = document.getElementById('yt-edit-url-input');
    const editSubsInput = document.getElementById('yt-edit-subs-input');
    const editVideosInput = document.getElementById('yt-edit-videos-input');
    const editPersonaInput = document.getElementById('yt-edit-persona-input');
    
    // Edit Uploads
    const editBannerBtn = document.getElementById('yt-edit-banner-btn');
    const bannerUpload = document.getElementById('yt-banner-upload');
    const editBannerImg = document.getElementById('yt-edit-banner-img');
    
    const editAvatarWrapper = document.getElementById('yt-edit-avatar-wrapper');
    const avatarUpload = document.getElementById('yt-avatar-upload');
    const editAvatarImg = document.getElementById('yt-edit-avatar-img');
    const editAvatarIcon = document.querySelector('#yt-edit-avatar-preview i');

    // 3. App Launch & Close Logic
    if (dockIconYt && ytView) {
        dockIconYt.addEventListener('click', (e) => {
            if (window.isJiggleMode || window.preventAppClick) { e.preventDefault(); e.stopPropagation(); return; }
            if (!ytUserState && window.userState) {
                ytUserState = { ...window.userState }; // Shallow copy
            }
            if (!ytUserState) ytUserState = {}; // Fallback
            syncYtProfile();
            ytView.classList.add('active');
            renderSubscriptions();
            renderVideos();
        });
    }

    if (backBtn && ytView) {
        backBtn.addEventListener('click', () => {
            ytView.classList.remove('active');
        });
    }

    // 4. Bottom Nav Interaction
    
    // --- Messages Tab Logic ---
    const msgFilterDm = document.getElementById('msg-filter-dm');
    const msgFilterCommunity = document.getElementById('msg-filter-community');
    const msgFilterBusiness = document.getElementById('msg-filter-business');
    const msgListContainer = document.getElementById('yt-messages-list');
    const msgRefreshBtn = document.getElementById('yt-messages-refresh-btn');
    let currentMsgFilter = 'dm';

    if (msgRefreshBtn) {
        msgRefreshBtn.addEventListener('click', async () => {
            if (!window.apiConfig || !window.apiConfig.endpoint || !window.apiConfig.apiKey) {
                if(window.showToast) window.showToast('请先配置 API');
                renderMessagesList();
                return;
            }
            
            if (currentMsgFilter === 'community') {
                if(window.showToast) window.showToast('社群不支持魔法棒生成');
                return;
            }

            msgRefreshBtn.style.opacity = '0.5';
            msgRefreshBtn.style.pointerEvents = 'none';
            if(window.showToast) window.showToast('正在生成新消息...');

            let wbContext = '';
            if (channelState && channelState.boundWorldBookIds && Array.isArray(channelState.boundWorldBookIds) && window.getWorldBooks) {
                const wbs = window.getWorldBooks();
                channelState.boundWorldBookIds.forEach(id => {
                    const boundWb = wbs.find(w => w.id === id);
                    if (boundWb && boundWb.entries) {
                        wbContext += `\n【${boundWb.name}】:\n` + boundWb.entries.map(e => `${e.keyword}: ${e.content}`).join('\n');
                    }
                });
            }

            const userPersona = (ytUserState && ytUserState.persona) ? ytUserState.persona : (window.userState ? (window.userState.persona || '普通用户') : '普通用户');
            
            const filterTypeAtRequest = currentMsgFilter;
            let prompt = '';
            if (filterTypeAtRequest === 'business') {
                prompt = `仔细阅读我的用户人设，根据我的用户人设生成3-5个**为你量身定制**的商务合作/赞助/联动邀请。
要求发件人是不同的品牌方、赞助商或希望联动的博主。合作内容必须与我的人设息息相关！
绝对不要使用任何 Emoji 表情符号，句子末尾不要使用句号。
我的用户人设："${userPersona}"。
世界观背景：${wbContext}
返回严格的JSON格式：
{
  "users": [
    {
      "name": "发件人名字(必须纯品牌名或频道名，绝对禁止在名字中添加'PR'、'经理'、'负责人'、'官方'等任何后缀！)",
      "avatarDesc": "英文单词描述头像(如: business logo)",
      "messages": [
        { "type": "text", "content": "你好！我们是某某品牌" },
        { "type": "text", "content": "看了你的内容非常感兴趣" },
        { "type": "offer", "offerData": { 
            "title": "游戏试玩推广", 
            "offerType": "填入枚举值: video(定制视频) 或 live(工商直播) 或 post(图文宣发) 或 collab(博主联动)",
            "requirement": "详细说明植入要求或直播要求，必须明确！", 
            "price": "$5000",
            "rmbAmount": 35000,
            "penalty": "$2000",
            "rmbPenalty": 14000
          } 
        }
      ]
    }
  ]
}
注意：每个发件人的 messages 数组中，除了前面的文字寒暄，最后一条必须是 type 为 "offer" 的商单卡片。
offerData.price 用于展示，offerData.rmbAmount 是纯数字，代表换算成人民币的金额。只能返回纯JSON。`;
            } else if (filterTypeAtRequest === 'dm') {
                prompt = `仔细阅读我的用户人设，生成3-5个不同的陌生人、同行或粉丝给你发私信的数据。
私信内容必须**强烈受我的人设影响**！他们可能是被你的人设吸引，也可能是针对你人设的某些特征来找你搭话。
绝对不要使用任何 Emoji 表情符号，句子末尾不要使用句号，语气要像真实的活人聊天。
我的用户人设："${userPersona}"。
世界观背景：${wbContext}
返回严格的JSON格式：
{
  "users": [
    {
      "name": "陌生人/同行/粉丝名字",
      "avatarDesc": "英文单词描述头像",
      "messages": [
        { "type": "text", "content": "第一条消息内容" },
        { "type": "text", "content": "第二条消息内容" }
      ]
    }
  ]
}
注意：只能返回纯JSON。`;
            }

            try {
                let endpoint = window.apiConfig.endpoint;
                if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
                if(!endpoint.endsWith('/chat/completions')) {
                    endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
                }

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.apiConfig.apiKey}`
                    },
                    body: JSON.stringify({
                        model: window.apiConfig.model || 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.9,
                        response_format: { type: "json_object" } 
                    })
                });

                if (!res.ok) throw new Error("API failed");
                const data = await res.json();
                let resultText = data.choices[0].message.content;
                let jsonMatch = resultText.match(/\{[\s\S]*\}/);
                resultText = jsonMatch ? jsonMatch[0] : resultText;
                const parsed = sanitizeObj(JSON.parse(resultText));

                if (parsed.users && Array.isArray(parsed.users)) {
                    const isBusiness = filterTypeAtRequest === 'business';
                    parsed.users.forEach(u => {
                        const newSub = {
                            id: 'gen_user_' + Date.now() + Math.floor(Math.random()*10000),
                            name: u.name,
                            handle: u.name.toLowerCase().replace(/\s+/g, ''),
                            avatar: `https://picsum.photos/seed/${u.avatarDesc ? u.avatarDesc.replace(/\s+/g, '') : Date.now()}/80/80?grayscale`,
                            isBusiness: isBusiness,
                            isFriend: false, // 默认都是陌生人，需要手动添加好友
                            isSubscribed: false, // 默认未订阅
                            dmHistory: u.messages.map(m => {
                                if (m.type === 'offer') {
                                    return {
                                        type: 'char',
                                        name: u.name,
                                        isOffer: true,
                                        offerData: m.offerData || { title: '合作邀请', offerType: 'video', requirement: '详谈', price: '￥5000', penalty: '￥2000' },
                                        offerStatus: 'pending' // pending, accepted, rejected, completed, failed
                                    };
                                } else {
                                    return {
                                        type: 'char',
                                        name: u.name,
                                        text: m.content || m.text || (typeof m === 'string' ? m : "你好")
                                    };
                                }
                            })
                        };
                        mockSubscriptions.unshift(newSub);
                    });
                    saveYoutubeData();
                    renderMessagesList();
                    if(window.showToast) window.showToast(`收到 ${parsed.users.length} 位新联系人的消息`);
                }

            } catch (e) {
                console.error("Generate MSG Error: ", e);
                if(window.showToast) window.showToast('无法生成新消息，请重试');
            } finally {
                msgRefreshBtn.style.opacity = '1';
                msgRefreshBtn.style.pointerEvents = 'auto';
            }
        });
    }

    if (msgFilterDm && msgFilterCommunity && msgFilterBusiness) {
        msgFilterDm.addEventListener('click', () => {
            msgFilterDm.classList.add('active');
            msgFilterCommunity.classList.remove('active');
            msgFilterBusiness.classList.remove('active');
            currentMsgFilter = 'dm';
            renderMessagesList();
        });
        msgFilterCommunity.addEventListener('click', () => {
            msgFilterCommunity.classList.add('active');
            msgFilterDm.classList.remove('active');
            msgFilterBusiness.classList.remove('active');
            currentMsgFilter = 'community';
            renderMessagesList();
        });
        msgFilterBusiness.addEventListener('click', () => {
            msgFilterBusiness.classList.add('active');
            msgFilterCommunity.classList.remove('active');
            msgFilterDm.classList.remove('active');
            currentMsgFilter = 'business';
            renderMessagesList();
        });
    }

    function renderMessagesList() {
        if (!msgListContainer) return;
        msgListContainer.innerHTML = '';

        if (currentMsgFilter === 'business' || currentMsgFilter === 'dm') {
            const isBusiness = currentMsgFilter === 'business';
            const allTargetSubs = mockSubscriptions.filter(sub => sub.isBusiness === isBusiness && (sub.isFriend || (sub.dmHistory && sub.dmHistory.length > 0)));
            
            if (allTargetSubs.length === 0) {
                msgListContainer.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 100px; color: #8e8e93;">
                        <i class="fas ${isBusiness ? 'fa-envelope-open-text' : 'fa-comment-dots'}" style="font-size: 48px; margin-bottom: 16px; color: #d1d1d6;"></i>
                        <p style="font-size: 15px;">暂无${isBusiness ? '商务' : '私信'}消息</p>
                    </div>
                `;
                return;
            }

            const friends = allTargetSubs.filter(s => s.isFriend);
            const strangers = allTargetSubs.filter(s => !s.isFriend);

            const renderSubList = (subsArr, title) => {
                if (subsArr.length === 0) return '';
                const wrapper = document.createElement('div');
                wrapper.innerHTML = `<div style="font-size: 14px; font-weight: 600; color: #8e8e93; margin: 16px 4px 8px;">${title} (${subsArr.length})</div>`;
                
                const listWrapper = document.createElement('div');
                listWrapper.style.backgroundColor = '#ffffff';
                listWrapper.style.borderRadius = '16px';
                listWrapper.style.overflow = 'hidden';
                listWrapper.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';

                subsArr.forEach((sub, index) => {
                    const el = document.createElement('div');
                    el.style.display = 'flex';
                    el.style.alignItems = 'center';
                    el.style.gap = '15px';
                    el.style.cursor = 'pointer';
                    el.style.padding = '16px';
                    el.style.backgroundColor = '#ffffff';
                    if (index < subsArr.length - 1) {
                        el.style.borderBottom = '1px solid #f2f2f2';
                    }
                    
                    const lastMsg = sub.dmHistory[sub.dmHistory.length - 1];
                    let lastMsgText = lastMsg.isOffer ? '[商单邀请]' : (lastMsg.text || '...');
                    let lastMsgTime = '刚刚';

                    const badgeHtml = sub.isBusiness ? `<span style="font-size:10px; background:#e8f5e9; color:#388e3c; padding:2px 4px; border-radius:4px; margin-left:4px;">商务</span>` : '';

                    el.innerHTML = `
                        <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <img src="${sub.avatar}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="flex: 1; overflow: hidden;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                                <div style="font-size: 16px; font-weight: 600; color: #0f0f0f; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${sub.name} ${badgeHtml}</div>
                                <div style="font-size: 12px; color: #8e8e93;">${lastMsgTime}</div>
                            </div>
                            <div style="font-size: 13px; color: #606060; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${lastMsgText}</div>
                        </div>
                    `;
                    
                    el.addEventListener('click', () => {
                        currentSubChannelData = sub;
                        openDMChat(sub);
                    });
                    
                    listWrapper.appendChild(el);
                });
                wrapper.appendChild(listWrapper);
                return wrapper;
            };

            if (friends.length > 0) {
                msgListContainer.appendChild(renderSubList(friends, '我的好友'));
            }
            if (strangers.length > 0) {
                msgListContainer.appendChild(renderSubList(strangers, '消息请求'));
            }
            return;
        }

        // Community Tab - Render joined fan groups
        let joinedGroups = [];
        mockSubscriptions.forEach(sub => {
            if (sub.generatedContent && sub.generatedContent.fanGroup && sub.generatedContent.fanGroup.isJoined) {
                joinedGroups.push({
                    subData: sub,
                    group: sub.generatedContent.fanGroup
                });
            }
        });

        if (joinedGroups.length === 0) {
            msgListContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 100px; color: #8e8e93;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; color: #d1d1d6;"></i>
                    <p style="font-size: 15px;">你还没有加入任何粉丝群</p>
                </div>
            `;
            return;
        }

        const listWrapper = document.createElement('div');
        listWrapper.style.backgroundColor = '#ffffff';
        listWrapper.style.borderRadius = '16px';
        listWrapper.style.overflow = 'hidden';
        listWrapper.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';

        joinedGroups.forEach((item, index) => {
            const el = document.createElement('div');
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.gap = '15px';
            el.style.cursor = 'pointer';
            el.style.padding = '16px';
            el.style.backgroundColor = '#ffffff';
            if (index < joinedGroups.length - 1) {
                el.style.borderBottom = '1px solid #f2f2f2';
            }
            
            let groupAvatarHtml = `
                <div style="width: 50px; height: 50px; border-radius: 50%; background: #ffcc00; display: flex; justify-content: center; align-items: center; color: white; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <i class="fas fa-users" style="font-size: 20px;"></i>
                </div>
            `;
            
            if (item.group.avatar) {
                groupAvatarHtml = `
                    <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <img src="${item.group.avatar}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                `;
            }
            
            el.innerHTML = `
                ${groupAvatarHtml}
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-size: 16px; font-weight: 600; color: #0f0f0f; margin-bottom: 4px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${item.group.name || '粉丝群'}</div>
                    <div style="font-size: 13px; color: #606060; display: flex; align-items: center; gap: 6px;">
                        <img src="${item.subData.avatar}" style="width: 16px; height: 16px; border-radius: 50%;"> 
                        <span style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${item.subData.name} 的专属社群 • ${item.group.memberCount || '3000人'}</span>
                    </div>
                </div>
                <div style="color: #ccc;"><i class="fas fa-chevron-right"></i></div>
            `;
            
            el.addEventListener('click', () => {
                currentSubChannelData = item.subData; // Required for openFanGroupChat to know context
                openFanGroupChat(item.group);
            });
            
            listWrapper.appendChild(el);
        });
        msgListContainer.appendChild(listWrapper);
    }


    function updateNavIndicator(activeItem) {
        if (!activeItem || !navIndicator) return;
        const containerRect = activeItem.parentElement.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const relativeLeft = itemRect.left - containerRect.left;
        navIndicator.style.width = `${itemRect.width}px`;
        navIndicator.style.left = `${relativeLeft}px`;
    }

    setTimeout(() => {
        const activeNav = document.querySelector('.yt-nav-item.active');
        if(activeNav) updateNavIndicator(activeNav);
    }, 100);

    const ytCreateSheet = document.getElementById('yt-create-sheet');
    const ytNavPlusBtn = document.getElementById('yt-nav-plus-btn');

    if(ytNavPlusBtn && ytCreateSheet) {
        ytNavPlusBtn.addEventListener('click', () => {
            ytCreateSheet.classList.add('active');
        });

        ytCreateSheet.addEventListener('mousedown', (e) => {
            if (e.target === ytCreateSheet) {
                ytCreateSheet.classList.remove('active');
            }
        });
        
        const createBtns = ytCreateSheet.querySelectorAll('.yt-create-bubble-btn');
        createBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                ytCreateSheet.classList.remove('active');
            });
        });
    }

    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            if(item.classList.contains('yt-nav-item-center')) return;

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            updateNavIndicator(item);

            const targetId = item.getAttribute('data-target');
            tabContents.forEach(tab => {
                if (tab.id === targetId) {
                    tab.classList.add('active');
                    // Add hook for rendering messages
                    if (targetId === 'yt-messages-tab') {
                        renderMessagesList();
                    }
                } else {
                    tab.classList.remove('active');
                }
            });
        });
    });
    
    window.addEventListener('resize', () => {
        const activeNav = document.querySelector('.yt-nav-item.active');
        if(activeNav) updateNavIndicator(activeNav);
    });

    // 5. Data Rendering Logic
    function renderSubscriptions() {
        if (!subsList) return;
        subsList.innerHTML = '';

        document.querySelector('.yt-subscriptions-wrapper').style.display = 'flex';

        if (!hasSubscriptions || mockSubscriptions.length === 0) {
            const el = document.createElement('div');
            el.className = `yt-sub-item`;
            el.innerHTML = `
                <div class="yt-sub-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <span class="yt-sub-name">暂无订阅</span>
            `;
            subsList.appendChild(el);
            return;
        }

        // Only render actually subscribed channels in the top bar
        const realSubscriptions = mockSubscriptions.filter(s => s.isSubscribed !== false);
        
        if (realSubscriptions.length === 0 && mockSubscriptions.length > 0) {
            const el = document.createElement('div');
            el.className = `yt-sub-item`;
            el.innerHTML = `
                <div class="yt-sub-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <span class="yt-sub-name">暂无订阅</span>
            `;
            subsList.appendChild(el);
        } else {
            realSubscriptions.forEach(sub => {
                const el = document.createElement('div');
                el.className = `yt-sub-item ${sub.isLive ? 'has-live' : ''}`;
                el.innerHTML = `
                    <div class="yt-sub-avatar">
                        <img src="${sub.avatar}" alt="${sub.name}">
                    </div>
                    <span class="yt-sub-name">${sub.name}</span>
                `;
                el.addEventListener('click', () => {
                    openSubChannelView(sub);
                });
                subsList.appendChild(el);
            });
        }

        const allBtn = document.querySelector('.yt-sub-all-btn');
        const allSubsSheet = document.getElementById('yt-all-subs-sheet');
        if(allBtn && allSubsSheet) {
            allBtn.onclick = () => {
                const list = document.getElementById('yt-all-subs-list');
                list.innerHTML = '';
                mockSubscriptions.forEach(sub => {
                    const item = document.createElement('div');
                    item.className = 'account-card';
                    item.innerHTML = `
                        <div class="account-content" style="cursor:pointer;">
                            <div class="account-avatar"><img src="${sub.avatar}" stylewidth:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                            <div class="account-info">
                                <div class="account-name">${sub.name}</div>
                                <div class="account-detail">${sub.subs || '0'} 订阅者</div>
                            </div>
                        </div>
                    `;
                    item.addEventListener('click', () => {
                        allSubsSheet.classList.remove('active');
                        openSubChannelView(sub);
                    });
                    list.appendChild(item);
                });
                allSubsSheet.classList.add('active');
            };
            
            allSubsSheet.addEventListener('mousedown', (e) => {
                if(e.target === allSubsSheet) allSubsSheet.classList.remove('active');
            });
        }
    }

    let currentFilter = '全部';

    filterBubbles.forEach(bubble => {
        bubble.addEventListener('click', () => {
            filterBubbles.forEach(b => b.classList.remove('active'));
            bubble.classList.add('active');
            currentFilter = bubble.textContent;
            renderVideos();
        });
    });

    function renderVideos() {
        if (!liveSection || !emptyState) return;
        liveSection.innerHTML = '';

        let filteredVideos = mockVideos;
        if (currentFilter === '正在直播') {
            filteredVideos = mockVideos.filter(v => v.isLive);
        }

        if (filteredVideos.length === 0) {
            liveSection.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.querySelector('p').textContent = '暂无符合条件的视频';
            return;
        }

        liveSection.style.display = 'flex';
        emptyState.style.display = 'none';

        // Only show videos from subscribed channels
        const realFilteredVideos = filteredVideos.filter(v => v.channelData && v.channelData.isSubscribed !== false);
        
        if (realFilteredVideos.length === 0) {
            liveSection.style.display = 'none';
            emptyState.style.display = 'flex';
            emptyState.querySelector('p').textContent = '暂无符合条件的视频';
            return;
        }

        realFilteredVideos.forEach(video => {
            const channel = video.channelData;
            const liveBadgeHtml = video.isLive ? `<div class="yt-live-badge"><i class="fas fa-broadcast-tower" style="font-size: 10px;"></i> LIVE</div>` : '';

            const el = document.createElement('div');
            el.className = 'yt-video-card';
            el.innerHTML = `
                <div class="yt-video-thumbnail">
                    <img src="${video.thumbnail || 'https://picsum.photos/320/180?grayscale'}" alt="Thumbnail">
                    ${liveBadgeHtml}
                </div>
                <div class="yt-video-info">
                    <div class="yt-video-avatar" style="cursor: pointer; border: 1px solid #e5e5e5; transition: transform 0.2s;">
                        <img src="${channel.avatar || 'https://picsum.photos/80/80?grayscale'}" alt="${channel.name}">
                    </div>
                    <div class="yt-video-details">
                        <h3 class="yt-video-title">${video.title || '无标题'}</h3>
                        <p class="yt-video-meta">${channel.name} • ${video.views || '0'} • ${video.time || '刚刚'}</p>
                    </div>
                </div>
            `;
            
            el.addEventListener('click', () => {
                if(channel.id === 'user_channel_id' && video.isLive) {
                    const userLiveView = document.getElementById('yt-user-live-view');
                    if (userLiveView) userLiveView.classList.add('active');
                } else {
                    openVideoPlayer(video);
                }
            });

            const avatarBtn = el.querySelector('.yt-video-avatar');
            avatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSubChannelView(channel);
            });

            liveSection.appendChild(el);
        });
    }

    function syncYtProfile() {
        if (ytUserState) {
            const nameStr = ytUserState.name || 'User';
            if (profileName) profileName.textContent = nameStr;
            
            const handleStr = ytUserState.handle || nameStr.toLowerCase().replace(/\s+/g, '');
            if (profileHandle) profileHandle.textContent = '@' + handleStr;
            
            if (ytUserState.avatarUrl) {
                if (profileAvatarImg) {
                    profileAvatarImg.src = ytUserState.avatarUrl;
                    profileAvatarImg.style.display = 'block';
                }
                if (profileAvatarIcon) profileAvatarIcon.style.display = 'none';
            } else {
                if (profileAvatarImg) profileAvatarImg.style.display = 'none';
                if (profileAvatarIcon) profileAvatarIcon.style.display = 'block';
            }
            
            if (channelState.bannerUrl && profileHeaderBg) {
                profileHeaderBg.style.backgroundImage = `url('${channelState.bannerUrl}')`;
            } else if (profileHeaderBg) {
                profileHeaderBg.style.backgroundImage = 'none';
            }

            if (profileSubs) {
                profileSubs.textContent = `${ytUserState.subs || '0'} 订阅者`;
            }
            if (profileVideos) {
                profileVideos.textContent = `${ytUserState.videos || '0'} 视频`;
            }
        }
    }

    if (editChannelBtn && editChannelSheet) {
        editChannelBtn.addEventListener('click', () => {
            if (!ytUserState) return;
            const nameStr = ytUserState.name || '';
            const handleStr = ytUserState.handle || nameStr.toLowerCase().replace(/\s+/g, '');
            
            if(editNameInput) editNameInput.value = nameStr;
            if(editHandleInput) editHandleInput.value = handleStr;
            if(editUrlInput) editUrlInput.value = channelState.url || `youtube.com/@${handleStr}`;
            if(editSubsInput) editSubsInput.value = ytUserState.subs || '';
            if(editVideosInput) editVideosInput.value = ytUserState.videos || '';
            if(editPersonaInput) editPersonaInput.value = ytUserState.persona || '';
            
            if (ytUserState.avatarUrl && editAvatarImg) {
                editAvatarImg.src = ytUserState.avatarUrl;
                editAvatarImg.style.display = 'block';
                if(editAvatarIcon) editAvatarIcon.style.display = 'none';
            } else {
                if(editAvatarImg) editAvatarImg.style.display = 'none';
                if(editAvatarIcon) editAvatarIcon.style.display = 'block';
            }
            
            if (channelState.bannerUrl && editBannerImg) {
                editBannerImg.src = channelState.bannerUrl;
                editBannerImg.style.display = 'block';
            } else {
                if(editBannerImg) editBannerImg.style.display = 'none';
            }
            editChannelSheet.classList.add('active');
        });
    }

    if (editHandleInput && editUrlInput) {
        editHandleInput.addEventListener('input', (e) => {
            const val = e.target.value.replace(/^@/, '');
            editUrlInput.value = val ? `youtube.com/@${val}` : 'youtube.com/@';
        });
    }

    if (editBannerBtn && bannerUpload) {
        editBannerBtn.addEventListener('click', () => bannerUpload.click());
        bannerUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (window.compressImage) {
                        window.compressImage(event.target.result, 800, 800, (compressedUrl) => {
                            if(editBannerImg) {
                                editBannerImg.src = compressedUrl;
                                editBannerImg.style.display = 'block';
                            }
                        });
                    } else {
                        if(editBannerImg) {
                            editBannerImg.src = event.target.result;
                            editBannerImg.style.display = 'block';
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (editAvatarWrapper && avatarUpload) {
        editAvatarWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
                avatarUpload.click();
            }
        });
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (window.compressImage) {
                        window.compressImage(event.target.result, 300, 300, (compressedUrl) => {
                            if(editAvatarImg) {
                                editAvatarImg.src = compressedUrl;
                                editAvatarImg.style.display = 'block';
                            }
                            if(editAvatarIcon) editAvatarIcon.style.display = 'none';
                        });
                    } else {
                        if(editAvatarImg) {
                            editAvatarImg.src = event.target.result;
                            editAvatarImg.style.display = 'block';
                        }
                        if(editAvatarIcon) editAvatarIcon.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (confirmEditBtn) {
        confirmEditBtn.addEventListener('click', () => {
            if (!ytUserState) ytUserState = {};
            if(editNameInput) ytUserState.name = editNameInput.value.trim();
            if(editHandleInput) ytUserState.handle = editHandleInput.value.trim().replace(/^@/, '');
            if(editSubsInput) ytUserState.subs = editSubsInput.value.trim();
            if(editVideosInput) ytUserState.videos = editVideosInput.value.trim();
            if(editPersonaInput) ytUserState.persona = editPersonaInput.value.trim();
            
            if (editAvatarImg && editAvatarImg.style.display === 'block' && editAvatarImg.src) {
                ytUserState.avatarUrl = editAvatarImg.src;
            }
            if (editBannerImg && editBannerImg.style.display === 'block' && editBannerImg.src) {
                channelState.bannerUrl = editBannerImg.src;
            }
            if(editUrlInput) channelState.url = editUrlInput.value.trim();

            syncYtProfile();
            if(editChannelSheet) editChannelSheet.classList.remove('active');
            saveYoutubeData();
            if (window.showToast) window.showToast('频道信息已保存');
            renderVideos(); // Refresh avatars in video list
        });
    }

    if (editChannelSheet) {
        editChannelSheet.addEventListener('mousedown', (e) => {
            if (e.target === editChannelSheet) {
                editChannelSheet.classList.remove('active');
            }
        });
    }
