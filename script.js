let editorContent = [];
let saveTimeout = null;
let refreshInterval = null;
let lastContentHash = '';
let isPlaying = false;
let playbackInterval = null;
let currentPlayIndex = 0;
let playbackSnapshot = []; // Snapshot of items to play

// Load content on page load
window.addEventListener('DOMContentLoaded', () => {
    loadContentFromServer();
    startAutoRefresh();
    setupPlaybackControls();
    setupFormatButton();
    setupNavigationButtons();
    setupQuickLinks();
    updateLineCount();
});

function setupQuickLinks() {
    const quickLinks = document.querySelectorAll('.quick-link');
    quickLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const day = link.dataset.day;
            jumpToDay(day);
        });
    });
}

function jumpToDay(day) {
    // Switch to revision tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector('[data-tab="revision"]').classList.add('active');
    document.getElementById('revision').classList.add('active');
    
    // Update revision view to ensure it's rendered
    updateRevisionView();
    
    // Wait a bit for rendering, then scroll to the day
    setTimeout(() => {
        const dateHeaders = document.querySelectorAll('.date-header');
        let found = false;
        
        dateHeaders.forEach(header => {
            const dateTitle = header.querySelector('.date-title').textContent;
            // Look for patterns like "90", "90th", "day 90", "360", etc.
            if (dateTitle.includes(day) || dateTitle.includes(`${day}th`) || dateTitle.includes(`day ${day}`)) {
                // Expand the section if collapsed
                const dateSection = header.nextElementSibling;
                if (dateSection.classList.contains('collapsed')) {
                    dateSection.classList.remove('collapsed');
                    header.classList.remove('collapsed');
                }
                
                // Scroll to the header
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Highlight the section briefly
                header.style.background = '#ffeb3b';
                setTimeout(() => {
                    header.style.background = '';
                }, 2000);
                
                found = true;
                console.log(`📍 Jumped to ${day}th day`);
            }
        });
        
        if (!found) {
            alert(`${day}th day not found in revision content`);
        }
    }, 100);
}

function setupFormatButton() {
    const formatBtn = document.getElementById('formatBtn');
    formatBtn.addEventListener('click', () => {
        formatContent();
    });
}

