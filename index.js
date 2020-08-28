const
  io = require("socket.io"),
  server = io.listen(process.env.PORT);

const clients = {};
const games = {};
let searchPlayer = [];

const play = (socket) => {
  if (searchPlayer.length < 2) {
    searchPlayer[socket.id] = socket;
  }

  if (searchPlayer.length === 2) {
    const players = searchPlayer;
    searchPlayer = [];
    const gameId = players[0].id;
    games[gameId] = players;

    for (const player of players) {
      player.gameId = gameId
      player.choice = null
      player.emit('gameOn')
    }
  }
}

// event fired every time a new client connects:
server.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`);
  // initialize this client's sequence number
  clients[socket.id] = socket;

  socket.emit('ok')

  socket.on('play', () => {
    play(socket)
  })

  socket.on('replay', () => {
    games[socket.gameId] && delete games[socket.gameId]
    play(socket)
  })

  socket.on('choice', e => {
    socket.choice = e;
    const game = games[socket.gameId]
    const waiting = game.find(player => player.choice === null);
    const [p1, p2] = game;

    if (!waiting) {
      const calcul = p2.choice - p1.choice;
      const p1Win = calcul === 2 || calcul === -1;

      p1.emit('endGame', p1Win ? 'win' : 'loose');
      p2.emit('endGame', !p1Win ? 'win' : 'loose');
    }
  })

  // when socket disconnects, remove it from the list:
  socket.on("over", () => {
    console.info(`Client gone [id=${socket.id}]`);
    delete clients[socket.id];
    socket.disconnect()
  });

  socket.on("disconnect", () => {
    console.info(`Client gone [id=${socket.id}]`);
    delete clients[socket.id];
    socket.disconnect()
  });
});

// sends each client its current sequence number
setInterval(() => {
  console.log(searchPlayer.length);
}, 1000);