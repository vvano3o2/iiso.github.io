// ==========================================
// 7. API CONFIGURATION
// ==========================================
// Open API Settings
document.getElementById('api-config-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    UI.inputs.apiEndpoint.value = apiConfig.endpoint;
    UI.inputs.apiKey.value = apiConfig.apiKey;
    UI.inputs.apiModel.value = apiConfig.model;
    UI.inputs.apiTemp.value = apiConfig.temperature;
    openView(UI.overlays.apiConfig);
});

// Confirm API Settings
document.getElementById('confirm-api-btn').addEventListener('click', () => {
    apiConfig.endpoint = UI.inputs.apiEndpoint.value;
    apiConfig.apiKey = UI.inputs.apiKey.value;
    apiConfig.model = UI.inputs.apiModel.value;
    apiConfig.temperature = parseFloat(UI.inputs.apiTemp.value) || 0.7;
    
    // Save globally
    window.apiConfig = apiConfig;
    saveGlobalData();
    
    closeView(UI.overlays.apiConfig);
    showToast('API Config Saved');
});

// Real Fetch Models Logic
const btnApiFetch = document.getElementById('fetch-models-btn');
if (btnApiFetch) {
    btnApiFetch.addEventListener('click', async () => {
        const endpoint = UI.inputs.apiEndpoint.value.trim();
        const key = UI.inputs.apiKey.value.trim();
        
        if (!endpoint) {
            showToast('Please enter an endpoint');
            return;
        }

        const originalText = btnApiFetch.innerHTML;
        btnApiFetch.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
        
        try {
            // Clean up endpoint to point to /v1/models
            let url = endpoint;
            if (url.endsWith('/')) url = url.slice(0, -1);
            if (!url.endsWith('/models')) {
                url = url.endsWith('/v1') ? url + '/models' : url + '/v1/models';
            }

            const headers = { 'Content-Type': 'application/json' };
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
            }

            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) throw new Error('Network response was not ok');
            
            const data = await res.json();
            
            if (data && data.data && Array.isArray(data.data)) {
                fetchedModels = data.data.map(m => m.id);
                saveGlobalData();
                showToast(`Fetched ${fetchedModels.length} models!`);
            } else {
                throw new Error('Invalid format');
            }
        } catch (error) {
            console.error('Fetch Models Error:', error);
            showToast('Failed to fetch models');
        } finally {
            btnApiFetch.innerHTML = originalText;
        }
    });
}

// -- Presets --
const savePresetBtn = document.getElementById('save-preset-btn');
const loadPresetBtn = document.getElementById('load-preset-btn');
const confirmSavePresetBtn = document.getElementById('confirm-save-preset-btn');

if (savePresetBtn) {
    savePresetBtn.addEventListener('click', () => {
        if (UI.inputs.presetName) UI.inputs.presetName.value = '';
        openView(UI.overlays.savePreset);
    });
}

if (confirmSavePresetBtn) {
    confirmSavePresetBtn.addEventListener('click', () => {
        const endpoint = UI.inputs.apiEndpoint ? UI.inputs.apiEndpoint.value.trim() : '';
        const apiKey = UI.inputs.apiKey ? UI.inputs.apiKey.value.trim() : '';
        const model = UI.inputs.apiModel ? UI.inputs.apiModel.value.trim() : '';
        const temp = UI.inputs.apiTemp ? parseFloat(UI.inputs.apiTemp.value) || 0.7 : 0.7;
        const presetName = UI.inputs.presetName ? UI.inputs.presetName.value.trim() : '';

        apiPresets.push({
            id: Date.now(),
            name: presetName || '未命名预设',
            endpoint,
            apiKey,
            model,
            temp
        });

        saveGlobalData();
        closeView(UI.overlays.savePreset);
        showToast('预设已保存');
    });
}

if (loadPresetBtn) {
    loadPresetBtn.addEventListener('click', () => {
        renderPresetList();
        openView(UI.overlays.loadPreset);
    });
}

