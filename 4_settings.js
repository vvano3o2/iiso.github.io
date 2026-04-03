// --- YouTube Settings & Binding Logic ---
    const ytSettingsSheet = document.getElementById('yt-settings-sheet');
    const ytBindWbBtn = document.getElementById('yt-bind-wb-btn');
    const bindWbSheet = document.getElementById('bind-world-book-sheet');
    const ytPromptSheet = document.getElementById('yt-prompt-sheet');
    const ytExportDataBtn = document.getElementById('yt-export-data-btn');
    const ytImportDataBtn = document.getElementById('yt-import-data-btn');
    const ytImportDataFile = document.getElementById('yt-import-data-file');
    const ytClearDataBtn = document.getElementById('yt-clear-data-btn');

    if (ytExportDataBtn) {
        ytExportDataBtn.addEventListener('click', () => {
            const dataToExport = {
                channelState: channelState,
                subscriptions: mockSubscriptions,
                userState: ytUserState
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "youtube_emulator_data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            if(window.showToast) window.showToast('数据已导出');
            if(ytSettingsSheet) ytSettingsSheet.classList.remove('active');
        });
    }

    if (ytImportDataBtn && ytImportDataFile) {
        ytImportDataBtn.addEventListener('click', () => ytImportDataFile.click());
        ytImportDataFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (importedData.channelState) channelState = importedData.channelState;
                    if (importedData.subscriptions) {
                        mockSubscriptions = importedData.subscriptions;
                        hasSubscriptions = mockSubscriptions.length > 0;
                        mockVideos = [];
                        mockSubscriptions.forEach(sub => {
                            if (sub.generatedContent && sub.generatedContent.currentLive) {
                                mockVideos.push({
                                    title: sub.generatedContent.currentLive.title,
                                    views: sub.generatedContent.currentLive.views,
                                    time: 'LIVE',
                                    thumbnail: sub.generatedContent.currentLive.thumbnail || 'https://picsum.photos/320/180?grayscale',
                                    isLive: true,
                                    comments: sub.generatedContent.currentLive.comments || [],
                                    initialBubbles: sub.generatedContent.currentLive.initialBubbles || [],
                                    guest: sub.generatedContent.currentLive.guest || null,
                                    channelData: sub
                                });
                            }
                        });
                    }
                    if (importedData.userState) ytUserState = importedData.userState;
                    
                    saveYoutubeData();
                    syncYtProfile();
                    renderSubscriptions();
                    renderVideos();
                    renderMessagesList();
                    
                    if(window.showToast) window.showToast('数据导入成功');
                    if(ytSettingsSheet) ytSettingsSheet.classList.remove('active');
                } catch (err) {
                    console.error("Import Error:", err);
                    if(window.showToast) window.showToast('导入失败，数据格式错误');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    if (ytClearDataBtn) {
        ytClearDataBtn.addEventListener('click', () => {
            if (window.showCustomModal) {
                window.showCustomModal({
                    title: '清空所有数据',
                    message: '确定要清空 YouTube 模拟器的所有数据吗？这包括频道状态、订阅、所有视频和聊天记录。此操作不可恢复。',
                    isDestructive: true,
                    confirmText: '清空',
                    onConfirm: () => {
                        localStorage.removeItem('yt_channel_state');
                        localStorage.removeItem('yt_subscriptions');
                        localStorage.removeItem('yt_user_state');
                        
                        // Reset memory state
                        channelState = {
                            bannerUrl: null,
                            url: '',
                            boundWorldBookIds: [],
                            systemPrompt: '',
                            summaryPrompt: '',
                            groupChatPrompt: '',
                            vodPrompt: '',
                            postPrompt: '',
                            liveSummaries: [],
                            groupChatHistory: [],
                            cachedTrendingLive: null,
                            cachedTrendingSub: null,
                            pastVideos: []
                        };
                        mockSubscriptions = [];
                        hasSubscriptions = false;
                        mockVideos = [];
                        ytUserState = null;
                        if (window.userState) ytUserState = { ...window.userState };
                        
                        syncYtProfile();
                        renderSubscriptions();
                        renderVideos();
                        renderMessagesList();
                        
                        if(window.showToast) window.showToast('所有数据已清空');
                        if(ytSettingsSheet) ytSettingsSheet.classList.remove('active');
                    }
                });
            } else {
                if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
                    localStorage.removeItem('yt_channel_state');
                    localStorage.removeItem('yt_subscriptions');
                    localStorage.removeItem('yt_user_state');
                    location.reload();
                }
            }
        });
    }

    if (mainSettingsBtn && ytSettingsSheet) {
        mainSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            ytSettingsSheet.classList.add('active');
        });
        
        ytSettingsSheet.addEventListener('mousedown', (e) => {
            if(e.target === ytSettingsSheet) ytSettingsSheet.classList.remove('active');
        });
    }

    if (ytBindWbBtn && bindWbSheet) {
        ytBindWbBtn.addEventListener('click', () => {
            ytSettingsSheet.classList.remove('active');
            renderWbBindList();
            bindWbSheet.classList.add('active');
        });
    }

    let tempBoundIds = [];

    if (ytBindWbBtn && bindWbSheet) {
        ytBindWbBtn.addEventListener('click', () => {
            ytSettingsSheet.classList.remove('active');
            tempBoundIds = [...(channelState.boundWorldBookIds || [])];
            renderWbBindList();
            bindWbSheet.classList.add('active');
        });
    }

    const confirmBindWbBtn = document.getElementById('confirm-bind-world-book-btn');
    if (confirmBindWbBtn) {
        confirmBindWbBtn.addEventListener('click', () => {
            channelState.boundWorldBookIds = [...tempBoundIds];
            const nameEl = document.getElementById('yt-bound-wb-name');
            if (nameEl) {
                if (channelState.boundWorldBookIds.length === 0) {
                    nameEl.textContent = '未绑定';
                } else if (channelState.boundWorldBookIds.length === 1) {
                    const wbs = window.getWorldBooks ? window.getWorldBooks() : [];
                    const wb = wbs.find(w => w.id === channelState.boundWorldBookIds[0]);
                    nameEl.textContent = wb ? wb.name : '已绑定 1 本';
                } else {
                    nameEl.textContent = `已绑定 ${channelState.boundWorldBookIds.length} 本`;
                }
            }
            saveYoutubeData();
            if(window.showToast) window.showToast('世界书绑定成功');
            bindWbSheet.classList.remove('active');
        });
    }

    function renderWbBindList() {
        const list = document.getElementById('bind-world-book-list');
        if(!list) return;
        list.innerHTML = '';
        
        const wbs = window.getWorldBooks ? window.getWorldBooks() : [];
        if (wbs.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding:20px; color:#8e8e93;">暂无世界书，请先在主界面创建</div>`;
            return;
        }

        wbs.forEach(wb => {
            const isSelected = tempBoundIds.includes(wb.id);
            const tokens = window.calculateTokens ? window.calculateTokens(wb.entries) : 0;
            
            const item = document.createElement('div');
            item.className = 'account-card';
            item.style.padding = '12px 16px';
            item.style.height = 'auto';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '16px';
            item.style.border = isSelected ? '2px solid var(--blue-color)' : '2px solid transparent';
            item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            item.style.position = 'relative';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; background-color: #1c1c1e; border-radius: 10px; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 16px;">
                            <i class="fas fa-book"></i>
                        </div>
                        <div>
                            <div style="font-size: 16px; font-weight: 500; color: #000;">${wb.name}</div>
                            <div style="font-size: 12px; color: #8e8e93; margin-top: 2px;">分组: ${wb.group || '未分组'}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 13px; color: #8e8e93;">+${tokens} Tokens</span>
                        <div style="width: 22px; height: 22px; border-radius: 50%; border: 1px solid ${isSelected ? 'var(--blue-color)' : '#c7c7cc'}; background-color: ${isSelected ? 'var(--blue-color)' : 'transparent'}; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 12px;">
                            ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            const styleFix = document.createElement('style');
            styleFix.innerHTML = `#bind-world-book-list .account-card::after { display: none !important; }`;
            item.appendChild(styleFix);

            item.addEventListener('click', () => {
                if (tempBoundIds.includes(wb.id)) {
                    tempBoundIds = tempBoundIds.filter(id => id !== wb.id);
                } else {
                    tempBoundIds.push(wb.id);
                }
                renderWbBindList();
            });
            
            list.appendChild(item);
        });
    }

    // Prompt Settings
    const ytPromptInput = document.getElementById('yt-prompt-input');
    const promptTabLive = document.getElementById('prompt-tab-live');
    const promptTabSummary = document.getElementById('prompt-tab-summary');
    const promptTabGroup = document.getElementById('prompt-tab-group');
    const promptDesc = document.getElementById('yt-prompt-desc');
    let currentPromptTab = 'live';

    const defaultPrompt = `你正在进行YouTube直播，你的名字是"{char}"。
你的人设和简介："{char_persona}"。
当前和你互动的是观众"{user}"，ta的人设："{user_persona}"。
世界观背景：{wb_context}
最近的直播经历：{live_summary_context}
{context_clue}
{msg_context}

请根据你的设定，生成符合你人设风格的直播回应。
具体要求：
1. charBubbles: 主播（你）的回应。
   - 绝对不要复述观众的话或SC留言！
   - 返回1-3条气泡（字符串数组）。每条限制在30字内。
   - 格式要求：动作请用全角括号包裹（例如：（微笑）），环境和氛围请用简短的词语描述在括号里。然后再接语言。
   - 绝对禁止使用任何 Emoji 表情符号！
   - 句子末尾不要使用句号，语气要像活人聊天。
2. passerbyComments: 路人观众在公屏发表的评论（吃瓜群众）。**注意：主播（Char）的回复绝对不要出现在这里！绝对不要使用 Emoji 和句末句号！**
3. randomSuperChat: （可选）随机生成一条其他人的打赏。
   - 必须根据打赏观众的国籍或名字特征，显示不同国家/地区的货币符号和金额（例如：$50, ¥100, €20, £30, JP¥5000 等）。如果不确定，可随机使用一种。
   - displayAmount: 用于展示给用户的金额（带货币符号的字符串）。
   - amount: 用于后台统计的纯数字（代表换算成人民币的大致金额）。

必须返回严格的 JSON 格式，如下：
{
  "charBubbles": ["（喝了口水，氛围轻松）大家晚上好呀", "（笑）谢谢大家的礼物"],
  "passerbyComments": [
    {"name": "路人甲", "text": "前排围观"},
    {"name": "John Doe", "text": "This is awesome"}
  ],
  "randomSuperChat": {
    "hasSuperChat": true,
    "name": "富哥",
    "displayAmount": "JP¥5000",
    "amount": 250,
    "text": "主播辛苦了",
    "color": "#e65100"
  }
}`;

    const defaultSummaryPrompt = `请为刚刚结束的这场直播写一份“直播总结报告”。
你的名字是"{char}"。你的人设和简介："{char_persona}"。
这场直播中与你互动的主要观众是"{user}"。
当前时间：{current_time}
以下是本次直播的真实聊天记录摘要：
{chat_history}

请严格基于上述聊天记录生成一份详细的直播回忆总结，不要编造不存在的情节。
要求：
1. 字数控制在200字以内，简化描述，去除冗余修饰。
2. 专注于核心互动、关键事件和直播间的整体氛围。
3. 包含 date, title, content, interaction, atmosphere 字段。
4. 绝对不要使用任何 Emoji 表情符号，句子末尾不要使用句号。

返回严格的 JSON 格式：
{
  "date": "使用当前真实时间",
  "title": "简短标题",
  "content": "简要概括做了什么",
  "interaction": "与观众的互动亮点",
  "atmosphere": "整体氛围",
  "newSubs": 150
}`;

    const defaultGroupChatPrompt = `你正在粉丝群里水群，你的名字是"{char}"。
你的人设和简介："{char_persona}"。
用户"{user}"也在群里，ta的人设："{user_persona}"。
世界观背景：{wb_context}
最近的直播经历：{live_summary_context}

群聊历史记录：
{chat_history}

{trigger_instruction}

请生成群聊回复。
返回严格的 JSON 格式：
{
  "charReplies": ["你的第一句回复", "你的第二句回复（可选，分段发送更真实）"],
  "otherFansReplies": [
    {"name": "粉丝A", "text": "回复内容"},
    {"name": "粉丝B", "text": "回复内容"}
  ]
}
注意：
1. 气泡要简短！每条回复（包括你的和其他粉丝的）**绝对不要超过25个字**。
2. charReplies 必须是一个字符串数组。请模仿真实聊天，将你想说的话拆分成1-3条极短的消息分开发送。
3. otherFansReplies 中的每个粉丝也应该只发极短的句子。如果一个粉丝要说多句话，请将其拆分成多个对象（同名）。
4. 语气要口语化、松弛，绝对不要使用任何 Emoji 表情符号，句子末尾不要使用句号。`;

    const defaultVODPrompt = `用户"{user}"在你的往期视频或贴文下发表了评论。
内容主题："{video_title}"
你的名字："{char}"，人设："{char_persona}"。
用户人设："{user_persona}"。
世界观：{wb_context}

用户评论内容："{msg}"

请生成回复。返回严格的 JSON 格式：
{
  "charReplies": ["你的回复内容（可以是1-3条短句）"],
  "fanReplies": [
    {"name": "路人粉", "text": "路人的简短评论"},
    {"name": "黑粉", "text": "路人的简短评论"}
  ]
}
注意：绝对不要使用任何 Emoji 表情符号，句子末尾不要使用句号，语气要像真实的活人聊天。`;

    if (promptTabLive && promptTabSummary && promptTabGroup) {
        promptTabLive.addEventListener('click', () => {
            currentPromptTab = 'live';
            promptTabLive.classList.add('active');
            promptTabSummary.classList.remove('active');
            promptTabGroup.classList.remove('active');
            if(promptDesc) promptDesc.textContent = "直播互动提示词。使用 {char}, {user}, {guest}, {msg} 等变量。";
            if(ytPromptInput) ytPromptInput.value = channelState.systemPrompt || defaultPrompt;
        });

        promptTabSummary.addEventListener('click', () => {
            currentPromptTab = 'summary';
            promptTabSummary.classList.add('active');
            promptTabLive.classList.remove('active');
            promptTabGroup.classList.remove('active');
            if(promptDesc) promptDesc.textContent = "直播总结提示词。要求返回 JSON。";
            if(ytPromptInput) ytPromptInput.value = channelState.summaryPrompt || defaultSummaryPrompt;
        });
        
        promptTabGroup.addEventListener('click', () => {
            currentPromptTab = 'group';
            promptTabGroup.classList.add('active');
            promptTabLive.classList.remove('active');
            promptTabSummary.classList.remove('active');
            if(promptDesc) promptDesc.textContent = "粉丝群聊提示词。包含 {live_summary_context}, {chat_history} 等变量。";
            if(ytPromptInput) ytPromptInput.value = channelState.groupChatPrompt || defaultGroupChatPrompt;
        });
    }

    const resetPromptBtn = document.getElementById('reset-yt-prompt-btn');
    if (resetPromptBtn) {
        resetPromptBtn.addEventListener('click', () => {
            if (!ytPromptInput) return;
            if (currentPromptTab === 'live') {
                ytPromptInput.value = defaultPrompt;
            } else if (currentPromptTab === 'summary') {
                ytPromptInput.value = defaultSummaryPrompt;
            } else {
                ytPromptInput.value = defaultGroupChatPrompt;
            }
        });
    }

    const confirmPromptBtn = document.getElementById('confirm-yt-prompt-btn');
    if (confirmPromptBtn) {
        confirmPromptBtn.addEventListener('click', () => {
            if (!ytPromptInput) return;
            if (currentPromptTab === 'live') {
                channelState.systemPrompt = ytPromptInput.value.trim();
            } else if (currentPromptTab === 'summary') {
                channelState.summaryPrompt = ytPromptInput.value.trim();
            } else {
                channelState.groupChatPrompt = ytPromptInput.value.trim();
            }
            saveYoutubeData();
            if(ytPromptSheet) ytPromptSheet.classList.remove('active');
            if(window.showToast) window.showToast('提示词已保存');
        });
    }

    // Summary List Logic
    const summaryListBtn = document.getElementById('yt-summary-list-btn');
    const summaryListSheet = document.getElementById('yt-summary-list-sheet');
    const summaryListContainer = document.getElementById('yt-summary-list-container');
    const summaryDetailSheet = document.getElementById('yt-summary-detail-sheet');
    const summaryDetailText = document.getElementById('yt-summary-detail-text');
    const summarySaveBtn = document.getElementById('yt-summary-save-btn');
    const summaryDeleteBtn = document.getElementById('yt-summary-delete-btn');
    
    let currentEditingSummaryIndex = -1;

    if (summaryListBtn && summaryListSheet) {
        summaryListBtn.addEventListener('click', () => {
            if(ytSettingsSheet) ytSettingsSheet.classList.remove('active');
            renderSummaryList();
            summaryListSheet.classList.add('active');
        });
        
        summaryListSheet.addEventListener('mousedown', (e) => {
            if(e.target === summaryListSheet) summaryListSheet.classList.remove('active');
        });
        
        if (summaryDetailSheet) {
            summaryDetailSheet.addEventListener('mousedown', (e) => {
                if(e.target === summaryDetailSheet) summaryDetailSheet.classList.remove('active');
            });
        }
    }

    if (summarySaveBtn) {
        summarySaveBtn.addEventListener('click', () => {
            if (currentEditingSummaryIndex > -1 && channelState.liveSummaries) {
                if (summaryDetailText) {
                    channelState.liveSummaries[currentEditingSummaryIndex].content = summaryDetailText.value;
                }
                channelState.liveSummaries[currentEditingSummaryIndex].isEdited = true;
                saveYoutubeData();
                if(window.showToast) window.showToast('总结已修改');
                renderSummaryList(); // Refresh list preview
                if(summaryDetailSheet) summaryDetailSheet.classList.remove('active');
            }
        });
    }

    if (summaryDeleteBtn) {
        summaryDeleteBtn.addEventListener('click', () => {
            if (currentEditingSummaryIndex > -1 && channelState.liveSummaries) {
                if(confirm('确定要删除这条总结吗？')) {
                    channelState.liveSummaries.splice(currentEditingSummaryIndex, 1);
                    saveYoutubeData();
                    if(window.showToast) window.showToast('总结已删除');
                    renderSummaryList();
                    if(summaryDetailSheet) summaryDetailSheet.classList.remove('active');
                }
            }
        });
    }

    function renderSummaryList() {
        if (!summaryListContainer) return;
        summaryListContainer.innerHTML = '';
        
        if (!channelState.liveSummaries || channelState.liveSummaries.length === 0) {
            summaryListContainer.innerHTML = `<div style="text-align:center; padding: 30px; color:#8e8e93; font-size:14px;">暂无直播总结记录</div>`;
            return;
        }

        for (let i = channelState.liveSummaries.length - 1; i >= 0; i--) {
            const summary = channelState.liveSummaries[i];
            const card = document.createElement('div');
            card.className = 'yt-summary-card';
            
            const displayTitle = summary.title || '直播记录';
            const safeContent = summary.content ? String(summary.content) : '';
            const displayContent = summary.isEdited ? (safeContent.length > 60 ? safeContent.slice(0, 60) + '...' : safeContent) : (safeContent || '无内容');

            card.innerHTML = `
                <div class="yt-summary-date">${summary.date || '未知时间'}</div>
                <div class="yt-summary-title">${displayTitle}</div>
                <div class="yt-summary-preview">主要内容：${displayContent}</div>
            `;
            
            card.addEventListener('click', () => {
                currentEditingSummaryIndex = i;
                if (summaryDetailText) {
                    if (summary.isEdited) {
                        summaryDetailText.value = summary.content || '';
                    } else {
                        summaryDetailText.value = `【直播时间】\n${summary.date || ''}\n\n` +
                                                  `【直播主题】\n${summary.title || ''}\n\n` +
                                                  `【直播内容】\n${summary.content || ''}\n\n` +
                                                  `【互动亮点】\n${summary.interaction || ''}\n\n` +
                                                  `【直播氛围】\n${summary.atmosphere || ''}`;
                    }
                }
                if (summaryDetailSheet) summaryDetailSheet.classList.add('active');
            });
            
            summaryListContainer.appendChild(card);
        }
    }

    