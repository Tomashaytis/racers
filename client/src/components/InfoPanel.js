import './InfoPanel.css';

function InfoPanel({ playerCount, aiPlayerCount }) {
    return (
        <div className="info-panel">
            <div className='player-count'>Racers in game: {playerCount}</div>
            <div className='ai-player-count'>Bots in game: {aiPlayerCount}</div>
        </div>
    )
}

export default InfoPanel;