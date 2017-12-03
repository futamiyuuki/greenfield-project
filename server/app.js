const express = require('express');
const path = require('path');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const db = require('../database/db.js');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const { createPlayer } = require('./helpers/creators.js');
const { resolveTurn } = require('./helpers/combat');

const saltRounds = 10;
const dist = path.join(__dirname, '/../client/dist');

/* ======================== MIDDLEWARE ======================== */

app.use(bodyParser());
app.use(express.static(dist));

app.use(cookieParser());
app.use(session({
  secret: 'odajs2iqw9asjxzascatsas22',
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true },
}));
app.use(passport.initialize());
app.use(passport.session());

// ** Webpack middleware **
// Note: Make sure while developing that bundle.js is NOT built - delete if it is in dist directory

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const config = require('../webpack.config.js');
  const compiler = webpack(config);

  app.use(webpackHotMiddleware(compiler));
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPathdist,
  }));
}

/* =============================================================== */


/* ======================== GAME STATE =========================== */

/* The state of all games currently happening are saved in the
'games' object.

The sample shape of a game is:

  {
    player1: object,
    player2: object,
    p1Move: string,
    p2Move: string,
    p1MoveIdx: number,
    p2MoveIdx: number,
  }

Refer to './helpers/creators.js' for more detail
on what is inside each player object

*/

const games = new Map();
// const playerselection = new Map();
/* =============================================================== */

/* =============== SOCKET CONNECTION / LOGIC ===================== */

io.on('connection', (socket) => {
  /* socket.on('join game')

  The first check is to see if there is a game in the games object with this id, and if there is
  not, it initializes a new one with this new player. This means creating a new socket 'room' via
  socket.join() using the game's URL name. Once the player is created, update the game state and
  emit to player one ONLY that he / she is player1 by emitting directly to that socket id.

  If the game already exists but there is no player 2, it creates that player and first emits to
  that client directly that it is player2 as well as to the newly created room that the game is
  now ready, and it sends down the game's state to both clients to parse out and render.

  */
  // socket.on('enter loading room', (data) => { })
  socket.on('join game', (data) => {
    socket.join(data.gameid);
    const game = games.get(data.gameid);
    if (!game) {
      createPlayer(data, 'player1')
        .then((player1) => {
          games.set(data.gameid, {
            player1,
            player2: null,
            // playerTurn: 'player1',
            moveChosenCount: 0,
            p1Move: '',
            p2Move: '',
          });
          io.to(socket.id).emit('player', player1);
        });
    } else if (!game.player2) {
      createPlayer(data, 'player2')
        .then((player2) => {
          game.player2 = player2;
          io.to(socket.id).emit('player', player2);
          // io.to(data.gameid).emit('ready', game);
        });
    } else {
      io.to(socket.id).emit('gamefull', 'this game is full!');
    }
  });

  socket.on('selectPokemon', (data) => {
    const game = games.get(data.gameid);
    if (data.player) {
      game.player1.pokemon = data.pokemon;
      game.player1.ready = true;
    } else {
      game.player2.pokemon = data.pokemon;
      game.player2.ready = true;
    }
    games.set(data.gameid, game);
    if (game.player1 && game.player1.ready && game.player2 && game.player2.ready) {
      io.to(data.gameid).emit('ready', game);
    }
  });

  // socket.on('confirmteam', (data){})

  socket.on('chat message', (data) => {
    io.to(data.gameid).emit('chat message', data);
  });

  /* socket.on('attack') / socket.on('switch')

  These two functions both involve updating the game's state in some way and re-sending it back
  down to the client once it has been fully processed. Different events are emitted back to the
  client based on the state of the game, and can be extended to add more complexity into the game.

  */

  socket.on('attack', (data) => {
    const game = games.get(data.gameid);
    // IMPL: if game doesn't exist, error

    if (data.name === game.player1.name) {
      game.p1Move = 'attack';
      game.p1MoveIdx = data.moveIdx;
    } else {
      game.p2Move = 'attack';
      game.p2MoveIdx = data.moveIdx;
    }

    if (game.p1Move && game.p2Move) {
      resolveTurn(game, game.p1Move, game.p1MoveIdx, game.p2Move, game.p2MoveIdx, io, data.gameid);
      game.p1Move = '';
      game.p2Move = '';
    } else if (game.p1Move) {
      io.to(data.gameid).emit('waiting', { player: game.player1.player });
    } else if (game.p2Move) {
      io.to(data.gameid).emit('waiting', { player: game.player2.player });
    } else {
      console.error('Resolving turn with no moves selected');
    }
  });

  socket.on('switch', (data) => {
    const game = games.get(data.gameid);

    const isPlayer1 = data.name === game.player1.name;

    if (data.free) {
      // const player = isPlayer1 ? game.player1 : game.player2;
      if (isPlayer1) {
        game.p1Move = 'switch';
        game.p1MoveIdx = data.index;
      } else {
        game.p2Move = 'switch';
        game.p2MoveIdx = data.index;
      }
      resolveTurn(game, game.p1Move, game.p1MoveIdx, game.p2Move, game.p2MoveIdx, io, data.gameid);
      game.p1Move = '';
      game.p2Move = '';
      return;
    }

    if (data.name === game.player1.name) {
      game.p1Move = 'switch';
      game.p1MoveIdx = data.index;
    } else {
      game.p2Move = 'switch';
      game.p2MoveIdx = data.index;
    }

    if (game.p1Move && game.p2Move) {
      resolveTurn(game, game.p1Move, game.p1MoveIdx, game.p2Move, game.p2MoveIdx, io, data.gameid);
      game.p1Move = '';
      game.p2Move = '';
    } else if (game.p1Move) {
      io.to(data.gameid).emit('waiting', { player: game.player1.player });
    } else if (game.p2Move) {
      io.to(data.gameid).emit('waiting', { player: game.player2.player });
    } else {
      console.error('Resolving turn with no moves selected');
    }
  });
});

