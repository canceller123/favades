const socket = io();
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Set initial position of current player
let playerX = canvas.width / 2;
let playerY = canvas.height / 2;

const move = { up: false, down: false, left: false, right: false };

// Resize the canvas to fit the window
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Draw a player
function drawPlayer(x, y, color) {
  context.beginPath();
  context.arc(x, y, 20, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.closePath();
}

// Redraw all players on every frame
function redraw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer(playerX, playerY, 'red');
  for (const id in players) {
    const player = players[id];
    drawPlayer(player.x, player.y, 'blue');
  }
  requestAnimationFrame(redraw);
}

// Send movement events to the server
function sendMovement() {
  if (moveUp) { playerY -= 5; }
  if (moveDown) { playerY += 5; }
  if (moveLeft) { playerX -= 5; }
  if (moveRight) { playerX += 5; }

  // Emit movement event with player position
  socket.emit('movement', { x: playerX, y: playerY });

  // Request the next frame
  requestAnimationFrame(sendMovement);
}

// 
document.addEventListener('keydown', event => {
  if (event.keyCode === 87) { moveUp = true; } // W
  if (event.keyCode === 83) { moveDown = true; } // S
  if (event.keyCode === 65) { moveLeft = true; } // A
  if (event.keyCode === 68) { moveRight = true; } // D
});

document.addEventListener('keyup', event => {
  if (event.keyCode === 87) { moveUp = false; } // W
  if (event.keyCode === 83) { moveDown = false; } // S
  if (event.keyCode === 65) { moveLeft = false; } // A
  if (event.keyCode === 68) { moveRight = false; } // D
});

// 
const players = {};

// receive movement events from the server and update other players' positions
socket.on('movement', data => {
  players[data.id] = data.position;
});

//receive initial player positions from the server
socket.on('init', data => {
  for (const player of data.players) {
    players[player.id] = player.position;
  }
});

// todo remoe disconnected player from the canvas
function removePlayer(playerId) {
  delete players[playerId];
  redraw();
}

// handle playerDisconnected event
socket.on('playerDisconnected', removePlayer);

// gameloop
redraw();
sendMovement();
