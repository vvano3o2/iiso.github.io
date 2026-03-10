document.addEventListener('DOMContentLoaded', () => {
    // Helper to get element by mouse coordinates across both grids
    function getGridSlotByMouse(x, y) {
        const pagesContainer = document.getElementById('pages-container');
        const pageIndex = pagesContainer ? Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth) : 0;
        const currentGrid = document.getElementById(pageIndex === 0 ? 'main-grid-1' : 'main-grid-2');
        if (!currentGrid) return null;
        
        const elements = [...currentGrid.querySelectorAll('.app-item, .time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .status-card-widget, .complex-music-widget')];
        for (let child of elements) {
            const box = child.getBoundingClientRect();
            if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
                return { element: child, isLeft: x < box.left + box.width / 2, grid: currentGrid };
            }
        }
        // If no specific element found under mouse, still return the grid to append to first available slot
        return { element: null, isLeft: false, grid: currentGrid };
    }

    // Exported function for clicking to add widgets
    window.addWidgetToGrid = function(html, className, slotsNeeded) {
        const pagesContainer = document.getElementById('pages-container');
        let pageIndex = pagesContainer ? Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth) : 0;
        let currentGrid = document.getElementById(`main-grid-${pageIndex + 1}`);
        if (!currentGrid) return;
        
        let empties = currentGrid.querySelectorAll('.empty-slot');
        
        if (empties.length < slotsNeeded) {
            // Find next page
            let found = false;
            let nextIndex = pageIndex + 1;
            let nextGrid = document.getElementById(`main-grid-${nextIndex + 1}`);
            
            // Loop through all existing subsequent grids
            while (nextGrid) {
                let nextEmpties = nextGrid.querySelectorAll('.empty-slot');
                if (nextEmpties.length >= slotsNeeded) {
                    currentGrid = nextGrid;
                    empties = nextEmpties;
                    found = true;
                    // Scroll to this page
                    if (pagesContainer) {
                        pagesContainer.scrollTo({
                            left: nextIndex * pagesContainer.clientWidth,
                            behavior: 'smooth'
                        });
                    }
                    break;
                }
                nextIndex++;
                nextGrid = document.getElementById(`main-grid-${nextIndex + 1}`);
            }
            
            if (!found) {
                if (window.showToast) window.showToast('所有页面空间都不足');
                return;
            }
        }
        
        // Remove required number of empty slots from the end
        for(let i=0; i<slotsNeeded; i++) {
            if (empties[empties.length - 1 - i]) empties[empties.length - 1 - i].remove();
        }
        
        const widgetWrapper = document.createElement('div');
        widgetWrapper.innerHTML = html;
        const widget = widgetWrapper.firstElementChild;
        
        if (className.includes('time-widget')) bindTimeWidget(widget);
        else if (className.includes('ins-profile-widget')) bindInsProfileWidget(widget);
        else if (className.includes('spotify-widget')) bindSpotifyWidget(widget);
        else if (className.includes('pet-widget')) bindPetWidget(widget);
        else if (className.includes('status-card-widget')) bindStatusCardWidget(widget);
        else if (className.includes('complex-music-widget')) bindComplexMusicWidget(widget);
        
        if (window.setupDraggable) window.setupDraggable(widget);
        
        const firstEmpty = currentGrid.querySelector('.empty-slot');
        if (firstEmpty) {
            currentGrid.insertBefore(widget, firstEmpty);
        } else {
            currentGrid.appendChild(widget);
        }
        
        if (window.balanceGridSlots) window.balanceGridSlots();
        if (window.closeView) window.closeView(document.getElementById('widget-gallery-sheet'));
        if (window.enterJiggleMode && !window.isJiggleMode) window.enterJiggleMode();
        
        // Save state immediately after adding
        if (window.saveDesktopState) window.saveDesktopState();
    };

    function createTimeWidget() {
        const widget = document.createElement('div');
        widget.className = 'time-widget';
        widget.id = 'time-widget-' + Date.now();
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            <div class="time-widget-left">
                <div class="time-bubble" contenteditable="true" spellcheck="false" style="cursor: text;"><i class="fas fa-cloud" style="color: #8e8e93;" contenteditable="false"></i> 26°C 阴天</div>
                <div class="time-bubble time-display-bubble"><i class="far fa-clock" style="color: #8e8e93;"></i> <span>14:30</span></div>
                <div class="time-bubble" contenteditable="true" spellcheck="false" style="cursor: text;"><i class="fas fa-pen" style="color: #8e8e93;" contenteditable="false"></i> Have a nice day</div>
            </div>
            <div class="binder-spine">
                <div class="binder-ring"></div>
                <div class="binder-ring"></div>
                <div class="binder-ring"></div>
            </div>
            <div class="time-widget-right-wrapper">
                <div class="time-widget-right">
                    <div class="polaroid-tape"></div>
                    <div class="time-widget-img-container">
                        <img class="time-widget-img" id="desktop-time-widget-photo-${Date.now()}" src="" style="display:none; width:100%; height:100%; object-fit:cover;">
                        <i class="fas fa-image" id="desktop-time-widget-icon-${Date.now()}"></i>
                    </div>
                    <input type="file" class="time-img-upload" id="desktop-time-widget-upload-${Date.now()}" accept="image/*" style="display:none;">
                </div>
            </div>
        `;
        bindTimeWidget(widget);
        updateDiaryTime();
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindTimeWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');
        const imgContainer = widget.querySelector('.time-widget-right');
        const upload = widget.querySelector('.time-img-upload');
        const img = widget.querySelector('.time-widget-img');
        const icon = widget.querySelector('.time-widget-img-container i');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        if (imgContainer && upload) {
            imgContainer.addEventListener('click', (e) => {
                if (window.isJiggleMode || window.preventAppClick) return;
                e.stopPropagation();
                upload.click();
            });

            upload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img) {
                            img.src = ev.target.result;
                            img.style.display = 'block';
                        }
                        if (icon) icon.style.display = 'none';
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }
        
        // Prevent drag on contenteditable and save on blur
        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) {
                    e.stopPropagation();
                }
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    function createSpotifyWidget() {
        const widget = document.createElement('div');
        widget.className = 'spotify-widget';
        const wid = Date.now();
        widget.id = 'spotify-widget-' + wid;
        
        // Generate random heights for the waveform
        const numBars = 35;
        let waveformHtml = '';
        for (let i = 0; i < numBars; i++) {
            const height = Math.floor(Math.random() * 80) + 20; // 20% to 100%
            waveformHtml += `<div class="waveform-bar" style="height: ${height}%;"></div>`;
        }

        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            <div class="spotify-widget-header">
                <div class="spotify-widget-info-pill">
            <div class="spotify-widget-text">
                        <div class="spotify-widget-title" id="spotify-widget-title-${wid}" contenteditable="true" spellcheck="false">iisonyoung</div>
                        <div class="spotify-widget-handle" id="spotify-widget-handle-${wid}" contenteditable="true" spellcheck="false">@iis</div>
                    </div>
                    <i class="fas fa-heart spotify-widget-heart"></i>
                </div>
                <div class="spotify-widget-logo">
                    <i class="fab fa-spotify"></i>
                </div>
            </div>
            
            <div class="spotify-widget-images">
                <div class="spotify-widget-img-container left-img" id="spotify-img-container-1-${wid}">
                    <img src="" id="spotify-img-1-${wid}">
                    <i class="fas fa-image" style="font-size: 32px;"></i>
                    <input type="file" id="spotify-upload-1-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="spotify-widget-img-container right-img" id="spotify-img-container-2-${wid}">
                    <img src="" id="spotify-img-2-${wid}">
                    <i class="fas fa-image" style="font-size: 32px;"></i>
                    <input type="file" id="spotify-upload-2-${wid}" accept="image/*" style="display:none;">
                </div>
            </div>

            <div class="spotify-widget-waveform">
                ${waveformHtml}
            </div>
        `;
        bindSpotifyWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindSpotifyWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup uploads for left image
        const imgContainer1 = widget.querySelector('.left-img');
        const upload1 = imgContainer1 ? imgContainer1.querySelector('input[type="file"]') : null;
        const img1 = imgContainer1 ? imgContainer1.querySelector('img') : null;
        const icon1 = imgContainer1 ? imgContainer1.querySelector('i') : null;
        
        if (imgContainer1 && upload1) {
            imgContainer1.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload1.click(); }
            });
            upload1.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img1) { img1.src = ev.target.result; img1.style.display = 'block'; }
                        if (icon1) { icon1.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Setup uploads for right image
        const imgContainer2 = widget.querySelector('.right-img');
        const upload2 = imgContainer2 ? imgContainer2.querySelector('input[type="file"]') : null;
        const img2 = imgContainer2 ? imgContainer2.querySelector('img') : null;
        const icon2 = imgContainer2 ? imgContainer2.querySelector('i') : null;
        
        if (imgContainer2 && upload2) {
            imgContainer2.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload2.click(); }
            });
            upload2.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img2) { img2.src = ev.target.result; img2.style.display = 'block'; }
                        if (icon2) { icon2.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
        
        // Optional: Animate waveform on click (if not editing)
        const waveform = widget.querySelector('.spotify-widget-waveform');
        if (waveform) {
            widget.addEventListener('click', (e) => {
                if (window.isJiggleMode || window.preventAppClick || e.target.closest('[contenteditable="true"]') || e.target.closest('.spotify-widget-img-container')) return;
                
                // Toggle animation
                const isPlaying = widget.classList.toggle('playing');
                const bars = waveform.querySelectorAll('.waveform-bar');
                
                if (isPlaying) {
                    bars.forEach((bar, index) => {
                        bar.style.transition = 'height 0.2s ease-in-out';
                        // Randomize heights continuously
                        bar.dataset.intervalId = setInterval(() => {
                            const newHeight = Math.floor(Math.random() * 80) + 20;
                            bar.style.height = `${newHeight}%`;
                        }, 200 + Math.random() * 200);
                    });
                } else {
                    bars.forEach(bar => {
                        if (bar.dataset.intervalId) {
                            clearInterval(parseInt(bar.dataset.intervalId));
                            delete bar.dataset.intervalId;
                        }
                    });
                }
            });
        }
    }

    function createComplexMusicWidget() {
        const widget = document.createElement('div');
        widget.className = 'complex-music-widget';
        const wid = Date.now();
        widget.id = 'complex-music-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn" style="z-index: 50;"><i class="fas fa-times"></i></div>
            
            <div class="cmw-main-card">
                <div class="cmw-cast-icon"><i class="fas fa-music"></i></div>
                <div class="cmw-progress-bar">
                    <div class="cmw-progress-fill">
                        <div class="cmw-progress-dot"></div>
                    </div>
                </div>
                <div class="cmw-time-current" contenteditable="true" spellcheck="false">1:15</div>
                <div class="cmw-time-total" contenteditable="true" spellcheck="false">-2:38</div>
                <div class="cmw-controls">
                    <i class="fas fa-backward" style="font-size: 24px; cursor: pointer;"></i>
                    <div class="cmw-play-btn" id="cmw-play-btn-${wid}">
                        <div class="cmw-play-bar"></div>
                        <div class="cmw-play-bar"></div>
                    </div>
                    <i class="fas fa-forward" style="font-size: 24px; cursor: pointer;"></i>
                </div>
            </div>
            
            <div class="cmw-top-ring">
                <div class="cmw-top-ring-bg" id="cmw-ring-btn-${wid}" style="cursor: pointer;">
                    <img src="" id="cmw-ring-img-${wid}">
                    <i class="fas fa-image" id="cmw-ring-icon-${wid}"></i>
                    <input type="file" id="cmw-ring-upload-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="cmw-heart-top"><i class="fas fa-heart" style="color: #333; font-size: 14px;"></i></div>
                <div class="cmw-heart-bottom"><i class="fas fa-heart" style="color: #333; font-size: 14px;"></i></div>
                <div class="cmw-waveform-pill" contenteditable="true" spellcheck="false">oxo</div>
            </div>
        `;
        bindComplexMusicWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindComplexMusicWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup upload for Top Ring
        const ringBtn = widget.querySelector('.cmw-top-ring-bg');
        const ringUpload = ringBtn ? ringBtn.querySelector('input[type="file"]') : null;
        const ringImg = ringBtn ? ringBtn.querySelector('img') : null;
        const ringIcon = ringBtn ? ringBtn.querySelector('i') : null;
        
        if (ringBtn && ringUpload) {
            ringBtn.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { 
                    e.stopPropagation(); 
                    ringUpload.click(); 
                }
            });
            ringUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (ringImg) { ringImg.src = ev.target.result; ringImg.style.display = 'block'; }
                        if (ringIcon) { ringIcon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Play button interaction
        const playBtn = widget.querySelector('.cmw-play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                if (window.isJiggleMode || window.preventAppClick) return;
                e.stopPropagation();
                widget.classList.toggle('playing');
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    function createStatusCardWidget() {
        const widget = document.createElement('div');
        widget.className = 'status-card-widget';
        const wid = Date.now();
        widget.id = 'status-card-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            
            <div class="status-card-top" id="status-card-top-${wid}">
                <img src="" class="status-card-bg-img" id="status-card-bg-${wid}">
                <div class="status-card-bg-upload-btn"><i class="fas fa-camera"></i></div>
                <input type="file" id="status-card-bg-upload-${wid}" accept="image/*" style="display:none;">
                
                <div class="status-card-date" id="status-card-date-${wid}" contenteditable="true" spellcheck="false">03-02</div>
                <div class="status-card-temp" id="status-card-temp-${wid}" contenteditable="true" spellcheck="false">11°</div>
            </div>
            
            <div class="status-card-bottom">
                <div class="status-card-progress-area">
                    <div class="status-card-progress-label" contenteditable="true" spellcheck="false">今日剩余</div>
                    <i class="fas fa-heart" style="color: #ccc; font-size: 10px;"></i>
                    <div class="status-card-progress-track">
                        <div class="status-card-progress-fill"></div>
                    </div>
                    <i class="fas fa-heart" style="color: #ccc; font-size: 10px;"></i>
                    <div class="status-card-progress-value" contenteditable="true" spellcheck="false">61%</div>
                </div>
            </div>
            
            <div class="status-card-avatar-wrapper">
                <div class="status-card-avatar" id="status-card-avatar-btn-${wid}">
                    <img src="" id="status-card-avatar-img-${wid}">
                    <i class="fas fa-user" id="status-card-avatar-icon-${wid}"></i>
                    <input type="file" id="status-card-avatar-upload-${wid}" accept="image/*" style="display:none;">
                </div>
                <div class="status-card-clip"><i class="fas fa-paperclip"></i></div>
                
                <div class="status-card-info-pill">
                    <div class="status-card-name-box" contenteditable="true" spellcheck="false">iis</div>
                </div>
            </div>
        `;
        bindStatusCardWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindStatusCardWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup upload for Top Background
        const topBgContainer = widget.querySelector('.status-card-top');
        const bgUpload = topBgContainer ? topBgContainer.querySelector('input[type="file"]') : null;
        const bgImg = topBgContainer ? topBgContainer.querySelector('.status-card-bg-img') : null;
        const bgIcon = topBgContainer ? topBgContainer.querySelector('.status-card-bg-upload-btn') : null;
        
        if (topBgContainer && bgUpload) {
            topBgContainer.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick && !e.target.closest('[contenteditable="true"]')) { 
                    e.stopPropagation(); 
                    bgUpload.click(); 
                }
            });
            bgUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (bgImg) { bgImg.src = ev.target.result; bgImg.style.display = 'block'; }
                        if (bgIcon) { bgIcon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Setup upload for Center Avatar
        const avatarContainer = widget.querySelector('.status-card-avatar');
        const avatarUpload = avatarContainer ? avatarContainer.querySelector('input[type="file"]') : null;
        const avatarImg = avatarContainer ? avatarContainer.querySelector('img') : null;
        const avatarIcon = avatarContainer ? avatarContainer.querySelector('i.fa-user') : null;
        
        if (avatarContainer && avatarUpload) {
            avatarContainer.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { 
                    e.stopPropagation(); 
                    avatarUpload.click(); 
                }
            });
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (avatarImg) { avatarImg.src = ev.target.result; avatarImg.style.display = 'block'; }
                        if (avatarIcon) { avatarIcon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        // Battery API Integration
        const progressTrack = widget.querySelector('.status-card-progress-track');
        const progressFill = widget.querySelector('.status-card-progress-fill');
        const progressText = widget.querySelector('.status-card-progress-value');
        
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                const updateBattery = () => {
                    if (progressFill && progressText) {
                        const level = Math.round(battery.level * 100);
                        progressFill.style.width = level + '%';
                        progressText.textContent = level + '%';
                        if (window.saveDesktopState) window.saveDesktopState();
                    }
                };
                
                // Initial update
                updateBattery();
                
                // Listen for changes
                battery.addEventListener('levelchange', updateBattery);
            });
        } else {
            // Fallback interactive logic if Battery API not supported
            if (progressTrack && progressFill && progressText) {
                progressTrack.addEventListener('click', (e) => {
                    if (window.isJiggleMode || window.preventAppClick) return;
                    e.stopPropagation();
                    
                    // Calculate percentage based on click position
                    const rect = progressTrack.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    let percentage = Math.round((clickX / rect.width) * 100);
                    
                    // Clamp
                    if (percentage < 0) percentage = 0;
                    if (percentage > 100) percentage = 100;
                    
                    progressFill.style.width = percentage + '%';
                    progressText.textContent = percentage + '%';
                    
                    if (window.saveDesktopState) window.saveDesktopState();
                });
            }
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
    }

    function createPetWidget() {
        const widget = document.createElement('div');
        widget.className = 'pet-widget';
        const wid = Date.now();
        widget.id = 'pet-widget-' + wid;
        
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            
            <div class="pet-widget-img-wrapper" id="pet-img-container-${wid}">
                <img src="" id="pet-img-${wid}">
                <i class="fas fa-image" id="pet-icon-${wid}" style="font-size: 30px; color: #ccc;"></i>
                <input type="file" id="pet-upload-${wid}" accept="image/*" style="display:none;">
            </div>
            
            <div class="pet-widget-bubble" id="pet-bubble-${wid}" contenteditable="true" spellcheck="false">oxo</div>
            
            <div class="pet-widget-music-icon"><i class="fas fa-music"></i></div>
            
            <div class="pet-widget-plus-btn"><i class="fas fa-plus"></i></div>
        `;
        bindPetWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindPetWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup upload for central image
        const imgContainer = widget.querySelector('.pet-widget-img-wrapper');
        const upload = imgContainer ? imgContainer.querySelector('input[type="file"]') : null;
        const img = imgContainer ? imgContainer.querySelector('img') : null;
        const icon = imgContainer ? imgContainer.querySelector('i') : null;
        
        if (imgContainer && upload) {
            imgContainer.addEventListener('click', (e) => {
                if(!window.isJiggleMode && !window.preventAppClick) { e.stopPropagation(); upload.click(); }
            });
            upload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (img) { img.src = ev.target.result; img.style.display = 'block'; }
                        if (icon) { icon.style.display = 'none'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });
        
        const plusBtn = widget.querySelector('.pet-widget-plus-btn');
        if (plusBtn) {
            plusBtn.addEventListener('click', (e) => {
                if (!window.isJiggleMode && !window.preventAppClick) {
                    e.stopPropagation();
                    // Add some fun interaction later if needed, currently just stops propagation
                }
            });
        }
    }

    function createInsProfileWidget() {
        const widget = document.createElement('div');
        widget.className = 'ins-profile-widget';
        const wid = Date.now();
        widget.id = 'ins-profile-widget-' + wid;
        widget.innerHTML = `
            <div class="delete-widget-btn"><i class="fas fa-times"></i></div>
            <div class="ins-widget-banner" id="ins-widget-banner-btn-${wid}">
                <img src="" id="ins-widget-banner-img-${wid}" style="display: none;">
                <i class="fas fa-camera"></i>
                <input type="file" id="ins-widget-banner-upload-${wid}" accept="image/*" style="display:none;">
            </div>
            <div class="ins-widget-avatar-wrapper" id="ins-widget-avatar-btn-${wid}">
                <div class="ins-widget-avatar">
                    <img src="" id="ins-widget-avatar-img-${wid}" style="display: none;">
                    <i class="fas fa-user"></i>
                </div>
                <input type="file" id="ins-widget-avatar-upload-${wid}" accept="image/*" style="display:none;">
            </div>
            <div class="ins-widget-info">
                <div class="ins-widget-name" id="ins-widget-name-${wid}" contenteditable="true" spellcheck="false">Your Name</div>
                <div class="ins-widget-handle" id="ins-widget-handle-${wid}" contenteditable="true" spellcheck="false">@username</div>
                <div class="ins-widget-bio" id="ins-widget-bio-${wid}" contenteditable="true" spellcheck="false">Write your bio here...</div>
                <div class="ins-widget-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span id="ins-widget-location-text-${wid}" contenteditable="true" spellcheck="false">New York</span>
                </div>
            </div>
        `;
        bindInsProfileWidget(widget);
        if (window.setupDraggable) window.setupDraggable(widget);
        return widget;
    }

    function bindInsProfileWidget(widget) {
        if (!widget) return;
        const deleteBtn = widget.querySelector('.delete-widget-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault(); // prevent drag
                if (window.isJiggleMode) {
                    widget.remove();
                    if (window.balanceGridSlots) window.balanceGridSlots();
                    if (window.saveDesktopState) window.saveDesktopState();
                }
            });
        }

        // Setup uploads
        const bannerBtn = widget.querySelector('.ins-widget-banner');
        const bannerUpload = bannerBtn ? bannerBtn.querySelector('input[type="file"]') : null;
        const bannerImg = bannerBtn ? bannerBtn.querySelector('img') : null;
        if (bannerBtn && bannerUpload) {
            bannerBtn.addEventListener('click', (e) => {
                if(!window.isJiggleMode) { e.stopPropagation(); bannerUpload.click(); }
            });
            bannerUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (bannerImg) { bannerImg.src = ev.target.result; bannerImg.style.display = 'block'; }
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const avatarBtn = widget.querySelector('.ins-widget-avatar-wrapper');
        const avatarUpload = avatarBtn ? avatarBtn.querySelector('input[type="file"]') : null;
        const avatarImg = avatarBtn ? avatarBtn.querySelector('img') : null;
        const avatarIcon = avatarBtn ? avatarBtn.querySelector('.ins-widget-avatar i') : null;
        if (avatarBtn && avatarUpload) {
            avatarBtn.addEventListener('click', (e) => {
                if(!window.isJiggleMode) { e.stopPropagation(); avatarUpload.click(); }
            });
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        if (avatarImg) { avatarImg.src = ev.target.result; avatarImg.style.display = 'block'; }
                        if (avatarIcon) avatarIcon.style.display = 'none';
                        if (window.saveDesktopState) window.saveDesktopState();
                    };
                    reader.readAsDataURL(file);
                }
                e.target.value = '';
            });
        }

        const editables = widget.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
            editable.addEventListener('pointerdown', (e) => {
                if (!window.isJiggleMode) e.stopPropagation();
            });
            editable.addEventListener('blur', () => {
                if (window.saveDesktopState) window.saveDesktopState();
            });
        });

        // Set initial values from userState if empty
        if (window.userState) {
            const nameEl = widget.querySelector('.ins-widget-name');
            const handleEl = widget.querySelector('.ins-widget-handle');
            const bioEl = widget.querySelector('.ins-widget-bio');
            const avatarImgTag = widget.querySelector('.ins-widget-avatar img');
            const avatarIconTag = widget.querySelector('.ins-widget-avatar i');
            
            if(nameEl && nameEl.textContent === 'Your Name') nameEl.textContent = window.userState.name || 'User';
            if(handleEl && handleEl.textContent === '@username') handleEl.textContent = '@' + (window.userState.name || 'user').toLowerCase().replace(/\s+/g, '');
            if(bioEl && bioEl.textContent === 'Write your bio here...') bioEl.textContent = window.userState.persona || 'No bio';
            if(avatarImgTag && (!avatarImgTag.src || avatarImgTag.src === window.location.href) && window.userState.avatarUrl) {
                avatarImgTag.src = window.userState.avatarUrl;
                avatarImgTag.style.display = 'block';
                if(avatarIconTag) avatarIconTag.style.display = 'none';
            }
        }
    }

    function updateDiaryTime() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeStr = `${month}月${date}日 ${hours}:${minutes}`;

        document.querySelectorAll('.time-display-bubble span').forEach(el => {
            el.textContent = timeStr;
        });
        
        const realTimeStr = `${hours}:${minutes}`;
        document.querySelectorAll('.status-card-date').forEach(el => {
            if (!el.matches(':focus')) {
                el.textContent = realTimeStr;
            }
        });
        
        // Update preview in gallery
        const previewTime = document.querySelector('#add-time-widget-btn .time-bubble:nth-child(2)');
        if (previewTime) {
            previewTime.innerHTML = `<i class="far fa-clock" style="color: #8e8e93;"></i> <span>${timeStr}</span>`;
        }
    }
    
    updateDiaryTime();
    setInterval(updateDiaryTime, 60000);

    // Gallery Drag & Drop Logic
    const gallerySheet = document.getElementById('widget-gallery-sheet');
    const timePreviewBtn = document.getElementById('add-time-widget-btn');
    const insPreviewBtn = document.getElementById('add-ins-profile-btn');
    const spotifyPreviewBtn = document.getElementById('add-spotify-widget-btn');
    const petPreviewBtn = document.getElementById('add-pet-widget-btn');
    const statusCardPreviewBtn = document.getElementById('add-status-card-btn');
    const complexMusicPreviewBtn = document.getElementById('add-complex-music-btn');

    function setupGalleryDrag(btn, createWidgetFn, slotsNeeded, offsetW, offsetH) {
        if (!btn) return;
        let isDraggingFromGallery = false;
        let galleryGhost = null;
        let offsetX = 0;
        let offsetY = 0;
        let pressTimer = null;
        let initialX = 0, initialY = 0;

        btn.addEventListener('pointerdown', (e) => {
            initialX = e.clientX;
            initialY = e.clientY;
            
            pressTimer = setTimeout(() => {
                startGalleryDrag(e);
            }, 300);
        });

        const cancelGalleryPress = (e) => {
            if (pressTimer) clearTimeout(pressTimer);
            if (!isDraggingFromGallery) return;
            endGalleryDrag(e);
        };

        const handleGalleryMove = (e) => {
            if (pressTimer) {
                if (Math.abs(e.clientX - initialX) > 10 || Math.abs(e.clientY - initialY) > 10) {
                    clearTimeout(pressTimer);
                }
            }

            if (isDraggingFromGallery && galleryGhost) {
                e.preventDefault();
                galleryGhost.style.left = (e.clientX - offsetX) + 'px';
                galleryGhost.style.top = (e.clientY - offsetY) + 'px';
            }
        };

        btn.addEventListener('pointerup', (e) => {
            if (pressTimer) clearTimeout(pressTimer);
            if (!isDraggingFromGallery) {
                // Short click adds automatically using smart logic
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(createWidgetFn());
                const className = tempDiv.firstElementChild.className;
                
                // Let the global addWidgetToGrid handle the heavy lifting
                if (typeof window.addWidgetToGrid === 'function') {
                    window.addWidgetToGrid(tempDiv.innerHTML, className, slotsNeeded);
                } else {
                    // Fallback to internal if global wasn't exported (we export it below now)
                    addWidgetToGrid(tempDiv.innerHTML, className, slotsNeeded);
                }
            } else {
                endGalleryDrag(e);
            }
        });

        document.addEventListener('pointermove', handleGalleryMove, { passive: false });
        document.addEventListener('pointerup', cancelGalleryPress);
        document.addEventListener('pointercancel', cancelGalleryPress);

        function startGalleryDrag(e) {
            const pagesContainer = document.getElementById('pages-container');
            const pageIndex = pagesContainer ? Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth) : 0;
            const grids = document.querySelectorAll('.main-grid');
            const currentGrid = grids[pageIndex];
            
            if (!currentGrid) return;

            // Allow starting drag even if current page is full so user can drag to dock or other pages
            isDraggingFromGallery = true;
            
            galleryGhost = createWidgetFn();
            galleryGhost.id = 'gallery-drag-ghost';
            galleryGhost.style.position = 'fixed';
            galleryGhost.style.margin = '0';
            galleryGhost.style.zIndex = '9999';
            galleryGhost.style.opacity = '0.9';
            galleryGhost.style.pointerEvents = 'none';
            galleryGhost.style.transform = 'scale(1.05)';
            galleryGhost.style.transition = 'none';
            
            if (slotsNeeded === 8) {
                galleryGhost.style.width = '321px';
            } else if (slotsNeeded === 16) {
                galleryGhost.style.width = '321px';
                galleryGhost.style.height = '325px';
            }

            offsetX = offsetW;
            offsetY = offsetH;

            galleryGhost.style.left = (e.clientX - offsetX) + 'px';
            galleryGhost.style.top = (e.clientY - offsetY) + 'px';

            document.body.appendChild(galleryGhost);

            if (window.closeView) window.closeView(gallerySheet);
            if (window.enterJiggleMode && !window.isJiggleMode) {
                window.enterJiggleMode();
            }
        }

        function endGalleryDrag(e) {
            if (!isDraggingFromGallery) return;
            isDraggingFromGallery = false;

            if (galleryGhost) {
                galleryGhost.remove();
                galleryGhost = null;
            }

            const targetInfo = getGridSlotByMouse(e.clientX, e.clientY);
            
            if (targetInfo && targetInfo.grid) {
                const targetEl = targetInfo.element;
                const widget = createWidgetFn();
                
                const empties = targetInfo.grid.querySelectorAll('.empty-slot');
                if (empties.length >= slotsNeeded) {
                    for(let i=0; i<slotsNeeded; i++) {
                        if (empties[empties.length - 1 - i]) empties[empties.length - 1 - i].remove();
                    }

                    if (!targetEl) {
                        // Drop in empty area, find first available empty slot to insert before
                        const firstEmpty = targetInfo.grid.querySelector('.empty-slot');
                        if (firstEmpty) {
                            targetInfo.grid.insertBefore(widget, firstEmpty);
                        } else {
                            targetInfo.grid.appendChild(widget);
                        }
                    } else if (targetEl.classList.contains('empty-slot')) {
                        targetEl.parentNode.insertBefore(widget, targetEl);
                        targetEl.remove();
                    } else {
                        if (targetInfo.isLeft) {
                            targetEl.parentNode.insertBefore(widget, targetEl);
                        } else {
                            targetEl.parentNode.insertBefore(widget, targetEl.nextSibling);
                        }
                    }
                } else {
                    if (window.showToast) window.showToast('放置位置空间不足');
                }
                
                if (window.balanceGridSlots) window.balanceGridSlots();
                if (window.saveDesktopState) window.saveDesktopState();
            }
        }
    }

    setupGalleryDrag(timePreviewBtn, createTimeWidget, 8, 160, 75);
    setupGalleryDrag(insPreviewBtn, createInsProfileWidget, 16, 160, 160);
    setupGalleryDrag(spotifyPreviewBtn, createSpotifyWidget, 16, 160, 160);
    setupGalleryDrag(petPreviewBtn, createPetWidget, 4, 75, 75);
    setupGalleryDrag(statusCardPreviewBtn, createStatusCardWidget, 8, 160, 75);
    setupGalleryDrag(complexMusicPreviewBtn, createComplexMusicWidget, 16, 160, 160);

    // ==========================================
    // DATA PERSISTENCE FOR WIDGETS
    // ==========================================
    window.saveDesktopState = function() {
        const pagesContainer = document.getElementById('pages-container');
        if (!pagesContainer) return;
        
        // Temporarily remove jiggle mode classes if present to save clean state
        const wasJiggling = window.isJiggleMode;
        if (wasJiggling) {
            document.body.classList.remove('jiggle-mode');
            const plusBtn = document.querySelector('.jiggle-plus-btn');
            if (plusBtn) plusBtn.style.display = 'none';
        }

        const state = {
            grid1: document.getElementById('main-grid-1').innerHTML,
            grid2: document.getElementById('main-grid-2').innerHTML
        };

        localStorage.setItem('ios_emulator_desktop_state_v3', JSON.stringify(state));

        // Restore jiggle mode if it was active
        if (wasJiggling) {
            document.body.classList.add('jiggle-mode');
            const plusBtn = document.querySelector('.jiggle-plus-btn');
            if (plusBtn) plusBtn.style.display = 'flex';
        }
    };

    window.loadDesktopState = function() {
        const savedStateStr = localStorage.getItem('ios_emulator_desktop_state_v3');
        if (savedStateStr) {
            try {
                const state = JSON.parse(savedStateStr);
                const grid1 = document.getElementById('main-grid-1');
                const grid2 = document.getElementById('main-grid-2');
                
                if (grid1 && state.grid1) grid1.innerHTML = state.grid1;
                if (grid2 && state.grid2) grid2.innerHTML = state.grid2;
                
                // Re-bind events to loaded elements
                const allWidgets = document.querySelectorAll('.time-widget, .ins-profile-widget, .spotify-widget, .pet-widget, .status-card-widget, .complex-music-widget');
                allWidgets.forEach(widget => {
                    const className = widget.className;
                    if (className.includes('time-widget')) bindTimeWidget(widget);
                    else if (className.includes('ins-profile-widget')) bindInsProfileWidget(widget);
                    else if (className.includes('spotify-widget')) bindSpotifyWidget(widget);
                    else if (className.includes('pet-widget')) bindPetWidget(widget);
                    else if (className.includes('status-card-widget')) bindStatusCardWidget(widget);
                    else if (className.includes('complex-music-widget')) bindComplexMusicWidget(widget);
                });

                if (window.refreshDraggables) window.refreshDraggables();
                
            } catch(e) {
                console.error("Failed to load desktop state", e);
                // Fallback to binding default widgets if load fails
                bindInitialWidgets();
            }
        } else {
            bindInitialWidgets();
        }
    };

    function bindInitialWidgets() {
        // Initialize default desktop widgets if no saved state
        const defaultTime = document.getElementById('desktop-time-widget');
        if (defaultTime) bindTimeWidget(defaultTime);
        
        const defaultIns = document.getElementById('ins-profile-widget');
        if (defaultIns) bindInsProfileWidget(defaultIns);
        
        const defaultSpotify = document.getElementById('spotify-widget-desktop');
        if (defaultSpotify) bindSpotifyWidget(defaultSpotify);
        
        const defaultPet = document.getElementById('pet-widget-desktop');
        if (defaultPet) bindPetWidget(defaultPet);
        
        const defaultStatusCard = document.getElementById('status-card-desktop');
        if (defaultStatusCard) bindStatusCardWidget(defaultStatusCard);
    }

    // Call load on script execute
    window.loadDesktopState();
});