/* =============================================================== */


/* =============== AUTHENTICATION ROUTES / LOGIC ================= */


app.post('/login', async (req, resp) => {
  const { username, password } = req.body;
  const user = await db.Users.findOne({ where: { username } });
  if (!user) {
    resp.writeHead(201, { 'Content-Type': 'text/plain' });
    return resp.end('Username Not Found');
  }
  const hash = user.dataValues.password;
  const passwordsMatch = await bcrypt.compare(password, hash);
  if (passwordsMatch) {
    req.session.username = username;
    req.session.loggedIn = true;
    return resp.redirect('/welcome');
  }
  resp.writeHead(201, { 'Content-Type': 'text/plain' });
  return resp.end('Passwords Do Not Match');
});

app.post('/signup', (req, resp) => {
  const { username, password, email } = req.body;
  bcrypt.hash(password, saltRounds)
    .then(hash => db.saveUser(username, hash, email))
    .then((newuser) => {
      if (newuser.dataValues) {
        req.login({ user_id: newuser.id }, (err) => {
          if (err) throw err;
          req.session.username = username;
          req.session.loggedIn = true;
          const currSession = JSON.stringify(req.session);
          resp.writeHead(201, { 'Content-Type': 'app/json' });
          resp.end(currSession);
        });
      } else if (newuser.match('Username Already Exists')) {
        resp.writeHead(201, { 'Content-Type': 'text/plain' });
        resp.end('Username Already Exists');
      } else if (newuser.match('Email Already Exists')) {
        resp.writeHead(201, { 'Content-Type': 'text/plain' });
        resp.end('Email Already Exists');
      }
    })
    .catch((err) => {
      throw new Error(err);
    });
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get('/user', (req, resp) => {
  resp.end(JSON.stringify({
    username: req.session.username,
    loggedIn: req.session.loggedIn,
  }));
});

app.get('/logout', (req, resp) => {
  req.session.destroy((err) => {
    if (err) throw err;
    resp.redirect('/login');
  });
});

/* =============================================================== */


// a catch-all route for BrowserRouter - enables direct linking to this point.

app.get('/*', (req, resp) => {
  resp.sendFile(`${dist}/index.html`);
});


const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`listening on *: + ${port}`);
});

module.exports = app;
