import './Result.css';

function Result({ playerColor, playerName, playerScore }) {
    return (
        <div className="result">
            <div className='player-color' style={{backgroundColor: playerColor}}></div>
            <div className='player-name'>{playerName}</div>
            <div className='player-score'>{playerScore} points</div>
        </div>
    )
}

export default Result;