import './PlayerPanel.css';
import { useJoin } from '../hooks/useJoin';
import { useState } from 'react';

function PlayerPanel(probs) {
    const [playerName, setPlayerName] = useState('');
    const handlePlayerNameChange = (e) => {
        setPlayerName(e.target.value);
    };

    const [isJoin, join] = useJoin(true, playerName);

    if (!isJoin) {
        if (playerName.length > 10) {
            join()
            alert('Your name too long!');
        } else if (playerName.length === 0) {
            join()
            alert('You forgot to set your name!');
        }
    }

    return (
        <div className="player-panel">
            <input type='text' className='input-name' placeholder='Your name' disabled={!isJoin} onChange={handlePlayerNameChange}></input>
            <select className='select-color' disabled={!isJoin}> {
                    probs.freeColors.map((color, index) => (
                        <option key={index} value={color}>{color}</option>
                    )
                )}
            </select>
            <button className='join-button' onClick={join}>{isJoin ? 'Join!' : 'Leave'}</button>
        </div>
    )
}

export default PlayerPanel;