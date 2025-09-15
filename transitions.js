// ===== GLOBAL PAGE TRANSITIONS SCRIPT =====
// Create this as a separate file: transitions.js
// Include this in ALL your HTML pages

(function() {
    'use strict';

    class GlobalPageTransitions {
        constructor() {
            this.transitionDuration = 400; // milliseconds
            this.init();
        }

        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            this.createLoadingOverlay();
            this.setupPageLoadAnimation();
            this.setupLinkTransitions();
            this.setupFormTransitions();
            this.handleBrowserNavigation();
        }

        createLoadingOverlay() {
            // Create loading overlay if it doesn't exist
            if (!document.querySelector('.page-loading-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'page-loading-overlay';
                overlay.innerHTML = '<div class="page-loading-spinner"></div>';
                document.body.appendChild(overlay);
            }
        }

        setupPageLoadAnimation() {
            // Smooth page load animation
            document.body.style.opacity = '0';
            
            // Trigger animation after a brief delay
            requestAnimationFrame(() => {
                document.body.style.transition = 'opacity 0.6s ease-out';
                document.body.style.opacity = '1';
            });
        }

        setupLinkTransitions() {
            // Handle all internal links
            const internalLinks = document.querySelectorAll('a[href]');
            
            internalLinks.forEach(link => {
                const href = link.getAttribute('href');
                
                // Only handle internal links (not external or mailto/tel links)
                if (this.isInternalLink(href)) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.transitionToPage(href);
                    });
                }
            });
        }

        setupFormTransitions() {
            const forms = document.querySelectorAll('form');
            
            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    // Add subtle form submission animation
                    this.animateFormSubmission(form);
                });
            });
        }

        isInternalLink(href) {
            return href && 
                   !href.startsWith('http') && 
                   !href.startsWith('mailto:') && 
                   !href.startsWith('tel:') && 
                   !href.startsWith('#') &&
                   href !== 'javascript:void(0)';
        }

        transitionToPage(href) {
            // Show loading overlay
            const overlay = document.querySelector('.page-loading-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }

            // Add exit animation to body
            document.body.style.transition = 'all 0.4s ease-in';
            document.body.style.opacity = '0';
            document.body.style.transform = 'translateY(-20px)';

            // Navigate after animation completes
            setTimeout(() => {
                window.location.href = href;
            }, this.transitionDuration);
        }

        animateFormSubmission(form) {
            const formContainer = form.closest('.form-container') || form;
            
            // Add loading state
            formContainer.style.transition = 'all 0.3s ease-out';
            formContainer.style.transform = 'scale(0.98)';
            formContainer.style.opacity = '0.7';
            
            // Reset after a brief moment
            setTimeout(() => {
                formContainer.style.transform = 'scale(1)';
                formContainer.style.opacity = '1';
            }, 300);
        }

        handleBrowserNavigation() {
            // Handle browser back/forward buttons
            window.addEventListener('pageshow', (e) => {
                if (e.persisted) {
                    // Page was loaded from cache, ensure animations work
                    document.body.style.opacity = '1';
                    document.body.style.transform = 'translateY(0)';
                }
            });

            // Handle page unload
            window.addEventListener('beforeunload', () => {
                const overlay = document.querySelector('.page-loading-overlay');
                if (overlay) {
                    overlay.classList.add('active');
                }
            });
        }

        // Public method for successful form submissions (login/register)
        successTransition(targetPage = 'index.html', message = '') {
            const formContainer = document.querySelector('.form-container');
            
            if (formContainer) {
                // Success animation
                formContainer.style.transition = 'all 0.5s ease-out';
                formContainer.style.transform = 'translateY(-30px)';
                formContainer.style.opacity = '0';
            }

            // Show success message if provided
            if (message) {
                this.showSuccessMessage(message);
            }

            // Navigate after animation
            setTimeout(() => {
                this.transitionToPage(targetPage);
            }, 600);
        }

        showSuccessMessage(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 15px 20px;
                border-radius: 4px;
                z-index: 10000;
                animation: successBounce 0.6s ease-out;
            `;
            
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        }

        // Public method to show error animations
        showErrorAnimation(errorElement) {
            if (errorElement && errorElement.textContent.trim()) {
                errorElement.classList.add('shake');
                setTimeout(() => {
                    errorElement.classList.remove('shake');
                }, 500);
            }
        }
    }

    // Initialize global transitions
    const globalTransitions = new GlobalPageTransitions();

    // Make it available globally for other scripts
    window.GlobalPageTransitions = globalTransitions;

    // Auto-enhance error messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const target = mutation.target;
                if (target.id === 'auth-error' || target.classList.contains('error-message')) {
                    if (target.textContent.trim()) {
                        globalTransitions.showErrorAnimation(target);
                    }
                }
            }
        });
    });

    // Start observing error elements
    document.addEventListener('DOMContentLoaded', () => {
        const errorElements = document.querySelectorAll('#auth-error, .error-message');
        errorElements.forEach(element => {
            observer.observe(element, { childList: true, characterData: true, subtree: true });
        });
    });

})();