function setupNavigationButtons() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollBottomBtn = document.getElementById('scrollBottomBtn');
    const scrollTopBtn2 = document.getElementById('scrollTopBtn2');
    const scrollBottomBtn2 = document.getElementById('scrollBottomBtn2');
    const revisionList = document.getElementById('revisionList');
    
    scrollTopBtn.addEventListener('click', () => {
        revisionList.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    scrollBottomBtn.addEventListener('click', () => {
        revisionList.scrollTo({ top: revisionList.scrollHeight, behavior: 'smooth' });
    });
    
    scrollTopBtn2.addEventListener('click', () => {
        revisionList.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    scrollBottomBtn2.addEventListener('click', () => {
        revisionList.scrollTo({ top: revisionList.scrollHeight, behavior: 'smooth' });
    });
}

function formatContent() {
    // Remove empty lines (text items with only whitespace)
    const originalLength = editorContent.length;
    editorContent = editorContent.filter(item => {
        if (item.type === 'text') {
            return item.content.trim().length > 0;
        }
        return true; // Keep all images
    });
    
    const removedCount = originalLength - editorContent.length;
    
    updateEditorFromContent();
    updateLineCount();
    saveContentToServer();
    
    console.log(`🧹 Formatted: Removed ${removedCount} empty lines`);
    alert(`Removed ${removedCount} empty line(s)`);
}

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
    
    // Create a snapshot of text items to play
    playbackSnapshot = editorContent
        .map((item, index) => ({ ...item, snapshotIndex: index }))
        .filter(item => item.type === 'text');
    
    if (playbackSnapshot.length === 0) {
        alert('No text items to play');
        return;
    }
    
    isPlaying = true;
    currentPlayIndex = 0;
    
    // Update button UI
    playPauseBtn.querySelector('.play-icon').style.display = 'none';
    playPauseBtn.querySelector('.pause-icon').style.display = 'inline';
    playPauseBtn.querySelector('.btn-text').textContent = 'Stop';
    playPauseBtn.classList.add('playing');
    
    // Stop auto-refresh during playback
    stopAutoRefresh();
    
    console.log(`▶ Starting playback with ${playbackSnapshot.length} text items, ${timeInterval / 1000} second interval`);
    
    // Start playing immediately
    playNextItem(timeInterval);
}

function stopPlayback() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    isPlaying = false;
    currentPlayIndex = 0;
    playbackSnapshot = [];
    
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
    
    if (currentPlayIndex >= playbackSnapshot.length) {
        console.log('✅ Playback completed - all items processed');
        stopPlayback();
        return;
    }
    
    const item = playbackSnapshot[currentPlayIndex];
    console.log(`🔊 [${currentPlayIndex + 1}/${playbackSnapshot.length}] Speaking:`, item.content.substring(0, 50) + '...');
    
    // Speak the text (takes as long as needed to read the entire line)
    speakText(item.content, () => {
        console.log(`✓ Finished speaking line ${currentPlayIndex + 1}`);
        
        // After speaking completes, wait for the configured interval
        console.log(`⏱️ Waiting ${timeInterval / 1000} seconds before deleting...`);
        
        playbackInterval = setTimeout(() => {
            if (!isPlaying) return; // Check if stopped during wait
            
            // Find and delete the item by matching content
            // Search from the beginning to find the first matching text item
            let foundIndex = -1;
            for (let i = 0; i < editorContent.length; i++) {
                if (editorContent[i].type === 'text' && editorContent[i].content === item.content) {
                    foundIndex = i;
                    break;
                }
            }
            
            if (foundIndex !== -1) {
                editorContent.splice(foundIndex, 1);
                updateEditorFromContent();
                updateLineCount();
                
                // Update revision tab if it's active
                if (document.querySelector('.tab-content.active')?.id === 'revision') {
                    updateRevisionView();
                }
                
                saveContentToServer();
                console.log(`🗑️ Deleted line ${currentPlayIndex + 1} from both editor and revision`);
            } else {
                console.warn(`⚠️ Could not find item to delete: ${item.content.substring(0, 30)}...`);
            }
            
            currentPlayIndex++;
            
            // Play next item immediately after deletion
            if (isPlaying) {
                playNextItem(timeInterval);
            }
        }, timeInterval);
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
    
    // Group content by date (extract dates from file paths like C:\Users\...)
    const groupedByDate = {};
    const ungrouped = [];
    
    editorContent.forEach((item, index) => {
        item.originalIndex = index;
        
        if (item.type === 'text') {
            // Try to extract date pattern from text (e.g., C:\Users\date\...)
            const dateMatch = item.content.match(/[A-Z]:\\[^\\]+\\([^\\]+)/);
            if (dateMatch) {
                const dateKey = dateMatch[1];
                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(item);
            } else {
                ungrouped.push(item);
            }
        } else {
            ungrouped.push(item);
        }
    });
    
    // Display grouped content
    Object.keys(groupedByDate).sort().forEach(dateKey => {
        const items = groupedByDate[dateKey];
        
        // Create date header with line count and ID for linking
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.id = `date-${dateKey.replace(/[^a-zA-Z0-9]/g, '-')}`;
        dateHeader.innerHTML = `
            <span class="date-title">${dateKey}</span>
            <span class="date-count">(${items.length} line${items.length > 1 ? 's' : ''})</span>
        `;
        dateHeader.addEventListener('click', () => {
            const dateSection = dateHeader.nextElementSibling;
            dateSection.classList.toggle('collapsed');
            dateHeader.classList.toggle('collapsed');
        });
        revisionList.appendChild(dateHeader);
        
        // Create date section
        const dateSection = document.createElement('div');
        dateSection.className = 'date-section';
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'revision-item';
            div.textContent = item.content;
            
            div.addEventListener('click', () => {
                deleteItem(item.originalIndex);
            });
            
            dateSection.appendChild(div);
        });
        
        revisionList.appendChild(dateSection);
    });
    
    // Display ungrouped content
    if (ungrouped.length > 0) {
        const ungroupedHeader = document.createElement('div');
        ungroupedHeader.className = 'date-header';
        ungroupedHeader.innerHTML = `
            <span class="date-title">Other Content</span>
            <span class="date-count">(${ungrouped.length} item${ungrouped.length > 1 ? 's' : ''})</span>
        `;
        ungroupedHeader.addEventListener('click', () => {
            const ungroupedSection = ungroupedHeader.nextElementSibling;
            ungroupedSection.classList.toggle('collapsed');
            ungroupedHeader.classList.toggle('collapsed');
        });
        revisionList.appendChild(ungroupedHeader);
        
        const ungroupedSection = document.createElement('div');
        ungroupedSection.className = 'date-section';
        
        ungrouped.forEach(item => {
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
                deleteItem(item.originalIndex);
            });
            
            ungroupedSection.appendChild(div);
        });
        
        revisionList.appendChild(ungroupedSection);
    }
}

function deleteItem(index) {
    editorContent.splice(index, 1);
    updateEditorFromContent();
    updateRevisionView();
    updateLineCount();
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
