// This script adds floating 'Back' and 'Home' buttons to every page except the homepage.

(function() {
    // --- Configuration ---
    // Add any other homepage filenames here if needed (e.g., '/default.html')
    const homepages = ['/', '/index.html'];

    // --- Logic ---
    // Check if the current page is one of the specified homepages
    const isHomepage = homepages.some(page => window.location.pathname.endsWith(page));

    // If it's not the homepage, create and inject the buttons and their styles
    if (!isHomepage) {
        // 1. Create the CSS styles for the buttons
        const styles = `
            .fab-container {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                z-index: 50;
            }

            .fab {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 3.5rem;
                height: 3.5rem;
                border-radius: 9999px;
                color: white;
                background-color: #c21a1a;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                transition: all 0.2s ease-in-out;
                text-decoration: none;
                border: none;
                cursor: pointer;
            }

            .fab:hover {
                background-color: #a01616;
                transform: scale(1.05);
            }
        `;

        // 2. Create the HTML for the buttons
        const fabHTML = `
            <div class="fab-container">
                <!-- Back Button -->
                <button onclick="history.back()" class="fab" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                </button>
                <!-- Home Button -->
                <a href="index.html" class="fab" aria-label="Go to homepage">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </a>
            </div>
        `;

        // 3. Inject the styles into the document's head
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        // 4. Inject the HTML into the document's body
        document.body.insertAdjacentHTML('beforeend', fabHTML);
    }
})();