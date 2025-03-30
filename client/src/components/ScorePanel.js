import './ScorePanel.css';
import { ClientApiContext } from '../contexts/ClientApiContext';
import { useContext } from 'react';

function ScorePanel(props) {
    const clientApi = useContext(ClientApiContext); 
    let playerScore = '?';
    let playerPlace = '?';
    if (clientApi.playerName !== null) {
        for (let player of props.players) {
            if (player.name === clientApi.playerName) {
                playerScore = player.score;
            }
        }
        playerPlace = 1;
        for (let player of props.players) {
            if (player.score > playerScore) {
                playerPlace += 1;
            }
        }
    }
    return (
        <div className="score-panel">
            <div className='score'>Score: {playerScore}</div>
            <div className='place'>Place: {playerPlace}</div>
        </div>
    )
}

export default ScorePanel;