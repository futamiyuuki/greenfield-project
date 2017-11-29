import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import validator from '../../../server/helpers/validator.js';
import css from '../styles.css';
import axios from 'axios';

export default class Signup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      repeatPassword: '',
      email: '',
      matchingPasswordError: false,
      usernameUniqueError: false,
      emailUniqueError: false
    };

    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePasswordMatch = this.handlePasswordMatch.bind(this);
  }

  componentWillMount() {
    axios('/user')
    .then(({ data }) => {
      if (data.username) {
        const username = data.username;
        this.setState({
          name: username
        });
        this.props.history.replace("/welcome");
      }
    });
  }

  handleUsernameChange(e) {
    console.log('Username changed to', e.target.value);

    this.setState({
      username: e.target.value
    });
  }

  handlePasswordChange(e) {
    console.log('Password changed to', e.target.value);

    this.setState({
      password: e.target.value
    });
  }

  handleEmailChange(e) {
    console.log('Email changed to', e.target.value);

    this.setState({
      email: e.target.value
    });
  }

  handlePasswordMatch(e) {
    const { password } = this.state;
    const repeat = e.target.value;

    this.setState({
      repeatPassword: repeat,
      matchingPasswordError: password === repeat
        ? false
        : true
    });
  }

  handleSubmit() {
    console.log('click\'d');
    const username = this.state.username;
    const password = this.state.password;
    const email = this.state.email;

    if (!username.match(validator.username)) {
      alert('Username should only conatain latin letters and/or numbers, and be from 3 to 20 characters long');
      return;
    }
    else if (!password.match(validator.password)) {
      alert('Password needs to be at 8-20 characters long and have one number');
      return;
    }
    else if (!email.match(validator.email)) {
      alert('Incorrect email format');
      return;
    }

    axios({
        method: 'post',
        url: '/signup',
        baseUrl: process.env.baseURL || 'http://localhost:3000',
        data: { username, password, email }
      })
      .then(resp => {
        console.log(resp.data)
        if (typeof resp.data === 'string' && resp.data.match('Email Already Exists')) {
          alert('This email already exists, try again!');
        }
        else if (typeof resp.data === 'string' && resp.data.match('Username Already Exists')) {
          alert('This username already exists, try again!');
        }
        else {
          this.props.history.replace("/welcome");
        }
      })
      .catch(err => {
        console.log(err);
      });
  }


  render() {
    let usernameField = null;
    let emailField = null;
    let passwordError = this.state.matchingPasswordError
    ? <div className={css.fieldErrorWrapper}>
        <div className={css.fieldErrorText}>Passwords are not the same</div>
      </div>
    : null;

    if (this.state.usernameUniqueError) {
      usernameField = <div className={css.fieldErrorWrapper}>
        <div className={css.fieldErrorText}>Username already exists</div>
        <input type="text" className={css.fieldErrorInput} placeholder="Username" value={this.state.username} onChange={this.handleUsernameChange}></input>
      </div>
    } else {
      usernameField = <input type="text" className={css.signInUpField} placeholder="Username" value={this.state.username} onChange={this.handleUsernameChange}></input>
    }

    if (this.state.emailUniqueError) {
      emailField = <div className={css.fieldErrorWrapper}>
        <div className={css.fieldErrorText}>Email has an account already</div>
        <input type="text" className={css.fieldErrorInput} placeholder="Email" value={this.state.email} onChange={this.handleEmailChange}></input>
      </div>
    } else {
      emailField = <input type="text" className={css.signInUpField} placeholder="Email" value={this.state.email} onChange={this.handleEmailChange}></input>
    }


    return (
      <div>
        <div className={css.navBar}>
          <div className={css.logo}>Chattermon</div>
          <div className={css.navBarLinksContainer}>
            <div className={css.navBarLink}><Link to={'/login'} className={css.navBarLinkA}>Log In</Link></div>
          </div>
        </div>
        <div className={css.contentSuperWrapper}>
          <div className={css.welcomeControlPannel}>
            <div className={css.welcomeMessage}>Sign Up</div>
            <div className={css.controlsContainer}>
              <div className={css.joinGameContainer}>
                {usernameField}
                <input type="password" className={css.signInUpField} placeholder="Password" value={this.state.password} onChange={this.handlePasswordChange}></input>
                {passwordError}
                <input type="password" className={css.signInUpField} placeholder="Repeat Your Password" value={this.state.repeatPassword} onChange={this.handlePasswordMatch}></input>
                {emailField}
                <button className={css.gameButton} onClick={this.handleSubmit}>Sign Up</button>
              </div>
              <div className={css.seperator}></div>
              <div className={css.altAuthText}>Have an account?</div>
              <Link to='/login' className={css.gameButtonLink}><button className={css.gameButton}>Log In</button></Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
