/**
 * WalkieTalkie - AI-powered location discovery PWA
 * Uses GPS and OpenAI to tell you about your surroundings
 */

// Application state
const state = {
    currentPosition: null,
    isLoading: false,
    watchId: null,
    history: [],
    settings: {
        apiKey: '',
        detailLevel: 'moderate',
        interests: ''
    }
};

// DOM Elements
const elements = {
    locationCoords: document.getElementById('locationCoords'),
    locationAccuracy: document.getElementById('locationAccuracy'),
    locationCard: document.getElementById('locationCard'),
    discoverBtn: document.getElementById('discoverBtn'),
    responseArea: document.getElementById('responseArea'),
    responseContent: document.getElementById('responseContent'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettings: document.getElementById('closeSettings'),
    apiKeyInput: document.getElementById('apiKey'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    detailLevel: document.getElementById('detailLevel'),
    interests: document.getElementById('interests'),
    saveSettings: document.getElementById('saveSettings'),
    clearHistory: document.getElementById('clearHistory'),
    toastContainer: document.getElementById('toastContainer')
};

// Initialize the application
function init() {
    loadSettings();
    loadHistory();
    setupEventListeners();
    requestLocationPermission();
    registerServiceWorker();
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('walkietalkie_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.settings = { ...state.settings, ...parsed };
            elements.apiKeyInput.value = state.settings.apiKey;
            elements.detailLevel.value = state.settings.detailLevel;
            elements.interests.value = state.settings.interests;
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    state.settings.apiKey = elements.apiKeyInput.value.trim();
    state.settings.detailLevel = elements.detailLevel.value;
    state.settings.interests = elements.interests.value.trim();

    localStorage.setItem('walkietalkie_settings', JSON.stringify(state.settings));
    showToast('Settings saved!', 'success');
    closeModal();
    updateDiscoverButton();
}

// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('walkietalkie_history');
    if (saved) {
        try {
            state.history = JSON.parse(saved);
            renderHistory();
        } catch (e) {
            console.error('Failed to load history:', e);
            state.history = [];
        }
    }
}

// Save history to localStorage
function saveHistory() {
    // Keep only last 20 entries
    if (state.history.length > 20) {
        state.history = state.history.slice(0, 20);
    }
    localStorage.setItem('walkietalkie_history', JSON.stringify(state.history));
}

// Setup event listeners
function setupEventListeners() {
    elements.discoverBtn.addEventListener('click', handleDiscover);
    elements.settingsBtn.addEventListener('click', openModal);
    elements.closeSettings.addEventListener('click', closeModal);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeModal();
    });
    elements.saveSettings.addEventListener('click', saveSettings);
    elements.clearHistory.addEventListener('click', clearHistory);
    elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);

    // Handle escape key for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.settingsModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Toggle API key visibility
function toggleApiKeyVisibility() {
    const input = elements.apiKeyInput;
    const eyeOpen = elements.toggleApiKey.querySelector('.eye-open');
    const eyeClosed = elements.toggleApiKey.querySelector('.eye-closed');

    if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    } else {
        input.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
}

// Open settings modal
function openModal() {
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close settings modal
function closeModal() {
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Request location permission and start watching
function requestLocationPermission() {
    if (!navigator.geolocation) {
        updateLocationStatus('Geolocation is not supported by your browser', true);
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
    };

    // Watch position for continuous updates
    state.watchId = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        options
    );
}

// Handle successful position update
function handlePositionSuccess(position) {
    state.currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
    };

    updateLocationDisplay();
    updateDiscoverButton();
}

// Handle position error
function handlePositionError(error) {
    let message;
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        default:
            message = 'Unable to retrieve location.';
    }
    updateLocationStatus(message, true);
}

// Update location display
function updateLocationDisplay() {
    const { latitude, longitude, accuracy } = state.currentPosition;

    elements.locationCoords.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    elements.locationAccuracy.textContent = `±${Math.round(accuracy)}m`;
    elements.locationCard.classList.remove('error');
    elements.locationCard.classList.add('success');
}

// Update location status (for errors)
function updateLocationStatus(message, isError = false) {
    elements.locationCoords.textContent = message;
    elements.locationAccuracy.textContent = '';
    elements.locationCard.classList.toggle('error', isError);
    elements.locationCard.classList.remove('success');
}

// Update discover button state
function updateDiscoverButton() {
    const hasLocation = state.currentPosition !== null;
    const hasApiKey = state.settings.apiKey.length > 0;

    elements.discoverBtn.disabled = !hasLocation || state.isLoading;

    if (!hasApiKey && hasLocation) {
        elements.discoverBtn.querySelector('.discover-btn-text').textContent = 'Set API Key in Settings';
    } else if (!hasLocation) {
        elements.discoverBtn.querySelector('.discover-btn-text').textContent = 'Waiting for Location...';
    } else {
        elements.discoverBtn.querySelector('.discover-btn-text').textContent = 'Discover This Area';
    }
}

// Handle discover button click
async function handleDiscover() {
    if (!state.currentPosition) {
        showToast('Location not available', 'error');
        return;
    }

    if (!state.settings.apiKey) {
        openModal();
        showToast('Please enter your OpenAI API key', 'error');
        return;
    }

    setLoading(true);

    try {
        const response = await getAIResponse();
        displayResponse(response);
        addToHistory(response);
    } catch (error) {
        console.error('Error getting AI response:', error);
        showToast(error.message || 'Failed to get information about this area', 'error');
    } finally {
        setLoading(false);
    }
}

