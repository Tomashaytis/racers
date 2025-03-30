import './Result.css';

function Result(props) {
    return (
        <div className="result">
            <div className='player-color' style={{backgroundColor: props.playerColor}}></div>
            <div className='player-name'>{props.playerName}</div>
            <div className='player-score'>{props.playerScore}</div>
        </div>
    )
}

export default Result;