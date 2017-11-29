/* ===== GAME LOGIC ================================================================================
The following govern chattermon's base game logic.

1) TYPES object:
     holds all the types in the pokemon game and is referenced whenever a pokemon attacks. The
     attack command is always the same 'type' as the attacking pokemon's first type in its types
     array. The 'type' will do more or less dmg, or no damage at all, depending on the type of the
     opposing pokemon.
====================================================================================================
2) findRandomIV:
     a function that introduces a level of variability to an individual pokemon's stats, so that
     individual instances of a the same pokemon will not always have the same stats everytime they
     are instantiated.
====================================================================================================
3) calculateBaseHealth:
     a function that generates the inital HP or health points of the pokemon
====================================================================================================
4) calculateBaseStat:
     a function that is used to generate the pokemon's attack and defense, used in damage
     calculation
====================================================================================================
5) criticalChance:
     a function that will amplify the damage of any given attack with a 6.25% chance. Again, this
     adds an element of luck to the game and introduces a bit more complexity.
====================================================================================================
6) modifierCalculation:
     a function that will produce a number based on the aforementioned functions and types object.
     This function returns an object with two properties
      - a log statement, which is later shown to the user depending whether the attack does more or
        less damage as
        determined by the attacking and opposing pokemons types and
      - the modifier number, which amplifies or dampens the amount the attack actually does, again,
        depending on the attacking and opposing pokemons types.
====================================================================================================
7) damageCalculation:
    a function that generates the damage to be done based on the algorithm used in the pokemon
    games.
    The number produced by this algorithm is multiplied by the modifier number to produce the actual
    damage to be to the opposing pokemon as seen by the user.
================================================================================================= */

const TYPES = {
  normal: {
    SUPER_EFFECT: [],
    NOT_VERY_EFFECTIVE: ['steel', 'rock'],
    NOT_EFFECTIVE: ['ghost'],
  },
  fighting: {
    SUPER_EFFECT: ['normal', 'rock', 'steel', 'ice', 'dark'],
    NOT_VERY_EFFECTIVE: ['flying', 'poison', 'bug', 'psychic', 'fairy'],
    NOT_EFFECTIVE: ['ghost'],
  },
  flying: {
    SUPER_EFFECT: ['fighting', 'bug', 'grass'],
    NOT_VERY_EFFECTIVE: ['rock', 'steel', 'electric'],
    NOT_EFFECTIVE: [],
  },
  poison: {
    SUPER_EFFECT: ['grass'],
    NOT_VERY_EFFECTIVE: ['poison', 'ground', 'rock', 'ghost'],
    NOT_EFFECTIVE: ['steel'],
  },
  ground: {
    SUPER_EFFECT: ['poison', 'rock', 'steel', 'fire'],
    NOT_VERY_EFFECTIVE: ['bug', 'grass'],
    NOT_EFFECTIVE: ['flying'],
  },
  rock: {
    SUPER_EFFECT: ['flying', 'bug', 'fire'],
    NOT_VERY_EFFECTIVE: ['fighting', 'ground', 'steel'],
    NOT_EFFECTIVE: ['fighting', 'ground'],
  },
  bug: {
    SUPER_EFFECT: ['grass', 'psychic', 'dark'],
    NOT_VERY_EFFECTIVE: ['fighting', 'flying', 'poison', 'ghost', 'steel', 'fire', 'fairy'],
    NOT_EFFECTIVE: [],
  },
  ghost: {
    SUPER_EFFECT: ['ghost', 'psychic'],
    NOT_VERY_EFFECTIVE: ['dark'],
    NOT_EFFECTIVE: ['normal'],
  },
  steel: {
    SUPER_EFFECT: ['rock', 'ice', 'fairy'],
    NOT_VERY_EFFECTIVE: ['steel', 'fire', 'water', 'electric'],
    NOT_EFFECTIVE: [],
  },
  fire: {
    SUPER_EFFECT: ['bug', 'steel', 'grass', 'ice'],
    NOT_VERY_EFFECTIVE: ['rock', 'fire', 'water', 'dragon'],
    NOT_EFFECTIVE: [],
  },
  water: {
    SUPER_EFFECT: ['ground', 'rock', 'fire'],
    NOT_VERY_EFFECTIVE: ['water', 'grass', 'dragon'],
    NOT_EFFECTIVE: [],
  },
  grass: {
    SUPER_EFFECT: ['ground', 'rock', 'water'],
    NOT_VERY_EFFECTIVE: ['flying', 'poison', 'bug', 'steel', 'fire', 'dragon'],
    NOT_EFFECTIVE: [],
  },
  electric: {
    SUPER_EFFECT: ['flying', 'water'],
    NOT_VERY_EFFECTIVE: ['grass', 'electric', 'dragon'],
    NOT_EFFECTIVE: ['ground'],
  },
  psychic: {
    SUPER_EFFECT: ['fighting', 'poison'],
    NOT_VERY_EFFECTIVE: ['steel', 'psychic'],
    NOT_EFFECTIVE: ['dark'],
  },
  ice: {
    SUPER_EFFECT: ['flying', 'ground', 'grass', 'dragon'],
    NOT_VERY_EFFECTIVE: ['steel', 'fire', 'water', 'ice'],
    NOT_EFFECTIVE: [],
  },
  dragon: {
    SUPER_EFFECT: ['steel'],
    NOT_VERY_EFFECTIVE: ['steel'],
    NOT_EFFECTIVE: ['fairy'],
  },
  dark: {
    SUPER_EFFECT: ['ghost', 'psychic'],
    NOT_VERY_EFFECTIVE: ['fighting', 'dark', 'fairy'],
    NOT_EFFECTIVE: [],
  },
  fairy: {
    SUPER_EFFECT: ['fighting'],
    NOT_VERY_EFFECTIVE: ['poison', 'steel', 'fire'],
    NOT_EFFECTIVE: [],
  },
};

