import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import Game from './Game';
import Login from './Login';
import Signup from './Signup';
import Welcome from './Welcome';
// import io from 'socket.io-client';

// const loggedIn = false;

function App() {
  return (
    <div>
      <Switch>
        <Route exact path="/" component={Login} />
        <Route path="/home" component={Home} />
        <Route path="/game/:gameid" component={Game} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/welcome" component={Welcome} />
      </Switch>
    </div>
  );
}

export default App;
