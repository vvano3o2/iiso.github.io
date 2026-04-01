// ==========================================
// IMESSAGE: 1. DATA & STATE MANAGEMENT
// ==========================================

window.imData = {
    friends: [],
    moments: [],
    momentMessages: [],
    currentActiveFriend: null,
    currentSettingsFriend: null,
    currentDetailMoment: null,
    currentOpenUserId: 'me',
    pendingImages: [],
    isPublishing: false,
    currentEditImageIndex: -1,
    cssPresets: [],
    tempSelectedBookIds: [],
    tempRelationshipDrafts: [],
    isRelationshipPickerVisible: false,
    longPressTimer: null,
    currentActiveRow: null,
    stickers: [] // { categoryName: string, items: [{name: string, url: string}] }
};

window.imApp = {};

window.imApp.createDefaultMemory = function() {
    return {
        overview: '',
        anniversaries: '',
        context: { enabled: true, limit: 30, notes: '' },
        summary: { enabled: false, limit: 50, prompt: '' },
        longTerm: '',
        cherished: '',
        relationships: []
    };
};

window.imApp.getStatusBarTemplatePresets = function() {
    const oldDefaultStyle = '/* 可以在这里添加自定义CSS，它会作用于.status-card-custom */\n.status-card-custom {\n  background: rgba(255, 255, 255, 0.8);\n  color: #333;\n  border-radius: 16px;\n  padding: 12px;\n  backdrop-filter: blur(10px);\n  box-shadow: 0 4px 15px rgba(0,0,0,0.1);\n  text-align: center;\n}';
    const iosSmsStyle = '/* iOS短信风格状态栏 */\n.status-card-custom {\n  background: rgba(250, 250, 250, 0.85);\n  color: #000;\n  border-radius: 20px;\n  padding: 12px 16px;\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  box-shadow: 0 4px 20px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.4);\n  text-align: left;\n  font-size: 14px;\n  line-height: 1.4;\n  font-weight: 500;\n  border: 0.5px solid rgba(0,0,0,0.05);\n}';
    const insStyle = '/* Ins卡片风格状态栏 */\n.status-card-custom {\n  background: #ffffff;\n  color: #262626;\n  border-radius: 16px;\n  padding: 0;\n  width: 300px;\n  box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n  text-align: left;\n  overflow: hidden;\n  border: 1px solid #efefef;\n}';
    const icityStyle = '/* iCity卡片风格状态栏 */\n.status-card-custom {\n  background: #ffffff;\n  color: #333333;\n  border-radius: 12px;\n  padding: 0;\n  width: 300px;\n  box-shadow: 0 8px 24px rgba(0,0,0,0.06);\n  text-align: left;\n  overflow: hidden;\n  border: 1px solid rgba(0,0,0,0.04);\n}';
    const oldPrompt = '请在回复的最后使用 <status>当前时间 | 当前位置 | 内心想法</status> 的格式输出你的状态。';
        const insPrompt = '请在回复的最后使用 <status>{"text":"你的状态文案","img":"相关图片URL(如https://picsum.photos/seed/xxx/300/300)","loc":"当前位置","comment":"好友评论","commentUser":"评论人","thought":"50-100字的第一人称内心独白"}</status> 的格式输出你的状态，确保它是合法的 JSON 字符串。';
        const icityPrompt = '请在回复的最后使用 <status>{"text":"50-100字的心声正文","loc":"当前位置","thought":"50-100字的第一人称心声","comments":[{"user":"评论人1","text":"评论内容1"},{"user":"评论人2","text":"评论内容2"}]}</status> 的格式输出你的状态，确保它是合法的 JSON 字符串。';

    return {
        oldDefaultStyle,
        iosSmsStyle,
        oldPrompt,
        ins: {
            type: 'ins',
            prompt: insPrompt,
            style: insStyle
        },
        icity: {
            type: 'icity',
            prompt: icityPrompt,
            style: icityStyle
        }
    };
};

