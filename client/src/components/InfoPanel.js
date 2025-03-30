import './InfoPanel.css';

function InfoPanel({ playerCount, aiPlayerCount }) {
    return (
        <div className="info-panel">
            <div className='player-count'>Racers: {playerCount}</div>
            <div className='ai-player-count'>Bots: {aiPlayerCount}</div>
        </div>
    )
}

export default InfoPanel;