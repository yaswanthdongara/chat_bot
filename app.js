
// ===================================
// CHAT APPLICATION CODE
// ===================================

// Chat Elements
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chat App Initialized');
    setupEventListeners();
    loadTheme(); // Just applies the class
    
    // Load chat history if on chat page
    if (chatHistory) loadChatHistory();
});

// Setup event listeners
function setupEventListeners() {
    if (chatInput) {
        // Auto-resize textarea
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }


    // Focus input on any click (terminal behavior)
    if (chatInput) {
        document.addEventListener('click', (e) => {
            // Don't steal focus if clicking on buttons or links or modal
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && !e.target.closest('#configModal')) {
                 // Check if text is being selected
                 const selection = window.getSelection();
                 if (selection.toString().length === 0) {
                     chatInput.focus();
                 }
            }
        });
    }

    // Config Modal Listeners
    const configBtn = document.getElementById('configBtn');
    const configModal = document.getElementById('configModal');
    const closeConfigBtn = document.getElementById('closeConfigBtn');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const aiKeyInput = document.getElementById('aiKeyInput');

    if (configBtn && configModal) {
        configBtn.addEventListener('click', () => {
            configModal.style.display = 'block';
            if (aiKeyInput) {
                aiKeyInput.value = localStorage.getItem('ai_api_key') || '';
            }
        });
    }

    if (closeConfigBtn && configModal) {
        closeConfigBtn.addEventListener('click', () => {
            configModal.style.display = 'none';
        });
    }

    if (saveConfigBtn && configModal && aiKeyInput) {
        saveConfigBtn.addEventListener('click', () => {
             const val = aiKeyInput.value.trim();
             if (val) {
                 localStorage.setItem('ai_api_key', val);
                 alert('Configuration Saved.');
             } else {
                 localStorage.removeItem('ai_api_key');
                 alert('Configuration Cleared.');
             }
             configModal.style.display = 'none';
        });
    }

    // Close on click outside
    if (configModal) {
        window.addEventListener('click', (e) => {
            if (e.target == configModal) {
                configModal.style.display = "none";
            }
        });
    }
}

// Theme Handling
window.setCmdTheme = function(themeName) {
    document.documentElement.className = themeName;
    localStorage.setItem('theme', themeName);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.className = savedTheme;
    } else {
        // Default to B/W CMD theme if no theme set
        setCmdTheme('theme-cmd-white');
    }
}

// Chat Functionality
function loadChatHistory() {
    // PROTECT INPUT AREA: Save it before clearing history
    const inputArea = document.getElementById('chatInputArea');
    const inputAreaParent = inputArea ? inputArea.parentNode : null;
    if (inputArea && inputAreaParent) {
        inputAreaParent.removeChild(inputArea);
    }

    const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
    chatHistory.innerHTML = ''; // Clear current
    
    // Add welcome message if empty
    if (history.length === 0) {
        const welcome = document.createElement('div');
        welcome.className = 'chat-welcome';
        welcome.style.cssText = "text-align: center; opacity: 0.7; margin-top: 50px;";
        welcome.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px;"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x1="16" x2="16" y1="16" y2="16"/></svg>
                <p>Start a conversation with the AI...</p>
        `;
        chatHistory.appendChild(welcome);
    } else {
        history.forEach(msg => appendMessageToUI(msg.role, msg.content));
    }

    // RESTORE INPUT AREA
    if (inputArea) {
        chatHistory.appendChild(inputArea);
        inputArea.style.display = 'flex';
        // Re-focus input
        const input = document.getElementById('chatInput');
        if (input) input.focus();
    }
    
    scrollToBottom();
}

function appendMessageToUI(role, content) {
    // Remove welcome message if it exists
    const welcome = chatHistory.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    // Ensure input area is always at the bottom
    const inputArea = document.getElementById('chatInputArea');
    
    // Map 'assistant' to 'ai' for styling
    const styleRole = role === 'assistant' ? 'ai' : role;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${styleRole}`;
    
    const sender = role === 'user' ? 'You' : 'AI';
    
    // 1. Escape HTML (basic)
    let safeContent = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 2. Extract code blocks to prevent <br> replacement inside them
    const codeBlocks = [];
    safeContent = safeContent.replace(/```(\w*)([\s\S]*?)```/g, (match, lang, code) => {
        codeBlocks.push({ lang, code });
        return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
    });

    // 3. Format the remaining text (newlines to <br>, inline code)
    let formattedContent = safeContent
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    // 4. Restore code blocks with proper HTML structure
    formattedContent = formattedContent.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => {
        const block = codeBlocks[index];
        const language = block.lang || 'text';
        return `
            <div class="code-block-wrapper">
                <div class="code-block-header">
                    <span class="code-lang">${language}</span>
                    <button class="copy-code-btn" onclick="copyCode(this)">Copy</button>
                </div>
                <pre><code class="language-${language}">${block.code}</code></pre>
            </div>
        `;
    });

    msgDiv.innerHTML = `
        <div class="chat-sender">${sender}</div>
        <div class="chat-bubble">${formattedContent}</div>
    `;
    
    // Insert before input area if it exists, otherwise append
    if (inputArea && chatHistory.contains(inputArea)) {
        chatHistory.insertBefore(msgDiv, inputArea);
    } else {
        chatHistory.appendChild(msgDiv);
    }
}

