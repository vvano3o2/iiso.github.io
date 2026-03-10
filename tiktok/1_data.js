// ==========================================
// TIKTOK: 1. STATE & DATA MANAGEMENT
// ==========================================

const tkState = {
    // Current user profile data
    profile: {
        name: 'User',
        handle: 'user123',
        avatar: null,
        status: '思考中...', // The bubble text above avatar
        bio: '点击添加个人简介',
        persona: '', // AI persona
        following: 12,
        followers: 128,
        likes: 1024,
        posts: [] // { id, text, views }
    },
    // Array of character objects
    chars: [
        /* 
        {
            id: 'char1',
            name: 'Alex',
            handle: 'alex_cool',
            avatar: null,
            status: '在海边',
            persona: '阳光男孩，喜欢冲浪',
            isFollowed: true
        }
        */
    ],
    // Video feed
    videos: [
        {
            id: 'v_default_1',
            authorId: 'user_default_1',
            authorName: 'Mew',
            desc: '周末的正确打开方式，当然是和猫猫一起虚度光阴啦 🐈 #猫咪日常 #周末vlog',
            sceneText: '阳光穿过窗纱洒在木地板上，一只橘猫正四仰八叉地躺在阳光里打呼噜。镜头缓慢拉近，画面色调温暖治愈，配着慵懒的 lofi 音乐。',
            likes: 12543,
            commentsCount: 432,
            shares: 128,
            isLiked: false,
            comments: [
                { authorName: 'Cici', text: '好治愈的画面，想去你家偷猫！', likes: 231 },
                { authorName: '鱼蛋', text: '这猫怎么长得跟人一样哈哈哈', likes: 89 }
            ]
        },
        {
            id: 'v_default_2',
            authorId: 'user_default_2',
            authorName: 'CityWalker',
            desc: '下雨天的城市，也有别样的浪漫 🌧️ 📸 #扫街 #下雨天 #摄影',
            sceneText: '镜头跟随着一把透明雨伞，穿梭在霓虹闪烁的积水街道。水面倒映着红蓝色的灯牌，雨滴砸在伞面上发出清脆的白噪音，氛围感拉满。',
            likes: 8762,
            commentsCount: 215,
            shares: 342,
            isLiked: false,
            comments: [
                { authorName: '光影', text: '色彩太棒了，求个滤镜参数', likes: 156 },
                { authorName: 'Jay', text: '喜欢下雨天的人，内心都很温柔吧', likes: 44 }
            ]
        }
    ],
    // Chat DMs
    dms: [
        /*
        {
            charId: 'char1',
            messages: [
                { sender: 'user', text: 'hi' },
                { sender: 'char1', text: 'hello' }
            ]
        }
        */
    ]
};

// Global export
window.tkState = tkState;

// Save/Load using global data hooks
function tkSaveData(globalData) {
    globalData.tiktokState = tkState;
}

function tkLoadData(globalData) {
    if (globalData.tiktokState) {
        // Deep merge or object assign
        Object.assign(tkState.profile, globalData.tiktokState.profile || {});
        tkState.chars = globalData.tiktokState.chars || [];
        tkState.videos = globalData.tiktokState.videos || [];
        tkState.dms = globalData.tiktokState.dms || [];
    }
}

// Hook into the main emulator's persistence system
const originalOnGlobalDataSave = window.onGlobalDataSave;
window.onGlobalDataSave = function(data) {
    if (originalOnGlobalDataSave) originalOnGlobalDataSave(data);
    tkSaveData(data);
};

const originalOnGlobalDataLoaded = window.onGlobalDataLoaded;
window.onGlobalDataLoaded = function(data) {
    if (originalOnGlobalDataLoaded) originalOnGlobalDataLoaded(data);
    tkLoadData(data);
    
    // Sync with main user state if needed
    if (window.userState) {
        if (!tkState.profile.name || tkState.profile.name === 'User') {
            tkState.profile.name = window.userState.name || 'User';
        }
        if (!tkState.profile.avatar && window.userState.avatarUrl) {
            tkState.profile.avatar = window.userState.avatarUrl;
        }
    }
};

// Helper: Get Char
window.tkGetChar = function(charId) {
    return tkState.chars.find(c => c.id === charId);
};

// Helper: Add or Update Char
window.tkSaveChar = function(charData) {
    const existing = tkState.chars.find(c => c.id === charData.id);
    if (existing) {
        Object.assign(existing, charData);
    } else {
        tkState.chars.push(charData);
    }
    window.saveGlobalData();
};
