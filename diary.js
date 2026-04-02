document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const diaryView = document.getElementById('diary-view');

    const foldersPage = document.getElementById('diary-folders-page');
    const notesPage = document.getElementById('diary-notes-page');
    const editPage = document.getElementById('diary-edit-page');

    const folderList = document.getElementById('diary-folder-list');
    const notesList = document.getElementById('diary-notes-list');
    const notesTitle = document.getElementById('diary-notes-title');
    const notesCount = document.getElementById('diary-notes-count');

    const homeBackBtn = document.getElementById('diary-home-back-btn');
    const notesBackBtn = document.getElementById('diary-notes-back');
    const editBackBtn = document.getElementById('diary-edit-back');
    const newEntryBtn = document.getElementById('diary-new-entry-btn');
    const newNoteBtn = document.getElementById('diary-new-note-btn');
    const editDoneBtn = document.getElementById('diary-edit-done');

    const editorDate = document.getElementById('diary-editor-date');
    const editorInput = document.getElementById('diary-editor-input');

    // --- State ---
    let diaryData = []; // [{ id, text, time, folder, originalFolder?, originalFolderTitle?, deletedAt?, deletedAuthorName? }]
    let currentFolder = '';
    let currentFolderTitle = '';
    let currentNoteId = null;
    let isEditMode = false;
    let pageTransitionLock = false;

    // --- Data Management ---
    function loadDiaryData() {
        try {
            const saved = localStorage.getItem('ios_diary_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                diaryData = Array.isArray(parsed) ? parsed : [];
            } else {
                diaryData = [];
            }
        } catch (e) {
            diaryData = [];
        }
    }

    function saveDiaryData() {
        localStorage.setItem('ios_diary_data', JSON.stringify(diaryData));
    }

    // --- Utility ---
    function formatDate(timeMs, formatType = 'short') {
        const date = new Date(timeMs);
        if (formatType === 'long') {
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours() < 12 ? '上午' : '下午'}${(date.getHours() % 12 || 12)}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (formatType === 'medium') {
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    function getFirstLine(text) {
        if (!text) return '新備忘錄';
        const lines = text.trim().split('\n');
        return lines[0] || '新備忘錄';
    }

    function getSecondLinePreview(text) {
        if (!text) return '没有附加文本';
        const lines = text.trim().split('\n');
        if (lines.length > 1) {
            return lines[1];
        }
        return '没有附加文本';
    }

    function getCurrentDiaryUserFolderKey() {
        const currentId = typeof window.getCurrentAccountId === 'function'
            ? window.getCurrentAccountId()
            : null;
        return currentId ? String(currentId) : (window.userState?.name || 'User');
    }

    function getCurrentDiaryUserFolderDisplayName() {
        const currentKey = getCurrentDiaryUserFolderKey();
        const accounts = typeof window.getAccounts === 'function' ? window.getAccounts() : [];
        const currentAccount = accounts.find(acc => String(acc.id) === String(currentKey));
        return currentAccount?.name || window.userState?.name || 'User';
    }

    function getCurrentDiaryUserFolderName() {
        return getCurrentDiaryUserFolderKey();
    }

    function getDeletedFolderName() {
        return '最近删除';
    }

    function isDeletedFolder(folderName = currentFolder) {
        return folderName === getDeletedFolderName();
    }

    function isUserFolder(folderName = currentFolder) {
        return folderName === getCurrentDiaryUserFolderKey();
    }

    function getFolderDisplayName(folderName) {
        if (!folderName) return '未知来源';
        if (folderName === getCurrentDiaryUserFolderKey()) {
            return getCurrentDiaryUserFolderDisplayName();
        }
        return String(folderName);
    }

    function getDeletedAuthorName(note) {
        if (note?.deletedAuthorName) return note.deletedAuthorName;
        if (note?.originalFolderTitle) return note.originalFolderTitle;
        if (note?.originalFolder) return getFolderDisplayName(note.originalFolder);
        return '未知来源';
    }

    function getNoteListTime(note, folderName = currentFolder) {
        if (isDeletedFolder(folderName)) {
            return note.deletedAt || note.time;
        }
        return note.time;
    }

    function clearDeletedMetadata(note) {
        delete note.originalFolder;
        delete note.originalFolderTitle;
        delete note.deletedAt;
        delete note.deletedAuthorName;
    }

    function moveNoteToRecentlyDeleted(note) {
        if (!note || isDeletedFolder(note.folder)) return false;

        const originalFolder = note.folder;
        note.originalFolder = originalFolder;
        note.originalFolderTitle = getFolderDisplayName(originalFolder);
        note.deletedAuthorName = getFolderDisplayName(originalFolder);
        note.deletedAt = Date.now();
        note.folder = getDeletedFolderName();

        return true;
    }

    function restoreDeletedNote(note) {
        if (!note || !note.originalFolder || note.originalFolder === getDeletedFolderName()) {
            return false;
        }

        note.folder = note.originalFolder;
        clearDeletedMetadata(note);

        return true;
    }

    function permanentlyDeleteNote(noteId) {
        const nextData = diaryData.filter(n => n.id !== noteId);
        const changed = nextData.length !== diaryData.length;
        diaryData = nextData;
        return changed;
    }

    function setEditButtonMode(mode = 'edit') {
        if (!editDoneBtn) return;
        if (mode === 'check') {
            editDoneBtn.innerHTML = '<i class="fas fa-check"></i>';
            editDoneBtn.classList.add('diary-nav-done');
        } else {
            editDoneBtn.innerHTML = '<i class="far fa-pen-to-square"></i>';
            editDoneBtn.classList.remove('diary-nav-done');
        }
    }

    function setEditorEditable(editable) {
        isEditMode = !!editable;
        if (editorInput) {
            editorInput.readOnly = !editable;
        }
        setEditButtonMode(editable ? 'check' : 'edit');
    }

    function triggerCharDiaryApi() {
        if (window.showToast) {
            window.showToast('Diary API 占位功能，提示词待补充');
        }
    }

    function resetPageClasses(page) {
        if (!page) return;
        page.classList.remove(
            'diary-page-active',
            'diary-page-enter-from-right',
            'diary-page-enter-from-left',
            'diary-page-enter-active',
            'diary-page-exit-to-left',
            'diary-page-exit-to-right',
            'diary-page-underlay-left',
            'diary-page-underlay-right',
            'diary-page-exit-fade'
        );
    }

    function showOnlyPage(activePage) {
        [foldersPage, notesPage, editPage].forEach(page => {
            if (!page) return;
            resetPageClasses(page);
            page.style.display = page === activePage ? 'flex' : 'none';
            if (page === activePage) {
                page.classList.add('diary-page-active');
            }
        });
    }

    function transitionPages(fromPage, toPage, direction = 'forward', onBeforeEnter) {
        if (!toPage || pageTransitionLock) return;
        if (!fromPage || fromPage === toPage) {
            if (typeof onBeforeEnter === 'function') onBeforeEnter();
            showOnlyPage(toPage);
            return;
        }

        pageTransitionLock = true;

        if (typeof onBeforeEnter === 'function') onBeforeEnter();

        resetPageClasses(fromPage);
        resetPageClasses(toPage);

        toPage.style.display = 'flex';
        fromPage.style.display = 'flex';

        fromPage.classList.add('diary-page-active');
        toPage.classList.add('diary-page-active');

        if (direction === 'back') {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    fromPage.classList.add('diary-page-exit-fade');
                });
            });

            window.setTimeout(() => {
                resetPageClasses(fromPage);
                fromPage.style.display = 'none';

                resetPageClasses(toPage);
                toPage.style.display = 'flex';
                toPage.classList.add('diary-page-active');

                pageTransitionLock = false;
            }, 220);
            return;
        }

        toPage.classList.add('diary-page-enter-from-right');
        fromPage.classList.add('diary-page-underlay-left');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toPage.classList.add('diary-page-enter-active');
                toPage.classList.remove('diary-page-enter-from-right');
                fromPage.classList.add('diary-page-exit-to-left');
            });
        });

        window.setTimeout(() => {
            resetPageClasses(fromPage);
            fromPage.style.display = 'none';

            resetPageClasses(toPage);
            toPage.style.display = 'flex';
            toPage.classList.add('diary-page-active');

            pageTransitionLock = false;
        }, 300);
    }

    // --- App Launch/Close ---
    document.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-item');
        if (appItem && appItem.querySelector('#app-icon-5')) {
            if (window.isJiggleMode || window.preventAppClick) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            e.stopPropagation();
            if (window.syncUIs) window.syncUIs();
            if (diaryView) {
                diaryView.classList.remove('closing');
                diaryView.classList.remove('active');
                loadDiaryData();
                renderFolders();
                showOnlyPage(foldersPage);
                requestAnimationFrame(() => {
                    diaryView.classList.add('active');
                });
            }
        }
    });

    function closeDiaryView() {
        if (diaryView && diaryView.classList.contains('active') && !diaryView.classList.contains('closing')) {
            diaryView.classList.add('closing');
            window.setTimeout(() => {
                diaryView.classList.remove('active');
                diaryView.classList.remove('closing');
                showOnlyPage(foldersPage);
            }, 220);
        }
    }

    const homeBar = document.getElementById('home-bar');
    if (homeBar && diaryView) {
        homeBar.addEventListener('click', closeDiaryView);
    }

    if (homeBackBtn && diaryView) {
        homeBackBtn.addEventListener('click', closeDiaryView);
    }

    // --- Navigation ---
    if (notesBackBtn) {
        notesBackBtn.addEventListener('click', () => {
            renderFolders();
            transitionPages(notesPage, foldersPage, 'back');
        });
    }

    if (editBackBtn) {
        editBackBtn.addEventListener('click', () => {
            saveCurrentNote();
            renderNotesList(currentFolder);
            transitionPages(editPage, notesPage, 'back');
        });
    }

    if (editDoneBtn) {
        editDoneBtn.addEventListener('click', () => {
            if (!isUserFolder()) {
                triggerCharDiaryApi();
                return;
            }

            if (!isEditMode) {
                setEditorEditable(true);
                if (editorInput) editorInput.focus();
                return;
            }

            saveCurrentNote();
            setEditorEditable(false);
            if (window.showToast) window.showToast('已保存');
        });
    }

    const openNewNote = () => {
        currentFolder = getCurrentDiaryUserFolderKey();
        currentFolderTitle = getCurrentDiaryUserFolderDisplayName();
        currentNoteId = null;
        editorInput.value = '';
        editorDate.textContent = formatDate(Date.now(), 'long');
        setEditorEditable(true);
        transitionPages(notesPage.style.display === 'flex' ? notesPage : foldersPage, editPage, 'forward', () => {
            if (editorInput) {
                window.setTimeout(() => editorInput.focus(), 220);
            }
        });
    };

    if (newEntryBtn) newEntryBtn.addEventListener('click', openNewNote);
    if (newNoteBtn) {
        newNoteBtn.addEventListener('click', () => {
            if (isUserFolder()) {
                openNewNote();
            } else {
                triggerCharDiaryApi();
            }
        });
    }

    function saveCurrentNote() {
        if (!isUserFolder()) return;

        const text = editorInput.value.trim();
        if (text) {
            if (currentNoteId) {
                // Update
                const note = diaryData.find(n => n.id === currentNoteId);
                if (note && note.folder === getCurrentDiaryUserFolderKey()) {
                    note.text = text;
                    note.time = Date.now();
                }
            } else {
                // Create
                diaryData.push({
                    id: Date.now().toString(),
                    text: text,
                    time: Date.now(),
                    folder: getCurrentDiaryUserFolderKey()
                });
                currentNoteId = diaryData[diaryData.length - 1].id;
                currentFolder = getCurrentDiaryUserFolderKey();
                currentFolderTitle = getCurrentDiaryUserFolderDisplayName();
            }
            saveDiaryData();
        } else if (currentNoteId) {
            const note = diaryData.find(n => n.id === currentNoteId);
            if (note && note.folder === getCurrentDiaryUserFolderKey()) {
                diaryData = diaryData.filter(n => n.id !== currentNoteId);
                currentNoteId = null;
                saveDiaryData();
            }
        }
    }

    // --- Rendering ---
    function renderFolders() {
        if (!folderList) return;
        folderList.innerHTML = '';

        const userFolderKey = getCurrentDiaryUserFolderKey();
        const userFolderDisplayName = getCurrentDiaryUserFolderDisplayName();
        const friends = (typeof window.getImFriends === 'function'
            ? window.getImFriends()
            : (window.imData?.friends || [])
        ).filter(friend => friend && friend.type !== 'group');

        const userGroup = document.createElement('div');
        userGroup.className = 'diary-folder-group';

        const userNotesCount = diaryData.filter(n => n.folder === userFolderKey).length;
        const userFolderEl = document.createElement('div');
        userFolderEl.className = 'diary-folder-item';
        userFolderEl.innerHTML = `
            <div class="diary-folder-icon"><i class="far fa-folder"></i></div>
            <div class="diary-folder-name">${userFolderDisplayName}</div>
            <div class="diary-folder-count">${userNotesCount}</div>
            <div class="diary-folder-arrow"><i class="fas fa-chevron-right"></i></div>
        `;
        userFolderEl.addEventListener('click', () => {
            openFolder(userFolderKey, userFolderDisplayName);
        });
        userGroup.appendChild(userFolderEl);
        folderList.appendChild(userGroup);

        const friendsGroup = document.createElement('div');
        friendsGroup.className = 'diary-folder-group';

        friends.forEach(friend => {
            const fName = friend.nickname || friend.name || friend.realName || 'Friend';
            const fNotesCount = diaryData.filter(n => n.folder === fName).length;

            const fFolderEl = document.createElement('div');
            fFolderEl.className = 'diary-folder-item';
            fFolderEl.innerHTML = `
                <div class="diary-folder-icon"><i class="far fa-folder"></i></div>
                <div class="diary-folder-name">${fName}</div>
                <div class="diary-folder-count">${fNotesCount}</div>
                <div class="diary-folder-arrow"><i class="fas fa-chevron-right"></i></div>
            `;
            fFolderEl.addEventListener('click', () => {
                openFolder(fName, fName);
            });
            friendsGroup.appendChild(fFolderEl);
        });

        const deletedFolderName = getDeletedFolderName();
        const deletedNotesCount = diaryData.filter(n => n.folder === deletedFolderName).length;
        const deletedFolderEl = document.createElement('div');
        deletedFolderEl.className = 'diary-folder-item';
        deletedFolderEl.innerHTML = `
            <div class="diary-folder-icon"><i class="far fa-trash-can"></i></div>
            <div class="diary-folder-name">${deletedFolderName}</div>
            <div class="diary-folder-count">${deletedNotesCount}</div>
            <div class="diary-folder-arrow"><i class="fas fa-chevron-right"></i></div>
        `;
        deletedFolderEl.addEventListener('click', () => {
            openFolder(deletedFolderName, deletedFolderName);
        });
        friendsGroup.appendChild(deletedFolderEl);

        if (friends.length === 0 && deletedNotesCount === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'diary-folder-item';
            emptyEl.style.pointerEvents = 'none';
            emptyEl.innerHTML = `
                <div class="diary-folder-icon" style="color: #c7c7cc;"><i class="far fa-folder"></i></div>
                <div class="diary-folder-name" style="color: #c7c7cc;">暂无好友</div>
            `;
            friendsGroup.appendChild(emptyEl);
        }

        folderList.appendChild(friendsGroup);
    }

    function openFolder(folderName, displayTitle = folderName) {
        currentFolder = folderName;
        currentFolderTitle = displayTitle;
        notesTitle.textContent = displayTitle;
        renderNotesList(folderName);
        transitionPages(foldersPage, notesPage, 'forward');
    }

    function renderNotesList(folderName) {
        if (!notesList) return;
        notesList.innerHTML = '';

        const folderNotes = diaryData
            .filter(n => n.folder === folderName)
            .sort((a, b) => getNoteListTime(b, folderName) - getNoteListTime(a, folderName));

        if (notesCount) {
            notesCount.textContent = `${folderNotes.length} 則備忘錄`;
        }

        if (newNoteBtn) {
            newNoteBtn.innerHTML = isUserFolder(folderName)
                ? '<i class="far fa-edit"></i>'
                : '<i class="fas fa-wand-magic-sparkles"></i>';
            newNoteBtn.setAttribute('aria-label', isUserFolder(folderName) ? 'New note' : 'Generate note');
        }

        if (folderNotes.length === 0) {
            notesList.innerHTML = '<div style="text-align: center; color: #8e8e93; margin-top: 40px; font-size: 15px;">暫無備忘錄</div>';
            return;
        }

        const notesByMonth = {};

        folderNotes.forEach(note => {
            const date = new Date(getNoteListTime(note, folderName));
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!notesByMonth[key]) notesByMonth[key] = [];
            notesByMonth[key].push(note);
        });

        Object.keys(notesByMonth)
            .sort((a, b) => {
                const [aYear, aMonth] = a.split('-').map(Number);
                const [bYear, bMonth] = b.split('-').map(Number);
                return bYear - aYear || bMonth - aMonth;
            })
            .forEach(key => {
                const [year, month] = key.split('-').map(Number);
                const groupTitle = document.createElement('div');
                groupTitle.className = 'diary-note-group-title';
                groupTitle.textContent = `${year}年${month}月`;
                notesList.appendChild(groupTitle);

                const groupList = document.createElement('div');
                groupList.className = 'diary-note-group-list';

                notesByMonth[key].forEach(note => {
                    groupList.appendChild(createNoteElement(note));
                });

                notesList.appendChild(groupList);
            });
    }

    function createNoteElement(note) {
        const isDeletedContext = isDeletedFolder(currentFolder);

        const row = document.createElement('div');
        row.className = 'diary-note-row';

        const actions = document.createElement('div');
        actions.className = `diary-note-actions${isDeletedContext ? ' diary-note-actions-double' : ''}`;

        let restoreBtn = null;
        if (isDeletedContext) {
            restoreBtn = document.createElement('button');
            restoreBtn.className = 'diary-note-restore-btn';
            restoreBtn.type = 'button';
            restoreBtn.setAttribute('aria-label', 'Restore note');
            restoreBtn.innerHTML = '<i class="fas fa-rotate-left"></i>';
            actions.appendChild(restoreBtn);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'diary-note-delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.setAttribute('aria-label', isDeletedContext ? 'Delete permanently' : 'Delete note');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        actions.appendChild(deleteBtn);

        const el = document.createElement('div');
        el.className = 'diary-note-item';

        const title = getFirstLine(note.text);
        const dateStr = formatDate(getNoteListTime(note, currentFolder), 'medium');
        const preview = getSecondLinePreview(note.text);

        if (isDeletedContext) {
            const authorLabel = getDeletedAuthorName(note);
            el.innerHTML = `
                <div class="diary-note-icon"><i class="far fa-note-sticky"></i></div>
                <div class="diary-note-content">
                    <div class="diary-note-title">${title}</div>
                    <div class="diary-note-desc">
                        <span class="diary-note-date">${dateStr}</span>
                        <span class="diary-note-author">作者：${authorLabel}</span>
                        <span class="diary-note-preview">${preview}</span>
                    </div>
                </div>
                <div class="diary-note-arrow"><i class="fas fa-chevron-right"></i></div>
            `;
        } else {
            el.innerHTML = `
                <div class="diary-note-icon"><i class="far fa-note-sticky"></i></div>
                <div class="diary-note-content">
                    <div class="diary-note-title">${title}</div>
                    <div class="diary-note-desc">
                        <span class="diary-note-date">${dateStr}</span>
                        <span class="diary-note-preview">${preview}</span>
                    </div>
                </div>
                <div class="diary-note-arrow"><i class="fas fa-chevron-right"></i></div>
            `;
        }

        const swipeWidth = isDeletedContext ? 164 : 88;
        const swipeThreshold = isDeletedContext ? 72 : 56;

        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        const resetSwipe = () => {
            el.style.transform = 'translateX(0)';
            row.classList.remove('swiped');
        };

        const onPointerDown = (event) => {
            startX = event.clientX;
            currentX = startX;
            isDragging = true;
        };

        const onPointerMove = (event) => {
            if (!isDragging) return;
            currentX = event.clientX;
            const deltaX = currentX - startX;
            if (deltaX < 0) {
                const translateX = Math.max(deltaX, -swipeWidth);
                el.style.transform = `translateX(${translateX}px)`;
                if (translateX <= -swipeThreshold) {
                    row.classList.add('swiped');
                } else {
                    row.classList.remove('swiped');
                }
            } else if (deltaX > 0 && row.classList.contains('swiped')) {
                const translateX = Math.min(0, -swipeWidth + deltaX);
                el.style.transform = `translateX(${translateX}px)`;
                if (translateX > -swipeThreshold) {
                    row.classList.remove('swiped');
                }
            }
        };

        const onPointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            const deltaX = currentX - startX;
            if (deltaX <= -swipeThreshold) {
                el.style.transform = `translateX(-${swipeWidth}px)`;
                row.classList.add('swiped');
            } else {
                resetSwipe();
            }
        };

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);
        el.addEventListener('pointerleave', onPointerUp);

        el.addEventListener('click', (e) => {
            if (row.classList.contains('swiped')) {
                resetSwipe();
                e.stopPropagation();
                return;
            }
            openEditNote(note);
        });

        if (restoreBtn) {
            restoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const target = diaryData.find(n => n.id === note.id);
                if (!target) return;

                const restoreFolderTitle = target.originalFolderTitle || getFolderDisplayName(target.originalFolder);
                if (!restoreDeletedNote(target)) {
                    resetSwipe();
                    if (window.showToast) window.showToast('原文件夹信息缺失，无法恢复');
                    return;
                }

                saveDiaryData();
                renderNotesList(currentFolder);
                renderFolders();
                if (window.showToast) window.showToast(`已恢复到${restoreFolderTitle}`);
            });
        }

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const target = diaryData.find(n => n.id === note.id);
            if (!target) return;

            if (isDeletedContext) {
                permanentlyDeleteNote(note.id);
                saveDiaryData();
                renderNotesList(currentFolder);
                renderFolders();
                if (window.showToast) window.showToast('已彻底删除');
                return;
            }

            if (moveNoteToRecentlyDeleted(target)) {
                saveDiaryData();
                renderNotesList(currentFolder);
                renderFolders();
                if (window.showToast) window.showToast('已移入最近删除');
            }
        });

        row.appendChild(actions);
        row.appendChild(el);

        return row;
    }

    function openEditNote(note) {
        currentNoteId = note.id;
        currentFolder = note.folder;
        currentFolderTitle = isUserFolder(note.folder) ? getCurrentDiaryUserFolderDisplayName() : note.folder;
        editorInput.value = note.text;
        editorDate.textContent = formatDate(getNoteListTime(note, note.folder), 'long');

        setEditorEditable(false);
        transitionPages(notesPage, editPage, 'forward');
    }
});
