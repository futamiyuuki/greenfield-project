const Sequelize = require('sequelize');

const rgx = new RegExp(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const match = process.env.DATABASE_URL ? process.env.DATABASE_URL.match(rgx) : 'postgres://wairrcwaikkuob:b6f7a04b36dc888549bcedd0c99f7cec9c18eb3e83bda91f24bd31fbe60eba50@ec2-50-16-199-246.compute-1.amazonaws.com:5432/d10sjl0jdmpqhu'.match(rgx);

const sequelize = new Sequelize(match[5], match[1], match[2], {
  dialect: 'postgres',
  protocol: 'postgres',
  port: match[4],
  host: match[3],
  logging: false,
  dialectOptions: { ssl: true },
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

const Users = sequelize.define('userito', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  email: Sequelize.STRING,
}, {
  timestamps: false,
});

const Pokemon = sequelize.define('pokerito', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    unique: true,
  },
  name: Sequelize.STRING,
  types: Sequelize.ARRAY(Sequelize.TEXT),
  baseHealth: Sequelize.INTEGER,
  baseAttack: Sequelize.INTEGER,
  baseDefense: Sequelize.INTEGER,
  // baseSpecialAttack: Sequelize.INTEGER,
  // baseSpecialDefense: Sequelize.INTEGER,
  // baseSpeed: Sequelize.INTEGER,
  backSprite: Sequelize.STRING,
  frontSprite: Sequelize.STRING,
}, {
  timestamps: false,
});


Users.sync();
Pokemon.sync();

const saveUser = (username, password, email) => (
  Users
    .findOne({ where: { username } })
    .then((userFound) => {
      if (userFound) {
        return 'Username Already Exists';
      }
      return Users.findOne({ where: { email } });
    })
    .then((userFoundOrUsernameExists) => {
      if (userFoundOrUsernameExists) {
        return userFoundOrUsernameExists === 'Username Already Exists' ?
          'Username Already Exists' :
          'Email Already Exists';
      }
      return Users.create({ username, password, email });
    })
);

const savePokemon = (pokemonObj) => {
  console.log('IN SAVE POKEMON!');
  Pokemon.create(pokemonObj).then((data) => {
    console.log('DATA: ', data);
    console.log('POKEMON SAVED TO DB!');
  }).catch((err) => {
    console.error('POKEMON SAVED ERROR: ', err);
  });
};

module.exports = {
  connecttion: sequelize,
  saveUser,
  Users,
  Pokemon,
};
