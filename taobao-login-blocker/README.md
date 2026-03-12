# Taobao Login Blocker Extension

This Chrome extension removes the mandatory login popups on Taobao and Tmall, allowing you to browse without logging in.

## Installation Instructions

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (toggle in the top right corner).
3.  Click **Load unpacked** (or "Carregar sem compactação").
4.  Select the `taobao-login-blocker` folder located at `c:\Users\FSOS\Documents\trae_projects\another\taobao-login-blocker`.
5.  **Reload the extension** if you already had it installed (click the circular arrow icon on the extension card).

## Features

-   **Automatic Popup Removal**: Automatically detects and removes login popups on Taobao and Tmall.
-   **Scroll Restoration**: Forces the page to be scrollable if the popup locked it.
-   **Manual Trigger**: Press `Alt + X` to manually trigger the popup removal if the automatic detection fails.
-   **Aggressive Mode**: Runs checks every 500ms to catch persistent popups.

## Supported Sites

-   taobao.com (including search results)
-   tmall.com

## Troubleshooting

If a popup still appears:
1.  Press `Alt + X`.
2.  If that doesn't work, the popup might be a new type or an iframe. Please report the issue or inspect the element to find its class name.
3.  Note that some "login requirements" are redirects (the URL changes to login.taobao.com). This extension currently focuses on removing *popups* on the current page. If you are redirected, you may need to go back and try again or use a different search method.