window.imApp.normalizeFriendData = function(friend) {
    const normalized = { ...friend };
    normalized.type = normalized.type || 'char';
    const isGroupChat = normalized.type === 'group';
    normalized.realName = normalized.realName || '';
    normalized.nickname = normalized.nickname || (normalized.type === 'npc' ? 'New NPC' : 'New Friend');
    normalized.signature = normalized.signature || 'No Signature';
    normalized.persona = normalized.persona || '';
    normalized.avatarUrl = normalized.avatarUrl || null;
    normalized.messages = Array.isArray(normalized.messages) ? normalized.messages : [];
    normalized.chatBg = normalized.chatBg || null;
    normalized.customCssEnabled = !!normalized.customCssEnabled;
    normalized.customCss = normalized.customCss || '';
    normalized.isPinned = !!normalized.isPinned;
    normalized.showTimestamp = !!normalized.showTimestamp;
    normalized.boundBooks = Array.isArray(normalized.boundBooks) ? normalized.boundBooks : [];
    normalized.momentsCover = normalized.momentsCover || null;

    const presets = window.imApp.getStatusBarTemplatePresets();
    const savedType = friend.statusBar && friend.statusBar.type === 'icity' ? 'icity' : 'ins';
    const defaultPreset = presets[savedType];

    let finalStyle = defaultPreset.style;
    if (friend.statusBar && friend.statusBar.style) {
        if (friend.statusBar.style === presets.oldDefaultStyle || friend.statusBar.style === presets.iosSmsStyle) {
            finalStyle = presets.ins.style;
        } else {
            finalStyle = friend.statusBar.style;
        }
    }

    let finalPrompt = defaultPreset.prompt;
    if (friend.statusBar && friend.statusBar.prompt) {
        if (friend.statusBar.prompt === presets.oldPrompt) {
            finalPrompt = presets.ins.prompt;
        } else {
            finalPrompt = friend.statusBar.prompt;
        }
    }

    normalized.statusBar = {
        enabled: !!(friend.statusBar && friend.statusBar.enabled),
        type: savedType,
        prompt: finalPrompt,
        regex: (friend.statusBar && friend.statusBar.regex) ? friend.statusBar.regex : '<status>([\\s\\S]*?)<\\/status>',
        style: finalStyle,
        history: (friend.statusBar && Array.isArray(friend.statusBar.history)) ? friend.statusBar.history : []
    };

    const defaultMemory = window.imApp.createDefaultMemory();
    const memory = normalized.memory || {};
    normalized.memory = {
        overview: memory.overview || defaultMemory.overview,
        anniversaries: memory.anniversaries || defaultMemory.anniversaries,
        context: {
            enabled: typeof memory.context?.enabled === 'boolean' ? memory.context.enabled : defaultMemory.context.enabled,
            limit: Number(memory.context?.limit) > 0
                ? Number(memory.context.limit)
                : (isGroupChat ? 50 : defaultMemory.context.limit),
            notes: memory.context?.notes || defaultMemory.context.notes
        },
        summary: {
            enabled: typeof memory.summary?.enabled === 'boolean' ? memory.summary.enabled : defaultMemory.summary.enabled,
            limit: Number(memory.summary?.limit) > 0 ? Number(memory.summary.limit) : defaultMemory.summary.limit,
            prompt: memory.summary?.prompt || defaultMemory.summary.prompt
        },
        longTerm: memory.longTerm || defaultMemory.longTerm,
        cherished: memory.cherished || defaultMemory.cherished,
        relationships: Array.isArray(memory.relationships) ? memory.relationships : defaultMemory.relationships
    };

    return normalized;
};

// Load Data from LocalStorage
try {
    const storedFriends = localStorage.getItem('ios_emulator_friends');
    if (storedFriends) {
        window.imData.friends = JSON.parse(storedFriends).map(window.imApp.normalizeFriendData);
    }
    const storedMoments = localStorage.getItem('ios_emulator_moments');
    if (storedMoments) window.imData.moments = JSON.parse(storedMoments);
    
    const storedMsgs = localStorage.getItem('ios_emulator_moment_messages');
    if (storedMsgs) window.imData.momentMessages = JSON.parse(storedMsgs);

    window.imData.cssPresets = JSON.parse(localStorage.getItem('ios_emulator_css_presets') || '[]');
    
    const storedStickers = localStorage.getItem('ios_emulator_stickers');
    if (storedStickers) {
        window.imData.stickers = JSON.parse(storedStickers);
    }
} catch(e) {
    console.error('Failed to load imessage data', e);
}

