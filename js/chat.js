document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    let messageIndex = 0;

    // Define chat flow
    const chatFlow = [
    {
        type: 'user',
        text: 'Hey, do you think I can complete these 3 assignments by <span class="status-highlight">2359</span>? It\'s 2300 already!',
        buttons: null
    },
    {
        type: 'ai',
        text: 'of course you can! Do you need me to:<ol><li>Do programming for you?</li><li>Do Communication in global workplace for you?</li><li>Do Innovative Thinking for you?</li><li>Do everything?</li></ol>Just tell me the number and I will do it for you!',
        buttons: ['1', '2', '3', '4']
    },
    {
        type: 'ai',
        text: 'This might take a while... <br><br><a href="lateSubmission.html">Here you go!</a>',
        buttons: null
    }
    ];

    function createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        messageDiv.style.transition = 'opacity 0.5s ease-in, transform 0.5s ease-in';

        if (message.type === 'user') {
            messageDiv.innerHTML = `
                <div>
                    <div class="speaker">You</div>
                    <div class="bubble">${message.text}</div>
                </div>
                <div class="avatar" aria-hidden></div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="avatar" aria-hidden></div>
                <div>
                    <div class="speaker">AI</div>
                    <div class="bubble">${message.text}</div>
                </div>
            `;
        }

        return messageDiv;
    }

    function showMessage(index) {
    if (index >= chatFlow.length) return;

    const message = chatFlow[index];
    const messageElement = createMessageElement(message);

    chatContainer.appendChild(messageElement);

    // Trigger animation
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
        }, 10);

        // If AI message with buttons, show them after animation
        if (message.type === 'ai' && message.buttons) {
            setTimeout(() => {
                showButtons(message.buttons, index);
            }, 600);
        }

        // If this is the FIRST user message, auto-show the AI reply after a delay
        if (index === 0) {
            setTimeout(() => {
                showMessage(1);   // show AI message with buttons
            }, 900);
        }
    }

    function showButtons(options, currentIndex) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'button-group';
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.style.justifyContent = 'center';
        buttonsDiv.style.marginTop = '12px';
        buttonsDiv.style.flexWrap = 'wrap';

        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'chat-button';
            button.style.padding = '8px 16px';
            button.style.borderRadius = '20px';
            button.style.border = 'none';
            button.style.background = '#3b82f6';
            button.style.color = '#f1f5f9';
            button.style.cursor = 'pointer';
            button.style.fontSize = '14px';
            button.style.transition = 'background 0.2s ease';

            button.addEventListener('mouseover', () => {
                button.style.background = '#2563eb';
            });

            button.addEventListener('mouseout', () => {
                button.style.background = '#3b82f6';
            });

            button.addEventListener('click', () => {
                // Hide buttons
                buttonsDiv.style.display = 'none';

                // Show user response
                const userMessage = {
                    type: 'user',
                    text: option,
                    buttons: null
                };
                const userElement = createMessageElement(userMessage);
                chatContainer.appendChild(userElement);

                // Trigger animation
                setTimeout(() => {
                    userElement.style.opacity = '1';
                    userElement.style.transform = 'translateY(0)';
                }, 10);

                // Show next AI response
                setTimeout(() => {
                    showMessage(currentIndex + 1);
                }, 900);
            });

            buttonsDiv.appendChild(button);
        });

        chatContainer.appendChild(buttonsDiv);
    }

    // Start chat
    showMessage(0);
});