// Set loading state
function setLoading(loading) {
    state.isLoading = loading;
    elements.discoverBtn.classList.toggle('loading', loading);
    elements.discoverBtn.disabled = loading;
}

// Get AI response from OpenAI
async function getAIResponse() {
    const { latitude, longitude } = state.currentPosition;
    const { detailLevel, interests } = state.settings;

    // Build the prompt based on settings
    let prompt = buildPrompt(latitude, longitude, detailLevel, interests);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.settings.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are a knowledgeable and friendly local guide. You provide accurate, interesting information about locations based on GPS coordinates. Your responses should be engaging, informative, and help people appreciate their surroundings. Always structure your response with clear sections. Be factual and accurate - if you're not certain about something specific to the exact location, focus on what you know about the broader area. Never make up specific landmarks or attractions that might not exist.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: getMaxTokens(detailLevel),
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
        } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 500) {
            throw new Error('OpenAI service error. Please try again later.');
        }
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Unexpected response format from OpenAI');
    }

    return data.choices[0].message.content;
}

// Build the prompt based on user settings
function buildPrompt(latitude, longitude, detailLevel, interests) {
    let basePrompt = `I am currently at coordinates: ${latitude}, ${longitude}.

Please tell me about this location and what I might see around me.`;

    if (interests) {
        basePrompt += `\n\nI'm particularly interested in: ${interests}`;
    }

    switch (detailLevel) {
        case 'brief':
            basePrompt += `\n\nPlease provide a brief overview (2-3 short paragraphs) covering:
- What area/neighborhood/region this is
- One or two notable things nearby
- A quick interesting fact about the area`;
            break;
        case 'detailed':
            basePrompt += `\n\nPlease provide a detailed exploration including:
- The specific area/neighborhood/region and its character
- Historical background of this area
- Notable landmarks, attractions, or points of interest nearby
- Natural features (parks, water bodies, terrain)
- Local culture, food, or unique characteristics
- Interesting facts or lesser-known information
- Suggestions for things to see or do while here`;
            break;
        default: // moderate
            basePrompt += `\n\nPlease provide a balanced overview including:
- What area/neighborhood/region this is
- Notable nearby landmarks or attractions
- Key historical or cultural points
- 2-3 interesting facts about the area
- A suggestion or two for what to explore`;
    }

    return basePrompt;
}

// Get max tokens based on detail level
function getMaxTokens(detailLevel) {
    switch (detailLevel) {
        case 'brief': return 500;
        case 'detailed': return 1500;
        default: return 800;
    }
}

// Display the AI response
function displayResponse(content) {
    const placeholder = elements.responseArea.querySelector('.response-placeholder');
    placeholder.style.display = 'none';

    // Convert markdown-like formatting to HTML
    const formattedContent = formatResponse(content);

    elements.responseContent.innerHTML = formattedContent;
    elements.responseContent.classList.add('active');

    // Scroll response into view
    elements.responseArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Format the response (basic markdown to HTML)
function formatResponse(content) {
    // Escape HTML
    let formatted = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Headers
    formatted = formatted.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h3>$1</h3>');

    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Lists
    formatted = formatted.replace(/^\- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Paragraphs (double newlines)
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = '<p>' + formatted + '</p>';

    // Clean up empty paragraphs
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    formatted = formatted.replace(/<p>(<h[34]>)/g, '$1');
    formatted = formatted.replace(/(<\/h[34]>)<\/p>/g, '$1');
    formatted = formatted.replace(/<p>(<ul>)/g, '$1');
    formatted = formatted.replace(/(<\/ul>)<\/p>/g, '$1');

    return formatted;
}

// Add discovery to history
function addToHistory(content) {
    const entry = {
        id: Date.now(),
        latitude: state.currentPosition.latitude,
        longitude: state.currentPosition.longitude,
        content: content,
        timestamp: new Date().toISOString(),
        preview: content.substring(0, 150).replace(/[#*]/g, '') + '...'
    };

    state.history.unshift(entry);
    saveHistory();
    renderHistory();
}

// Render history list
function renderHistory() {
    if (state.history.length === 0) {
        elements.historySection.classList.remove('visible');
        return;
    }

    elements.historySection.classList.add('visible');
    elements.historyList.innerHTML = state.history.map(entry => `
        <div class="history-item" data-id="${entry.id}">
            <div class="history-item-header">
                <span class="history-item-location">${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}</span>
                <span class="history-item-time">${formatTimeAgo(entry.timestamp)}</span>
            </div>
            <p class="history-item-preview">${escapeHtml(entry.preview)}</p>
        </div>
    `).join('');

    // Add click handlers for history items
    elements.historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const entry = state.history.find(h => h.id === id);
            if (entry) {
                displayResponse(entry.content);
            }
        });
    });
}

// Format time ago
function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return then.toLocaleDateString();
}

// Escape HTML for safe display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear history
function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        state.history = [];
        localStorage.removeItem('walkietalkie_history');
        renderHistory();
        showToast('History cleared', 'success');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Register service worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered:', registration.scope);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
