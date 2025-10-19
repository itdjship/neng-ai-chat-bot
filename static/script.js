const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// handle enter key 
input.addEventListener('keydown', function(e) {
  
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    
    // add delay
    setTimeout(() => {
      handleFormSubmit();
    }, 10);
  }
});

// handle form submission
let isSubmitting = false;

async function handleFormSubmit() {
  
  if (isSubmitting) {
    return;
  }
  
  const userMessage = input.value.trim();
  if (!userMessage) {
    return;
  }
  
  isSubmitting = true;

  // disable input on processing
  input.disabled = true;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  // append message from user
  appendMessage('user', userMessage);
  
  // clear input after appending user message
  input.value = '';

  // typing indicator
  const typingIndicator = appendMessage('bot', 'Neng-AI nuju mikir...');
  typingIndicator.style.fontStyle = 'italic';
  typingIndicator.style.opacity = '0.7';
  
  try {

    const apiUrl = '/api/nengAI/chat';
    // for secure using authentication token or other headers if needed
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ],
      })
    });

    // console.log('Response status:', response.status);
    // console.log('Response ok:', response.ok);

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    // console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.log('Invalid response:', textResponse);
      throw new Error('Server returned non-JSON response: ' + textResponse);
    }

    const data = await response.json();
    
    // delete typing indicator
    typingIndicator.remove();
    
    if (response.ok && data.status && data.data) {
      // append response bot
      appendMessage('bot', data.data);
    } else {
      // Show error message from server
      const errorMsg = data.message || 'Aduh punten aya kasalahan. Mangga cobian sakedap deui.';
      appendMessage('bot', `${errorMsg}`);
    }
  } catch (error) {
    // Remove typing indicator
    typingIndicator.remove();
    
    // Error Logging
    console.error('Error in handleFormSubmit:', error);
    
    // Different error messages based on error type
    let errorMessage = 'Aduh aya nu henteu beres ';
    
    if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
      errorMessage += 'Henteu tiasa nyambung ka jaringan.';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage += 'Henteu tiasa nyambung ka server.';
    } else if (error.message.includes('JSON')) {
      errorMessage += 'Henteu tiasa ngolah data.';
    } else {
      errorMessage += 'Kasalahan: ' + error.message;
    }
    
    appendMessage('bot', errorMessage);
  } finally {
    // Re-enable input after processing
    input.disabled = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Send';
    input.focus();
    
    // Reset submission flag
    isSubmitting = false;
    console.log('Form submission completed, isSubmitting reset to false');
  }
}

// Focus input on page load and set initial scroll
input.focus();

// Ensure chat box has proper scrolling capability
chatBox.style.overflowY = 'auto';

// Add welcome message with formatting demo
// setTimeout(() => {
//   // appendMessage('bot', 'Hello! I\'m **Neng AI**. 🤖\n\nI can help you with:\n• Answering questions\n• **Text analysis**\n• Creative writing\n• Problem solving\n\nTry asking me something!\nYou can use **bold text** and line breaks like this.\n\n💡 **Tip:** Click "✨ New Chat" anytime to start fresh!');
// }, 500);

// Test server connection on page load
// setTimeout(async () => {
//   try {
//     console.log('Testing server connection...');
//     const testResponse = await fetch('/api/nengAI/health');
//     console.log('Health check response:', testResponse.status, testResponse.ok);
    
//     if (testResponse.ok) {
//       console.log('✅ Server connection successful');
//     } else {
//       console.log('❌ Server health check failed');
//     }
//   } catch (error) {
//     console.log('❌ Server connection failed:', error);
//   }
// }, 1000);

// Debug scroll behavior
chatBox.addEventListener('scroll', () => {
  // console.log('Scroll position:', chatBox.scrollTop, '/', chatBox.scrollHeight - chatBox.clientHeight);
});


// Clear chat for testing
window.clearChat = () => {
  chatBox.innerHTML = '';
};

// Test form submit functionality
window.testFormSubmit = () => {
  input.value = 'Test message from button';
  handleFormSubmit();
};

