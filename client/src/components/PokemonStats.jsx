import React from 'react';
import css from '../styles.css';

function PokemonStats(props) {
  return (
    <div className={css.stats}>
      <h2>{props.stats.name.toUpperCase()}</h2>
      <h4 style={{ marginBottom: '2px' }}> {props.stats.health} / {props.stats.initialHealth} </h4>
      <h6 style={{ marginTop: '5px' }}> A: {props.stats.attack} - D: {props.stats.defense} - SpA: {props.stats.specialAttack} - SpD: {props.stats.specialDefense} - S: {props.stats.speed} </h6>
    </div>
  );
}

export default PokemonStats;