function renderPresetList() {
    if (!UI.lists.presets) return;
    UI.lists.presets.innerHTML = '';

    if (!Array.isArray(apiPresets) || apiPresets.length === 0) {
        UI.lists.presets.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #8e8e93; font-size: 15px;">
                暂无预设
            </div>
        `;
        return;
    }

    apiPresets.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'account-card';
        item.innerHTML = `
            <div class="account-content" style="cursor: pointer;">
                <div class="account-avatar" style="background-color: var(--blue-color); color: white;"><i class="fas fa-server"></i></div>
                <div class="account-info">
                    <div class="account-name">${preset.name || '未命名预设'}</div>
                    <div class="account-detail" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">${preset.endpoint || '未填写接口地址'}</div>
                </div>
                <i class="fas fa-times delete-icon"></i>
            </div>
        `;

        const content = item.querySelector('.account-content');
        const deleteIcon = item.querySelector('.delete-icon');

        if (content) {
            content.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-icon') || e.target.closest('.delete-icon')) return;

                if (UI.inputs.apiEndpoint) UI.inputs.apiEndpoint.value = preset.endpoint || '';
                if (UI.inputs.apiKey) UI.inputs.apiKey.value = preset.apiKey || '';
                if (UI.inputs.apiModel) UI.inputs.apiModel.value = preset.model || '';
                if (UI.inputs.apiTemp) UI.inputs.apiTemp.value = preset.temp ?? 0.7;

                closeView(UI.overlays.loadPreset);
                showToast('预设已加载');
            });
        }

        if (deleteIcon) {
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`删除预设“${preset.name || '未命名预设'}”？`)) {
                    apiPresets = apiPresets.filter(p => p.id !== preset.id);
                    saveGlobalData();
                    renderPresetList();
                    showToast('预设已删除');
                }
            });
        }

        UI.lists.presets.appendChild(item);
    });
}

// -- Model Picker --
if (UI.inputs.apiModel) {
    UI.inputs.apiModel.addEventListener('click', () => {
        renderModelList();
        openView(UI.overlays.modelPicker);
    });
}

function renderModelList() {
    if (!UI.lists.models) return;
    UI.lists.models.innerHTML = '';

    if (!Array.isArray(fetchedModels) || fetchedModels.length === 0) {
        UI.lists.models.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #8e8e93; font-size: 15px;">
                暂无模型，请先点击 Fetch Models
            </div>
        `;
        return;
    }

    fetchedModels.forEach(model => {
        const item = document.createElement('div');
        item.className = 'api-model-card';
        item.style.cursor = 'pointer';
        item.innerHTML = `
            <div class="api-model-card-name">${model}</div>
            <div class="api-model-card-action">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        item.addEventListener('click', () => {
            UI.inputs.apiModel.value = model;
            closeView(UI.overlays.modelPicker);
        });
        UI.lists.models.appendChild(item);
    });
}

// ==========================================
// 8. THEME CONFIGURATION
// ==========================================
// Open Theme Settings
document.getElementById('theme-config-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    
    const islandToggle = document.getElementById('theme-island-toggle');
    const statusBarToggle = document.getElementById('theme-statusbar-toggle');
    const fsToggle = document.getElementById('theme-fullscreen-toggle');
    if (islandToggle) islandToggle.checked = themeState.showIsland;
    if (statusBarToggle) statusBarToggle.checked = themeState.showStatusBar;
    if (fsToggle) fsToggle.checked = themeState.isFullscreen;

    renderThemeAppList();
    openView(UI.overlays.themeConfig);
});

// Theme Background Upload
document.getElementById('theme-bg-upload-btn').addEventListener('click', () => {
    document.getElementById('theme-bg-file-input').click();
});

// Theme Background Reset
document.getElementById('theme-bg-reset-btn').addEventListener('click', () => {
    themeState.bgUrl = null;
    if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = '';
    showToast('背景已重置，点击保存生效');
});

document.getElementById('theme-bg-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Resize for background (max 1080p)
            if (window.compressImage) {
                window.compressImage(event.target.result, 1080, 1920, (compressedUrl) => {
                    if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = compressedUrl;
                    themeState.bgUrl = compressedUrl;
                    showToast('背景已加载，点击保存生效');
                });
            } else {
                if (UI.inputs.themeBgUrl) UI.inputs.themeBgUrl.value = event.target.result;
                themeState.bgUrl = event.target.result;
                showToast('背景已加载，点击保存生效');
            }
        };
        reader.readAsDataURL(file);
    }
    e.target.value = '';
});

// Background URL Input Change
if (UI.inputs.themeBgUrl) {
    UI.inputs.themeBgUrl.addEventListener('input', (e) => {
        themeState.bgUrl = e.target.value;
    });
}

// Reset All Icons
const resetAllIconsBtn = document.getElementById('theme-reset-all-icons-btn');
if (resetAllIconsBtn) {
    resetAllIconsBtn.addEventListener('click', () => {
        themeState.apps.forEach(app => {
            app.icon = null;
        });
        renderThemeAppList();
        showToast('应用图标已全部重置，点击保存生效');
    });
}

// Render App List for Customization
function renderThemeAppList() {
    if (!UI.inputs.themeAppList) return;
    UI.inputs.themeAppList.innerHTML = '';

    themeState.apps.forEach((app, index) => {
        const item = document.createElement('div');
        item.className = 'form-item';
        // Custom styling for app item
        item.style.padding = '8px 16px';
        item.style.height = '60px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.borderBottom = '1px solid #f2f2f7';
        
        // Icon Preview (or placeholder)
        let iconHtml = '';
        if (app.icon) {
            iconHtml = `<div style="width: 40px; height: 40px; border-radius: 10px; background-image: url('${app.icon}'); background-size: cover; background-position: center; border: 1px solid #e5e5ea; flex-shrink: 0;"></div>`;
        } else {
            iconHtml = `<div style="width: 40px; height: 40px; border-radius: 10px; background-color: #f2f2f7; border: 1px solid #e5e5ea; display: flex; align-items: center; justify-content: center; color: #c7c7cc; flex-shrink: 0;"><i class="fas fa-image"></i></div>`;
        }

        item.innerHTML = `
            <div style="display: flex; align-items: center; flex: 1;">
                ${iconHtml}
                <div style="margin-left: 12px; font-size: 16px; font-weight: 500; color: #000;">${app.name}</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <div class="reset-single-app-btn" style="width: 32px; height: 32px; border-radius: 50%; background: #ffebee; color: #ff3b30; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                    <i class="fas fa-undo" style="font-size: 14px;"></i>
                </div>
                <div class="upload-single-app-btn" style="width: 32px; height: 32px; border-radius: 50%; background: #e8f5e9; color: #34c759; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                    <i class="fas fa-upload" style="font-size: 14px;"></i>
                </div>
            </div>
        `;
        
        // Click to reset
        const resetBtn = item.querySelector('.reset-single-app-btn');
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeState.apps[index].icon = null;
            renderThemeAppList();
        });

        // Click to upload
        const uploadBtn = item.querySelector('.upload-single-app-btn');
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentEditingAppIndex = index;
            document.getElementById('theme-app-file-input').click();
        });

        UI.inputs.themeAppList.appendChild(item);
    });
}

// Handle App Icon File Selection
document.getElementById('theme-app-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && currentEditingAppIndex >= 0) {
        const reader = new FileReader();
        reader.onload = (event) => {
            // Compress icon to tiny size (150x150) to save space
            if (window.compressImage) {
                window.compressImage(event.target.result, 150, 150, (compressedUrl) => {
                    themeState.apps[currentEditingAppIndex].icon = compressedUrl;
                    renderThemeAppList();
                });
            } else {
                themeState.apps[currentEditingAppIndex].icon = event.target.result;
                renderThemeAppList();
            }
        };
        reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = '';
});

// Apply specific logic for app icon background to avoid overlay bug
function applyAppIconStyles(app) {
    const el = document.getElementById(app.id);
    if (!el) return;
    
    // Target the inner .app-icon div rather than the wrapper
    const iconDiv = el.querySelector('.app-icon');
    const iEl = el.querySelector('i');
    const nameEl = el.querySelector('.app-name');
    
    if (nameEl && app.name) {
        nameEl.textContent = app.name;
    }

    if (!iconDiv) return;

    if (app.icon) {
        // Apply image, clear background color
        iconDiv.style.backgroundImage = `url(${app.icon})`;
        iconDiv.style.backgroundSize = 'cover';
        iconDiv.style.backgroundPosition = 'center';
        iconDiv.style.backgroundColor = 'transparent';
        if (iEl) iEl.style.display = 'none';
    } else {
        // Revert to original
        iconDiv.style.backgroundImage = 'none';
        // Restore original gradient/color using inline style if it was stripped, 
        // but normally removing backgroundImage is enough if CSS handles it.
        // We'll rely on the default inline style still being there under the hood or class defaults.
        if (app.id === 'dock-icon-settings') { iconDiv.style.background = 'linear-gradient(180deg, #48484a 0%, #2c2c2e 100%)'; iconDiv.style.color = '#ffffff'; if (iEl) iEl.className = 'fas fa-cog'; }
        else if (app.id === 'dock-icon-imessage') { iconDiv.style.background = 'linear-gradient(180deg, #ffffff 0%, #f2f2f7 100%)'; iconDiv.style.color = '#1c1c1e'; if (iEl) iEl.className = 'fas fa-comment'; }
        else if (app.id === 'dock-icon-youtube') { iconDiv.style.background = '#ffffff'; iconDiv.style.color = '#1c1c1e'; if (iEl) iEl.className = 'fab fa-youtube'; }
        else if (app.id === 'app-icon-1') { iconDiv.style.background = 'linear-gradient(180deg, #3a3a3c 0%, #1c1c1e 100%)'; iconDiv.style.color = '#ffffff'; if (iEl) iEl.className = 'fas fa-wallet'; }
        else if (app.id === 'app-icon-2') { iconDiv.style.background = '#000000'; iconDiv.style.color = '#ffffff'; if (iEl) iEl.className = 'fab fa-tiktok'; } // TikTok Style
        else if (app.id === 'app-icon-3') { iconDiv.style.background = '#000000'; iconDiv.style.color = '#ffffff'; if (iEl) iEl.className = 'fas fa-star'; } // b.stage Style
        else if (app.id === 'app-icon-4') { iconDiv.style.background = '#000000'; iconDiv.style.color = '#ffffff'; if (iEl) iEl.className = 'fab fa-twitter'; }
        else if (['app-icon-5', 'app-icon-6', 'app-icon-7', 'app-icon-8'].includes(app.id)) { iconDiv.style.background = '#e5e5ea'; iconDiv.style.color = ''; if (iEl) iEl.className = ''; }
        
        if (iEl) iEl.style.display = '';
    }
}

// Confirm Theme Settings
document.getElementById('confirm-theme-btn').addEventListener('click', () => {
    const islandToggle = document.getElementById('theme-island-toggle');
    const statusBarToggle = document.getElementById('theme-statusbar-toggle');
    const fsToggle = document.getElementById('theme-fullscreen-toggle');
    
    if (islandToggle) themeState.showIsland = islandToggle.checked;
    if (statusBarToggle) themeState.showStatusBar = statusBarToggle.checked;
    if (fsToggle) themeState.isFullscreen = fsToggle.checked;

    if (themeState.showIsland) {
        document.body.classList.remove('hide-island');
    } else {
        document.body.classList.add('hide-island');
    }
    
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
        statusBar.style.display = themeState.showStatusBar ? 'flex' : 'none';
    }

    if (themeState.isFullscreen) {
        document.body.classList.add('fullscreen-mode');
        try {
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) docEl.requestFullscreen();
            else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
            else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
        } catch (e) { console.log('Fullscreen API not supported'); }
    } else {
        document.body.classList.remove('fullscreen-mode');
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                else if (document.msExitFullscreen) document.msExitFullscreen();
            }
        } catch (e) { console.log('Exit Fullscreen API not supported'); }
    }

    // Apply Background
    const bgUrl = (UI.inputs.themeBgUrl && UI.inputs.themeBgUrl.value) ? UI.inputs.themeBgUrl.value.trim() : themeState.bgUrl;
    const screenEl = document.querySelector('.screen');
    if (screenEl) {
        if (bgUrl) {
            // Remove nested quotes to avoid parsing errors with long base64 strings
            screenEl.style.backgroundImage = `url(${bgUrl})`;
            screenEl.style.backgroundSize = 'cover';
            screenEl.style.backgroundPosition = 'center';
            screenEl.style.backgroundColor = 'transparent';
        } else {
            screenEl.style.backgroundImage = 'none';
            screenEl.style.backgroundColor = ''; // Restore to CSS default
        }
    }

    // Apply App Icons
    themeState.apps.forEach(app => {
        applyAppIconStyles(app);
    });

    saveGlobalData();
    closeView(UI.overlays.themeConfig);
    showToast('主题已应用！');
});

// Apply theme on load
function applySavedTheme() {
    if (themeState.showIsland === false) document.body.classList.add('hide-island');
    if (themeState.isFullscreen === true) {
        document.body.classList.add('fullscreen-mode');
        // Do not force native fullscreen on load as it requires user gesture, 
        // just apply the CSS class.
    }
    
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
        statusBar.style.display = themeState.showStatusBar === false ? 'none' : 'flex';
    }

    const screenEl = document.querySelector('.screen');
    if (screenEl) {
        if (themeState.bgUrl) {
            screenEl.style.backgroundImage = `url(${themeState.bgUrl})`;
            screenEl.style.backgroundSize = 'cover';
            screenEl.style.backgroundPosition = 'center';
            screenEl.style.backgroundColor = 'transparent';
        } else {
            screenEl.style.backgroundImage = ''; // Remove inline style to use CSS default
            screenEl.style.backgroundColor = ''; // Restore to CSS default
        }
    }
    themeState.apps.forEach(app => {
        applyAppIconStyles(app);
    });
}
window.applySavedTheme = applySavedTheme;

// ==========================================
// --- Chat Sending Logic (Shared Helper Functions if needed) ---
// ==========================================
(() => {
    const chatInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('send-msg-btn');
    const micBtn = document.getElementById('mic-msg-btn');
    const chatMessagesContainer = document.getElementById('ins-chat-messages');

    function scrollToBottom() {
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    function appendUserMessage(msg) {
        if (!chatMessagesContainer) return;
        const row = document.createElement('div');
        row.className = 'chat-row user-row';
        row.innerHTML = `<div class="chat-bubble user-bubble">${msg}</div>`;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
    }

    function appendAiMessage(msg, friend) {
        if (!chatMessagesContainer) return;
        const row = document.createElement('div');
        row.className = 'chat-row ai-row';
        
        const avatarHtml = (friend && friend.avatarUrl) 
            ? `<img src="${friend.avatarUrl}">`
            : `<i class="fas fa-user"></i>`;

        row.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="chat-bubble ai-bubble">${msg}</div>
        `;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
    }

    function appendAiTyping(friend) {
        if (!chatMessagesContainer) return null;
        const row = document.createElement('div');
        row.className = 'chat-row ai-row typing-row';
        
        const avatarHtml = (friend && friend.avatarUrl) 
            ? `<img src="${friend.avatarUrl}">`
            : `<i class="fas fa-user"></i>`;

        row.innerHTML = `
            <div class="chat-avatar-small">${avatarHtml}</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessagesContainer.appendChild(row);
        scrollToBottom();
        return row;
    }

    function handleSendMessage() {
        if (!chatInput) return;
        const msg = chatInput.value.trim();
        if (msg) {
            appendUserMessage(msg);
            chatInput.value = '';
        }
    }

    async function handleAiGenerate() {
        // Assuming currentActiveFriend is defined globally by another script that uses this
        if (typeof currentActiveFriend === 'undefined' || !currentActiveFriend) {
            showToast('No active friend selected.');
            return;
        }
        
        if (!apiConfig.endpoint || !apiConfig.apiKey) {
            showToast('请先配置 API Endpoint 和 Key');
            return;
        }

        const typingRow = appendAiTyping(currentActiveFriend);
        if(micBtn) micBtn.style.opacity = '0.5';

        const globalWorldBookContext = window.getGlobalWorldBookContext ? window.getGlobalWorldBookContext() : '';
        const systemPrompt = `You are playing the role of ${currentActiveFriend.realName || currentActiveFriend.nickname}. 
Your persona is: ${currentActiveFriend.persona || 'No specific persona'}. 
You are talking to ${userState.name}, whose persona is: ${userState.persona || 'A normal user'}.
${globalWorldBookContext ? `Global World Book:\n${globalWorldBookContext}\n` : ''}Reply naturally as your character in a chat app. Do not include your own name at the beginning.`;

        const messages = [{ role: 'system', content: systemPrompt }];
        
        if (chatMessagesContainer) {
            const rows = chatMessagesContainer.querySelectorAll('.chat-row');
            const recentRows = Array.from(rows).slice(-10);
            recentRows.forEach(row => {
                if (row.classList.contains('typing-row')) return;
                const bubble = row.querySelector('.chat-bubble');
                if (bubble) {
                    if (row.classList.contains('user-row')) {
                        messages.push({ role: 'user', content: bubble.textContent });
                    } else if (row.classList.contains('ai-row')) {
                        messages.push({ role: 'assistant', content: bubble.textContent });
                    }
                }
            });
        }
        
        if (messages.length === 1) {
            messages.push({ role: 'user', content: '你好' });
        }

        try {
            let endpoint = apiConfig.endpoint;
            // 确保 endpoint 结尾没有 /，且自动补全 /chat/completions 或 /v1/chat/completions 
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: apiConfig.model || '',
                    messages: messages,
                    temperature: parseFloat(apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            const aiReply = data.choices[0].message.content;
            
            if (typingRow) typingRow.remove();
            appendAiMessage(aiReply, currentActiveFriend);

        } catch (error) {
            console.error(error);
            if (typingRow) typingRow.remove();
            showToast('API 请求失败，请检查配置或网络');
        } finally {
            if(micBtn) micBtn.style.opacity = '1';
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (micBtn) {
        micBtn.addEventListener('click', handleAiGenerate);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
})();
