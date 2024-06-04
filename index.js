'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');
const port = process.env.PORT || 4000;

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(port);

let users = {};

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {

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

