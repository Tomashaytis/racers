import './InfoPanel.css';

/**
 * Component for game info panel rendering
 * @param {object} props - props
 * @returns jsx
 */
function InfoPanel(props) {
    let playersCount = 0;
    let aiPlayersCount = 0;
    for (const player of props.players) {
        player.isBot ? aiPlayersCount++ : playersCount++;
    }
    return (
        <div className="info-panel">
            <div className='player-count'>Racers: {playersCount}</div>
            <div className='ai-player-count'>Bots: {aiPlayersCount}</div>
        </div>
    )
}

export default InfoPanel;