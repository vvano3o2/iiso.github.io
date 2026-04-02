// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================
function openView(viewElement) {
    if(viewElement) viewElement.classList.add('active');
}

function closeView(viewElement) {
    if(viewElement) viewElement.classList.remove('active');
}
window.openView = openView;
window.closeView = closeView;

// Bind overlay click-to-close automatically
Object.values(UI.overlays).forEach(overlay => {
    if(overlay) {
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) closeView(overlay);
        });
    }
});

// --- Custom Modal System ---
window.showCustomModal = function(options) {
    const overlay = document.getElementById('custom-modal-overlay');
    if (!overlay) return;

    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    if (titleEl) titleEl.textContent = options.title || '提示';
    if (messageEl) messageEl.textContent = options.message || '';
    
    if (cancelBtn) {
        cancelBtn.textContent = options.cancelText || '取消';
        cancelBtn.onclick = () => {
            closeView(overlay);
            if (options.onCancel) options.onCancel();
        };
    }
    
    if (confirmBtn) {
        confirmBtn.textContent = options.confirmText || '确定';
        if (options.isDestructive) {
            confirmBtn.style.color = '#ff3b30';
        } else {
            confirmBtn.style.color = '#007aff';
        }
        confirmBtn.onclick = () => {
            closeView(overlay);
            if (options.onConfirm) options.onConfirm();
        };
    }

    // Handle prompt vs confirm
    const promptContent = document.getElementById('modal-prompt-content');
    const confirmContent = document.getElementById('modal-confirm-content');
    const promptConfirmBtn = document.getElementById('modal-prompt-confirm-btn');
    const modalInput = document.getElementById('modal-input');

    if (options.type === 'prompt') {
        if (promptContent) promptContent.style.display = 'block';
        if (confirmContent) confirmContent.style.display = 'none';
        if (confirmBtn) confirmBtn.style.display = 'none';
        if (promptConfirmBtn) {
            promptConfirmBtn.style.display = 'block';
            promptConfirmBtn.textContent = options.confirmText || '确定';
            promptConfirmBtn.onclick = () => {
                closeView(overlay);
                if (options.onConfirm) options.onConfirm(modalInput ? modalInput.value : '');
            };
        }
        if (modalInput) {
            modalInput.placeholder = options.placeholder || '请输入';
            modalInput.value = options.defaultValue || '';
        }
    } else {
        if (promptContent) promptContent.style.display = 'none';
        if (confirmContent) confirmContent.style.display = 'block';
        if (confirmBtn) confirmBtn.style.display = 'block';
        if (promptConfirmBtn) promptConfirmBtn.style.display = 'none';
    }

    openView(overlay);
};

// --- Toast Notification System ---
let toastTimeout = null;
function showToast(message, duration = 2000) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'toast-bubble';
        // Append to screen container to stay within phone frame
        const screen = document.querySelector('.screen');
        if (screen) {
            screen.appendChild(toast);
        } else {
            document.body.appendChild(toast);
        }
    }

    toast.textContent = message;
    toast.classList.remove('show');
    
    // Force reflow
    void toast.offsetWidth;
    
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
window.showToast = showToast;

// Handle generic swipe logic for any list
function addSwipeLogic(card, onDelete) {
    let startX = 0, isDragging = false;
    
    // Find existing swiped card in the same list to close it
    const list = card.parentElement;

    const startSwipe = (x) => { startX = x; isDragging = true; };
    const moveSwipe = (x) => {
        if (!isDragging) return;
        const diff = startX - x;
        
        if (diff > 40) { 
            // Close others
            const others = list.querySelectorAll('.account-card.swiped');
            others.forEach(o => { if(o !== card) o.classList.remove('swiped') });
            
            card.classList.add('swiped');
            isDragging = false;
        } else if (diff < -40) { 
            card.classList.remove('swiped');
            isDragging = false;
        }
    };
    const endSwipe = () => { isDragging = false; };

    card.addEventListener('mousedown', (e) => startSwipe(e.clientX));
    card.addEventListener('mousemove', (e) => moveSwipe(e.clientX));
    card.addEventListener('mouseup', endSwipe);
    card.addEventListener('mouseleave', endSwipe);
    card.addEventListener('touchstart', (e) => startSwipe(e.touches[0].clientX));
    card.addEventListener('touchmove', (e) => moveSwipe(e.touches[0].clientX));
    card.addEventListener('touchend', endSwipe);

    // Delete Action
    card.querySelector('.delete-action').addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete();
    });
}

