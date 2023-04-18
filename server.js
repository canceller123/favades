const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = 3000;

// Serve static files
app.use(express.static(__dirname + '/public'));

// Handle socket.io connections
io.on('connection', socket => {
  console.log('A player has joined');

  // Listen for movement events
  socket.on('movement', data => {
    // Broadcast movement to all other players
    socket.broadcast.emit('movement', data);
  });

  // Listen for disconnect events
  socket.on('disconnect', () => {
    console.log('A player has disconnected');
  });
});

// Start the server
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
