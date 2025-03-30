import './Results.css';
import Result from './Result';

function Results(props) {
    return (
        <div className="results"> {
                props.players.map((player) => (
                    <Result key={player.name} playerColor={player.color} playerName={player.name} playerScore={player.score} />
                )
            )}
        </div>
    )
}

export default Results;