// ==========================================
// 4. CORE SYSTEM LOGIC
// ==========================================
// Clock
function updateClock() {
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.textContent = timeString;
    }
}
updateClock();
setInterval(updateClock, 1000);

// Phone Input Restriction
if (UI.inputs.detailPhone) {
    UI.inputs.detailPhone.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 11);
    });
}

// ==========================================
// 9. SYNCHRONIZATION HELPERS
// ==========================================
window.syncUIs = function syncUIs() {
    // Sync Home Screen
    if(UI.displays.homeName) UI.displays.homeName.textContent = userState.name || 'name @yourid';
    
    if (userState.avatarUrl) {
        if(UI.displays.homeAvatarImg) {
            UI.displays.homeAvatarImg.src = userState.avatarUrl;
            UI.displays.homeAvatarImg.style.display = 'block';
        }
        if(UI.displays.homeAvatarIcon) UI.displays.homeAvatarIcon.style.display = 'none';
    } else {
        if(UI.displays.homeAvatarImg) UI.displays.homeAvatarImg.style.display = 'none';
        if(UI.displays.homeAvatarIcon) UI.displays.homeAvatarIcon.style.display = 'block';
    }
    
    // Sync Main Settings Profile Card
    if(UI.displays.settingsName) UI.displays.settingsName.textContent = userState.name || '未登录 Apple ID';
    
    if (userState.avatarUrl) {
        if(UI.displays.settingsAvatarImg) {
            UI.displays.settingsAvatarImg.src = userState.avatarUrl;
            UI.displays.settingsAvatarImg.style.display = 'block';
        }
        if(UI.displays.settingsAvatarIcon) UI.displays.settingsAvatarIcon.style.display = 'none';
    } else {
        if(UI.displays.settingsAvatarImg) UI.displays.settingsAvatarImg.style.display = 'none';
        if(UI.displays.settingsAvatarIcon) UI.displays.settingsAvatarIcon.style.display = 'block';
    }
    
    // Sync Apple ID View
    if(UI.displays.displayName) UI.displays.displayName.textContent = userState.name || '未登录 Apple ID';
    if(UI.displays.displayPhone) UI.displays.displayPhone.textContent = userState.phone || '暂无手机号';
    
    const displaySignature = document.getElementById('display-signature');
    if(displaySignature) displaySignature.textContent = userState.persona || '添加账号后可同步头像、名称与签名';

    if (userState.avatarUrl) {
        if(UI.displays.editAvatarImg) {
            UI.displays.editAvatarImg.src = userState.avatarUrl;
            UI.displays.editAvatarImg.style.display = 'block';
        }
        if(UI.displays.editAvatarIcon) UI.displays.editAvatarIcon.style.display = 'none';
    } else {
        if(UI.displays.editAvatarImg) UI.displays.editAvatarImg.style.display = 'none';
        if(UI.displays.editAvatarIcon) UI.displays.editAvatarIcon.style.display = 'block';
    }

    // Sync iMessage (LINE Style) Profile
    const imName = document.getElementById('imessage-profile-name');
    const imSign = document.getElementById('imessage-profile-sign');
    const imAvatarImg = document.getElementById('imessage-avatar-img');
    const imAvatarIcon = document.getElementById('imessage-avatar-icon');

    if (imName) imName.textContent = userState.name || '未设置名称';
    if (imSign) imSign.textContent = userState.persona || '添加账号后可同步个性签名';

    if (userState.avatarUrl) {
        if (imAvatarImg) {
            imAvatarImg.src = userState.avatarUrl;
            imAvatarImg.style.display = 'block';
        }
        if (imAvatarIcon) imAvatarIcon.style.display = 'none';
    } else {
        if (imAvatarImg) imAvatarImg.style.display = 'none';
        if (imAvatarIcon) imAvatarIcon.style.display = 'block';
    }
}

// ==========================================
// 10. JIGGLE MODE & DRAG AND DROP
// ==========================================
const homeScreen = document.querySelector('.screen');
const dock = document.getElementById('dock');
let pressTimer = null;
window.isJiggleMode = false;
let draggedElement = null;
window.preventAppClick = false;
const LONG_PRESS_DURATION = 480;
const DRAG_MOVE_TOLERANCE = 10;

function stopCurrentPointerDrag() {
    if (draggedElement) draggedElement.classList.remove('dragging');
    draggedElement = null;
    const ghost = document.getElementById('drag-ghost');
    if (ghost) ghost.remove();
}

