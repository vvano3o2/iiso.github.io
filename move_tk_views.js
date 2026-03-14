const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const ids = [
  'tk-upload-video-sheet',
  'tk-dm-chat-view',
  'tk-fullscreen-video-view',
  'tk-sub-profile-view',
  'tk-share-sheet',
  'tk-comment-user-modal'
];

function extractElement(id) {
    const startStr = 'id="' + id + '"';
    const startIdx = html.indexOf(startStr);
    if (startIdx === -1) return '';
    
    // Find the opening div
    let divStart = html.lastIndexOf('<div', startIdx);
    
    // Find the closing div
    let openCount = 0;
    let i = divStart;
    while (i < html.length) {
        if (html.substring(i, i+4) === '<div') {
            openCount++;
            i += 4;
        } else if (html.substring(i, i+6) === '</div>') {
            openCount--;
            if (openCount === 0) {
                const endIdx = i + 6;
                const chunk = html.substring(divStart, endIdx);
                // Remove chunk from html
                html = html.substring(0, divStart) + html.substring(endIdx);
                return chunk;
            }
            i += 6;
        } else {
            i++;
        }
    }
    return '';
}

let chunks = [];
for (const id of ids) {
    const chunk = extractElement(id);
    if (chunk) chunks.push(chunk);
}

// Find the end of tiktok-view
const tkViewStr = 'id="tiktok-view"';
const tkStart = html.indexOf(tkViewStr);
let openCount = 0;
let tkEnd = -1;
let i = html.lastIndexOf('<div', tkStart);
while (i < html.length) {
    if (html.substring(i, i+4) === '<div') {
        openCount++;
        i += 4;
    } else if (html.substring(i, i+6) === '</div>') {
        openCount--;
        if (openCount === 0) {
            tkEnd = i;
            break;
        }
        i += 6;
    } else {
        i++;
    }
}

if (tkEnd !== -1 && chunks.length > 0) {
    const newHtml = html.substring(0, tkEnd) + '\n<!-- MOVED TK VIEWS -->\n' + chunks.join('\n\n') + '\n' + html.substring(tkEnd);
    fs.writeFileSync('index.html', newHtml, 'utf8');
    console.log('Moved views successfully.');
} else {
    console.log('Failed to find tk-view or chunks.');
}
