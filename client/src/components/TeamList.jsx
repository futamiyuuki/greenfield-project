import React, { Component } from 'react';
import css from '../styles.css';

const TeamList = (props) => {
  return (
    <div>
      <h3>Your Team</h3>
      {props.pokemon.map((pokemon) => {
        return (
          <div key={pokemon.name}>
            <img src={pokemon.sprites.front_default} alt="" />
            <h5 style={{ marginBottom: '0px', marginTop: '2px' }}>{pokemon.name}</h5>
            <h6 style={{ marginBottom: '0px' }}>{pokemon.health} / {pokemon.initialHealth}</h6>
          </div>
        );
      })}
    </div>
  );
};

export default TeamList;
