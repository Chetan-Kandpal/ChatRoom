const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-secret-development-key';

const users = [];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: 'Username and password required'
        });
    }

    const existingUser = users.find(
        u => u.username === username
    );

    if (existingUser) {
        return res.status(409).json({
            error: 'Username already exists'
        });
    }

    const hashedPassword =
        await bcrypt.hash(password, 10);

    users.push({
        username,
        password: hashedPassword
    });

    res.status(201).json({
        message: 'Registration successful'
    });
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(
        u => u.username === username
    );

    if (!user) {
        return res.status(401).json({
            error: 'Invalid credentials'
        });
    }

    const validPassword =
        await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return res.status(401).json({
            error: 'Invalid credentials'
        });
    }

    const token = jwt.sign(
        { username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token });
});

// WebSocket Authentication
wss.on('connection', (ws, req) => {

    const params = url.parse(req.url, true);
    const token = params.query.token;

    if (!token) {
        ws.close(4001, 'No token provided');
        return;
    }

    try {

        const decoded =
            jwt.verify(token, JWT_SECRET);

        ws.username = decoded.username;

        console.log(
            `${ws.username} connected`
        );

        ws.on('message', (message) => {

            const payload = JSON.stringify({
                sender: ws.username,
                text: message.toString(),
                timestamp: new Date().toISOString()
            });

            wss.clients.forEach(client => {

                if (
                    client.readyState === WebSocket.OPEN &&
                    client.username
                ) {
                    client.send(payload);
                }
            });
        });

        ws.on('close', () => {
            console.log(
                `${ws.username} disconnected`
            );
        });

    } catch (error) {
        ws.close(4001, 'Invalid token');
    }
});

server.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});