function startPointerDrag(el, pointX, pointY) {
    if (!el || el.classList.contains('empty-slot')) return;

    stopCurrentPointerDrag();
    draggedElement = el;
    el.classList.add('dragging');

    const ghost = el.cloneNode(true);
    ghost.id = 'drag-ghost';
    ghost.classList.remove('dragging');
    ghost.style.position = 'fixed';
    ghost.style.margin = '0';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.92';
    ghost.style.pointerEvents = 'none';
    ghost.style.transition = 'none';
    ghost.style.willChange = 'left, top, transform';

    const rect = el.getBoundingClientRect();
    const offsetX = Math.min(Math.max(pointX - rect.left, 0), rect.width);
    const offsetY = Math.min(Math.max(pointY - rect.top, 0), rect.height);

    ghost.dataset.offsetX = offsetX;
    ghost.dataset.offsetY = offsetY;
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left = (pointX - offsetX) + 'px';
    ghost.style.top = (pointY - offsetY) + 'px';
    ghost.style.transform = 'scale(1.04)';

    document.body.appendChild(ghost);
}

// Use capturing phase to intercept clicks
if (homeScreen) {
    homeScreen.addEventListener('click', (e) => {
        if (e.target.closest('.jiggle-plus-btn')) return; // Allow plus button to work

        if (window.isJiggleMode || window.preventAppClick) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (window.isJiggleMode && (
            e.target === homeScreen || 
            e.target.classList.contains('main-grid') || 
            e.target.classList.contains('dock-container') || 
            e.target.id === 'dock' ||
            e.target.classList.contains('empty-slot') ||
            (e.target.classList.contains('app-icon') && e.target.parentNode.classList.contains('empty-slot'))
        )) {
            exitJiggleMode();
        }
    }, true);

    homeScreen.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .diary-widget, .custom-music-widget, .main-grid, .dock, .dock-container, .pages-container')) {
            e.preventDefault();
        }
    });
}

function setupDraggable(el) {
    if (el._dragSetup) return;
    el._dragSetup = true;

    // Clean up legacy dataset if it exists so it doesn't pollute saved HTML
    if (el.dataset.dragSetup) delete el.dataset.dragSetup;

    let isTouchDrag = false;
    let isMoved = false;
    let startX = 0;
    let startY = 0;
    let moveCount = 0;

    el.addEventListener('pointerdown', (e) => {
        isMoved = false;
        moveCount = 0;
        startX = e.clientX;
        startY = e.clientY;

        // In jiggle mode, pointerdown immediately starts a drag
        if (window.isJiggleMode) {
            // Ignore empty slots for dragging
            if (el.classList.contains('empty-slot')) return;
            
            // Prevent default ONLY if it's not a form element or contenteditable
            if (!e.target.closest('[contenteditable="true"]') && e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }

            isTouchDrag = true;
            startPointerDrag(el, e.clientX, e.clientY);
            return;
        }

        window.preventAppClick = false;
        pressTimer = setTimeout(() => {
            if (!isMoved) {
                window.preventAppClick = true;
                enterJiggleMode();
                isTouchDrag = true;
                startPointerDrag(el, startX, startY);
            }
        }, LONG_PRESS_DURATION);
    });

    // Track movement to cancel long press if they swipe
    el.addEventListener('pointermove', (e) => {
        if (!pressTimer && !isTouchDrag) return;
        moveCount++;
        // Mobile touch jitter tolerance: only cancel long press after clear movement
        if (Math.abs(e.clientX - startX) > DRAG_MOVE_TOLERANCE || Math.abs(e.clientY - startY) > DRAG_MOVE_TOLERANCE) {
            isMoved = true;
            if (!window.isJiggleMode && pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        }
    });

    const cancelPress = (e) => {
        if (pressTimer) clearTimeout(pressTimer);
        pressTimer = null;
        
        // If they didn't hold long enough, and didn't move much, it's a click!
        if (!window.preventAppClick && !window.isJiggleMode && !isMoved) {
            // Do nothing, let native click fire
        } else if (window.preventAppClick && !window.isJiggleMode) {
            // Was long press, but jiggle hasn't started or we just cancelled it
            setTimeout(() => window.preventAppClick = false, 100);
        }

        // End drag if we were dragging
        if (isTouchDrag && window.isJiggleMode) {
            isTouchDrag = false;
            stopCurrentPointerDrag();
            balanceGridSlots();
            if (window.saveDesktopState) window.saveDesktopState();
        }
    };
    
    el.addEventListener('pointerup', cancelPress);
    el.addEventListener('pointercancel', cancelPress);
    
    // Disable native drag and drop to use our custom pointer events
    el.addEventListener('dragstart', (e) => e.preventDefault());
}

function refreshDraggables() {
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .diary-widget, .custom-music-widget').forEach(setupDraggable);
}

window.refreshDraggables = refreshDraggables;
refreshDraggables();

function getElementByMouse(container, x, y) {
    const elements = [...container.querySelectorAll('.app-item:not(.dragging):not(.empty-slot), .time-widget:not(.dragging), .ins-profile-widget:not(.dragging), .spotify-widget:not(.dragging), .pet-widget:not(.dragging), .couple-widget:not(.dragging), .status-card-widget:not(.dragging), .complex-music-widget:not(.dragging), .photo-profile-widget:not(.dragging), .diary-widget:not(.dragging), .custom-music-widget:not(.dragging)')];
    for (let child of elements) {
        const box = child.getBoundingClientRect();
        if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
            return { element: child, isLeft: x < box.left + box.width / 2 };
        }
    }
    
    // Also check empty slots so we can insert before them
    const emptySlots = [...container.querySelectorAll('.empty-slot')];
    if (emptySlots.length > 0) {
        for (let child of emptySlots) {
            const box = child.getBoundingClientRect();
            if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
                return { element: child, isLeft: true };
            }
        }
    }
    return null;
}

