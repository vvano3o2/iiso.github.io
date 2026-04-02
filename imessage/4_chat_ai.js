
// ==========================================
// IMESSAGE: 4_chat_ai.js
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const { apiConfig, userState } = window;
    window.imChat = window.imChat || {};
    const imChat = window.imChat;

function handleSend(friend, inputEl, container) {
        const text = inputEl.value.trim();
        if (!text) return;

        const now = Date.now();
        const lastMsg = friend.messages && friend.messages.length > 0 
            ? friend.messages[friend.messages.length - 1] 
            : null;
        
        if (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000)) {
            window.imChat.renderTimestamp(now, container);
        }

        const replyToText = window.imData.currentReplyText || null;

        const msgObj = {
            id: window.imChat.createMessageId('msg'),
            role: 'user',
            content: text,
            timestamp: now,
            replyTo: replyToText
        };

        window.imChat.renderUserBubble(text, container, now, replyToText, null, false, msgObj.id);
        inputEl.value = '';

        if (!friend.messages) friend.messages = [];
        friend.messages.push(msgObj);
        if(window.imApp.saveFriends) window.imApp.saveFriends();

        window.imData.currentReplyText = null;
        const page = document.getElementById(`chat-interface-${friend.id}`);
        if (page) {
            const preview = page.querySelector('.reply-preview-container');
            if (preview) preview.style.display = 'none';
        }
    }

function extractTaggedBlock(text, tagName) {
        if (!text || !tagName) return null;
        const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
        const match = String(text).match(regex);
        return match ? match[1].trim() : null;
    }