window.imApp.saveFriends = function() {
    try {
        localStorage.setItem('ios_emulator_friends', JSON.stringify(window.imData.friends));
    } catch(e) {
        console.error('Storage full or error', e);
        if(window.showToast) window.showToast('保存失败');
    }
};

window.imApp.saveMoments = function() {
    localStorage.setItem('ios_emulator_moments', JSON.stringify(window.imData.moments));
};

window.imApp.saveMomentMessages = function() {
    localStorage.setItem('ios_emulator_moment_messages', JSON.stringify(window.imData.momentMessages));
};

window.imApp.saveStickers = function() {
    try {
        localStorage.setItem('ios_emulator_stickers', JSON.stringify(window.imData.stickers));
    } catch(e) {
        console.error('Failed to save stickers', e);
        if(window.showToast) window.showToast('保存表情包失败');
    }
};

window.getGlobalWorldBookContext = function() {
    if (!window.getWorldBooks) return '';

    const allBooks = window.getWorldBooks();
    if (!Array.isArray(allBooks) || allBooks.length === 0) return '';

    const globalBooks = allBooks.filter(book => book && book.isGlobal && Array.isArray(book.entries) && book.entries.length > 0);
    if (globalBooks.length === 0) return '';

    let wbContext = 'Global World Book:\n';
    globalBooks.forEach(book => {
        wbContext += `【${book.name || '未命名世界书'}】\n`;
        book.entries.forEach(entry => {
            const keyword = entry?.keyword ? String(entry.keyword).trim() : '';
            const content = entry?.content ? String(entry.content).trim() : '';
            if (keyword || content) {
                wbContext += `${keyword ? `关键词: ${keyword}\n` : ''}${content ? `内容: ${content}\n` : ''}`;
            }
        });
        wbContext += '\n';
    });

    return wbContext.trim();
};

// Export friends for other modules
window.getImFriends = () => window.imData.friends;

window.addImFriend = function(friendData) {
    const friend = window.imApp.normalizeFriendData({
        id: Date.now(),
        type: friendData.type || 'char',
        realName: friendData.realName || '',
        nickname: friendData.nickname || 'New Friend',
        signature: friendData.signature || 'No Signature',
        persona: friendData.persona || '',
        avatarUrl: friendData.avatarUrl || null,
        messages: [],
        chatBg: null,
        customCssEnabled: false,
        customCss: '',
        memory: window.imApp.createDefaultMemory()
    });
    window.imData.friends.push(friend);
    window.imApp.saveFriends();
    if(window.imApp.renderFriendsList) window.imApp.renderFriendsList();
    if(window.showToast) window.showToast(`已添加好友: ${friend.nickname}`);
};

window.imApp.formatTime = function(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (isToday) return `${hours}:${minutes}`;
    if (isYesterday) return `Yesterday`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

window.imApp.addMomentNotification = function(type, user, momentId, content = '') {
    const notif = {
        id: Date.now(),
        type: type, // 'like' or 'comment'
        userId: user.id || user.userId,
        userName: user.nickname || user.name,
        userAvatar: user.avatarUrl || user.avatar,
        momentId: momentId,
        momentImg: null, 
        momentText: null, 
        content: content,
        time: Date.now(),
        read: false
    };
    
    const m = window.imData.moments.find(x => x.id === momentId);
    if (m) {
        if (m.images && m.images.length > 0) {
            const img = m.images[0];
            notif.momentImg = (typeof img === 'object') ? img.src : img;
        }
        notif.momentText = m.text;
    }
    
    window.imData.momentMessages.unshift(notif);
    window.imApp.saveMomentMessages();
    if(window.imApp.renderMomentsMessages) window.imApp.renderMomentsMessages();
};