function swapNodes(node1, node2) {
    if (node1 === node2) return;
    const parent1 = node1.parentNode;
    const parent2 = node2.parentNode;
    const marker = document.createElement('div');
    parent1.insertBefore(marker, node1);
    parent2.insertBefore(node1, node2);
    marker.parentNode.insertBefore(node2, marker);
    marker.remove();
}

// Custom Drag Tracking to bypass dataTransfer limitations and enable visual following
function recordPositions() {
    const positions = new Map();
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .diary-widget, .custom-music-widget').forEach(el => {
        positions.set(el, el.getBoundingClientRect());
        el.style.transition = 'none';
        el.style.transform = '';
    });
    return positions;
}

function playAnimations(oldPositions) {
    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .diary-widget, .custom-music-widget').forEach(el => {
        if (el.classList.contains('dragging')) return;
        const oldPos = oldPositions.get(el);
        if (!oldPos) return;
        const newPos = el.getBoundingClientRect();
        
        const dx = oldPos.left - newPos.left;
        const dy = oldPos.top - newPos.top;
        
        if (dx !== 0 || dy !== 0) {
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            el.style.transition = 'none';
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.style.transform = '';
                    el.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
                });
            });
        }
    });
}

let lastEdgeScrollTime = 0;

let dragMoveHandler = (e) => {
    if (!draggedElement || !window.isJiggleMode) return;
    
    // Prevent scrolling while dragging (if not cancelled by browser)
    if (e.cancelable) e.preventDefault();

    const ghost = document.getElementById('drag-ghost');
    if (ghost) {
        // Allow pointer events to pass through ghost so we can find element underneath
        ghost.style.left = (e.clientX - parseFloat(ghost.dataset.offsetX)) + 'px';
        ghost.style.top = (e.clientY - parseFloat(ghost.dataset.offsetY)) + 'px';
    }

    // --- Edge Scrolling for Pages ---
    const pagesContainerEl = document.getElementById('pages-container');
    if (pagesContainerEl) {
        const rect = pagesContainerEl.getBoundingClientRect();
        const now = Date.now();
        if (now - lastEdgeScrollTime > 800) { // Throttle edge scrolling
            if (e.clientX > rect.right - 40) {
                pagesContainerEl.scrollBy({ left: pagesContainerEl.clientWidth, behavior: 'smooth' });
                lastEdgeScrollTime = now;
            } else if (e.clientX < rect.left + 40) {
                pagesContainerEl.scrollBy({ left: -pagesContainerEl.clientWidth, behavior: 'smooth' });
                lastEdgeScrollTime = now;
            }
        }
    }

    // Find which container we are over
    let targetContainer = null;
    
    const pageIndex = pagesContainerEl ? Math.round(pagesContainerEl.scrollLeft / pagesContainerEl.clientWidth) : 0;
    const currentGrid = document.getElementById(pageIndex === 0 ? 'main-grid-1' : 'main-grid-2');
    
    if (currentGrid) {
        const currentGridRect = currentGrid.getBoundingClientRect();
        if (e.clientY >= currentGridRect.top && e.clientY <= currentGridRect.bottom) {
            targetContainer = currentGrid;
        }
    }
    
    if (dock) {
        const dockRect = dock.getBoundingClientRect();
        if (!targetContainer && e.clientY >= dockRect.top - 20 && e.clientY <= dockRect.bottom + 20) {
            targetContainer = dock;
        }
    }

    if (!targetContainer) return;

    // Constraints (Only allow regular app items in dock)
    if (targetContainer === dock && !draggedElement.classList.contains('app-item')) return;

    const targetInfo = getElementByMouse(targetContainer, e.clientX, e.clientY);
    
    let didSwap = false;
    let oldPositions = null;

    if (targetInfo && targetInfo.element !== draggedElement) {
        let targetEl = targetInfo.element;
        oldPositions = recordPositions();

        // Scenario 1: Same container or simple swap
        if (draggedElement.parentNode === targetEl.parentNode) {
            swapNodes(draggedElement, targetEl);
            didSwap = true;
        } 
        // Scenario 2: Dock -> Grid (Replace empty slot or Swap with App)
        else if (draggedElement.parentNode === dock && targetEl.parentNode === currentGrid) {
            if (targetEl.classList.contains('empty-slot')) {
                targetEl.parentNode.insertBefore(draggedElement, targetEl);
                targetEl.remove();
            } else {
                swapNodes(draggedElement, targetEl);
            }
            didSwap = true;
        }
        // Scenario 3: Grid -> Dock
        else if (draggedElement.parentNode && draggedElement.parentNode.classList.contains('main-grid') && targetEl.parentNode === dock) {
            swapNodes(draggedElement, targetEl);
            didSwap = true;
        }

    } 
    // Hovering over empty space in dock
    else if (!targetInfo && targetContainer === dock && draggedElement.parentNode !== dock) {
        const currentItems = dock.querySelectorAll('.app-item:not(.dragging)').length;
        if (currentItems < 4) {
            oldPositions = recordPositions();
            // Leave an empty slot in grid
            const empty = document.createElement('div');
            empty.className = 'app-item empty-slot';
            empty.innerHTML = '<div class="app-icon" style="opacity:0;"></div>';
            draggedElement.parentNode.insertBefore(empty, draggedElement);
            
            dock.appendChild(draggedElement);
            setupDraggable(empty);
            didSwap = true;
        }
    }
    
    if (didSwap && oldPositions) {
        playAnimations(oldPositions);
    }
};

