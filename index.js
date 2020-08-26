const
  io = require("socket.io"),
  server = io.listen(process.env.PORT);

const clients = {};
const games = {};
let searchPlayer = [];

const play = (socket) => {
  if (searchPlayer.length < 2) {
    searchPlayer.push(socket);
  }

  if (searchPlayer.length === 2) {
    console.log('gameOn')
    const players = searchPlayer;
    searchPlayer = [];
    const gameId = players[0].id;
    games[gameId] = players;

    for (const player of players) {
      player.gameId = gameId
      player.emit('gameOn')
    }
  }
}

// event fired every time a new client connects:
server.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`);
  // initialize this client's sequence number
  clients[socket.id] = socket;

  play(socket)

  socket.on('replay', () => {
    socket.choice = null
    games[socket.gameId] && delete games[socket.gameId]
    play(socket)
  })

  socket.on('choice', e => {
    socket.choice = e;
    const game = games[socket.gameId]
    const waiting = game.find(player => !player.choice);
    const [p1, p2] = game;

    if (!waiting) {
      const p1Win = p1.choice > p2.choice && !(p1.choice === 3 && p2.choice === 1);

      p1.emit('endGame', p1Win ? 'win' : 'loose');
      p2.emit('endGame', !p1Win ? 'win' : 'loose');

      console.log('both played')
    }
  })

  // when socket disconnects, remove it from the list:
  socket.on("disconnect", () => {
    delete clients[socket.id];
    console.info(`Client gone [id=${socket.id}]`);
  });
});

// sends each client its current sequence number
setInterval(() => {
  // console.log(Object.keys(clients).length);
}, 1000);