function removeTaggedBlock(text, tagName) {
        if (!text || !tagName) return text;
        const regex = new RegExp(`<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'i');
        return String(text).replace(regex, '').trim();
    }

function parseJsonArrayFromText(rawText) {
        if (!rawText || typeof rawText !== 'string') return null;
        let cleanText = rawText.trim();

        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }

        cleanText = cleanText.trim();
        if (!cleanText) return null;

        try {
            const parsed = JSON.parse(cleanText);
            return Array.isArray(parsed) ? parsed : null;
        } catch (e) {
            return null;
        }
    }

async function handleAiReply(friend, container, btnEl) {
        if (!apiConfig.endpoint || !apiConfig.apiKey) {
            if(window.showToast) window.showToast('请先在设置中配置 API');
            return;
        }

        const typingRow = document.createElement('div');
        typingRow.className = 'chat-row ai-row typing-row';
        typingRow.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        `;
        container.appendChild(typingRow);
        window.imChat.scrollToBottom(container);
        
        if(btnEl) btnEl.style.opacity = '0.5';

        friend.memory = window.imApp.normalizeFriendData(friend).memory;

        const relationshipText = friend.memory.relationships && friend.memory.relationships.length > 0
            ? friend.memory.relationships.map(rel => {
                const npc = window.imData.friends.find(item => String(item.id) === String(rel.npcId));
                return `${npc ? npc.nickname : 'Unknown NPC'}: ${rel.relation}`;
            }).join('\n')
            : 'None';
            
        const commonMemorySections = [
            friend.memory.overview ? `Overview:\n${friend.memory.overview}` : '',
            friend.memory.anniversaries ? `Anniversaries:\n${friend.memory.anniversaries}` : '',
            friend.memory.longTerm ? `Long-term Memory:\n${friend.memory.longTerm}` : '',
            friend.memory.cherished ? `Cherished Memories:\n${friend.memory.cherished}` : '',
            friend.memory.context?.notes ? `Extra Context Notes:\n${friend.memory.context.notes}` : '',
            friend.memory.summary?.enabled && friend.memory.summary?.prompt ? `Auto Summary Prompt:\n${friend.memory.summary.prompt}` : '',
            `Relationship Network:\n${relationshipText}`,
            (() => {
                const mounted = friend.mountedStickers || [];
                if (mounted.length === 0) return '';
                const allStickers = window.imData.stickers || [];
                const stickerLines = [];
                mounted.forEach(catName => {
                    const cat = allStickers.find(c => c.categoryName === catName);
                    if (cat && cat.items.length > 0) {
                        const names = cat.items.map(s => s.name).join(', ');
                        stickerLines.push(`[${catName}]: ${names}`);
                    }
                });
                if (stickerLines.length === 0) return '';
                return `Available Stickers (both you and user can use, describe sticker usage with {{sticker:name}} format):\n${stickerLines.join('\n')}`;
            })(),
            (friend.statusBar && friend.statusBar.enabled && friend.statusBar.prompt) 
                ? `[System Note for Status Bar]:\n${friend.statusBar.prompt}` 
                : ''
        ].filter(Boolean).join('\n\n');

        let statusBarHistoryContext = '';
        if (friend.statusBar && friend.statusBar.enabled && Array.isArray(friend.statusBar.history)) {
            const recentStatus = friend.statusBar.history.slice(-3);
            if (recentStatus.length > 0) {
                statusBarHistoryContext = '\n\n近期发布的前三个状态栏内容（请勿重复或不连贯）：\n' + recentStatus.map((s, i) => {
                    try {
                        const parsed = JSON.parse(s.text);
                        return `[状态${i+1}]: ${parsed.text || s.text} | 心声: ${parsed.thought || ''}`;
                    } catch(e) {
                        return `[状态${i+1}]: ${s.text}`;
                    }
                }).join('\n');
            }
        }

        const statusBarRequirement = (friend.statusBar && friend.statusBar.enabled)
            ? (window.imChat.getStatusBarType(friend) === 'icity'
                ? `\n\nStatus Bar Requirement:\n- 本次回复必须且只能额外生成 1 个当下状态栏\n- 状态栏内容必须使用 <status> 和 </status> 包裹\n- <status> 内必须是合法 JSON，不能有 markdown 代码块，不能有额外解释文字\n- JSON 必须包含以下字段：text、loc、thought、comments\n- text 必须是 50-100 字的心声正文，严格结合当前聊天上下文体现当前内心想法，user的话对你产生了什么情绪？\n- thought 必须是 50-100 字，使用第一人称，像日记里的内心独白\n- comments 必须是 1-2 条评论，格式为 [{"user":"评论人","text":"评论内容"}]\n- comments 中的评论必须和当前聊天上下文有关，像真的有人看完会留下的小纸条\n- 除聊天气泡正文外，你必须输出 1 个状态栏，禁止省略${statusBarHistoryContext}`
                : `\n\nStatus Bar Requirement:\n- 本次回复必须且只能额外生成 1 个当下状态栏\n- 状态栏内容必须使用 <status> 和 </status> 包裹\n- <status> 内必须是合法 JSON，不能有 markdown 代码块，不能有额外解释文字\n- JSON 必须包含以下字段：text、img、loc、comment、commentUser、thought\n- text 必须体现你此刻基于聊天上下文的内心想法/状态\n- thought 必须是 50-100 字，使用第一人称，严格基于你的人设与当前聊天上下文，描述你对 user 的想法与感受\n- comment 和 commentUser 必须和当前聊天上下文有关，像是真的有人会对这条动态留言\n- 除聊天气泡正文外，你必须输出 1 个状态栏，禁止省略${statusBarHistoryContext}`)
            : '';

        let systemPrompt = '';
        const effectiveUserPersona = window.imApp?.getEffectivePersonaForFriend
            ? window.imApp.getEffectivePersonaForFriend(friend)
            : (userState.persona || '');
        
        if (friend.type === 'group') {
            const globalWorldBookContext = window.getGlobalWorldBookContext ? window.getGlobalWorldBookContext() : '';
            const worldbookStr = globalWorldBookContext ? `\n\nWorldbook / Background:\n${globalWorldBookContext}` : '';
            const groupMembers = window.imChat.getGroupMemberFriends(friend);
            const allowedSpeakerNames = groupMembers.map(member => member.nickname).filter(Boolean);
            const membersInfo = groupMembers.length > 0
                ? groupMembers.map(member => {
                    return `Name: ${member.nickname}\nPersona: ${member.persona || 'None'}\nOverview: ${member.memory?.overview || 'None'}`;
                }).join('\n\n')
                : 'None';
                
            systemPrompt = `你正在模拟一个名为 "${friend.nickname}" 的群聊。
你正在与 ${userState.name} 聊天，其人设为: ${effectiveUserPersona || '一个普通用户'}。

此群内允许发言的成员名单（除用户外）：
${membersInfo}

只允许以下这些成员发言：
${allowedSpeakerNames.length > 0 ? allowedSpeakerNames.join('、') : 'None'}${worldbookStr}

群聊特定规则：
1. 请根据上下文和群成员性格进行回复，所有群员都必须参与回复，除非群聊人数大于10人则挑选5-8人回复。
2. 每位发声的成员必须发送 2-5 条连贯的消息气泡。标点符号多用空格来代替逗号，一句话分开发成多个气泡，且语句简短。
3. 对话要具有思维流和非连续性，像真人一样可以跳跃、有顿悟、有小情绪的流露。不要机械式回答，要有群聊的插科打诨和生活感。
4. 你会在下面看到带说话人标记的最近聊天记录。你必须认真参考“谁刚刚说了什么”，不能忽略成员自己的上一轮发言，不能像失忆一样重复、改口或无缘无故换立场。
5. 同一个成员如果刚刚表达过观点、情绪、计划、态度、称呼对象，本轮继续发言时必须与其最近发言保持连续性，除非有明确的新消息让他改变想法。
6. 回复时优先承接最近几条消息中的具体对象、话题、称呼、问题和情绪，不要只对最后一条做泛泛回应。
7. 【强限制】：严禁使用名单之外的名字发言，严禁虚构新成员，严禁让 User 冒充群成员发言。
8. 【输出格式】：必须把聊天气泡放在 <chat_json> 和 </chat_json> 标签内，标签内只能是合法 JSON 数组，不能有 markdown 代码块，不能有解释文字。
9. JSON 数组中的每一个对象都严格对应“一个独立气泡”或“发出的红包”，绝对禁止把多条消息合并。
10. 普通文本气泡格式必须为 {"type":"text","speaker":"成员名","text":"气泡内容","translation":"中文翻译或空字符串","quote":"被引用内容或空字符串"}。
11. 【重要】如果群员想要发红包，或者你觉得气氛到了该发红包了，可以输出红包对象格式：{"type":"red_packet","speaker":"发红包的成员名","amount":100,"count":5,"description":"红包封面语"}。
12. speaker 必须且只能使用以上允许发言名单中的完整准确名字。
13. translation 只能翻译当前这一条 text；如果 text 本身是中文，translation 必须是空字符串。
14. quote 只有在你确实想引用用户或上一条消息时才填写，否则必须是空字符串。
15. 除 <chat_json> 外，不要输出任何聊天正文；若启用了状态栏，则继续额外输出 1 个 <status>...</status>。
群聊的背景与关系记忆:
${commonMemorySections || 'None'}`;

        } else {
            const globalWorldBookContext = window.getGlobalWorldBookContext ? window.getGlobalWorldBookContext() : '';

            systemPrompt = `You are playing the role of ${friend.realName || friend.nickname}. 
Your persona is: ${friend.persona || 'No specific persona'}. 
You are talking to ${userState.name}, whose persona is: ${effectiveUserPersona || 'A normal user'}.
Reply naturally as your character in a chat app.
请根据上下文，记忆，人设进行回复，一次按需求回复2-8条气泡。
强制遵循以下角色自然对话原则，模拟真人聊天的自然感：
1. 你的回复应该具有思维流和非连续性，像真人一样可以跳跃、有顿悟、有小情绪的流露，摒弃 AI 典型的“总-分-总”或机械式的应答结构，不要总是试图提供完美或完整的解答。
2. 标点符号多用空格来代替逗号，一句话会分开发成多个气泡，且语句简短。不需要对用户的每句话都进行回应，保持一定的选择性和重点。
3. 回复不完全依赖于对用户消息的直接回应，可以根据上下文和记忆中的信息进行自由发挥和创造，甚至可以引入一些新的话题或元素来丰富对话。
4. 语言风格要符合现代即时通讯软件的习惯（如简短、随性），以第一人称视角进行回复，避免过于正式或书面化的表达。
5. 如果用户刚刚给你转账，你可以选择正常文字回复，也可以额外输出 1 个支付对象表示“收下转账”；如果你想给用户转账，也可以输出 1 个支付对象表示“你向用户转账”。
6. 【输出格式】必须把聊天气泡放在 <chat_json> 和 </chat_json> 标签内，标签内只能是合法 JSON 数组，不能有 markdown 代码块，不能有解释文字。
7. JSON 数组中的每一个对象都严格对应“一个独立气泡”或“一个独立支付卡片”，绝对禁止把多条气泡合并到同一个 text 字段里。
8. 普通文本对象格式必须为 {"type":"text","text":"气泡内容","translation":"该条气泡的中文翻译或空字符串","quote":"被引用内容或空字符串"}。
9. 支付对象格式必须为 {"type":"payment","paymentAction":"receive|transfer","amount":88.88,"description":"原因或备注"}。
10. 当 paymentAction 为 receive 时，表示你收下了用户刚刚给你的钱；当 paymentAction 为 transfer 时，表示你给用户转账。
11. translation 只能翻译当前这一条 text；如果 text 本身是中文，translation 必须是空字符串。
12. quote 只有在你确实想引用用户某句消息时才填写，否则必须是空字符串。
13. 除 <chat_json> 外，不要输出任何聊天正文；若启用了状态栏，则继续额外输出 1 个 <status>...</status>。

Character Memory:
${commonMemorySections || 'None'}${globalWorldBookContext ? `\n\nGlobal World Book:\n${globalWorldBookContext}` : ''}`;
        }

        const messages = [{ role: 'system', content: systemPrompt }];
        if (friend.messages) {
            const defaultContextLimit = friend.type === 'group' ? 50 : 30;
            const contextLimit = friend.memory?.context?.enabled === false
                ? 0
                : (Number(friend.memory?.context?.limit) > 0 ? Number(friend.memory.context.limit) : defaultContextLimit);
            const recent = contextLimit > 0 ? friend.messages.slice(-contextLimit) : [];

            recent.forEach(m => {
                let apiContent = m.content;

                if (m.type === 'moment_forward') {
                    try {
                        const momentData = JSON.parse(m.content);
                        apiContent = `[分享了一条朋友圈: ${momentData.text || ''}]`;
                        if (momentData.img) apiContent += ` (附带图片)`;
                    } catch(e) {
                        apiContent = `[分享了一条朋友圈]`;
                    }
                } else if (m.type === 'image') {
                    apiContent = `[发送了一张图片: ${m.text || '无描述'}]`;
                } else if (m.type === 'pay_transfer') {
                    const payAmount = Number(m.amount) || 0;
                    const payDesc = m.description || '转账';
                    const payTarget = m.targetName || friend.nickname || '对方';

                    if (m.payKind === 'user_to_char') {
                        apiContent = `[用户刚刚向你转账 ¥${payAmount.toFixed(2)}，备注：${payDesc}，对象：${payTarget}。你可以收下这笔钱，也可以正常回复。]`;
                    } else if (m.payKind === 'char_received') {
                        apiContent = `[你刚刚收下了用户的一笔转账 ¥${payAmount.toFixed(2)}，备注：${payDesc}。]`;
                    } else if (m.payKind === 'char_to_user_pending') {
                        apiContent = `[你刚刚向用户发起了一笔转账 ¥${payAmount.toFixed(2)}，备注：${payDesc}，等待用户领取。]`;
                    } else if (m.payKind === 'char_to_user_claimed' || m.payKind === 'user_received_from_char') {
                        apiContent = `[用户刚刚领取了你转给他的 ¥${payAmount.toFixed(2)}，备注：${payDesc}。]`;
                    }
                }

                if (friend.type === 'group') {
                    if (m.role === 'user') {
                        const userLabel = `User(${userState.name || 'User'})`;
                        if (m.replyTo) {
                            apiContent = `[引用了消息："${m.replyTo}"]\n${apiContent}`;
                        }
                        messages.push({
                            role: 'user',
                            content: `${userLabel}: ${apiContent}`
                        });
                    } else {
                        const assistantSpeaker = typeof m.speaker === 'string' && m.speaker.trim()
                            ? m.speaker.trim()
                            : ((m.role === 'assistant' && friend.type === 'group')
                                ? (window.imChat.getSafeGroupSpeaker(friend)?.nickname || '群成员')
                                : 'Assistant');

                        if (m.replyTo) {
                            apiContent = `[引用了消息："${m.replyTo}"]\n${apiContent}`;
                        }

                        messages.push({
                            role: 'assistant',
                            content: `${assistantSpeaker}: ${apiContent}`
                        });
                    }
                } else {
                    if (m.role === 'user' && m.replyTo) {
                        apiContent = `[用户引用了消息："${m.replyTo}"]\n${m.content}`;
                    }
                    messages.push({ role: m.role, content: apiContent });
                }
            });
        }
        if (messages.length === 1) messages.push({ role: 'user', content: 'Hello' });

        try {
            let endpoint = apiConfig.endpoint;
            if(endpoint.endsWith('/')) endpoint = endpoint.slice(0, -1);
            if(!endpoint.endsWith('/chat/completions')) {
                endpoint = endpoint.endsWith('/v1') ? endpoint + '/chat/completions' : endpoint + '/v1/chat/completions';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` },
                body: JSON.stringify({
                    model: apiConfig.model || '',
                    messages: messages,
                    temperature: parseFloat(apiConfig.temperature) || 0.7
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            let fullReply = data.choices[0].message.content;

            if (typingRow) typingRow.remove();

            // Status Bar Regex Extraction
            let statusExtracted = false;
            if (friend.statusBar && friend.statusBar.enabled && friend.statusBar.regex) {
                try {
                    const regex = new RegExp(friend.statusBar.regex, 'g');
                    let match;
                    let lastMatch = null;
                    while ((match = regex.exec(fullReply)) !== null) {
                        lastMatch = match;
                    }

                    if (lastMatch && lastMatch[1]) {
                        statusExtracted = true;
                        const statusText = lastMatch[1].trim();
                        // Add to history
                        if (!friend.statusBar.history) friend.statusBar.history = [];
                        friend.statusBar.history.push({
                            id: Date.now(),
                            text: statusText,
                            type: window.imChat.getStatusBarType(friend),
                            styleSnapshot: friend.statusBar.style || ''
                        });
                        
                        // Remove all matches from fullReply so it doesn't show in chat bubble
                        fullReply = fullReply.replace(regex, '').trim();

                        // Refresh status bar UI only if it's already open
                        const page = document.getElementById(`chat-interface-${friend.id}`);
                        if (page) {
                            const statusBarContainer = page.querySelector('.chat-status-bar-container');
                        if (statusBarContainer && statusBarContainer.style.opacity === '1') {
                            window.imChat.setStatusBarPage(friend, friend.statusBar.history.length - 1);
                            window.imChat.renderStatusBarHistory(friend, statusBarContainer);
                            requestAnimationFrame(() => {
                                window.imChat.syncStatusBarView(friend, statusBarContainer, { scroll: true });
                            });
                        }
                        }
                    } else {
                        if (window.showToast) window.showToast('本次回复未生成状态栏');
                    }
                } catch (e) {
                    console.error("Status Bar Regex Error:", e);
                }
            }

            if (!fullReply) {
                // If the entire reply was just the status
                if(btnEl) btnEl.style.opacity = '1';
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                return;
            }

            let structuredItems = null;
            const chatJsonBlock = window.imChat.extractTaggedBlock(fullReply, 'chat_json');
            if (chatJsonBlock) {
                structuredItems = window.imChat.parseJsonArrayFromText(chatJsonBlock);
                fullReply = window.imChat.removeTaggedBlock(fullReply, 'chat_json');
            }

            if (!structuredItems) {
                const directJsonArray = window.imChat.parseJsonArrayFromText(fullReply);
                if (directJsonArray) {
                    structuredItems = directJsonArray;
                    fullReply = '';
                }
            }

            let queueItems = [];

            if (structuredItems && structuredItems.length > 0) {
                queueItems = structuredItems.map(item => {
                    if (!item || typeof item !== 'object') return null;

                    const itemType = typeof item.type === 'string' ? item.type.trim().toLowerCase() : '';
                    if (itemType === 'red_packet') {
                        const amount = Number(item.amount);
                        const count = parseInt(item.count, 10) || 5;
                        if (!Number.isFinite(amount) || amount <= 0) return null;

                        return {
                            kind: 'red_packet',
                            amount,
                            count,
                            description: typeof item.description === 'string' ? item.description.trim() || '恭喜发财' : '恭喜发财',
                            speaker: typeof item.speaker === 'string' ? item.speaker.trim() : ''
                        };
                    }
                    if (itemType === 'payment' || item.paymentAction) {
                        const amount = Number(item.amount);
                        if (!Number.isFinite(amount) || amount <= 0) return null;

                        return {
                            kind: 'payment',
                            paymentAction: item.paymentAction === 'transfer' ? 'transfer' : 'receive',
                            amount,
                            description: typeof item.description === 'string' ? item.description.trim() || '转账' : '转账'
                        };
                    }

                    const text = typeof item.text === 'string' ? item.text.trim() : '';
                    if (!text) return null;

                    return {
                        kind: 'text',
                        text,
                        translation: typeof item.translation === 'string'
                            ? item.translation.trim()
                            : (typeof item.trans === 'string' ? item.trans.trim() : ''),
                        replyTo: typeof item.quote === 'string' ? item.quote.trim() : '',
                        speaker: typeof item.speaker === 'string' ? item.speaker.trim() : ''
                    };
                }).filter(Boolean);
            }

            if (queueItems.length === 0) {
                let fullTranslation = null;
                const transRegex = /<translation>([\s\S]*?)<\/translation>/i;
                const transMatch = fullReply.match(transRegex);
                if (transMatch) {
                    fullTranslation = transMatch[1].trim();
                    fullReply = fullReply.replace(transRegex, '').trim();
                }

                let sentences = [];
                if (friend.type === 'group') {
                    sentences = fullReply.split(/\n+/).map(s => s.trim()).filter(s => s.length > 0);
                } else if (fullTranslation) {
                    sentences = [fullReply];
                } else {
                    sentences = fullReply.split(/(?<=[。！？.!?\n])/).map(s => s.trim()).filter(s => s.length > 0);
                    
                    if (sentences.length > 7) {
                        while (sentences.length > 7) {
                            let minLen = Infinity;
                            let minIdx = 0;
                            for (let i = 0; i < sentences.length - 1; i++) {
                                let len = sentences[i].length + sentences[i + 1].length;
                                if (len < minLen) {
                                    minLen = len;
                                    minIdx = i;
                                }
                            }
                            sentences[minIdx] = sentences[minIdx] + ' ' + sentences[minIdx + 1];
                            sentences.splice(minIdx + 1, 1);
                        }
                    } else if (sentences.length < 3 && fullReply.length > 30) {
                        sentences = fullReply.split(/(?<=[。！？.!?\n，,])/).map(s => s.trim()).filter(s => s.length > 0);
                        if (sentences.length > 7) sentences = sentences.slice(0, 7);
                    }
                }

                if (sentences.length === 0 && fullReply) sentences = [fullReply];

                queueItems = sentences.map(text => ({
                    text,
                    translation: fullTranslation || '',
                    replyTo: '',
                    speaker: ''
                }));
            }

            if (queueItems.length === 0) {
                if(btnEl) btnEl.style.opacity = '1';
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                return;
            }

            let qIndex = 0;
            const now = Date.now();
            const bannerPreviewText = queueItems.map(item => item.text).filter(Boolean).join(' ').trim() || fullReply;
            
            // Re-fetch the container safely in case user navigated away
            const getSafeContainer = () => {
                const pageId = `chat-interface-${friend.id}`;
                const page = document.getElementById(pageId);
                return page ? page.querySelector('.ins-chat-messages') : null;
            };

            const safeContainer = getSafeContainer();
            const lastMsg = friend.messages[friend.messages.length - 1]; 
            if (safeContainer && (!lastMsg || (now - (lastMsg.timestamp || 0) > 300000))) {
                window.imChat.renderTimestamp(now, safeContainer);
            }

            let lastGroupSpeaker = null;

            async function processNextSentence() {
                if (qIndex >= queueItems.length) {
                    const redPacketChanged = friend.type === 'group'
                        ? window.imChat.processPendingGroupRedPackets(friend)
                        : false;

                    if (redPacketChanged) {
                        const latestContainer = getSafeContainer();
                        const isActiveChat = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id);

                        if (isActiveChat && latestContainer) {
                            latestContainer.innerHTML = '';
                            window.imChat.renderChatHistory(friend, latestContainer);
                            window.imChat.scrollToBottom(latestContainer);
                        }
                    }

                    if (window.imApp.saveFriends) window.imApp.saveFriends();
                    if (btnEl) btnEl.style.opacity = '1';
                    
                    // Check if we need to show banner notification AFTER ALL sentences processed
                    if (!window.imData.currentActiveFriend || String(window.imData.currentActiveFriend.id) !== String(friend.id)) {
                        if (window.imApp.showBannerNotification) {
                            window.imApp.showBannerNotification(friend, bannerPreviewText);
                        }
                    }
                    
                    // If user is on the main list view, we need to update the preview text
                    if (window.imApp.updateChatsView && !window.imData.currentActiveFriend) {
                        window.imApp.updateChatsView();
                    }
                    
                    return;
                }

                const currentItem = queueItems[qIndex] || {};

                if (currentItem.kind === 'red_packet') {
                    const totalAmount = Number(currentItem.amount) || 0;
                    const packetCount = parseInt(currentItem.count, 10) || 5;
                    const description = currentItem.description || '恭喜发财';
                    let speakerName = currentItem.speaker || lastGroupSpeaker || '群成员';
                    let detectedSpeaker = null;

                    if (friend.type === 'group') {
                        detectedSpeaker = window.imChat.normalizeGroupSpeaker(friend, speakerName);
                        if (!detectedSpeaker && lastGroupSpeaker) {
                            detectedSpeaker = window.imChat.normalizeGroupSpeaker(friend, lastGroupSpeaker);
                        }
                    }

                    if (detectedSpeaker) {
                        speakerName = detectedSpeaker.nickname || detectedSpeaker.realName;
                        lastGroupSpeaker = speakerName;
                    }

                    if (totalAmount > 0) {
                        const nowMsg = Date.now();
                        const allocations = window.imChat.createRedPacketAllocations(totalAmount, packetCount);
                        
                        const packetMsg = window.imChat.normalizeGroupRedPacketState({
                            id: window.imChat.createMessageId('packet'),
                            packetId: window.imChat.createMessageId('packet'),
                            role: 'assistant',
                            type: 'group_red_packet',
                            totalAmount,
                            packetCount,
                            description,
                            allocations,
                            claimRecords: [],
                            claimedMemberIds: [],
                            content: `[群红包] ${description} ¥${Number(totalAmount).toFixed(2)}`,
                            timestamp: nowMsg,
                            speakerMemberId: detectedSpeaker ? detectedSpeaker.id : '',
                            senderName: speakerName,
                            senderAvatarUrl: detectedSpeaker ? detectedSpeaker.avatarUrl : ''
                        }, friend);

                        const freshContainer = getSafeContainer();
                        const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && freshContainer;

                        if (!friend.messages) friend.messages = [];
                        friend.messages.push(packetMsg);

                        if (isUserStillLooking) {
                            window.imChat.renderGroupRedPacketBubble(packetMsg, friend, freshContainer, nowMsg);
                        }
                    }

                    qIndex++;
                    processNextSentence();
                    return;
                }

                if (currentItem.kind === 'payment') {
                    const paymentAction = currentItem.paymentAction === 'transfer' ? 'transfer' : 'receive';
                    const paymentAmount = Number(currentItem.amount) || 0;
                    const paymentDescription = currentItem.description || '转账';

                    if (paymentAmount > 0) {
                        const nowMsg = Date.now();
                        const paymentMsg = {
                            id: window.imChat.createMessageId('pay'),
                            role: 'assistant',
                            type: 'pay_transfer',
                            payKind: paymentAction === 'transfer' ? 'char_to_user_pending' : 'char_received',
                            amount: paymentAmount,
                            description: paymentDescription,
                            targetName: paymentAction === 'transfer'
                                ? (friend.nickname || friend.realName || '对方')
                                : (userState.name || '用户'),
                            cardTitle: paymentAction === 'transfer' ? '转账' : '收款',
                            payStatus: 'completed',
                            content: paymentAction === 'transfer'
                                ? `[角色转账] ${paymentDescription} ¥${paymentAmount.toFixed(2)}`
                                : `[收下转账] ${paymentDescription} ¥${paymentAmount.toFixed(2)}`,
                            timestamp: nowMsg
                        };

                        const freshContainer = getSafeContainer();
                        const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && freshContainer;

                        if (!friend.messages) friend.messages = [];
                        friend.messages.push(paymentMsg);

                        if (isUserStillLooking) {
                            window.imChat.renderPayTransferBubble(paymentMsg, friend, freshContainer, nowMsg);
                        }
                    }

                    qIndex++;
                    processNextSentence();
                    return;
                }

                let text = typeof currentItem.text === 'string' ? currentItem.text.trim() : '';
                let aiReplyTo = typeof currentItem.replyTo === 'string' && currentItem.replyTo.trim() ? currentItem.replyTo.trim() : null;
                const itemTranslation = typeof currentItem.translation === 'string' && currentItem.translation.trim()
                    ? currentItem.translation.trim()
                    : null;

                if (!text) {
                    qIndex++;
                    processNextSentence();
                    return;
                }

                if (!structuredItems) {
                    const quoteRegex = /<quote>([\s\S]*?)<\/quote>/i;
                    const quoteMatch = text.match(quoteRegex);
                    if (quoteMatch) {
                        aiReplyTo = quoteMatch[1].trim();
                        text = text.replace(quoteRegex, '').trim();
                    }
                }

                let currentSpeakerName = null;
                let currentSpeakerAvatar = null;
                if (friend.type === 'group') {
                    let detectedSpeaker = null;

                    if (structuredItems && currentItem.speaker) {
                        detectedSpeaker = window.imChat.normalizeGroupSpeaker(friend, currentItem.speaker);
                    } else {
                        const nameRegex = /^([a-zA-Z0-9\u4e00-\u9fa5\s_\-.]+)[：:]\s*/;
                        const nameMatch = text.match(nameRegex);

                        if (nameMatch) {
                            detectedSpeaker = window.imChat.normalizeGroupSpeaker(friend, nameMatch[1].trim());
                            text = text.substring(nameMatch[0].length).trim();
                        } else if (lastGroupSpeaker) {
                            detectedSpeaker = window.imChat.normalizeGroupSpeaker(friend, lastGroupSpeaker);
                        }
                    }

                    if (!detectedSpeaker) {
                        detectedSpeaker = window.imChat.getSafeGroupSpeaker(friend, lastGroupSpeaker);
                    }

                    if (detectedSpeaker) {
                        currentSpeakerName = detectedSpeaker.nickname;
                        currentSpeakerAvatar = detectedSpeaker.avatarUrl || null;
                        lastGroupSpeaker = currentSpeakerName;
                    }
                }
                
                if (!text) {
                    qIndex++;
                    processNextSentence();
                    return;
                }

                const delay = Math.max(500, Math.min(2000, text.length * 50));
                
                // Only show typing animation if the user is STILL in this chat
                const currentContainer = getSafeContainer();
                const isUserLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && currentContainer;
                
                let tr = null;
                if (isUserLooking) {
                    tr = document.createElement('div');
                    tr.className = 'chat-row ai-row typing-row';
                    tr.innerHTML = `
                        <div class="typing-indicator">
                            <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                        </div>
                    `;
                    
                    const lastRow = currentContainer.lastElementChild;
                    if (lastRow && lastRow.classList.contains('ai-row') && !lastRow.classList.contains('typing-row')) {
                        lastRow.classList.add('has-next');
                        tr.classList.add('has-prev');
                    }
                    
                    currentContainer.appendChild(tr);
                    window.imChat.scrollToBottom(currentContainer);
                }

                await new Promise(res => setTimeout(res, delay));
                
                if (tr && tr.parentNode) {
                    tr.remove(); 
                }

                const nowMsg = Date.now();
                const msgObj = { id: window.imChat.createMessageId('msg'), role: 'assistant', content: text, timestamp: nowMsg, replyTo: aiReplyTo };
                if (currentSpeakerName) msgObj.speaker = currentSpeakerName;
                if (itemTranslation) {
                    msgObj.translation = itemTranslation;
                    msgObj.showTranslation = false;
                }
                
                // Only attempt to render bubble if user is STILL in this chat
                const freshContainer = getSafeContainer();
                const isUserStillLooking = window.imData.currentActiveFriend && String(window.imData.currentActiveFriend.id) === String(friend.id) && freshContainer;
                
                if (isUserStillLooking) {
                    window.imChat.renderAiBubble(text, friend, freshContainer, nowMsg, msgObj.translation, msgObj.showTranslation, msgObj.replyTo, currentSpeakerName, currentSpeakerAvatar, msgObj.id);
                }

                // ALWAYS push data to history regardless of where user is
                if (!friend.messages) friend.messages = [];
                friend.messages.push(msgObj);

                qIndex++;
                processNextSentence();
            }

            processNextSentence();

        } catch (error) {
            if (typingRow && typingRow.parentNode) typingRow.remove();
            if (window.showToast) window.showToast('API 请求失败');
            console.error(error);
            if (btnEl) btnEl.style.opacity = '1';
        }
    }

    window.imChat.handleSend = handleSend;
    window.imChat.extractTaggedBlock = extractTaggedBlock;
    window.imChat.removeTaggedBlock = removeTaggedBlock;
    window.imChat.parseJsonArrayFromText = parseJsonArrayFromText;
    window.imChat.handleAiReply = handleAiReply;

});
