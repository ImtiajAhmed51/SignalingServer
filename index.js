'use strict';

const os = require('os');
const nodeStatic = require('node-static');
const http = require('http');
const socketIO = require('socket.io');
const port = process.env.PORT || 4000;

const fileServer = new nodeStatic.Server();
const app = http.createServer((req, res) => {
  fileServer.serve(req, res);
}).listen(port, () => {
  console.log(`Server listening on port ${port}`);
}).on('error', (err) => {
  console.error(`Server error: ${err}`);
});

let users = {};

const io = socketIO(app, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register', (username) => {
    users[username] = socket.id;
    console.log(`User registered: ${username}`);
    io.emit('user_list', Object.keys(users));
  });

  socket.on('call', (data) => {
    const { from, to } = data;
    if (users[to]) {
      console.log(`Call from ${from} to ${to}`);
      io.to(users[to]).emit('incoming_call', { from });
    } else {
      console.log(`User ${to} not found`);
    }
  });

  socket.on('accept_call', (data) => {
    const { from, to } = data;
    if (users[from]) {
      console.log(`Call accepted by ${to} from ${from}`);
      io.to(users[from]).emit('call_accepted', { to });
    } else {
      console.log(`User ${from} not found`);
    }
  });

  socket.on('disconnect', () => {
    for (const [username, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        console.log(`User disconnected: ${username}`);
        delete users[username];
        io.emit('user_list', Object.keys(users));
        break;
      }
    }
  });

  socket.on('error', (err) => {
    console.error(`Socket error: ${err}`);
  });
});
