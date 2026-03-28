// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
const userState = {
    name: 'iis',
    phone: '13800000000',
    persona: 'Default User',
    avatarUrl: null
};
window.userState = userState;

let accounts = [
    { id: 1, name: 'iis', phone: '13800000000', signature: 'Default User', persona: 'Default User', avatarUrl: null },
    { id: 2, name: 'User2', phone: '13912345678', signature: 'Work Persona', persona: 'Work Persona', avatarUrl: null }
];
let currentAccountId = 1;

// Detail View temp state
let isCreatingNewAccount = false;
let detailTempId = null;

// API State
let apiConfig = { endpoint: '', apiKey: '', model: 'gpt-3.5-turbo', temperature: 0.7 };
let apiPresets = [
    { id: 1, name: 'Localhost', endpoint: 'http://localhost:5000', apiKey: 'sk-12345', model: 'llama-2', temp: 0.7 },
    { id: 2, name: 'OpenAI', endpoint: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4', temp: 1.0 }
];
let fetchedModels = ['gpt-3.5-turbo', 'gpt-4', 'claude-v1'];

// Theme State
const isMobileUser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
let themeState = {
    bgUrl: null,
    showIsland: !isMobileUser,
    showStatusBar: true,
    isFullscreen: isMobileUser,
    apps: [
        { id: 'app-icon-1', name: 'Pay', icon: null },
        { id: 'app-icon-2', name: 'TikTok', icon: null },
        { id: 'app-icon-3', name: 'b.stage', icon: null },
        { id: 'app-icon-4', name: 'X', icon: null },
        { id: 'app-icon-5', name: 'App', icon: null },
        { id: 'app-icon-6', name: 'App', icon: null },
        { id: 'app-icon-7', name: 'App', icon: null },
        { id: 'app-icon-8', name: 'App', icon: null },
        { id: 'dock-icon-settings', name: '设置', icon: null },
        { id: 'dock-icon-imessage', name: '信息', icon: null },
        { id: 'dock-icon-youtube', name: 'YouTube', icon: null }
    ]
};
let currentEditingAppIndex = -1;

// World Book State
let wbGroups = []; 
let worldBooks = []; 
window.getWorldBooks = () => worldBooks; 
let editingBookId = null; 
let tempEntries = []; 
let activeEntryId = null; 

// --- Data Persistence Helper ---
function loadGlobalData() {
    try {
        const dataStr = localStorage.getItem('ios_emulator_global_data');
        if (dataStr) {
            const data = JSON.parse(dataStr);
            if (data.userState) Object.assign(userState, data.userState);
            if (data.accounts) accounts = data.accounts;
            if (data.currentAccountId) currentAccountId = data.currentAccountId;
            if (data.apiConfig) Object.assign(apiConfig, data.apiConfig);
            if (data.apiPresets) apiPresets = data.apiPresets;
            if (data.fetchedModels) fetchedModels = data.fetchedModels;
            if (data.themeState) {
                themeState = data.themeState;
                if (themeState.showIsland === undefined) themeState.showIsland = !isMobileUser;
                if (themeState.showStatusBar === undefined) themeState.showStatusBar = true;
                if (themeState.isFullscreen === undefined) themeState.isFullscreen = isMobileUser;
                // Migration for default app names
                if (themeState.apps) {
                    const app1 = themeState.apps.find(a => a.id === 'app-icon-1');
                    if (app1 && app1.name === 'App 1') app1.name = 'Pay';
                    
                    const app2 = themeState.apps.find(a => a.id === 'app-icon-2');
                    if (app2 && app2.name === 'App 2') app2.name = 'TikTok';
                    
                    const app3 = themeState.apps.find(a => a.id === 'app-icon-3');
                    if (app3 && (app3.name === 'App 3' || app3.name === 'Notes')) app3.name = 'b.stage';
                    
                    const app4 = themeState.apps.find(a => a.id === 'app-icon-4');
                    if (app4 && (app4.name === 'App 4' || app4.name === 'Calendar')) app4.name = 'X';

                    // New apps migration
                    ['app-icon-5', 'app-icon-6', 'app-icon-7', 'app-icon-8'].forEach(id => {
                        if (!themeState.apps.find(a => a.id === id)) {
                            themeState.apps.push({ id, name: 'App', icon: null });
                        }
                    });
                }
            }
            if (data.wbGroups) wbGroups = data.wbGroups;
            if (data.worldBooks) worldBooks = data.worldBooks;
            
            // Call external state restores if they registered a hook
            if (window.onGlobalDataLoaded) window.onGlobalDataLoaded(data);
        }
    } catch (e) {
        console.error('Failed to load global data', e);
    }
}

function saveGlobalData() {
    try {
        const data = {
            userState,
            accounts,
            currentAccountId,
            apiConfig,
            apiPresets,
            fetchedModels,
            themeState,
            wbGroups,
            worldBooks
        };
        
        // Allow other modules to inject their state
        if (window.onGlobalDataSave) {
            window.onGlobalDataSave(data);
        }
        
        localStorage.setItem('ios_emulator_global_data', JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save global data', e);
    }
}
window.saveGlobalData = saveGlobalData;

// Load at startup
loadGlobalData();
window.apiConfig = apiConfig;
