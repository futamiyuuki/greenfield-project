const db = require('../../database/db.js');

/*

====== Game Creation Helpers ========

These functions help shape the data that ultimately build up the state of each
game. They return correctly parsed data that the client will eventually be expecting,
which will be emitted from the socket connection within server/app.js

*/

const createPokemon = (pokemon) => {
  const {
    name, baseHealth, baseAttack, baseDefense, frontSprite, backSprite, types,
  } = pokemon;
  return {
    name,
    health: baseHealth,
    initialHealth: baseHealth,
    attack: baseAttack,
    defense: baseDefense,
    sprites: { front_default: frontSprite, back_default: backSprite },
    types,
  };
};

const createPlayer = (player, number) => {
  const random = () => Math.ceil(Math.random() * 150);
  return new Promise((resolve, reject) => {
    const pokemonCalls = [];
    for (let i = 0; i < 3; i += 1) {
      pokemonCalls.push(db.Pokemon.findOne({ where: { id: random() } }));
    }
    Promise.all(pokemonCalls)
      .then((results) => {
        const pokemon = [];
        results.forEach(result => pokemon.push(createPokemon(result)));
        resolve({
          player: number,
          name: player.name,
          pokemon,
        });
      })
      .catch(err => reject(err));
  });
};

const createTurnlog = (game, turn, type) => {
  const player = game.playerTurn;
  const opponent = game.playerTurn === 'player1' ? 'player2' : 'player1';
  if (type === 'attack') {
    const turnlog = [{ command: `${game[player].pokemon[0].name} attacked!` }];
    if (turn.logStatement !== '') {
      turnlog.push({ command: turn.logStatement });
    }
    turnlog.push({ command: `${game[opponent].pokemon[0].name} lost ${turn.damageToBeDone} HP` });
    if (game[opponent].pokemon[0].health <= 0) {
      turnlog.push({ command: `${game[opponent].pokemon[0].name} has fainted!` });
    }
    return turnlog;
  } else if (type === 'switch') {
    const turnlog = [{ command: `${game[player].pokemon[0].name} appears!` }];
    return turnlog;
  }
  return [];
};

module.exports = {
  createPokemon,
  createPlayer,
  createTurnlog,
};
