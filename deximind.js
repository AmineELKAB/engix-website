// DexiMind JavaScript functionality - Version 2.0 (Fixed duplicate user issue)

class DexiMindApp {
    constructor() {
        this.isLoggedIn = false;
        this.chatHistory = [];
        this.currentUser = null;
        this.llmIntegration = new LLaMA3Integration();
        
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Login button
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', () => this.showLoginModal());
        }

        // Subscribe button
        const subscribeButton = document.getElementById('subscribeButton');
        if (subscribeButton) {
            subscribeButton.addEventListener('click', () => this.showSubscribeModal());
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Subscribe form
        const subscribeForm = document.getElementById('subscribeForm');
        if (subscribeForm) {
            subscribeForm.addEventListener('submit', (e) => this.handleSubscribe(e));
        }

        // Modal close buttons
        const closeLoginModal = document.getElementById('closeLoginModal');
        if (closeLoginModal) {
            closeLoginModal.addEventListener('click', () => this.hideLoginModal());
        }

        const closeSubscribeModal = document.getElementById('closeSubscribeModal');
        if (closeSubscribeModal) {
            closeSubscribeModal.addEventListener('click', () => this.hideSubscribeModal());
        }

        // Chat functionality
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            });
        }

        // Control buttons
        const newDiscussionBtn = document.getElementById('newDiscussionBtn');
        if (newDiscussionBtn) {
            newDiscussionBtn.addEventListener('click', () => this.startNewDiscussion());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const killSwitchBtn = document.getElementById('killSwitchBtn');
        if (killSwitchBtn) {
            killSwitchBtn.addEventListener('click', () => this.activateKillSwitch());
        }

        // Modal click outside to close
        window.addEventListener('click', (e) => {
            const loginModal = document.getElementById('loginModal');
            const subscribeModal = document.getElementById('subscribeModal');
            
            if (e.target === loginModal) {
                this.hideLoginModal();
            }
            if (e.target === subscribeModal) {
                this.hideSubscribeModal();
            }
        });

        // Login link in subscribe modal
        const loginLink = document.getElementById('loginLink');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideSubscribeModal();
                this.showLoginModal();
            });
        }

        // Forgot password link
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Real-time email check for subscription form
        const subscribeEmail = document.getElementById('subscribeEmail');
        if (subscribeEmail) {
            subscribeEmail.addEventListener('blur', () => {
                this.checkEmailAvailability(subscribeEmail.value);
            });
        }

        // Handle window resize to maintain scrollbar prevention
        window.addEventListener('resize', () => {
            if (this.isLoggedIn) {
                this.ensureScrollbarPrevention();
            }
        });
    }

    checkAuthStatus() {
        // Check if user is already logged in (from localStorage or session)
        const savedUser = localStorage.getItem('deximind_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
            this.showChatInterface();
            // Ensure scrollbar prevention is applied on page load
            document.documentElement.classList.add('chat-active');
            document.body.classList.add('chat-active');
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showSubscribeModal() {
        const modal = document.getElementById('subscribeModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideSubscribeModal() {
        const modal = document.getElementById('subscribeModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Debug credentials before attempting login
            this.debugCredentials(email);
            
            // Simulate API call - replace with actual authentication
            const response = await this.authenticateUser(email, password);
            
            if (response.success) {
                this.currentUser = response.user;
                this.isLoggedIn = true;
                localStorage.setItem('deximind_user', JSON.stringify(this.currentUser));
                
                this.hideLoginModal();
                this.showChatInterface();
                this.showNotification('Login successful! Welcome to DexiMind', 'success');
            } else {
                // Show more detailed error message
                let errorMessage = response.message || 'Login failed';
                if (errorMessage.includes('Invalid password') || errorMessage.includes('User not found')) {
                    errorMessage += '\n\nTroubleshooting:\n1. Check if you received credentials from the owner\n2. Ensure email and password are copied correctly\n3. Try refreshing the page and logging in again\n4. Contact support if the issue persists';
                }
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again or contact support.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleSubscribe(e) {
        e.preventDefault();
        
        const name = document.getElementById('subscribeName').value;
        const email = document.getElementById('subscribeEmail').value;
        const phone = document.getElementById('subscribePhone').value;
        const plan = document.getElementById('subscribePlan').value;
        
        if (!name || !email || !plan) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Create subscription with real email sending
            const response = await this.createSubscription({ name, email, phone, plan });
            
            if (response.success) {
                this.hideSubscribeModal();
                
                // Show success message with credentials
                let message = response.message;
                if (response.credentials) {
                    message += `\n\nYour temporary login credentials:\nEmail: ${response.credentials.email}\nPassword: ${response.credentials.password}\n\nYou can login now or wait for the email confirmation.`;
                }
                
                this.showNotification(message, 'success');
                
                // Auto-fill login form with credentials
                if (response.credentials) {
                    setTimeout(() => {
                        this.showLoginModal();
                        document.getElementById('loginEmail').value = response.credentials.email;
                        document.getElementById('loginPassword').value = response.credentials.password;
                    }, 2000);
                }
            } else {
                // Handle duplicate email case specially
                if (response.isDuplicate) {
                    this.showNotification(response.message, 'warning');
                    // Auto-fill login form with the email they tried to subscribe with
                    setTimeout(() => {
                        this.hideSubscribeModal();
                        this.showLoginModal();
                        document.getElementById('loginEmail').value = userData.email;
                        document.getElementById('loginPassword').value = '';
                    }, 3000);
                } else {
                    this.showNotification(response.message || 'Subscription failed', 'error');
                }
            }
        } catch (error) {
            console.error('Subscription error:', error);
            this.showNotification('Subscription failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async authenticateUser(email, password) {
        try {
            // Check if user exists in localStorage (simulating user database)
            const existingUsers = JSON.parse(localStorage.getItem('deximind_users') || '[]');
            console.log('Available users:', existingUsers.map(u => ({ email: u.email, hasPassword: !!u.password })));
            console.log('Attempting login with:', { email, passwordLength: password.length });
            console.log('=== USING UPDATED AUTHENTICATION LOGIC v2 ===');
            
            // Find the most recent user with this email (in case there are duplicates)
            const matchingUsers = existingUsers.filter(u => u.email.toLowerCase() === email.toLowerCase());
            const user = matchingUsers.length > 0 ? 
                matchingUsers.reduce((latest, current) => 
                    new Date(current.createdAt || 0) > new Date(latest.createdAt || 0) ? current : latest
                ) : null;
            
            if (!user) {
                console.log('User not found for email:', email);
                return {
                    success: false,
                    message: 'User not found. Please check your email address or subscribe first.'
                };
            }
            
            if (!user.password) {
                console.log('User found but no password set:', user);
                return {
                    success: false,
                    message: 'No password set for this account. Please contact support or subscribe again.'
                };
            }
            
            if (user.password !== password) {
                console.log('Password mismatch. Expected:', user.password, 'Received:', password);
                return {
                    success: false,
                    message: 'Invalid password. Please check your credentials or contact support if you received them from the owner.'
                };
            }
            
            console.log('Authentication successful for user:', user.email);
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan,
                    isTemporary: user.isTemporary || false
                }
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                message: 'Authentication failed. Please try again or contact support.'
            };
        }
    }

    async createSubscription(userData) {
        try {
            // Check if user already exists
            const existingUsers = JSON.parse(localStorage.getItem('deximind_users') || '[]');
            const existingUser = existingUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
            
            if (existingUser) {
                return {
                    success: false,
                    message: `This email address (${userData.email}) is already registered with DexiMind.\n\nIf you already have an account, please use the Login button instead.\n\nIf you forgot your password or need help accessing your account, please contact support.`,
                    isDuplicate: true
                };
            }
            
            // Create a temporary user account for immediate access
            const tempPassword = this.generateTempPassword();
            const newUser = {
                id: 'user_' + Date.now(),
                name: userData.name,
                email: userData.email.toLowerCase().trim(), // Normalize email
                phone: userData.phone,
                plan: userData.plan,
                password: tempPassword,
                createdAt: new Date().toISOString(),
                isTemporary: true
            };
            
            console.log('Creating new user:', { email: newUser.email, password: newUser.password });
            
            // Store user in localStorage
            existingUsers.push(newUser);
            localStorage.setItem('deximind_users', JSON.stringify(existingUsers));
            
            // Verify the user was stored correctly
            const verifyUsers = JSON.parse(localStorage.getItem('deximind_users') || '[]');
            const storedUser = verifyUsers.find(u => u.email === newUser.email);
            console.log('User stored successfully:', !!storedUser, storedUser ? { email: storedUser.email, hasPassword: !!storedUser.password } : 'Not found');
            
            // Send notification to owner with user credentials to forward
            await this.sendOwnerNotificationWithCredentials(userData, tempPassword);
            
            return {
                success: true,
                message: `Subscription successful! Your login credentials are shown below and have been sent to the owner for email confirmation.`,
                credentials: {
                    email: userData.email,
                    password: tempPassword
                }
            };
            
        } catch (error) {
            console.error('Subscription error:', error);
            return {
                success: false,
                message: 'Failed to process subscription. Please try again or contact support.'
            };
        }
    }

    async sendOwnerNotificationWithCredentials(userData, tempPassword) {
        try {
            // Send notification to owner with credentials to forward to user
            await fetch(CONFIG.form.formspree.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'DexiMind System',
                    email: 'system@deximind.com',
                    phone: 'N/A',
                    request: `New DexiMind Subscription - Action Required\n\nUser Details:\nName: ${userData.name}\nEmail: ${userData.email}\nPhone: ${userData.phone || 'Not provided'}\nPlan: ${userData.plan}\n\nTemporary Credentials Created:\nEmail: ${userData.email}\nPassword: ${tempPassword}\n\nACTION REQUIRED:\nPlease forward these credentials to the user at ${userData.email}\n\nEmail Template for User:\n---\nSubject: Welcome to DexiMind - Your Login Credentials\n\nDear ${userData.name},\n\nWelcome to DexiMind! Your subscription has been successfully created.\n\nYour Login Credentials:\nEmail: ${userData.email}\nPassword: ${tempPassword}\n\nYou can now:\n1. Login to DexiMind using the credentials above\n2. Start chatting with your AI agent\n3. Explore automation capabilities\n\nPlease change your password after your first login for security.\n\nIf you have any questions, please contact support.\n\nBest regards,\nThe DexiMind Team\n---`,
                    subject: `URGENT: DexiMind Subscription - ${userData.plan} Plan - ${userData.name} - Forward Credentials`
                })
            });
        } catch (error) {
            console.error('Error sending owner notification:', error);
        }
    }

    generateTempPassword() {
        // Generate a temporary password for new users
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // Debug function to help troubleshoot credential issues
    debugCredentials(email) {
        const users = JSON.parse(localStorage.getItem('deximind_users') || '[]');
        const matchingUsers = users.filter(u => u.email.toLowerCase() === email.toLowerCase());
        const user = matchingUsers.length > 0 ? 
            matchingUsers.reduce((latest, current) => 
                new Date(current.createdAt || 0) > new Date(latest.createdAt || 0) ? current : latest
            ) : null;
        
        console.log('=== CREDENTIAL DEBUG ===');
        console.log('Searching for email:', email);
        console.log('All stored users:', users.map(u => ({ 
            email: u.email, 
            hasPassword: !!u.password, 
            passwordLength: u.password ? u.password.length : 0,
            isTemporary: u.isTemporary,
            createdAt: u.createdAt
        })));
        console.log('Matching users for this email:', matchingUsers.length);
        console.log('Found user (most recent):', user ? {
            email: user.email,
            hasPassword: !!user.password,
            password: user.password,
            isTemporary: user.isTemporary,
            createdAt: user.createdAt
        } : 'NOT FOUND');
        console.log('========================');
        
        return user;
    }

    // Function to clean up duplicate users
    cleanupDuplicateUsers() {
        const users = JSON.parse(localStorage.getItem('deximind_users') || '[]');
        const emailGroups = {};
        
        // Group users by email
        users.forEach(user => {
            const email = user.email.toLowerCase();
            if (!emailGroups[email]) {
                emailGroups[email] = [];
            }
            emailGroups[email].push(user);
        });
        
        // Keep only the most recent user for each email
        const cleanedUsers = [];
        Object.values(emailGroups).forEach(group => {
            const mostRecent = group.reduce((latest, current) => 
                new Date(current.createdAt || 0) > new Date(latest.createdAt || 0) ? current : latest
            );
            cleanedUsers.push(mostRecent);
        });
        
        localStorage.setItem('deximind_users', JSON.stringify(cleanedUsers));
        console.log(`Cleaned up duplicates: ${users.length} -> ${cleanedUsers.length} users`);
        return cleanedUsers;
    }

    showChatInterface() {
        const productDescription = document.getElementById('productDescription');
        const chatInterface = document.getElementById('chatInterface');
        
        if (productDescription && chatInterface) {
            productDescription.style.display = 'none';
            chatInterface.style.display = 'flex';
            // Add class to prevent outer scrollbars on both html and body
            document.documentElement.classList.add('chat-active');
            document.body.classList.add('chat-active');
        }
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat('user', message);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send message to LLaMA 3 API
            const response = await this.sendToLLM(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add DexiMind response to chat
            this.addMessageToChat('deximind', response);
            
        } catch (error) {
            console.error('Error sending message to LLM:', error);
            this.hideTypingIndicator();
            this.addMessageToChat('deximind', 'Sorry, I encountered an error. Please try again.');
        }
    }

    async sendToLLM(message) {
        try {
            // Use LLaMA 3 integration
            const response = await this.llmIntegration.sendMessage(message, this.chatHistory);
            return response;
        } catch (error) {
            console.error('Error sending message to LLaMA 3:', error);
            // Fallback to mock response if LLaMA 3 is not available
            return "I'm experiencing some technical difficulties with my AI processing. Please try again in a moment, or contact support if the issue persists.";
        }
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<p>${message}</p>`;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom smoothly
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);

        // Store in chat history
        this.chatHistory.push({ sender, message, timestamp: new Date() });
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message deximind-message typing-indicator';
        typingDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = '<p>DexiMind is typing...</p>';

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        chatMessages.appendChild(typingDiv);

        // Scroll to bottom smoothly for typing indicator
        setTimeout(() => {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    startNewDiscussion() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="message deximind-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <p>Hello! I'm DexiMind, your AI agent. I can help you control your computer, automate workflows, and learn from your tasks. How can I assist you today?</p>
                    </div>
                </div>
            `;
        }
        
        this.chatHistory = [];
        this.showNotification('New discussion started', 'info');
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout? You will need to login again to access DexiMind.')) {
            this.logout();
            this.showNotification('Logged out successfully. Thank you for using DexiMind!', 'info');
        }
    }

    activateKillSwitch() {
        if (confirm('Are you sure you want to activate the Kill Switch? This will immediately stop DexiMind and return to the main page.')) {
            this.logout();
            this.showNotification('Kill Switch activated. DexiMind stopped.', 'warning');
        }
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.chatHistory = [];
        localStorage.removeItem('deximind_user');
        
        const productDescription = document.getElementById('productDescription');
        const chatInterface = document.getElementById('chatInterface');
        
        if (productDescription && chatInterface) {
            productDescription.style.display = 'block';
            chatInterface.style.display = 'none';
            // Remove class to restore normal scrolling on both html and body
            document.documentElement.classList.remove('chat-active');
            document.body.classList.remove('chat-active');
        }
    }

    handleForgotPassword() {
        this.showNotification('Password reset instructions sent to your email', 'info');
    }

    checkEmailAvailability(email) {
        if (!email || !email.includes('@')) return;
        
        const existingUsers = JSON.parse(localStorage.getItem('deximind_users') || '[]');
        const existingUser = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
        
        const subscribeEmail = document.getElementById('subscribeEmail');
        if (subscribeEmail) {
            if (existingUser) {
                subscribeEmail.style.borderColor = '#ffc107';
                subscribeEmail.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                
                // Show warning message
                let warningDiv = document.getElementById('emailWarning');
                if (!warningDiv) {
                    warningDiv = document.createElement('div');
                    warningDiv.id = 'emailWarning';
                    warningDiv.style.color = '#ffc107';
                    warningDiv.style.fontSize = '0.9rem';
                    warningDiv.style.marginTop = '0.5rem';
                    subscribeEmail.parentNode.appendChild(warningDiv);
                }
                warningDiv.textContent = 'This email is already registered. Please use the Login button instead.';
            } else {
                subscribeEmail.style.borderColor = '#28a745';
                subscribeEmail.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                
                // Remove warning message
                const warningDiv = document.getElementById('emailWarning');
                if (warningDiv) {
                    warningDiv.remove();
                }
            }
        }
    }

    ensureScrollbarPrevention() {
        if (this.isLoggedIn) {
            document.documentElement.classList.add('chat-active');
            document.body.classList.add('chat-active');
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Handle multi-line messages
        if (message.includes('\n')) {
            const lines = message.split('\n');
            const formattedMessage = lines.map(line => {
                if (line.trim() === '') return '<br>';
                return line;
            }).join('<br>');
            notification.innerHTML = formattedMessage;
        } else {
            notification.textContent = message;
        }
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DexiMindApp();
});

// Handle navigation from main page
if (window.location.hash === '#deximind') {
    // If coming from main page with deximind hash, show the product description
    document.addEventListener('DOMContentLoaded', () => {
        const productDescription = document.getElementById('productDescription');
        if (productDescription) {
            productDescription.scrollIntoView({ behavior: 'smooth' });
        }
    });
}
