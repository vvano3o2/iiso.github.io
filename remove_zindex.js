const fs = require('fs');
const path = './index.html';
let html = fs.readFileSync(path, 'utf8');

// The elements we moved have inline z-index in their styles
// e.g. <div class="bottom-sheet-overlay detail-sheet-overlay" id="tk-upload-video-sheet" style="z-index: 700;">
// Let's replace specifically the ones we know:
html = html.replace(/id="tk-upload-video-sheet"\s+style="z-index:\s*\d+;?"/g, 'id="tk-upload-video-sheet"');
html = html.replace(/id="tk-dm-chat-view"\s+style="z-index:\s*\d+;?\s*background:\s*#fff;"/g, 'id="tk-dm-chat-view" style="background: #fff;"');
html = html.replace(/id="tk-fullscreen-video-view"\s+style="z-index:\s*\d+;?\s*background:\s*#000;\s*color:\s*#fff;"/g, 'id="tk-fullscreen-video-view" style="background: #000; color: #fff;"');
html = html.replace(/id="tk-share-sheet"\s+style="z-index:\s*\d+;"/g, 'id="tk-share-sheet"');
html = html.replace(/id="tk-comment-user-modal"\s+style="z-index:\s*\d+;"/g, 'id="tk-comment-user-modal"');

// also some might have style before id, so let's just do a generic replace on those specific IDs
const ids = [
    'tk-upload-video-sheet',
    'tk-dm-chat-view',
    'tk-fullscreen-video-view',
    'tk-sub-profile-view',
    'tk-share-sheet',
    'tk-comment-user-modal',
    'tk-video-detail-sheet',
    'tk-create-action-sheet',
    'tk-hashtag-view',
    'tk-music-view',
    'tk-edit-single-video-sheet',
    'tk-edit-profile-sheet',
    'tk-edit-char-sheet',
    'tk-import-char-sheet'
];

ids.forEach(id => {
    // A bit of a hacky regex but works for known HTML format
    let regex = new RegExp(`(id="${id}"[^>]*style="[^"]*)z-index:\\s*\\d+;?\\s*([^"]*")`, 'g');
    html = html.replace(regex, '$1$2');
    
    let regex2 = new RegExp(`(style="[^"]*)z-index:\\s*\\d+;?\\s*([^"]*"[^>]*id="${id}")`, 'g');
    html = html.replace(regex2, '$1$2');
});

fs.writeFileSync(path, html, 'utf8');
console.log('Removed z-index successfully.');
