// ==========================================
// IMESSAGE: 5. SETTINGS & EDITING
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const { openView, closeView, showToast, showCustomModal } = window;
    
    const chatSettingsSheet = document.getElementById('chat-settings-sheet');
    
    // Initialize shared state if not present
    window.imData.currentSettingsFriend = null;

    // Bind World Book Elements
    const bindWorldBookSheet = document.getElementById('bind-world-book-sheet');
    const bindWorldBookList = document.getElementById('bind-world-book-list');
    const confirmBindWorldBookBtn = document.getElementById('confirm-bind-world-book-btn');
    const worldBookBtn = document.getElementById('world-book-btn');
    
    let tempSelectedBookIds = [];
    
    const editCharPersonaSheet = document.getElementById('edit-char-persona-sheet');
    const relationshipSheet = document.getElementById('relationship-sheet');
    const relationshipBtn = document.getElementById('relationship-btn');
    const relationshipList = document.getElementById('relationship-list');
    const relationshipEmptyState = document.getElementById('relationship-empty-state');
    const relationshipPicker = document.getElementById('relationship-picker');
    const relationshipPickerList = document.getElementById('relationship-picker-list');
    const confirmRelationshipBtn = document.getElementById('confirm-relationship-btn');
    const relationshipAddNpcBtn = document.getElementById('relationship-add-npc-btn');

    let tempRelationshipDrafts = [];
    let isRelationshipPickerVisible = false;
    
    // Zoom & Pan state
    let relScale = 1;
    let relTranslateX = 0;
    let relTranslateY = 0;
    let isDraggingRel = false;
    let startDragX = 0;
    let startDragY = 0;
    let initialPinchDistance = null;
    let initialScale = 1;
    
    // Node Dragging State
    let draggingNodeId = null;

    function getDraftRelationValue(npcId, friend) {
        const draftRelation = tempRelationshipDrafts.find(rel => String(rel.npcId) === String(npcId));
        const savedRelation = friend.memory.relationships.find(rel => String(rel.npcId) === String(npcId));
        if (draftRelation) return draftRelation.relation || '';
        return savedRelation ? (savedRelation.relation || '') : '';
    }
    
    function resetRelView() {
        relScale = 1;
        relTranslateX = 0;
        relTranslateY = 0;
    }

    function renderRelationshipList(friend) {
        if (!relationshipList || !relationshipEmptyState) return;

        friend.memory = friend.memory || window.imApp.createDefaultMemory();
        if (!Array.isArray(friend.memory.relationships)) {
            friend.memory.relationships = [];
        }

        const selectedRelations = tempRelationshipDrafts;

        relationshipList.innerHTML = '';
        relationshipEmptyState.innerHTML = '';
        relationshipEmptyState.style.display = 'none';

        if (selectedRelations.length === 0) {
            relationshipList.style.display = 'none';
            relationshipEmptyState.style.display = 'block';
            relationshipEmptyState.innerHTML = '<div style="text-align:center; color:#8e8e93; padding:24px 16px; font-size:14px; line-height:1.6;">当前还没有关联 NPC。<br>点击下方“添加NPC”可从已有 NPC 中拉取。</div>';
            return;
        }

        relationshipList.style.display = 'flex';

        selectedRelations.forEach(rel => {
            const npc = window.imData.friends.find(item => item.type === 'npc' && String(item.id) === String(rel.npcId));
            if (!npc) return;

            const item = document.createElement('div');
            item.className = 'relationship-item';

            const avatarHtml = npc.avatarUrl
                ? `<img src="${npc.avatarUrl}" alt="">`
                : '<i class="fas fa-robot"></i>';

            item.innerHTML = `
                <div class="relationship-avatar">${avatarHtml}</div>
                <div class="relationship-meta">
                    <div class="relationship-name">${npc.nickname}</div>
                    <div class="relationship-desc">${npc.realName || npc.signature || 'NPC'}</div>
                </div>
                <input class="relationship-input" data-npc-id="${npc.id}" type="text" placeholder="输入关系" value="${rel.relation || ''}">
                <div class="relationship-delete-btn" style="color: #ff3b30; cursor: pointer; padding: 0 10px; font-size: 18px;"><i class="fas fa-minus-circle"></i></div>
            `;

            const deleteBtn = item.querySelector('.relationship-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    collectRelationshipDrafts();
                    tempRelationshipDrafts = tempRelationshipDrafts.filter(r => String(r.npcId) !== String(npc.id));
                    
                    relationshipList.innerHTML = '';
                    renderRelationshipList(friend);
                    renderRelationshipPreview(friend);
                    renderRelationshipPicker(friend);
                });
            }
            
            const relInput = item.querySelector('.relationship-input');
            if (relInput) {
                relInput.addEventListener('input', () => {
                    collectRelationshipDrafts();
                    renderRelationshipPreview(friend);
                });
            }

            relationshipList.appendChild(item);
        });
    }

    function renderRelationshipPreview(friend) {
        const previewArea = document.getElementById('relationship-preview-area');
        const canvas = document.getElementById('relationship-canvas');
        const nodesContainer = document.getElementById('relationship-nodes-container');
        
        if (!previewArea || !canvas || !nodesContainer) return;
        
        canvas.width = previewArea.clientWidth;
        canvas.height = previewArea.clientHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        nodesContainer.innerHTML = '';
        
        // Apply transformations to nodes container
        nodesContainer.style.transform = `translate(${relTranslateX}px, ${relTranslateY}px) scale(${relScale})`;
        nodesContainer.style.transformOrigin = '0 0';

        const selectedRelations = tempRelationshipDrafts;
            
        if (selectedRelations.length === 0) {
            // Still render main node even if no relations
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            const mainNode = document.createElement('div');
            mainNode.className = 'relationship-node main-node';
            mainNode.style.left = `${centerX - 25}px`;
            mainNode.style.top = `${centerY - 25}px`;
            
            const mainAvatar = friend.avatarUrl 
                ? `<img src="${friend.avatarUrl}">` 
                : `<i class="fas fa-user"></i>`;

            mainNode.innerHTML = `${mainAvatar}`;
            nodesContainer.appendChild(mainNode);
            return;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const mainNode = document.createElement('div');
        mainNode.className = 'relationship-node main-node';
        mainNode.style.left = `${centerX - 25}px`;
        mainNode.style.top = `${centerY - 25}px`;
        
        const mainAvatar = friend.avatarUrl 
            ? `<img src="${friend.avatarUrl}">` 
            : `<i class="fas fa-user"></i>`;

        mainNode.innerHTML = `${mainAvatar}`;
        nodesContainer.appendChild(mainNode);

        const radius = Math.min(canvas.width, canvas.height) * 0.35;
        const angleStep = (Math.PI * 2) / selectedRelations.length;

        // Draw connections on canvas, scaled and translated
        ctx.save();
        ctx.translate(relTranslateX, relTranslateY);
        ctx.scale(relScale, relScale);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.5;

        selectedRelations.forEach((rel, index) => {
            const npc = window.imData.friends.find(item => String(item.id) === String(rel.npcId));
            if (!npc) return;

            if (rel.offsetX === undefined || rel.offsetY === undefined) {
                const angle = index * angleStep - Math.PI / 2;
                rel.offsetX = radius * Math.cos(angle);
                rel.offsetY = radius * Math.sin(angle);
            }

            const x = centerX + rel.offsetX;
            const y = centerY + rel.offsetY;

            // Draw line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Draw text on line
            if (rel.relation) {
                const textX = centerX + rel.offsetX * 0.5;
                const textY = centerY + rel.offsetY * 0.5;
                
                ctx.font = '10px sans-serif';
                const metrics = ctx.measureText(rel.relation);
                const textWidth = metrics.width;
                const textHeight = 14;
                
                // Rotation for text
                let textAngle = Math.atan2(rel.offsetY, rel.offsetX);
                if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
                    textAngle += Math.PI;
                }

                ctx.save();
                ctx.translate(textX, textY);
                ctx.rotate(textAngle);
                
                // Background
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.roundRect(-textWidth/2 - 4, -textHeight/2 - 1, textWidth + 8, textHeight + 2, 4);
                ctx.fill();
                
                // Text
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(rel.relation, 0, 0);
                
                ctx.restore();
            }

            // Create NPC node in DOM
            const npcNode = document.createElement('div');
            npcNode.className = 'relationship-node';
            npcNode.style.left = `${x - 20}px`;
            npcNode.style.top = `${y - 20}px`;
            npcNode.style.cursor = 'pointer';
            
            const npcAvatar = npc.avatarUrl 
                ? `<img src="${npc.avatarUrl}">` 
                : `<i class="fas fa-robot"></i>`;

            npcNode.innerHTML = `${npcAvatar}`;
            
            // Add interaction for node dragging
            const startNodeDrag = (e) => {
                e.stopPropagation(); // Stop canvas panning
                draggingNodeId = rel.npcId;
                isDraggingRel = false;
                
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                
                startDragX = clientX;
                startDragY = clientY;
            };

            npcNode.addEventListener('mousedown', startNodeDrag);
            npcNode.addEventListener('touchstart', startNodeDrag, {passive: false});

            nodesContainer.appendChild(npcNode);
        });
        
        ctx.restore();
    }
    
    // Setup Interaction for Relationship Preview
    function initRelationshipPreviewInteractions() {
        const previewArea = document.getElementById('relationship-preview-area');
        if (!previewArea) return;
        
        // Prevent multiple bindings
        if (previewArea.dataset.bound === 'true') return;
        previewArea.dataset.bound = 'true';

        // Mouse Events
        previewArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(Math.max(0.5, relScale * zoomAmount), 3);
            
            // Zoom towards mouse pointer
            const rect = previewArea.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            relTranslateX = mouseX - (mouseX - relTranslateX) * (newScale / relScale);
            relTranslateY = mouseY - (mouseY - relTranslateY) * (newScale / relScale);
            relScale = newScale;
            
            if(window.imData.currentSettingsFriend) {
                renderRelationshipPreview(window.imData.currentSettingsFriend);
            }
        }, { passive: false });

        previewArea.addEventListener('mousedown', (e) => {
            if (!draggingNodeId) {
                isDraggingRel = true;
                startDragX = e.clientX - relTranslateX;
                startDragY = e.clientY - relTranslateY;
                previewArea.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (draggingNodeId) {
                const dx = (e.clientX - startDragX) / relScale;
                const dy = (e.clientY - startDragY) / relScale;
                
                const rel = tempRelationshipDrafts.find(r => r.npcId === draggingNodeId);
                if (rel) {
                    rel.offsetX += dx;
                    rel.offsetY += dy;
                    if(window.imData.currentSettingsFriend) {
                        renderRelationshipPreview(window.imData.currentSettingsFriend);
                    }
                }
                
                startDragX = e.clientX;
                startDragY = e.clientY;
                return;
            }

            if (!isDraggingRel) return;
            relTranslateX = e.clientX - startDragX;
            relTranslateY = e.clientY - startDragY;
            if(window.imData.currentSettingsFriend) {
                renderRelationshipPreview(window.imData.currentSettingsFriend);
            }
        });

        window.addEventListener('mouseup', () => {
            isDraggingRel = false;
            draggingNodeId = null;
            previewArea.style.cursor = 'grab';
        });

        // Touch Events
        previewArea.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && !draggingNodeId) {
                isDraggingRel = true;
                startDragX = e.touches[0].clientX - relTranslateX;
                startDragY = e.touches[0].clientY - relTranslateY;
            } else if (e.touches.length === 2) {
                isDraggingRel = false;
                draggingNodeId = null;
                initialPinchDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                initialScale = relScale;
            }
        }, { passive: false });

        previewArea.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && draggingNodeId) {
                e.preventDefault();
                const dx = (e.touches[0].clientX - startDragX) / relScale;
                const dy = (e.touches[0].clientY - startDragY) / relScale;
                
                const rel = tempRelationshipDrafts.find(r => r.npcId === draggingNodeId);
                if (rel) {
                    rel.offsetX += dx;
                    rel.offsetY += dy;
                    if(window.imData.currentSettingsFriend) {
                        renderRelationshipPreview(window.imData.currentSettingsFriend);
                    }
                }
                
                startDragX = e.touches[0].clientX;
                startDragY = e.touches[0].clientY;
                return;
            } else if (e.touches.length === 1 && isDraggingRel) {
                e.preventDefault();
                relTranslateX = e.touches[0].clientX - startDragX;
                relTranslateY = e.touches[0].clientY - startDragY;
                if(window.imData.currentSettingsFriend) {
                    renderRelationshipPreview(window.imData.currentSettingsFriend);
                }
            } else if (e.touches.length === 2 && initialPinchDistance) {
                e.preventDefault();
                const currentDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                const newScale = Math.min(Math.max(0.5, initialScale * (currentDistance / initialPinchDistance)), 3);
                
                // Try to zoom towards center of pinch
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const rect = previewArea.getBoundingClientRect();
                const viewX = centerX - rect.left;
                const viewY = centerY - rect.top;

                relTranslateX = viewX - (viewX - relTranslateX) * (newScale / relScale);
                relTranslateY = viewY - (viewY - relTranslateY) * (newScale / relScale);
                relScale = newScale;
                
                if(window.imData.currentSettingsFriend) {
                    renderRelationshipPreview(window.imData.currentSettingsFriend);
                }
            }
        }, { passive: false });

        previewArea.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                isDraggingRel = false;
                draggingNodeId = null;
            }
        });
        
        previewArea.style.cursor = 'grab';
    }

    function renderRelationshipPicker(friend) {
        if (!relationshipPicker || !relationshipPickerList) return;

        const allNpcs = window.imData.friends.filter(item => item.type === 'npc');
        const selectedNpcIds = new Set((tempRelationshipDrafts.length > 0
            ? tempRelationshipDrafts
            : friend.memory.relationships
        ).map(rel => String(rel.npcId)));

        relationshipPickerList.innerHTML = '';

        const availableNpcs = allNpcs.filter(npc => !selectedNpcIds.has(String(npc.id)));

        if (!isRelationshipPickerVisible) {
            relationshipPicker.style.display = 'none';
            return;
        }

        relationshipPicker.style.display = 'block';

        if (availableNpcs.length === 0) {
            relationshipPickerList.innerHTML = '<div style="text-align:center; color:#8e8e93; padding:12px 0;">暂无可拉取的已有NPC</div>';
            return;
        }

        availableNpcs.forEach(npc => {
            const item = document.createElement('div');
            item.className = 'relationship-item';
            item.style.cursor = 'pointer';

            const avatarHtml = npc.avatarUrl
                ? `<img src="${npc.avatarUrl}" alt="">`
                : '<i class="fas fa-robot"></i>';

            item.innerHTML = `
                <div class="relationship-avatar">${avatarHtml}</div>
                <div class="relationship-meta">
                    <div class="relationship-name">${npc.nickname}</div>
                    <div class="relationship-desc">${npc.realName || npc.signature || 'NPC'}</div>
                </div>
                <div style="font-size: 14px; color: #34c759; font-weight: 600;">拉取</div>
            `;

            item.addEventListener('click', () => {
                collectRelationshipDrafts();

                if (!tempRelationshipDrafts.some(rel => String(rel.npcId) === String(npc.id))) {
                    tempRelationshipDrafts.push({
                        npcId: String(npc.id),
                        relation: getDraftRelationValue(npc.id, friend)
                    });
                }

                isRelationshipPickerVisible = false;
                renderRelationshipList(friend);
                renderRelationshipPicker(friend);
                showToast(`已拉取NPC：${npc.nickname}`);
            });

            relationshipPickerList.appendChild(item);
        });
    }

    function renderRelationshipSheet(friend) {
        if (!relationshipList || !relationshipEmptyState) return;

        friend.memory = friend.memory || window.imApp.createDefaultMemory();
        if (!Array.isArray(friend.memory.relationships)) {
            friend.memory.relationships = [];
        }

        if (relationshipSheet && relationshipSheet.style.display === 'none' && tempRelationshipDrafts.length === 0) {
            tempRelationshipDrafts = friend.memory.relationships.map(rel => ({
                npcId: String(rel.npcId),
                relation: rel.relation || '',
                offsetX: rel.offsetX,
                offsetY: rel.offsetY
            }));
        }
        
        resetRelView();
        initRelationshipPreviewInteractions();

        renderRelationshipList(friend);
        renderRelationshipPicker(friend);
        setTimeout(() => renderRelationshipPreview(friend), 150);
    }

    function collectRelationshipDrafts() {
        if (!relationshipList) return;
        const inputs = relationshipList.querySelectorAll('.relationship-input');
        const currentValues = Array.from(inputs).map(input => {
            const npcId = input.getAttribute('data-npc-id');
            const existingRel = tempRelationshipDrafts.find(r => r.npcId === npcId);
            return {
                npcId: npcId,
                relation: input.value.trim(),
                offsetX: existingRel ? existingRel.offsetX : undefined,
                offsetY: existingRel ? existingRel.offsetY : undefined
            };
        });

        const existingIds = new Set(currentValues.map(item => String(item.npcId)));
        const hiddenDrafts = tempRelationshipDrafts.filter(item => !existingIds.has(String(item.npcId)));
        tempRelationshipDrafts = [...currentValues, ...hiddenDrafts];
    }

    function setActiveChatSettingsTab(tabName) {
        const tabs = document.querySelectorAll('#chat-settings-segment .char-settings-tab');
        const panels = document.querySelectorAll('#chat-settings-sheet .char-settings-panel');

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        panels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `chat-settings-${tabName}-panel`);
        });
    }

    function setActiveChatMemoryPanel(panelName) {
        const cards = document.querySelectorAll('#chat-settings-sheet .char-memory-card');
        const panels = document.querySelectorAll('#chat-settings-sheet .char-memory-section');

        cards.forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-memory-panel') === panelName);
        });

        panels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `chat-memory-${panelName}-panel`);
        });
    }

    function initChatSettingsInteractions() {
        const segmentTabs = document.querySelectorAll('#chat-settings-segment .char-settings-tab');

        segmentTabs.forEach(tab => {
            if (tab.dataset.bound === 'true') return;
            tab.dataset.bound = 'true';
            tab.addEventListener('click', () => {
                setActiveChatSettingsTab(tab.getAttribute('data-tab'));
            });
        });
    }

    if (editCharPersonaSheet) {
        editCharPersonaSheet.addEventListener('click', (e) => {
            if (e.target === editCharPersonaSheet) {
                closeView(editCharPersonaSheet);
            }
        });
    }

    if (relationshipSheet) {
        relationshipSheet.addEventListener('click', (e) => {
            if (e.target === relationshipSheet) {
                closeView(relationshipSheet);
            }
        });
    }

    if (relationshipBtn) {
        relationshipBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            isRelationshipPickerVisible = false;
            tempRelationshipDrafts = (window.imData.currentSettingsFriend.memory?.relationships || []).map(rel => ({
                npcId: String(rel.npcId),
                relation: rel.relation || '',
                offsetX: rel.offsetX,
                offsetY: rel.offsetY
            }));
            renderRelationshipSheet(window.imData.currentSettingsFriend);
            openView(relationshipSheet);
        });
    }

    if (confirmRelationshipBtn) {
        confirmRelationshipBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend || !relationshipList) return;

            collectRelationshipDrafts();
            window.imData.currentSettingsFriend.memory = window.imData.currentSettingsFriend.memory || window.imApp.createDefaultMemory();
            const normalizedRelations = tempRelationshipDrafts
                .map(item => ({
                    npcId: item.npcId,
                    relation: (item.relation || '').trim(),
                    offsetX: item.offsetX,
                    offsetY: item.offsetY
                }))
                .filter(item => item.relation);

            window.imData.currentSettingsFriend.memory.relationships = normalizedRelations;
            tempRelationshipDrafts = window.imData.currentSettingsFriend.memory.relationships.map(rel => ({
                npcId: String(rel.npcId),
                relation: rel.relation || '',
                offsetX: rel.offsetX,
                offsetY: rel.offsetY
            }));
            isRelationshipPickerVisible = false;
            if(window.imApp.saveFriends) window.imApp.saveFriends();
            showToast(normalizedRelations.length > 0 ? '关系网已保存' : '未填写关系，已清空关系网');
            closeView(relationshipSheet);
        });
    }

    if (relationshipAddNpcBtn) {
        relationshipAddNpcBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            collectRelationshipDrafts();

            const allNpcs = window.imData.friends.filter(item => item.type === 'npc');
            const selectedNpcIds = new Set(tempRelationshipDrafts.map(item => String(item.npcId)));
            const availableNpcs = allNpcs.filter(npc => !selectedNpcIds.has(String(npc.id)));

            if (allNpcs.length === 0) {
                showToast('暂无可拉取的已有NPC，请先在联系人中创建NPC');
                return;
            }

            if (availableNpcs.length === 0) {
                showToast('已有NPC已全部拉取');
                return;
            }

            isRelationshipPickerVisible = !isRelationshipPickerVisible;
            renderRelationshipSheet(window.imData.currentSettingsFriend);
        });
    }

    if (chatSettingsSheet) {
        chatSettingsSheet.addEventListener('click', (e) => {
            if (e.target === chatSettingsSheet) {
                closeView(chatSettingsSheet);
            }
        });
    }

    if (bindWorldBookSheet) {
        bindWorldBookSheet.addEventListener('click', (e) => {
            if (e.target === bindWorldBookSheet) {
                closeView(bindWorldBookSheet);
            }
        });
    }

    if (worldBookBtn && bindWorldBookSheet) {
        worldBookBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            tempSelectedBookIds = [...(window.imData.currentSettingsFriend.boundBooks || [])];
            renderBindWorldBookList();
            openView(bindWorldBookSheet);
        });
    }

    if (confirmBindWorldBookBtn) {
        confirmBindWorldBookBtn.addEventListener('click', () => {
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.boundBooks = [...tempSelectedBookIds];
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                if (window.renderWorldBooks) window.renderWorldBooks();
                showToast('世界书绑定已更新');
            }
            closeView(bindWorldBookSheet);
        });
    }

    function renderBindWorldBookList() {
        if (!bindWorldBookList) return;
        bindWorldBookList.innerHTML = '';
        
        const allBooks = window.getWorldBooks ? window.getWorldBooks() : [];
        
        if (allBooks.length === 0) {
            bindWorldBookList.innerHTML = '<div style="text-align: center; color: #8e8e93; padding: 20px;">暂无世界书，请先在主界面创建</div>';
            return;
        }

        allBooks.forEach(book => {
            const isSelected = tempSelectedBookIds.includes(book.id);
            const tokens = window.calculateTokens ? window.calculateTokens(book.entries) : 0;
            
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
                            <div style="font-size: 16px; font-weight: 500; color: #000;">${book.name}</div>
                            <div style="font-size: 12px; color: #8e8e93; margin-top: 2px;">分组: ${book.group}</div>
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
                if (tempSelectedBookIds.includes(book.id)) {
                    tempSelectedBookIds = tempSelectedBookIds.filter(id => id !== book.id);
                } else {
                    tempSelectedBookIds.push(book.id);
                }
                renderBindWorldBookList();
            });
            
            bindWorldBookList.appendChild(item);
        });
    }

    const bubbleStyleToggle = document.getElementById('bubble-style-toggle');
    const bubbleCssContainer = document.getElementById('bubble-css-container');
    const bubbleStyleHeader = document.getElementById('bubble-style-header');
    const bubbleCssInput = document.getElementById('bubble-css-input');
    const applyCssBtn = document.getElementById('apply-css-btn');
    const deleteFriendBtn = document.getElementById('delete-friend-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const resetCssBtn = document.getElementById('reset-css-btn');
    
    const chatBgUpload = document.getElementById('chat-bg-upload');
    const chatBgUploadIcon = document.getElementById('chat-bg-upload-icon');
    const chatBgSaveIcon = document.getElementById('chat-bg-save-icon');
    const chatBgResetIcon = document.getElementById('chat-bg-reset-icon');

    if (chatBgUploadIcon && chatBgUpload) {
        chatBgUploadIcon.addEventListener('click', () => {
            chatBgUpload.click();
        });

        chatBgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && window.imData.currentSettingsFriend) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const bgUrl = ev.target.result;
                    window.imData.currentSettingsFriend.chatBg = bgUrl;
                    if(window.imApp.saveFriends) window.imApp.saveFriends();
                    applyFriendBg(window.imData.currentSettingsFriend);
                    showToast('已更换聊天背景');
                };
                reader.readAsDataURL(file);
            }
            e.target.value = ''; 
        });
    }

    if (chatBgResetIcon) {
        chatBgResetIcon.addEventListener('click', () => {
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.chatBg = null;
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                applyFriendBg(window.imData.currentSettingsFriend);
                showToast('已重置聊天背景');
            }
        });
    }

    function applyFriendBg(friend) {
        if (!friend) return;
        const page = document.getElementById(`chat-interface-${friend.id}`);
        if (page) {
            if (friend.chatBg) {
                page.style.backgroundImage = `url(${friend.chatBg})`;
                page.style.backgroundSize = 'cover';
                page.style.backgroundPosition = 'center';
            } else {
                page.style.backgroundImage = 'none';
                page.style.backgroundColor = '#ffffff'; 
            }
        }
    }

    if (bubbleStyleToggle) {
        bubbleStyleToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                bubbleCssContainer.style.display = 'block';
                if(bubbleStyleHeader) {
                    bubbleStyleHeader.style.borderBottomLeftRadius = '0';
                    bubbleStyleHeader.style.borderBottomRightRadius = '0';
                }
            } else {
                bubbleCssContainer.style.display = 'none';
                if(bubbleStyleHeader) {
                    bubbleStyleHeader.style.borderBottomLeftRadius = '20px';
                    bubbleStyleHeader.style.borderBottomRightRadius = '20px';
                }
            }
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.customCssEnabled = e.target.checked;
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                applyFriendCss(window.imData.currentSettingsFriend);
            }
        });
    }

    if (applyCssBtn) {
        applyCssBtn.addEventListener('click', () => {
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.customCss = bubbleCssInput.value;
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                applyFriendCss(window.imData.currentSettingsFriend);
                showToast('已应用自定义样式');
            }
        });
    }

    if (resetCssBtn) {
        resetCssBtn.addEventListener('click', () => {
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.customCss = '';
                bubbleCssInput.value = '';
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                applyFriendCss(window.imData.currentSettingsFriend);
                showToast('已重置');
            }
        });
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (window.imData.currentSettingsFriend) {
                showCustomModal({
                    title: '清空聊天记录',
                    message: '确定清空所有聊天记录吗？此操作不可恢复。',
                    isDestructive: true,
                    confirmText: '清空',
                    onConfirm: () => {
                        window.imData.currentSettingsFriend.messages = [];
                        if(window.imApp.saveFriends) window.imApp.saveFriends();
                        
                        const page = document.getElementById(`chat-interface-${window.imData.currentSettingsFriend.id}`);
                        if (page) {
                            const msgContainer = page.querySelector('.ins-chat-messages');
                            if (msgContainer) msgContainer.innerHTML = '';
                        }
                        
                        showToast('已清空聊天记录');
                        closeView(chatSettingsSheet);
                        if(window.imApp.renderChatsList) window.imApp.renderChatsList();
                    }
                });
            }
        });
    }

    if (deleteFriendBtn) {
        deleteFriendBtn.addEventListener('click', () => {
            if (window.imData.currentSettingsFriend) {
                showCustomModal({
                    title: '删除好友',
                    message: `确定删除好友 ${window.imData.currentSettingsFriend.nickname} 吗？此操作不可恢复。`,
                    isDestructive: true,
                    confirmText: '删除',
                    onConfirm: () => {
                        window.imData.friends = window.imData.friends.filter(f => f.id !== window.imData.currentSettingsFriend.id);
                        if(window.imApp.saveFriends) window.imApp.saveFriends();
                        if(window.imApp.renderFriendsList) window.imApp.renderFriendsList();
                        closeView(chatSettingsSheet);
                        
                        window.imData.currentActiveFriend = null;
                        if(window.imApp.updateChatsView) window.imApp.updateChatsView();
                        
                        const page = document.getElementById(`chat-interface-${window.imData.currentSettingsFriend.id}`);
                        if (page) page.remove();
                        
                        showToast('已删除好友');
                    }
                });
            }
        });
    }

    const chatSettingsMomentsBtn = document.getElementById('chat-settings-moments-btn');
    if (chatSettingsMomentsBtn) {
        chatSettingsMomentsBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            if (chatSettingsSheet) closeView(chatSettingsSheet);
            if(window.imApp.openUserMoments) window.imApp.openUserMoments(window.imData.currentSettingsFriend.id);
        });
    }

    const chatSettingsProfileTrigger = document.getElementById('chat-settings-profile-trigger');
    if (chatSettingsProfileTrigger) {
        chatSettingsProfileTrigger.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            const friend = window.imData.currentSettingsFriend;
            const editSheet = document.getElementById('edit-char-persona-sheet');
            if (!editSheet) return;

            const realNameInput = document.getElementById('char-realname-input');
            const nicknameInput = document.getElementById('char-nickname-input');
            const signatureInput = document.getElementById('char-signature-input');
            const personaInput = document.getElementById('char-persona-input');
            const avatarPreview = document.getElementById('char-edit-avatar-img');
            const avatarIcon = document.getElementById('char-edit-avatar-preview');
            let avatarI = null;
            if(avatarIcon) avatarI = avatarIcon.querySelector('i');
            
            let tempAvatarUrl = friend.avatarUrl;

            friend.memory = window.imApp.normalizeFriendData(friend).memory;

            if(realNameInput) realNameInput.value = friend.realName || '';
            if(nicknameInput) nicknameInput.value = friend.nickname || '';
            if(signatureInput) signatureInput.value = friend.signature || '';
            if(personaInput) personaInput.value = friend.persona || '';
            
            if (friend.avatarUrl) {
                if(avatarPreview) { avatarPreview.src = friend.avatarUrl; avatarPreview.style.display = 'block'; }
                if(avatarI) avatarI.style.display = 'none';
            } else {
                if(avatarPreview) { avatarPreview.style.display = 'none'; avatarPreview.src = ''; }
                if(avatarI) avatarI.style.display = 'block';
            }

            const avatarWrapper = document.getElementById('char-edit-avatar-wrapper');
            const avatarUpload = document.getElementById('char-edit-avatar-upload');
            
            if (avatarWrapper && avatarUpload) {
                const newAvatarWrapper = avatarWrapper.cloneNode(true);
                avatarWrapper.parentNode.replaceChild(newAvatarWrapper, avatarWrapper);
                
                const newAvatarUpload = avatarUpload.cloneNode(true);
                avatarUpload.parentNode.replaceChild(newAvatarUpload, avatarUpload);

                newAvatarWrapper.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT') newAvatarUpload.click();
                });

                newAvatarUpload.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            tempAvatarUrl = ev.target.result;
                            const img = document.getElementById('char-edit-avatar-img');
                            const iconPreview = document.getElementById('char-edit-avatar-preview');
                            let iconI = null;
                            if(iconPreview) iconI = iconPreview.querySelector('i');
                            if(img) { img.src = tempAvatarUrl; img.style.display = 'block'; }
                            if(iconI) iconI.style.display = 'none';
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            const confirmBtn = document.getElementById('confirm-char-persona-btn');
            if (confirmBtn) {
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                newConfirmBtn.addEventListener('click', () => {
                    friend.realName = realNameInput ? realNameInput.value : '';
                    friend.nickname = nicknameInput ? (nicknameInput.value || 'New Friend') : 'New Friend';
                    friend.signature = signatureInput ? signatureInput.value : '';
                    friend.persona = personaInput ? personaInput.value : '';
                    friend.avatarUrl = tempAvatarUrl;
                    if(window.imApp.saveFriends) window.imApp.saveFriends();
                    
                    const page = document.getElementById(`chat-interface-${friend.id}`);
                    if (page) {
                        const nameEl = page.querySelector('.ins-chat-name');
                        const avatarContainer = page.querySelector('.ins-chat-avatar');
                        
                        if(nameEl) nameEl.textContent = friend.nickname;
                        
                        if (avatarContainer) {
                            if (friend.avatarUrl) {
                                avatarContainer.innerHTML = `<img src="${friend.avatarUrl}" style="display: block;">`;
                            } else {
                                avatarContainer.innerHTML = `<i class="fas fa-user"></i>`;
                            }
                        }
                    }

                    const settingsAvatarImg = document.getElementById('chat-settings-avatar-img');
                    const settingsAvatarIcon = document.getElementById('chat-settings-avatar-icon');
                    const settingsName = document.getElementById('chat-settings-name');
                    if (friend.avatarUrl) {
                        if(settingsAvatarImg) { settingsAvatarImg.src = friend.avatarUrl; settingsAvatarImg.style.display = 'block'; }
                        if(settingsAvatarIcon) settingsAvatarIcon.style.display = 'none';
                    } else {
                        if(settingsAvatarImg) { settingsAvatarImg.style.display = 'none'; settingsAvatarImg.src = ''; }
                        if(settingsAvatarIcon) settingsAvatarIcon.style.display = 'block';
                    }
                    if (settingsName) settingsName.textContent = friend.nickname;
                    
                    if(window.imApp.renderFriendsList) window.imApp.renderFriendsList();
                    if(window.imApp.renderChatsList) window.imApp.renderChatsList();
                    
                    showToast('角色修改成功');
                    closeView(editSheet);
                });
            }

            openView(editSheet);
        });
    }

    function saveChatSettingsMemory(friend, options = {}) {
        if (!friend) return;
        const shouldToast = !!options.showToast;

        const chatMemoryOverviewInput = document.getElementById('chat-memory-overview-input');
        const chatMemoryAnniversariesInput = document.getElementById('chat-memory-anniversaries-input');
        const chatMemoryContextEnabled = document.getElementById('chat-memory-context-enabled-toggle');
        const chatMemoryContextLimit = document.getElementById('chat-memory-context-limit-input');
        const chatMemorySummaryEnabled = document.getElementById('chat-memory-summary-enabled-toggle');
        const chatMemorySummaryLimit = document.getElementById('chat-memory-summary-limit-input');
        const chatMemorySummaryPromptInput = document.getElementById('chat-memory-summary-prompt-input');
        const chatMemoryLongtermInput = document.getElementById('chat-memory-longterm-input');
        const chatMemoryCherishedInput = document.getElementById('chat-memory-cherished-input');

        friend.memory = {
            ...window.imApp.createDefaultMemory(),
            ...(friend.memory || {}),
            overview: chatMemoryOverviewInput ? chatMemoryOverviewInput.value : '',
            anniversaries: chatMemoryAnniversariesInput ? chatMemoryAnniversariesInput.value : '',
            context: {
                enabled: chatMemoryContextEnabled ? chatMemoryContextEnabled.checked : true,
                limit: chatMemoryContextLimit && Number(chatMemoryContextLimit.value) > 0 ? Number(chatMemoryContextLimit.value) : 30,
                notes: friend.memory?.context?.notes || ''
            },
            summary: {
                enabled: chatMemorySummaryEnabled ? chatMemorySummaryEnabled.checked : false,
                limit: chatMemorySummaryLimit && Number(chatMemorySummaryLimit.value) > 0 ? Number(chatMemorySummaryLimit.value) : 50,
                prompt: chatMemorySummaryPromptInput ? chatMemorySummaryPromptInput.value : ''
            },
            longTerm: chatMemoryLongtermInput ? chatMemoryLongtermInput.value : '',
            cherished: chatMemoryCherishedInput ? chatMemoryCherishedInput.value : '',
            relationships: Array.isArray(friend.memory?.relationships) ? friend.memory.relationships : []
        };

        if(window.imApp.saveFriends) window.imApp.saveFriends();
        if (shouldToast) showToast('记忆设置已保存');
    }

    function bindChatSettingsMemoryPersistence(friend) {
        const ids = [
            'chat-memory-overview-input',
            'chat-memory-anniversaries-input',
            'chat-memory-context-enabled-toggle',
            'chat-memory-context-limit-input',
            'chat-memory-summary-enabled-toggle',
            'chat-memory-summary-limit-input',
            'chat-memory-summary-prompt-input',
            'chat-memory-longterm-input',
            'chat-memory-cherished-input'
        ];

        ids.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            if (el.dataset.chatMemoryBound === 'true') {
                el.oninput = null;
                el.onchange = null;
                el.onblur = null;
            }

            const persist = () => {
                if (window.imData.currentSettingsFriend && String(window.imData.currentSettingsFriend.id) === String(friend.id)) {
                    saveChatSettingsMemory(friend);
                }
            };

            if (el.tagName === 'TEXTAREA' || el.type === 'number' || el.type === 'text') {
                el.addEventListener('input', persist);
                el.addEventListener('blur', persist);
            } else {
                el.addEventListener('change', persist);
            }

            el.dataset.chatMemoryBound = 'true';
        });
    }

    function syncChatSummaryPromptCollapse(enabled) {
        const summaryBody = document.getElementById('summary-body');
        const summaryHeader = document.getElementById('summary-header');
        if (summaryBody && summaryHeader) {
            if (enabled) {
                summaryBody.style.display = 'block';
                summaryHeader.style.borderBottom = 'none';
                summaryHeader.style.borderBottomLeftRadius = '0';
                summaryHeader.style.borderBottomRightRadius = '0';
            } else {
                summaryBody.style.display = 'none';
                summaryHeader.style.borderBottom = 'none';
                summaryHeader.style.borderBottomLeftRadius = '20px';
                summaryHeader.style.borderBottomRightRadius = '20px';
            }
        }
    }

    const summaryToggleEl = document.getElementById('chat-memory-summary-enabled-toggle');
    if (summaryToggleEl) {
        summaryToggleEl.addEventListener('change', (e) => {
            syncChatSummaryPromptCollapse(e.target.checked);
        });
    }

    function initChatSettingsForFriend(friend) {
        window.imData.currentSettingsFriend = friend;
        friend.memory = window.imApp.normalizeFriendData(friend).memory;
        isRelationshipPickerVisible = false;
        tempRelationshipDrafts = (friend.memory.relationships || []).map(rel => ({
            npcId: String(rel.npcId),
            relation: rel.relation || ''
        }));
        initChatSettingsInteractions();
        setActiveChatSettingsTab('info');
        setActiveChatMemoryPanel('overview');
        syncChatSummaryPromptCollapse(!!friend.memory.summary.enabled);

        if (bubbleStyleToggle) {
            bubbleStyleToggle.checked = !!friend.customCssEnabled;
            bubbleStyleToggle.dispatchEvent(new Event('change'));
        }
        if (bubbleCssInput) {
            bubbleCssInput.value = friend.customCss || '';
        }

        const chatMemoryOverviewInput = document.getElementById('chat-memory-overview-input');
        const chatMemoryAnniversariesInput = document.getElementById('chat-memory-anniversaries-input');
        const chatMemoryContextEnabled = document.getElementById('chat-memory-context-enabled-toggle');
        const chatMemoryContextLimit = document.getElementById('chat-memory-context-limit-input');
        const chatMemorySummaryEnabled = document.getElementById('chat-memory-summary-enabled-toggle');
        const chatMemorySummaryLimit = document.getElementById('chat-memory-summary-limit-input');
        const chatMemorySummaryPromptInput = document.getElementById('chat-memory-summary-prompt-input');
        const chatMemoryLongtermInput = document.getElementById('chat-memory-longterm-input');
        const chatMemoryCherishedInput = document.getElementById('chat-memory-cherished-input');

        if (chatMemoryOverviewInput) chatMemoryOverviewInput.value = friend.memory.overview || '';
        if (chatMemoryAnniversariesInput) chatMemoryAnniversariesInput.value = friend.memory.anniversaries || '';
        if (chatMemoryContextEnabled) chatMemoryContextEnabled.checked = typeof friend.memory.context.enabled === 'boolean' ? friend.memory.context.enabled : true;
        if (chatMemoryContextLimit) chatMemoryContextLimit.value = friend.memory.context.limit || 30;
        if (chatMemorySummaryEnabled) chatMemorySummaryEnabled.checked = !!friend.memory.summary.enabled;
        if (chatMemorySummaryLimit) chatMemorySummaryLimit.value = friend.memory.summary.limit || 50;
        if (chatMemorySummaryPromptInput) chatMemorySummaryPromptInput.value = friend.memory.summary.prompt || '';
        if (chatMemoryLongtermInput) chatMemoryLongtermInput.value = friend.memory.longTerm || '';
        if (chatMemoryCherishedInput) chatMemoryCherishedInput.value = friend.memory.cherished || '';

        bindChatSettingsMemoryPersistence(friend);

        const tsToggle = document.getElementById('timestamp-toggle');
        if (tsToggle) tsToggle.checked = !!friend.showTimestamp;
        
        const pinToggle = document.getElementById('chat-pinned-toggle');
        if (pinToggle) pinToggle.checked = !!friend.isPinned;

        // Update stickers count display
        updateStickersBtnCount(friend);
        
        // Status Bar Settings Initialization
        const statusBarEnabledToggle = document.getElementById('status-bar-enabled-toggle');
        const statusBarPromptInput = document.getElementById('status-bar-prompt-input');
        const statusBarStyleInput = document.getElementById('status-bar-style-input');

        if (friend.statusBar) {
            if (statusBarEnabledToggle) statusBarEnabledToggle.checked = friend.statusBar.enabled;
            if (statusBarPromptInput) statusBarPromptInput.value = friend.statusBar.prompt || '';
            if (statusBarStyleInput) statusBarStyleInput.value = friend.statusBar.style || '';
        }
    }
    
    const tsToggle = document.getElementById('timestamp-toggle');
    if (tsToggle) {
        tsToggle.addEventListener('change', (e) => {
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.showTimestamp = e.target.checked;
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                
                const page = document.getElementById(`chat-interface-${window.imData.currentSettingsFriend.id}`);
                if (page) {
                    if (window.imData.currentSettingsFriend.showTimestamp) {
                        page.classList.add('show-timestamps');
                    } else {
                        page.classList.remove('show-timestamps');
                    }
                }
            }
        });
    }

    const pinToggle = document.getElementById('chat-pinned-toggle');
    if (pinToggle) {
        pinToggle.addEventListener('change', (e) => {
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.isPinned = e.target.checked;
                if(window.imApp.saveFriends) window.imApp.saveFriends();
                if(window.imApp.renderChatsList) window.imApp.renderChatsList();
                showToast(window.imData.currentSettingsFriend.isPinned ? '已置顶' : '已取消置顶');
                
                const page = document.getElementById(`chat-interface-${window.imData.currentSettingsFriend.id}`);
                if (page) {
                    if (window.imData.currentSettingsFriend.isPinned) {
                        page.classList.add('pinned-chat');
                    } else {
                        page.classList.remove('pinned-chat');
                    }
                }
            }
        });
    }
    
    function initTimestampSetting(friend) {
        window.imData.currentSettingsFriend = friend;
    }

    function applyFriendCss(friend) {
        let styleTag = document.getElementById(`custom-style-${friend.id}`);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = `custom-style-${friend.id}`;
            document.head.appendChild(styleTag);
        }

        if (friend.customCssEnabled && friend.customCss) {
            const prefix = `#chat-interface-${friend.id} `;
            let css = friend.customCss.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/ig, prefix + '$1$2');
            styleTag.innerHTML = css;
        } else {
            styleTag.innerHTML = '';
        }
    }
    
    function applyAllSavedCss() {
        if(window.imData.friends) {
            window.imData.friends.forEach(f => applyFriendCss(f));
        }
    }
    
    // Call it initially
    setTimeout(() => applyAllSavedCss(), 100);

    const saveCssPresetBtn = document.getElementById('save-css-preset-btn');
    const loadCssPresetBtn = document.getElementById('load-css-preset-btn');
    const cssPresetListSheet = document.getElementById('css-preset-list-sheet');
    const cssPresetList = document.getElementById('css-preset-list');

    if (cssPresetListSheet) {
        cssPresetListSheet.addEventListener('click', (e) => {
            if (e.target === cssPresetListSheet) {
                closeView(cssPresetListSheet);
            }
        });
    }

    let cssPresets = JSON.parse(localStorage.getItem('ios_emulator_css_presets') || '[]');

    if (saveCssPresetBtn) {
        saveCssPresetBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            
            showCustomModal({
                type: 'prompt',
                title: '存为预设',
                placeholder: '输入预设名称',
                confirmText: '保存',
                onConfirm: (name) => {
                    if (name && name.trim()) {
                        cssPresets.push({ name: name.trim(), css: bubbleCssInput.value, id: Date.now() });
                        localStorage.setItem('ios_emulator_css_presets', JSON.stringify(cssPresets));
                        showToast('预设已保存');
                    }
                }
            });
        });
    }

    if (loadCssPresetBtn) {
        loadCssPresetBtn.addEventListener('click', () => {
            renderCssPresetList();
            openView(cssPresetListSheet);
        });
    }

    function renderCssPresetList() {
        if (!cssPresetList) return;
        cssPresetList.innerHTML = '';
        if (cssPresets.length === 0) {
            cssPresetList.innerHTML = '<div style="padding: 20px; text-align: center; color: #8e8e93;">暂无预设</div>';
            return;
        }

        cssPresets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'account-card';
            item.innerHTML = `
                <div class="account-content" style="cursor: pointer;">
                    <div class="account-info">
                        <div class="account-name">${preset.name}</div>
                    </div>
                </div>
                <div class="delete-icon"><i class="fas fa-times"></i></div>
            `;

            item.querySelector('.account-content').addEventListener('click', () => {
                if (window.imData.currentSettingsFriend) {
                    bubbleCssInput.value = preset.css;
                    applyCssBtn.click();
                    closeView(cssPresetListSheet);
                }
            });

            item.querySelector('.delete-icon').addEventListener('click', (e) => {
                e.stopPropagation();
                cssPresets = cssPresets.filter(p => p.id !== preset.id);
                localStorage.setItem('ios_emulator_css_presets', JSON.stringify(cssPresets));
                renderCssPresetList();
            });

            cssPresetList.appendChild(item);
        });
    }

    // --- Status Bar Settings Logic ---
    const statusBarBtn = document.getElementById('status-bar-btn');
    const statusBarSettingsSheet = document.getElementById('status-bar-settings-sheet');
    const confirmStatusBarBtn = document.getElementById('confirm-status-bar-btn');
    const statusBarExportBtn = document.getElementById('status-bar-export-btn');
    const statusBarImportBtn = document.getElementById('status-bar-import-btn');
    const statusBarImportFile = document.getElementById('status-bar-import-file');

    if (statusBarSettingsSheet) {
        statusBarSettingsSheet.addEventListener('click', (e) => {
            if (e.target === statusBarSettingsSheet) closeView(statusBarSettingsSheet);
        });
    }

    if (statusBarBtn && statusBarSettingsSheet) {
        statusBarBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            openView(statusBarSettingsSheet);
        });
    }

    if (confirmStatusBarBtn) {
        confirmStatusBarBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            
            const friend = window.imData.currentSettingsFriend;
            const statusBarEnabledToggle = document.getElementById('status-bar-enabled-toggle');
            const statusBarPromptInput = document.getElementById('status-bar-prompt-input');
            const statusBarStyleInput = document.getElementById('status-bar-style-input');

            if (!friend.statusBar) friend.statusBar = {};
            
            friend.statusBar.enabled = statusBarEnabledToggle ? statusBarEnabledToggle.checked : false;
            friend.statusBar.prompt = statusBarPromptInput ? statusBarPromptInput.value : '';
            // keep regex intact even though we don't expose it to user anymore
            if (!friend.statusBar.regex) friend.statusBar.regex = '<status>([\\s\\S]*?)<\\/status>'; 
            friend.statusBar.style = statusBarStyleInput ? statusBarStyleInput.value : '';

            if (window.imApp.saveFriends) window.imApp.saveFriends();
            
            // Re-apply style if active
            if (window.imApp.applyFriendStatusBarCss) {
                window.imApp.applyFriendStatusBarCss(friend);
            }
            
            showToast('状态栏设置已保存');
            closeView(statusBarSettingsSheet);
        });
    }

    if (statusBarExportBtn) {
        statusBarExportBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend || !window.imData.currentSettingsFriend.statusBar) {
                showToast('暂无状态栏配置');
                return;
            }
            
            // 收集当前输入框的值，以防用户未保存就点导出
            const currentConfig = {
                enabled: document.getElementById('status-bar-enabled-toggle').checked,
                prompt: document.getElementById('status-bar-prompt-input').value,
                style: document.getElementById('status-bar-style-input').value
            };

            const dataStr = JSON.stringify(currentConfig, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `statusbar_config_${window.imData.currentSettingsFriend.nickname}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('导出成功');
        });
    }

    if (statusBarImportBtn && statusBarImportFile) {
        statusBarImportBtn.addEventListener('click', () => {
            statusBarImportFile.click();
        });

        statusBarImportFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    
                    const statusBarEnabledToggle = document.getElementById('status-bar-enabled-toggle');
                    const statusBarPromptInput = document.getElementById('status-bar-prompt-input');
                    const statusBarStyleInput = document.getElementById('status-bar-style-input');

                    if (statusBarEnabledToggle && config.enabled !== undefined) statusBarEnabledToggle.checked = config.enabled;
                    if (statusBarPromptInput && config.prompt !== undefined) statusBarPromptInput.value = config.prompt;
                    if (statusBarStyleInput && config.style !== undefined) statusBarStyleInput.value = config.style;

                    showToast('导入成功，请点击保存设置');
                } catch (err) {
                    showToast('导入失败：无效的 JSON 文件');
                    console.error('Import Error:', err);
                }
            };
            reader.readAsText(file);
            e.target.value = ''; // Reset input
        });
    }


    // --- Stickers Binding Logic ---
    const bindStickersSheet = document.getElementById('bind-stickers-sheet');
    const bindStickersList = document.getElementById('bind-stickers-list');
    const bindStickersEmpty = document.getElementById('bind-stickers-empty');
    const confirmBindStickersBtn = document.getElementById('confirm-bind-stickers-btn');
    const stickersBtn = document.getElementById('stickers-btn');
    const stickersBtnCount = document.getElementById('stickers-btn-count');

    let tempSelectedStickerCategories = [];

    if (bindStickersSheet) {
        bindStickersSheet.addEventListener('click', (e) => {
            if (e.target === bindStickersSheet) closeView(bindStickersSheet);
        });
    }

    if (stickersBtn && bindStickersSheet) {
        stickersBtn.addEventListener('click', () => {
            if (!window.imData.currentSettingsFriend) return;
            tempSelectedStickerCategories = [...(window.imData.currentSettingsFriend.mountedStickers || [])];
            renderBindStickersList();
            openView(bindStickersSheet);
        });
    }

    if (confirmBindStickersBtn) {
        confirmBindStickersBtn.addEventListener('click', () => {
            if (window.imData.currentSettingsFriend) {
                window.imData.currentSettingsFriend.mountedStickers = [...tempSelectedStickerCategories];
                if (window.imApp.saveFriends) window.imApp.saveFriends();
                updateStickersBtnCount(window.imData.currentSettingsFriend);
                showToast('表情包挂载已更新');
            }
            closeView(bindStickersSheet);
        });
    }

    function updateStickersBtnCount(friend) {
        if (stickersBtnCount) {
            const count = (friend.mountedStickers || []).length;
            stickersBtnCount.textContent = count > 0 ? `${count}个分类` : '';
        }
    }

    function renderBindStickersList() {
        if (!bindStickersList || !bindStickersEmpty) return;
        bindStickersList.innerHTML = '';

        const allCategories = window.imData.stickers || [];

        if (allCategories.length === 0) {
            bindStickersList.style.display = 'none';
            bindStickersEmpty.style.display = 'block';
            return;
        }

        bindStickersList.style.display = 'flex';
        bindStickersEmpty.style.display = 'none';

        allCategories.forEach(cat => {
            const isSelected = tempSelectedStickerCategories.includes(cat.categoryName);

            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #fff; border-radius: 14px; cursor: pointer; border: 2px solid ' + (isSelected ? '#007aff' : 'transparent') + '; box-shadow: 0 1px 4px rgba(0,0,0,0.04); transition: border-color 0.2s;';

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; background: #ff9500; border-radius: 10px; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 16px;">
                        <i class="fas fa-smile"></i>
                    </div>
                    <div>
                        <div style="font-size: 15px; font-weight: 500; color: #000;">${cat.categoryName}</div>
                        <div style="font-size: 12px; color: #8e8e93; margin-top: 2px;">${cat.items.length} 张表情</div>
                    </div>
                </div>
                <div style="width: 22px; height: 22px; border-radius: 50%; border: 1px solid ${isSelected ? '#007aff' : '#c7c7cc'}; background-color: ${isSelected ? '#007aff' : 'transparent'}; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 12px;">
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            `;

            item.addEventListener('click', () => {
                if (tempSelectedStickerCategories.includes(cat.categoryName)) {
                    tempSelectedStickerCategories = tempSelectedStickerCategories.filter(n => n !== cat.categoryName);
                } else {
                    tempSelectedStickerCategories.push(cat.categoryName);
                }
                renderBindStickersList();
            });

            bindStickersList.appendChild(item);
        });
    }

    // Expose Functions
    window.imApp.initChatSettingsForFriend = initChatSettingsForFriend;
    window.imApp.updateStickersBtnCount = updateStickersBtnCount;
    window.imApp.applyFriendBg = applyFriendBg;
    window.imApp.initTimestampSetting = initTimestampSetting;
    window.imApp.applyFriendCss = applyFriendCss;
    window.imApp.applyAllSavedCss = applyAllSavedCss;
    window.imApp.renderRelationshipSheet = renderRelationshipSheet;
});
