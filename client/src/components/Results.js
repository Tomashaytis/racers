import './Results.css';
import { Flipper, Flipped } from 'react-flip-toolkit';
import Result from './Result';

/**
 * Component for results rendering
 * @param {object} props - props
 * @returns jsx
 */
function Results(props) {
    return (
        <div className="results"> 
            <Flipper flipKey={props.players.map(player => player.name).join('')}>    {
                props.players.sort((player1, player2) => player2.score - player1.score).map((player) => (
                    <Flipped key={player.name} flipId={player.name}>
                        <Result playerColor={player.color} playerName={player.name} playerScore={player.score} />
                    </Flipped>
                )
            )}
            </Flipper>
        </div>
    )
}

export default Results;