function copyCode(btn) {
    const wrapper = btn.closest('.code-block-wrapper');
    const codeBlock = wrapper.querySelector('code');
    
    // Create a temporary textarea to copy the text
    const textarea = document.createElement('textarea');
    textarea.value = codeBlock.textContent;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        btn.textContent = 'Error';
    }
    
    document.body.removeChild(textarea);
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}


async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Hide default input implementation
    const chatInputArea = document.getElementById('chatInputArea');
    if (chatInputArea) chatInputArea.style.display = 'none';

    // Add user message
    appendMessageToUI('user', text);
    chatInput.value = '';
    chatInput.style.height = 'auto'; // Reset height
    scrollToBottom();
    
    // Save to history
    const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
    history.push({ role: 'user', content: text });
    localStorage.setItem('chat_history', JSON.stringify(history));

    await processAIResponse(history);
}

async function processAIResponse(history) {
    // Try to get key from local storage
    const key = localStorage.getItem('ai_api_key');

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    const inputArea = document.getElementById('chatInputArea');

    loadingDiv.className = 'chat-message ai loading-msg';
    loadingDiv.innerHTML = `
        <div class="chat-sender">AI</div>
        <div class="chat-bubble">Thinking...</div>
    `;
    
    // Insert before input area
    if (inputArea && chatHistory.contains(inputArea)) {
        chatHistory.insertBefore(loadingDiv, inputArea);
    } else {
        chatHistory.appendChild(loadingDiv);
    }
    
    scrollToBottom();

    if (!key) {
        loadingDiv.remove();
        appendMessageToUI('assistant', "I cannot reply because the API Key is missing. Please configure it in the full app or contact support.");
        // Restore input
        if (inputArea) {
            inputArea.style.display = 'flex';
            const input = document.getElementById('chatInput');
            if (input) input.focus();
            scrollToBottom();
        }
        return;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Code Syncer'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [
                    {
                        role: "system", 
                        content: "You are a helpful coding assistant. Answer questions and provide code snippets."
                    },
                    ...history
                ]
            })
        });

        if (!response.ok) {
            throw new Error('API Error: ' + response.status);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;
        
        // Remove loading
        loadingDiv.remove();
        
        // Add AI message
        appendMessageToUI('assistant', aiText); // OpenRouter returns 'assistant'
        scrollToBottom();
        
        // Save to history
        history.push({ role: 'assistant', content: aiText });
        localStorage.setItem('chat_history', JSON.stringify(history));

    } catch (error) {
        loadingDiv.remove();
        const errorDiv = document.createElement('div');
        const inputArea = document.getElementById('chatInputArea');

        errorDiv.className = 'chat-message system error-msg';
        errorDiv.innerHTML = `
            <div class="chat-sender">System</div>
            <div class="chat-bubble" style="color: var(--danger-color); border-color: var(--danger-color);">
                Error: ${error.message}
                <div style="margin-top: 5px;">
                    <button class="btn btn-small" onclick="retryLastMessage()" style="background: var(--danger-color); color: white; border: none;">Retry</button>
                    ${!key ? '<br>Note: Check your API Key.' : ''}
                </div>
            </div>
        `;
        
        if (inputArea && chatHistory.contains(inputArea)) {
            chatHistory.insertBefore(errorDiv, inputArea);
        } else {
            chatHistory.appendChild(errorDiv);
        }
        
        scrollToBottom();
    } finally {
        // Restore input area at the bottom
        const chatInputArea = document.getElementById('chatInputArea');
        if (chatInputArea) {
            chatInputArea.style.display = 'flex';
            const input = document.getElementById('chatInput');
            if (input) input.focus();
            scrollToBottom();
        }
    }
}

async function retryLastMessage() {
    // Remove error message
    const errorMsg = document.querySelector('.chat-message.system.error-msg');
    if (errorMsg) errorMsg.remove();
    
    const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
    await processAIResponse(history);
}
