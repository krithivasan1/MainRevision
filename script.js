let editorContent = [];
let saveTimeout = null;
let refreshInterval = null;
let lastContentHash = '';
let isPlaying = false;
let playbackInterval = null;
let currentPlayIndex = 0;

// Load content on page load
window.addEventListener('DOMContentLoaded', () => {
    loadContentFromServer();
    startAutoRefresh();
    setupPlaybackControls();
    updateLineCount();
});

function setupPlaybackControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const timeInterval = document.getElementById('timeInterval');
    
    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    });
}

function startPlayback() {
    const timeInterval = parseInt(document.getElementById('timeInterval').value) * 1000;
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    isPlaying = true;
    currentPlayIndex = 0;
    
    // Update button UI
    playPauseBtn.querySelector('.play-icon').style.display = 'none';
    playPauseBtn.querySelector('.pause-icon').style.display = 'inline';
    playPauseBtn.querySelector('.btn-text').textContent = 'Stop';
    playPauseBtn.classList.add('playing');
    
    // Stop auto-refresh during playback
    stopAutoRefresh();
    
    console.log('▶ Starting playback with', timeInterval / 1000, 'second interval');
    
    // Start playing immediately
    playNextItem(timeInterval);
}

function stopPlayback() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    isPlaying = false;
    currentPlayIndex = 0;
    
    if (playbackInterval) {
        clearTimeout(playbackInterval);
        playbackInterval = null;
    }
    
    // Stop any ongoing speech
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    // Update button UI
    playPauseBtn.querySelector('.play-icon').style.display = 'inline';
    playPauseBtn.querySelector('.pause-icon').style.display = 'none';
    playPauseBtn.querySelector('.btn-text').textContent = 'Play';
    playPauseBtn.classList.remove('playing');
    
    // Resume auto-refresh
    startAutoRefresh();
    
    console.log('⏸ Playback stopped');
}

function playNextItem(timeInterval) {
    if (!isPlaying) return;
    
    // Filter only text items
    const textItems = editorContent.filter(item => item.type === 'text');
    
    if (textItems.length === 0) {
        console.log('No text items to play');
        stopPlayback();
        return;
    }
    
    if (currentPlayIndex >= textItems.length) {
        console.log('✅ Playback completed');
        stopPlayback();
        return;
    }
    
    const item = textItems[currentPlayIndex];
    console.log('🔊 Speaking:', item.content.substring(0, 50) + '...');
    
    // Speak the text
    speakText(item.content, () => {
        // After speaking completes, delete the text item immediately
        const itemIndex = editorContent.findIndex(
            (el, idx) => el.type === 'text' && el.content === item.content && 
            editorContent.slice(0, idx).filter(e => e.type === 'text').length === currentPlayIndex
        );
        
        if (itemIndex !== -1) {
            editorContent.splice(itemIndex, 1);
            updateEditorFromContent();
            updateLineCount();
            saveContentToServer();
            console.log('🗑️ Deleted text item after speaking');
        }
        
        currentPlayIndex++;
        
        // Wait for the interval, then play next item
        if (isPlaying) {
            playbackInterval = setTimeout(() => {
                playNextItem(timeInterval);
            }, timeInterval);
        }
    });
}

function speakText(text, onComplete) {
    if (!window.speechSynthesis) {
        console.error('Speech synthesis not supported');
        if (onComplete) onComplete();
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
        if (onComplete) onComplete();
    };
    
    utterance.onerror = (event) => {
        console.error('Speech error:', event);
        if (onComplete) onComplete();
    };
    
    window.speechSynthesis.speak(utterance);
}

function updateLineCount() {
    const lineCountEl = document.getElementById('lineCount');
    const totalLines = editorContent.length;
    lineCountEl.textContent = `Lines: ${totalLines}`;
}

// Load content on page load
window.addEventListener('DOMContentLoaded', () => {
    loadContentFromServer();
    // Auto-refresh every 3 seconds to sync across devices
    startAutoRefresh();
});

function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        loadContentFromServer(true);
    }, 1000); // Check for updates every 1 second (faster sync)
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

function getContentHash(content) {
    return JSON.stringify(content);
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        if (tabName === 'revision') {
            updateRevisionView();
        }
    });
});

