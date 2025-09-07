// DOM Elements
const contactRequest = document.getElementById('contactRequest');
const deximindCard = document.getElementById('deximindCard');
const contactModal = document.getElementById('contactModal');
const closeModal = document.getElementById('closeModal');
const contactForm = document.getElementById('contactForm');
const loadingSpinner = document.getElementById('loadingSpinner');

// Rate limiting for form submission
let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN = CONFIG.form.validation.rateLimitMs;

// Event Listeners
contactRequest.addEventListener('click', openModal);
deximindCard.addEventListener('click', openDexiMindPage);
closeModal.addEventListener('click', closeModalFunc);
contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) {
        closeModalFunc();
    }
});
contactForm.addEventListener('submit', handleFormSubmit);

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal.style.display === 'block') {
        closeModalFunc();
    }
});

// Functions
function openModal() {
    contactModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    // Focus on first input
    setTimeout(() => {
        document.getElementById('name').focus();
    }, 100);
}

function openDexiMindPage() {
    // Navigate to DexiMind page
    window.location.href = 'deximind.html';
}

function closeModalFunc() {
    contactModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    // Reset form
    contactForm.reset();
}

function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showMessage(message, type = 'success') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 4000;
        animation: slideInRight 0.3s ease;
        ${type === 'success' ? 'background-color: #10b981;' : 'background-color: #ef4444;'}
    `;

    // Add animation keyframes if not already present
    if (!document.querySelector('#messageStyles')) {
        const style = document.createElement('style');
        style.id = 'messageStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(messageDiv);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 5000);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Rate limiting check
    const now = Date.now();
    if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
        showMessage('Please wait a few seconds before submitting again.', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        request: formData.get('request'),
        website: formData.get('website') // Honeypot field
    };

    // Basic validation
    if (!data.name.trim() || !data.email.trim() || !data.request.trim()) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }

    if (!isValidEmail(data.email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Check request length
    if (data.request.length > CONFIG.form.validation.maxRequestLength) {
        showMessage(`Request is too long. Maximum ${CONFIG.form.validation.maxRequestLength} characters allowed.`, 'error');
        return;
    }

    // Honeypot validation (spam protection)
    if (data.website && data.website.trim() !== '') {
        console.log('Spam detected via honeypot field');
        showMessage('Your request has been sent successfully! We\'ll get back to you soon.');
        closeModalFunc();
        return;
    }

    try {
        showLoading();
        
        // Submit to Formspree (owner notification)
        await submitForm(data);
        

        
        // Success
        showMessage('Your request has been sent successfully! We\'ll get back to you soon.');
        closeModalFunc();
        lastSubmissionTime = now; // Update submission time
        
    } catch (error) {
        console.error('Form submission error:', error);
        showMessage('There was an error sending your request. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function submitForm(data) {
    if (CONFIG.form.formspree.enabled) {
        // Formspree integration
        try {
            const response = await fetch(CONFIG.form.formspree.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    request: data.request,
                    subject: 'New Deep Dive Request from ' + data.name
                })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            return response.json();
            
        } catch (error) {
            console.error('Formspree submission error:', error);
            throw error;
        }
    } else if (CONFIG.form.sendgrid.enabled) {
        // SendGrid integration
        try {
            const response = await fetch(CONFIG.form.sendgrid.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            return response.json();
            
        } catch (error) {
            console.error('SendGrid submission error:', error);
            throw error;
        }
    } else {
        throw new Error('No form handler configured');
    }
}



// Add smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling to all internal links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Image lazy loading and progressive loading
class ImageLoader {
    constructor() {
        this.loadedImages = new Set();
        this.initLazyLoading();
    }

    initLazyLoading() {
        // Create intersection observer for lazy loading
        const lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    lazyObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Observe all lazy-loaded images and iframes
        document.addEventListener('DOMContentLoaded', () => {
            const lazyImages = document.querySelectorAll('.lazy-load');
            lazyImages.forEach(img => {
                lazyObserver.observe(img);
            });
        });
    }

    async loadImage(element) {
        const dataSrc = element.getAttribute('data-src');
        const src = element.getAttribute('src');
        const imageSrc = dataSrc || src;
        
        if (!imageSrc || this.loadedImages.has(imageSrc)) return;

        try {
            // Show loading state
            const loadingId = element.parentElement.querySelector('.image-loading');
            if (loadingId) {
                loadingId.style.display = 'flex';
            }

            // Handle iframe loading
            if (element.tagName === 'IFRAME') {
                const response = await fetch(imageSrc);
                if (response.ok) {
                    element.src = imageSrc;
                    element.onload = () => {
                        this.handleImageLoaded(element, loadingId);
                    };
                    this.loadedImages.add(imageSrc);
                }
            } 
            // Handle regular image loading
            else if (element.tagName === 'IMG') {
                element.onload = () => {
                    this.handleImageLoaded(element, loadingId);
                };
                element.onerror = () => {
                    console.error('Error loading image:', imageSrc);
                    this.handleImageLoaded(element, loadingId);
                };
                this.loadedImages.add(imageSrc);
            }
        } catch (error) {
            console.error('Error loading image:', error);
            this.handleImageLoaded(element, loadingId);
        }
    }

    handleImageLoaded(element, loadingElement) {
        // Hide loading state
        if (loadingElement) {
            loadingElement.classList.add('hidden');
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 300);
        }

        // Show element with fade-in effect
        element.classList.add('loaded');
    }
}

// Initialize image loader
const imageLoader = new ImageLoader();

// Ensure DexiMind image loads immediately
document.addEventListener('DOMContentLoaded', () => {
    const deximindImage = document.querySelector('.service-card.deximind-agent img.service-image');
    if (deximindImage) {
        console.log('DexiMind image found:', deximindImage.src);
        deximindImage.style.opacity = '1';
        deximindImage.classList.add('loaded');
        
        // Hide loading spinner
        const loadingSpinner = document.querySelector('.service-card.deximind-agent .image-loading');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        
        // Add error handling
        deximindImage.onerror = () => {
            console.error('Failed to load DexiMind image:', deximindImage.src);
        };
        
        deximindImage.onload = () => {
            console.log('DexiMind image loaded successfully');
        };
    } else {
        console.error('DexiMind image not found');
    }
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards for animation
document.addEventListener('DOMContentLoaded', () => {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
        observer.observe(card);
    });
});
