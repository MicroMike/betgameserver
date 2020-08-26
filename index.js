const
  io = require("socket.io"),
  server = io.listen(process.env.PORT);

const clients = {};
const games = {};
const searchPlayer = [];

// event fired every time a new client connects:
server.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`);
  // initialize this client's sequence number
  clients[socket.id] = socket;

  if (searchPlayer < 2) {
    searchPlayer.push(socket);
  }

  if (searchPlayer.length === 2) {
    const players = searchPlayer;
    searchPlayer = [];
    const gameId = players[0].id;
    games[gameId] = players;

    for (const player of players) {
      player.emit('gameOn')
    }

  }

  socket.on('choice', e => {
    socket.choice = e;
  })

  // when socket disconnects, remove it from the list:
  socket.on("disconnect", () => {
    delete clients[socket.id];
    console.info(`Client gone [id=${socket.id}]`);
  });
});

// sends each client its current sequence number
setInterval(() => {
  console.log(Object.keys(clients).length);
}, 1000);