const editor = document.getElementById('wordEditor');

async function loadContentFromServer(isAutoRefresh = false) {
    try {
        if (!isAutoRefresh) {
            console.log('Loading content from server...');
        }
        const response = await fetch('/api/content');
        const data = await response.json();
        const newContent = data.content || [];
        const newHash = getContentHash(newContent);
        
        // Only update if content has changed
        if (newHash !== lastContentHash) {
            editorContent = newContent;
            lastContentHash = newHash;
            
            // Only update editor if user is not currently typing
            if (!isAutoRefresh || !document.activeElement || document.activeElement !== editor) {
                updateEditorFromContent();
                if (document.querySelector('.tab-content.active')?.id === 'revision') {
                    updateRevisionView();
                }
            }
            
            if (!isAutoRefresh) {
                console.log('Loaded content:', editorContent.length, 'items');
            } else {
                console.log('🔄 Content synced:', editorContent.length, 'items');
            }
            updateLineCount();
        }
    } catch (err) {
        console.error('Failed to load content:', err);
    }
}

async function saveContentToServer() {
    try {
        console.log('Saving content to server...', editorContent.length, 'items');
        const response = await fetch('/api/content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: editorContent })
        });
        const result = await response.json();
        lastContentHash = getContentHash(editorContent);
        console.log('✅ Save result:', result);
    } catch (err) {
        console.error('Failed to save content:', err);
    }
}

// Handle paste event to capture content
editor.addEventListener('paste', (e) => {
    setTimeout(() => {
        saveEditorContent();
        debounceSave();
    }, 100);
});

// Handle input changes
editor.addEventListener('input', () => {
    saveEditorContent();
    debounceSave();
    updateLineCount();
});

// Pause auto-refresh when user is typing
editor.addEventListener('focus', () => {
    console.log('Editor focused - typing mode');
});

editor.addEventListener('blur', () => {
    console.log('Editor blurred - will sync on next refresh');
    // Force a save when user stops editing
    saveEditorContent();
    saveContentToServer();
});

function debounceSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveContentToServer();
    }, 500); // Save after 500ms of inactivity (faster save)
}

function saveEditorContent() {
    editorContent = [];
    const children = editor.childNodes;
    
    children.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            editorContent.push({
                type: 'text',
                content: node.textContent
            });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IMG') {
                editorContent.push({
                    type: 'image',
                    content: node.src
                });
            } else if (node.tagName === 'DIV' || node.tagName === 'P') {
                const imgs = node.querySelectorAll('img');
                if (imgs.length > 0) {
                    imgs.forEach(img => {
                        editorContent.push({
                            type: 'image',
                            content: img.src
                        });
                    });
                }
                const text = node.textContent.trim();
                if (text) {
                    editorContent.push({
                        type: 'text',
                        content: text
                    });
                }
            } else {
                const text = node.textContent.trim();
                if (text) {
                    editorContent.push({
                        type: 'text',
                        content: text
                    });
                }
            }
        }
    });
    console.log('Editor content updated:', editorContent.length, 'items');
    updateLineCount();
}

function updateRevisionView() {
    const revisionList = document.getElementById('revisionList');
    revisionList.innerHTML = '';
    
    if (editorContent.length === 0) {
        revisionList.innerHTML = '<p style="color: #999; text-align: center; padding: 50px;">No content to display. Add content in Word Editor tab.</p>';
        return;
    }
    
    editorContent.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'revision-item';
        
        if (item.type === 'text') {
            div.textContent = item.content;
        } else if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.content;
            div.appendChild(img);
        }
        
        div.addEventListener('click', () => {
            deleteItem(index);
        });
        
        revisionList.appendChild(div);
    });
}

function deleteItem(index) {
    editorContent.splice(index, 1);
    updateEditorFromContent();
    updateRevisionView();
    saveContentToServer();
}

function updateEditorFromContent() {
    editor.innerHTML = '';
    
    editorContent.forEach(item => {
        if (item.type === 'text') {
            const p = document.createElement('p');
            p.textContent = item.content;
            editor.appendChild(p);
        } else if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.content;
            editor.appendChild(img);
        }
    });
}
