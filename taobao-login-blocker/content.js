// Selectors for known login popups and overlays on Taobao/Tmall
const LOGIN_SELECTORS = [
    '.login-box',
    '#login-box',
    '.J_LoginBox',
    '.J_Popup',
    '.baxter-content',
    '.mui-dialog',
    '.login-dialog',
    '.login-mask',
    '.sufei-dialog-mask',
    '.sufei-dialog-content',
    '.tb-login-dialog',
    '.tm-login-dialog',
    'iframe[src*="login.taobao.com"]',
    'iframe[src*="login.tmall.com"]',
    '#login',
    '.login-new',
    '.mini-login',
    '[class*="login-modal"]',
    '[class*="login-wrap"]',
    '[id*="login-layer"]',
    '.ks-overlay',
    '.ks-overlay-mask',
    '.ks-overlay-content',
    '.ui-dialog-mask',
    '.ui-mask',
    '.next-overlay-backdrop',
    '.next-dialog',
    '[class*="overlay-mask"]',
    '[class*="dialog-mask"]'
];

// Helper to create the emergency button
function createEmergencyButton() {
    if (document.getElementById('taobao-blocker-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'taobao-blocker-btn';
    btn.innerText = '☠️ Remover Bloqueio';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647; /* Max z-index */
        padding: 10px 20px;
        background-color: #ff4d4f;
        color: white;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        font-size: 16px;
    `;
    
    btn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        nuclearOption();
        alert('Tentativa de desbloqueio realizada!');
    };

    document.body.appendChild(btn);
}

function removeLoginPopups() {
    LOGIN_SELECTORS.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.remove();
            console.log('Taobao Login Blocker: Removed element', selector);
        });
    });

    // Remove classes that might block scrolling
    document.body.classList.remove('hidden-scroll', 'no-scroll', 'modal-open', 'dialog-open');
    if (document.documentElement) {
        document.documentElement.classList.remove('hidden-scroll', 'no-scroll', 'modal-open', 'dialog-open');
    }

    // Force scrolling restoration
    document.body.style.setProperty('overflow', 'auto', 'important');
    if (document.documentElement) {
        document.documentElement.style.setProperty('overflow', 'auto', 'important');
    }
    
    // Some sites set position: fixed on body to lock scroll
    document.body.style.setProperty('position', 'static', 'important');
    
    // Clean up generic overlays (black screens)
    removeGenericOverlays();
}

function removeGenericOverlays() {
    // Find divs that are fixed, high z-index, and cover the screen
    const allDivs = document.querySelectorAll('div, span, section'); // Expanded to other tags
    allDivs.forEach(div => {
        if (div.id === 'taobao-blocker-btn') return; // Don't remove our button

        // Optimization: only check if it might be an overlay
        if (div.style.display === 'none') return;
        
        const style = window.getComputedStyle(div);
        
        // Check for "fixed" or "absolute" positioning with high z-index
        if ((style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex) > 1000) {
            const rect = div.getBoundingClientRect();
            
            // Check if it covers most of the screen (e.g., > 80%)
            if (rect.width >= window.innerWidth * 0.8 && rect.height >= window.innerHeight * 0.8) {
                
                // Check visual properties (dark background, transparency, etc.)
                const bg = style.backgroundColor;
                const isDark = bg.includes('rgba(0, 0, 0') || bg.includes('rgba(0,0,0') || bg === 'black' || bg === '#000000' || bg === 'rgb(0, 0, 0)';
                const isTransparent = parseFloat(style.opacity) < 1 && parseFloat(style.opacity) > 0;
                
                // If it's a large overlay, remove it
                if (isDark || isTransparent || style.backdropFilter !== 'none') {
                    div.remove();
                    console.log('Taobao Login Blocker: Removed generic overlay', div);
                }
            }
        }
    });
}

// "Nuclear" option: Removes ALL fixed elements with high z-index
function nuclearOption() {
    const allElements = document.querySelectorAll('body *');
    allElements.forEach(el => {
        if (el.id === 'taobao-blocker-btn') return;

        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' && parseInt(style.zIndex) > 500) {
            // Check if it's likely a header (usually top:0, height small)
            const rect = el.getBoundingClientRect();
            if (rect.height < 150 && rect.top === 0) {
                // Probably a header, keep it (unless user really wants it gone, but let's be safe first)
                return;
            }
            
            el.remove();
            console.log('Taobao Login Blocker: Nuclear removed', el);
        }
    });

    // Reset overflow again
    document.body.style.setProperty('overflow', 'auto', 'important');
    document.documentElement.style.setProperty('overflow', 'auto', 'important');
}

// Initial cleanup
removeLoginPopups();
createEmergencyButton();

// Use MutationObserver
const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0 || mutation.type === 'attributes') {
            shouldCheck = true;
        }
    });

    if (shouldCheck) {
        removeLoginPopups();
        // Ensure button stays on top
        const btn = document.getElementById('taobao-blocker-btn');
        if (btn) document.body.appendChild(btn); 
    }
});

// Start observing
const startObserver = () => {
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        removeLoginPopups();
        createEmergencyButton();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
} else {
    startObserver();
}

// Aggressive periodic check (every 500ms)
setInterval(() => {
    removeLoginPopups();
    createEmergencyButton();
}, 500);

// Add keyboard shortcut (Alt+X)
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyX') {
        nuclearOption();
    }
});

// Specific fix for "search" pages
if (window.location.hostname.includes('s.taobao.com')) {
    const items = document.querySelectorAll('.item-service-unavailable');
    items.forEach(item => item.style.display = 'none');
}
