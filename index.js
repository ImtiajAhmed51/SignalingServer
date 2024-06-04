const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {};

io.on('connection', (socket) => {
    socket.on('register', (username) => {
        users[username] = socket.id;
        io.emit('user_list', Object.keys(users));
    });

    socket.on('call', (data) => {
        const { from, to } = data;
        if (users[to]) {
            io.to(users[to]).emit('incoming_call', { from });
        }
    });

    socket.on('accept_call', (data) => {
        const { from, to } = data;
        if (users[from]) {
            io.to(users[from]).emit('call_accepted', { to });
        }
    });

    socket.on('disconnect', () => {
        for (const [username, socketId] of Object.entries(users)) {
            if (socketId === socket.id) {
                delete users[username];
                io.emit('user_list', Object.keys(users));
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