// Clear conversation history on server
window.clearConversationHistory = async () => {
  try {
    const response = await fetch('/api/nengAI/chat/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      // console.log('Conversation history cleared successfully');
      appendMessage('bot', '🔄 **Gedebug ti soledat!** Punten Neng ngadadak amnesia. Hihihi');
    } else {
      console.log('Failed to clear session history');
    }
  } catch (error) {
    console.error('Error clearing session history:', error);
  }
};

// Show conversation history from server
window.showConversationHistory = async () => {
  try {
    console.log('Fetching conversation history...');
    const response = await fetch('/api/nengAI/chat/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Conversation history:', data.data);
      
      if (data.data && data.data.length > 0) {
        let historyText = `📚 **AI Memory (${data.data.length} messages):**\n\n`;
        data.data.forEach((msg, index) => {
          const role = msg.role === 'user' ? 'You' : 'AI';
          const text = msg.parts[0]?.text || '[File/Media]';
          historyText += `${index + 1}. **${role}:** ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\n`;
        });
        appendMessage('bot', historyText);
      } else {
        appendMessage('bot', '📚 **AI Memory is empty.** We haven\'t started our conversation yet!');
      }
    } else {
      console.log('❌ Failed to fetch conversation history');
      appendMessage('bot', '❌ Failed to fetch AI memory. Please try again.');
    }
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    appendMessage('bot', '❌ Error fetching AI memory: ' + error.message);
  }
};

// Start new chat - clear both UI and server history
window.startNewChat = async () => {
  try {
    console.log('Starting new chat...');
    
    // Clear UI chat first
    chatBox.innerHTML = '';
    
    // Clear server-side conversation history
    const response = await fetch('/api/nengAI/chat/history', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      console.log('✅ New chat started successfully');
      
      // Add welcome message
      setTimeout(() => {
        // appendMessage('bot', '✨ ');
      }, 500);
    } else {
      console.log('❌ Failed to clear conversation history');
      appendMessage('bot', '❌ Failed to start new chat. Please try again.');
    }
  } catch (error) {
    console.error('Error starting new chat:', error);
    appendMessage('bot', '❌ Error starting new chat: ' + error.message);
  }
};

// Toggle debug controls visibility
window.toggleDebugControls = () => {
  const debugControls = document.getElementById('debug-controls');
  if (debugControls.style.display === 'none') {
    debugControls.style.display = 'block';
  } else {
    debugControls.style.display = 'none';
  }
};

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  e.stopPropagation();
  
  // Use the same handler function
  await handleFormSubmit();
});

// Parse text for markdown-like formatting
function parseMessageText(text) {
  // Escape HTML to prevent XSS, but preserve our formatting
  let parsed = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Handle newlines - convert \n to <br> for HTML display
  parsed = parsed.replace(/\n/g, '<br>');
  
  // Handle bold text **text** format
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle alternative bold format *text* (but not ***text***)
  parsed = parsed.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<strong>$1</strong>');
  
  // Handle bullet points
  parsed = parsed.replace(/^•\s+/gm, '• ');
  parsed = parsed.replace(/^-\s+/gm, '• ');
  
  // Handle numbered lists
  parsed = parsed.replace(/^(\d+)\.\s+/gm, '$1. ');
  
  return parsed;
}

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  
  // Parse the text for formatting
  const parsedText = parseMessageText(text);
  
  // Use innerHTML for formatted text (bold, newlines, lists)
  if (parsedText.includes('<strong>') || parsedText.includes('<br>') || parsedText.includes('•') || /\d+\./.test(parsedText)) {
    msg.innerHTML = parsedText;
  } else {
    msg.textContent = text;
  }
  
  // Check if user was at bottom before adding message (with some tolerance)
  const isAtBottom = chatBox.scrollTop >= (chatBox.scrollHeight - chatBox.clientHeight - 100);
  
  // Tambahkan ke chatBox (otomatis akan berada di bawah pesan sebelumnya)
  chatBox.appendChild(msg);
  
  // Always auto-scroll to bottom for new messages
  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 50);
  
  // Return element untuk bisa dihapus jika diperlukan (untuk loading message)
  return msg;
}