// Use pointermove globally to track dragging anywhere on screen
document.addEventListener('pointermove', (e) => {
    // If we are dragging, handle it
    if (draggedElement && window.isJiggleMode) {
        dragMoveHandler(e);
    }
}, { passive: false });

window.setupDraggable = setupDraggable;

// We no longer strip and append empty slots dynamically to the end, 
// because we want to preserve user-defined empty gaps.
// However, we still need a function to ensure exactly 24 capacity on load or major changes.
function balanceGridSlots() {
    const grids = document.querySelectorAll('.main-grid');
    grids.forEach(grid => {
        let usedSlots = 0;
        [...grid.children].forEach(item => {
            if (item.classList.contains('ins-profile-widget') || item.classList.contains('spotify-widget') || item.classList.contains('complex-music-widget')) usedSlots += 16;
            else if (item.classList.contains('time-widget') || item.classList.contains('status-card-widget') || item.classList.contains('photo-profile-widget') || item.classList.contains('diary-widget') || item.classList.contains('custom-music-widget')) usedSlots += 8;
            else if (item.classList.contains('pet-widget') || item.classList.contains('couple-widget')) usedSlots += 4;
            else usedSlots += 1;
        });

        if (usedSlots < 24) {
            for (let i = 0; i < 24 - usedSlots; i++) {
                const empty = document.createElement('div');
                empty.className = 'app-item empty-slot';
                empty.innerHTML = '<div class="app-icon" style="opacity:0;"></div>';
                grid.appendChild(empty);
                setupDraggable(empty);
            }
        } else if (usedSlots > 24) {
            // Only prune empty slots from the end if we somehow overflowed
            const empties = [...grid.querySelectorAll('.empty-slot')];
            let excess = usedSlots - 24;
            for (let i = empties.length - 1; i >= 0 && excess > 0; i--) {
                empties[i].remove();
                excess--;
            }
        }
    });
}
window.balanceGridSlots = balanceGridSlots;

