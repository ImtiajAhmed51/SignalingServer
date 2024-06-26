var http = require("http");
var socketIO = require("socket.io");
const port = process.env.PORT || 4000;
var app = http
  .createServer(function (req, res) {
    // You can add logging or handle HTTP requests here if needed
  })
  .listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

var io = socketIO.listen(app);
io.sockets.on("connection", function (socket) {
  console.log("A new client connected");

  // convenience function to log server messages on the client
  function log() {
    var array = ["Message from server:"];
    array.push.apply(array, arguments);
    socket.emit("log", array);
  }

  socket.on("message", function (message) {
    console.log("Received message from client:", message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit("message", message);
  });

  socket.on("create or join", function (room) {
    console.log("Received request to create or join room " + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom
      ? Object.keys(clientsInRoom.sockets).length
      : 0;
    console.log("Room " + room + " now has " + numClients + " client(s)");

    if (numClients === 0) {
      socket.join(room);
      console.log("Client ID " + socket.id + " created room " + room);
      socket.emit("created", room, socket.id);
    } else if (numClients === 1) {
      console.log("Client ID " + socket.id + " joined room " + room);
      io.sockets.in(room).emit("join", room);
      socket.join(room);
      socket.emit("joined", room, socket.id);
      io.sockets.in(room).emit("ready");
    } else {
      // max two clients
      socket.emit("full", room);
    }
  });

  socket.on("ipaddr", function () {
    var ifaces = require("os").networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function (details) {
        if (
          details.family === "IPv4" &&
          details.address !== "127.0.0.1" &&
          details.address !== "10.173.1.175"
        ) {
          socket.emit("ipaddr", details.address);
        }
      });
    }
  });

  socket.on("bye", function () {
    console.log("received bye");
  });

  // Handle disconnection event
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});
