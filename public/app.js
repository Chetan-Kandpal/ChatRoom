const page = window.location.pathname;
const token = localStorage.getItem('jwt_token');

function logout() {
    localStorage.removeItem('jwt_token');
    location.href = '/login.html';
}

// LOGIN PAGE
if (page.includes('login.html')) {

    if (token) {
        location.href = '/chat.html';
    }

    document
        .getElementById('loginForm')
        ?.addEventListener('submit', async e => {

            e.preventDefault();

            const username =
                document.getElementById('username').value;

            const password =
                document.getElementById('password').value;

            const response = await fetch(
                '/api/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                        'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                localStorage.setItem(
                    'jwt_token',
                    data.token
                );

                location.href =
                    '/chat.html';

            } else {

                alert(data.error);
            }
        });
}

// REGISTER PAGE
if (page.includes('register.html')) {

    document
        .getElementById('registerForm')
        ?.addEventListener('submit', async e => {

            e.preventDefault();

            const username =
                document.getElementById('username').value;

            const password =
                document.getElementById('password').value;

            const response = await fetch(
                '/api/register',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                        'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                alert(
                    'Registration successful'
                );

                location.href =
                    '/login.html';

            } else {

                alert(data.error);
            }
        });
}

// CHAT PAGE
if (page.includes('chat.html')) {

    if (!token) {
        location.href = '/login.html';
    }

    const protocol =
        location.protocol === 'https:'
            ? 'wss'
            : 'ws';

    const ws = new WebSocket(
        `${protocol}://${location.host}?token=${token}`
    );

    const chatBox =
        document.getElementById('chatBox');

    ws.onopen = () => {

        const div =
            document.createElement('div');

        div.className =
            'system-message';

        div.innerText =
            'Connected to chat';

        chatBox.appendChild(div);
    };

    ws.onmessage = event => {

        const data =
            JSON.parse(event.data);

        const msg =
            document.createElement('div');

        msg.className = 'message';

        msg.innerHTML =
            `<b>${data.sender}:</b> ${data.text}`;

        chatBox.appendChild(msg);

        chatBox.scrollTop =
            chatBox.scrollHeight;
    };

    ws.onerror = () => {
        console.error(
            'WebSocket Error'
        );
    };

    ws.onclose = event => {

        console.log(
            'Closed:',
            event.code,
            event.reason
        );

        if (event.code === 4001) {

            alert(
                'Session expired'
            );

            logout();
        }
    };

    document
        .getElementById('logoutButton')
        .addEventListener(
            'click',
            logout
        );

    document
        .getElementById('chatForm')
        .addEventListener(
            'submit',
            e => {

                e.preventDefault();

                const input =
                    document.getElementById(
                        'messageInput'
                    );

                if (
                    ws.readyState ===
                    WebSocket.OPEN
                ) {

                    ws.send(input.value);

                    input.value = '';
                }
            }
        );
}