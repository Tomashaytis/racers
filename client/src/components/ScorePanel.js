import './ScorePanel.css';

function ScorePanel({ playerScore, playerPlace }) {
    return (
        <div className="score-panel">
            <div className='score'>Score: {playerScore}</div>
            <div className='place'>Place: {playerPlace}</div>
        </div>
    )
}

export default ScorePanel;