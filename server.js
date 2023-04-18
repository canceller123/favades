const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 40200;

// mapp instead of an object for storing players
const players = new Map();

app.use(express.static(__dirname + '/client'));

io.on('connection', socket => {
  console.log('A player has joined');

  let lastPosition = null;
  let currentPosition = { x: 250, y: 250 };

  socket.on('movement', data => {
    lastPosition = currentPosition;
    currentPosition = data;

    //snd movement only to the players in the same room
    socket.to('game').emit('movement', { id: socket.id, position: currentPosition });
  });

  socket.on('disconnect', () => {
    console.log('A player has disconnected');
    players.delete(socket.id);
    socket.to('game').emit('playerDisconnected', socket.id);
  });

  // join the player to the game room
  socket.join('game');

  //add the player to the players Map
  players.set(socket.id, currentPosition);

  // Emit a 'playerConnected' event to all other players in the same room
  socket.to('game').emit('playerConnected', { id: socket.id, position: currentPosition });

  //send the list of players to the new player
  socket.emit('init', { players: Array.from(players.entries()).map(([id, position]) => ({ id, position })) });

  // Interpolate player positions at a more accurate interval
  let lastTimestamp = Date.now();
  setInterval(() => {
    const currentTimestamp = Date.now();
    const timeDelta = currentTimestamp - lastTimestamp;
    lastTimestamp = currentTimestamp;

    if (lastPosition !== null) {
      const delta = { x: currentPosition.x - lastPosition.x, y: currentPosition.y - lastPosition.y };
      currentPosition = { x: currentPosition.x + delta.x * (timeDelta / 1000), y: currentPosition.y + delta.y * (timeDelta / 1000) };

      socket.to('game').emit('movement', { id: socket.id, position: currentPosition });
    }
  }, 1000 / 60);
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
