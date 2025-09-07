// LLaMA 3 Integration for DexiMind
// This file handles the integration with LLaMA 3 for the chat functionality

class LLaMA3Integration {
    constructor() {
        this.apiEndpoint = 'https://api.engix.dev/llm/v1'; // Replace with actual LLaMA 3 endpoint
        this.apiKey = 'your-llama3-api-key'; // Replace with actual API key
        this.model = 'llama-3-8b-instruct'; // LLaMA 3 model variant
        this.maxTokens = 2048;
        this.temperature = 0.7;
        this.systemPrompt = this.getSystemPrompt();
    }

    getSystemPrompt() {
        return `You are DexiMind, an advanced AI agent designed to help users control and automate their computers. You have the following capabilities:

1. **Computer Control**: You can control any computer without software installation through external hardware
2. **Workflow Automation**: You can automate complex workflows across multiple applications
3. **Continuous Learning**: You learn from user interactions and adapt to their specific needs
4. **Zero Installation**: You work through external hardware, ensuring privacy and security
5. **Cross-Platform**: You work on Windows, macOS, and Linux systems

Your personality:
- Helpful and professional
- Focused on productivity and automation
- Always prioritize user safety and privacy
- Ask clarifying questions when needed
- Provide step-by-step guidance for complex tasks

When users ask about capabilities, explain that you can:
- Automate repetitive tasks
- Control applications and systems
- Learn from user behavior
- Generate reports and documentation
- Handle data processing workflows
- Assist with technical tasks

Always maintain a helpful, professional tone and focus on how you can make the user's work more efficient and automated.`;
    }

    async sendMessage(userMessage, chatHistory = []) {
        try {
            const messages = this.buildMessageArray(userMessage, chatHistory);
            
            const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Version': '2024-01-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    stream: false,
                    stop: ['Human:', 'User:', 'Assistant:']
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content.trim();
            } else {
                throw new Error('No response from LLaMA 3');
            }

        } catch (error) {
            console.error('LLaMA 3 API error:', error);
            
            // Fallback to mock responses if API is not available
            return this.getFallbackResponse(userMessage);
        }
    }

    buildMessageArray(userMessage, chatHistory) {
        const messages = [
            {
                role: 'system',
                content: this.systemPrompt
            }
        ];

        // Add chat history
        chatHistory.forEach(entry => {
            messages.push({
                role: entry.sender === 'user' ? 'user' : 'assistant',
                content: entry.message
            });
        });

        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });

        return messages;
    }

    getFallbackResponse(userMessage) {
        // Fallback responses when LLaMA 3 API is not available
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! I'm DexiMind, your AI agent. I can help you control your computer, automate workflows, and learn from your tasks. What would you like me to help you with today?";
        }
        
        if (lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities')) {
            return "I can help you with:\n\n• **Computer Control**: Control any application or system without installation\n• **Workflow Automation**: Automate complex tasks across multiple apps\n• **Data Processing**: Handle reports, analysis, and documentation\n• **Learning**: I continuously learn from your interactions\n• **Cross-Platform**: Work on Windows, macOS, and Linux\n\nWhat specific task would you like me to help you with?";
        }
        
        if (lowerMessage.includes('automate') || lowerMessage.includes('workflow')) {
            return "I'd be happy to help you automate that workflow! To get started, could you tell me:\n\n1. What applications are involved?\n2. What's the current manual process?\n3. What's the desired outcome?\n\nOnce I understand the workflow, I can create an automation plan and execute it for you.";
        }
        
        if (lowerMessage.includes('control') || lowerMessage.includes('click') || lowerMessage.includes('type')) {
            return "I can control your computer through external hardware, which means I can:\n\n• Click buttons and links\n• Type text and commands\n• Navigate through applications\n• Fill forms and process data\n• Take screenshots and analyze content\n\nWhat specific control action would you like me to perform?";
        }
        
        if (lowerMessage.includes('learn') || lowerMessage.includes('remember')) {
            return "Yes! I continuously learn from your interactions. I can:\n\n• Remember your preferences and patterns\n• Adapt to your working style\n• Suggest improvements to workflows\n• Automate tasks I've seen you do before\n• Build knowledge about your specific processes\n\nThe more we work together, the better I become at helping you!";
        }
        
        if (lowerMessage.includes('privacy') || lowerMessage.includes('security')) {
            return "Privacy and security are my top priorities:\n\n• **Zero Installation**: I work through external hardware, so no software is installed on your computer\n• **Local Processing**: Most processing happens on the external device\n• **Encrypted Communication**: All data is encrypted in transit\n• **No Data Storage**: I don't store your personal information\n• **User Control**: You can stop me anytime with the Kill Switch\n\nYour data and privacy are completely protected.";
        }
        
        if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
            return "I'm here to help! Here are some ways I can assist you:\n\n**Getting Started:**\n• Ask me to automate any repetitive task\n• Describe a workflow you want to streamline\n• Tell me about a process you do regularly\n\n**Examples:**\n• \"Help me automate my daily report generation\"\n• \"I need to process these spreadsheets every week\"\n• \"Can you help me set up automated testing?\"\n\nWhat would you like to work on?";
        }
        
        // Default response
        return "I understand you're asking about: \"" + userMessage + "\"\n\nAs your DexiMind AI agent, I can help you with computer control, workflow automation, and learning from your tasks. Could you provide more details about what you'd like me to help you with? I'm here to make your work more efficient and automated!";
    }

    // Method to test the API connection
    async testConnection() {
        try {
            const response = await this.sendMessage("Hello, this is a test message.");
            return { success: true, response: response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Method to get available models
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.apiEndpoint}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Version': '2024-01-01'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }

    // Method to update system prompt
    updateSystemPrompt(newPrompt) {
        this.systemPrompt = newPrompt;
    }

    // Method to adjust model parameters
    updateModelParameters(params) {
        if (params.maxTokens) this.maxTokens = params.maxTokens;
        if (params.temperature) this.temperature = params.temperature;
        if (params.model) this.model = params.model;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLaMA3Integration;
} else {
    window.LLaMA3Integration = LLaMA3Integration;
}