const POKEMON_LEVEL = 80;

// Used to generate stats for pokemon

const findRandomIV = () => (
  // adds an element of randomness so that stats for the same pokemon species are not
  // always the same
  Math.floor(Math.random() * 16)
);

const calculateBaseHealth = baseHP => (
  // reference https://bulbapedia.bulbagarden.net/wiki/Individual_values
  Math.round((((baseHP * 2) + findRandomIV()) * POKEMON_LEVEL * 0.01) + POKEMON_LEVEL + 10)
);

const calculateBaseStat = baseStat => (
  // reference https://bulbapedia.bulbagarden.net/wiki/Individual_values
  Math.round((((baseStat * 2) + findRandomIV()) * POKEMON_LEVEL * 0.01) + 5)
);

// Modifiers EXPLAINED: https://bulbapedia.bulbagarden.net/wiki/Damage
// STAB - same-type attack bonus, equal to 1.5 if user's type and move type match.
// Type - either 0, 0.25, 0.5, 1, 2 or 4 depending on opposing pokemon's type.
// Burn - either 0.5 or 1 depending on if the pokemon is burned.
// Critical - 6.25% chance to do 1.5x damage.
// Weather - different move types do more damage depending on weather state
const criticalChance = () => {
  const chance = Math.random() * 100;
  return chance <= 6.25 ? 1.5 : 1;
};

const modifierCalculation = (attackerTypes, moveType, opponentTypes) => {
  // pokemon can have at most two types
  let STAB = 1;
  let Type = 1;
  // let Burn = 1;  extra complexity we can add after MVP
  // let Weather = 1; extra EXTRA complexity, possibly after MVP
  const Critical = criticalChance();
  let logStatement = '';

  if (Critical > 1) {
    logStatement += 'A critical hit! ';
  }

  if (attackerTypes.indexOf(moveType) !== -1) {
    STAB = 1.5;
  }

  for (let i = 0; i < opponentTypes.length; i += 1) {
    if (TYPES[moveType].SUPER_EFFECT.indexOf(opponentTypes[i]) !== -1) {
      Type = 2;
      logStatement += 'It\'s super effective!';
      break;
    }

    if (TYPES[moveType].NOT_VERY_EFFECTIVE.indexOf(opponentTypes[i]) !== -1) {
      Type = 0.5;
      logStatement += 'It\'s not very effective...';
      break;
    }

    if (TYPES[moveType].NOT_EFFECTIVE.indexOf(opponentTypes[i]) !== -1) {
      Type = 0;
      logStatement += 'It had no effect.';
      break;
    }
  }

  return {
    modifierDamage: STAB * Type * Critical,
    logStatement,
  };
};

// reference: https://bulbapedia.bulbagarden.net/wiki/Damage
const damageCalculation = (activePlayer, opponent) => {
  const attackerTypes = activePlayer.pokemon[0].types;
  const moveType = attackerTypes[0];
  const opponentTypes = opponent.pokemon[0].types;
  const modifier = modifierCalculation(attackerTypes, moveType, opponentTypes);
  const userAttackStat = activePlayer.pokemon[0].attack;
  const opponentDefenseStat = opponent.pokemon[0].defense;
  return {
    damageToBeDone: Math.round((((12 * 60 * (userAttackStat / opponentDefenseStat)) / 50) + 2) *
                    modifier.modifierDamage),
    logStatement: modifier.logStatement,
  };
};

module.exports = {
  calculateBaseHealth,
  calculateBaseStat,
  damageCalculation,
};
