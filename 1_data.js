

    // 1. YouTube Mock Data & Discovery Content
    let mockVideos = []; // Global video list
    let currentChatHistory = []; // Store chat history for summary
    
    // Initial empty mock subscription list
    let mockSubscriptions = []; 
    let hasSubscriptions = false;

    // Channel Data State
    let ytUserState = null; // Internal state for YouTube app
    let currentSummaryFilter = '全部';

    function sanitizeObj(obj) {
        if (typeof obj === 'string') {
            let str = obj.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
            str = str.replace(/[.。]+$/g, '');
            return str.trim();
        } else if (Array.isArray(obj)) {
            return obj.map(item => sanitizeObj(item));
        } else if (obj !== null && typeof obj === 'object') {
            const newObj = {};
            for (let key in obj) {
                newObj[key] = sanitizeObj(obj[key]);
            }
            return newObj;
        }
        return obj;
    }
    let channelState = {
        bannerUrl: null,
        url: '',
        boundWorldBookIds: [],
        systemPrompt: '',
        summaryPrompt: '',
        groupChatPrompt: '',
        vodPrompt: '',
        postPrompt: '',
        liveSummaries: [], // Store generated live summaries
        groupChatHistory: [], // Store group chat history
        cachedTrendingLive: null,
        cachedTrendingSub: null,
        pastVideos: []
    };

    // --- Helper Functions ---
    // Universal image compression to prevent localStorage quota exceeded
    function compressImage(dataUrl, maxWidth, maxHeight, callback) {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            let shouldCompress = false;
            
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
                shouldCompress = true;
            }
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
                shouldCompress = true;
            }

            if (!shouldCompress) {
                // Already small enough, but re-encode to jpeg for consistency and slight size reduction
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, img.height);
                callback(canvas.toDataURL('image/jpeg', 0.8));
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with 0.8 quality to save space
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            callback(compressedDataUrl);
        };
        img.src = dataUrl;
    }

    function parseSubs(str) {
        if (!str) return 0;
        let s = String(str).replace(/,/g, '').trim();
        let multi = 1;
        if (s.includes('亿')) { multi = 100000000; s = s.replace('亿', ''); }
        else if (s.includes('万')) { multi = 10000; s = s.replace('万', ''); }
        else if (s.toUpperCase().includes('K')) { multi = 1000; s = s.toUpperCase().replace('K', ''); }
        else if (s.toUpperCase().includes('M')) { multi = 1000000; s = s.toUpperCase().replace('M', ''); }
        let num = parseFloat(s);
        if (isNaN(num)) return 0;
        return Math.floor(num * multi);
    }

    function formatSubs(num) {
        if (num >= 100000000) {
            return (num / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
        } else if (num >= 10000) {
            return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万';
        } else {
            return num.toString();
        }
    }

    // --- Data Persistence ---
    function loadYoutubeData() {
        try {
            const savedState = localStorage.getItem('yt_channel_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                channelState = { ...channelState, ...parsed };
                if (!channelState.pastVideos) channelState.pastVideos = [];
            }
            const savedSubs = localStorage.getItem('yt_subscriptions');
            if (savedSubs) {
                mockSubscriptions = JSON.parse(savedSubs);
                hasSubscriptions = mockSubscriptions.length > 0;
                // Re-populate mockVideos based on loaded subs
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
            const savedUser = localStorage.getItem('yt_user_state');
            if (savedUser) {
                ytUserState = JSON.parse(savedUser);
            }
        } catch (e) {
            console.error("Error loading YouTube data", e);
        }
    }

    function saveYoutubeData() {
        try {
            localStorage.setItem('yt_channel_state', JSON.stringify(channelState));
            localStorage.setItem('yt_subscriptions', JSON.stringify(mockSubscriptions));
            if (ytUserState) {
                localStorage.setItem('yt_user_state', JSON.stringify(ytUserState));
            }
        } catch (e) {
            console.error("Error saving YouTube data", e);
        }
    }

    // Load data initially
    loadYoutubeData();