function enterJiggleMode() {
    window.isJiggleMode = true;
    document.body.classList.add('jiggle-mode');

    document.querySelectorAll('.app-item:not(.empty-slot), .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .diary-widget, .custom-music-widget').forEach(el => {
        el.setAttribute('draggable', 'true');
    });

    // Add Plus button for widgets
    let plusBtn = document.querySelector('.jiggle-plus-btn');
    if (!plusBtn && homeScreen) {
        plusBtn = document.createElement('div');
        plusBtn.className = 'jiggle-plus-btn';
        plusBtn.innerHTML = '<i class="fas fa-plus"></i>';
        plusBtn.style.position = 'absolute';
        plusBtn.style.top = '20px';
        plusBtn.style.left = '24px';
        plusBtn.style.backgroundColor = 'rgba(255,255,255,0.5)';
        plusBtn.style.backdropFilter = 'blur(10px)';
        plusBtn.style.WebkitBackdropFilter = 'blur(10px)';
        plusBtn.style.width = '32px';
        plusBtn.style.height = '32px';
        plusBtn.style.borderRadius = '50%';
        plusBtn.style.display = 'flex';
        plusBtn.style.justifyContent = 'center';
        plusBtn.style.alignItems = 'center';
        plusBtn.style.color = '#000';
        plusBtn.style.fontSize = '16px';
        plusBtn.style.zIndex = '100';
        plusBtn.style.cursor = 'pointer';

        homeScreen.appendChild(plusBtn);
        const openGallery = (e) => {
            if (e) {
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
            }
            window.preventAppClick = false;
            stopCurrentPointerDrag();
            const gallerySheet = document.getElementById('widget-gallery-sheet');
            if (gallerySheet) openView(gallerySheet);
        };
        plusBtn.addEventListener('pointerup', openGallery);
        plusBtn.addEventListener('click', openGallery);
        plusBtn.addEventListener('touchend', openGallery, { passive: false });
        plusBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
        });
        plusBtn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
    }
}

function exitJiggleMode() {
    window.isJiggleMode = false;
    window.preventAppClick = false;
    document.body.classList.remove('jiggle-mode');
    stopCurrentPointerDrag();
    const plusBtn = document.querySelector('.jiggle-plus-btn');
    if (plusBtn) plusBtn.remove();

    document.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .couple-widget, .status-card-widget, .complex-music-widget, .photo-profile-widget, .diary-widget, .custom-music-widget').forEach(el => {
        el.removeAttribute('draggable');
    });
    
    // Save state after arranging
    if (window.saveDesktopState) window.saveDesktopState();
}
window.enterJiggleMode = enterJiggleMode;
window.exitJiggleMode = exitJiggleMode;

// ==========================================
// 11. SWIPE / SCROLL NAVIGATION
// ==========================================
const pagesContainer = document.getElementById('pages-container');
if (pagesContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;

    pagesContainer.addEventListener('pointerdown', (e) => {
        // Do not intercept if in jiggle mode or interacting with bottom sheets/buttons
        if (window.isJiggleMode || window.preventAppClick || e.target.closest('.bottom-sheet-overlay')) return;
        isDown = true;
        startX = e.pageX - pagesContainer.offsetLeft;
        scrollLeft = pagesContainer.scrollLeft;
    });

    pagesContainer.addEventListener('pointerleave', () => {
        if (!isDown) return;
        isDown = false;
        snapToNearestPage();
    });

    pagesContainer.addEventListener('pointerup', () => {
        if (!isDown) return;
        isDown = false;
        snapToNearestPage();
    });

    pagesContainer.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        if (window.isJiggleMode) {
            isDown = false;
            return;
        }
        
        const x = e.pageX - pagesContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        
        if (Math.abs(walk) > 10) {
            // We are actually swiping
            e.preventDefault(); 
            pagesContainer.scrollLeft = scrollLeft - walk;
        }
    });

    function snapToNearestPage() {
        const pageIndex = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
        pagesContainer.scrollTo({
            left: pageIndex * pagesContainer.clientWidth,
            behavior: 'smooth'
        });
    }
    
    pagesContainer.addEventListener('scroll', () => {
        const pageIndex = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
        const dots = document.querySelectorAll('.page-indicators .dot');
        dots.forEach((dot, index) => {
            if (index === pageIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    });
}
