import './PlayerPanel.css';
import { ClientApiContext } from '../contexts/ClientApiContext';
import { useContext, useState} from 'react';

function PlayerPanel(probs) {
    const clientApi = useContext(ClientApiContext); 
    clientApi.callback = (data) => console.log(data);

    const [playerName, setPlayerName] = useState('');
    const handlePlayerNameChange = (e) => {
        setPlayerName(e.target.value);
    };

    const [playerColor, setSelectedColor] = useState(probs.freeColors[0]);
    const handleColorChange = (e) => {
        setSelectedColor(e.target.value);
    };

    const [isJoin, setJoinValue] = useState(true);
    const changeButtonState = () => {
        setJoinValue(!isJoin);
    }

    const handleClick = () => {
        if (playerName.length > probs.maxNameLength) {
            alert('Your name too long!');
        } else if (playerName.length === 0) {
            alert('You forgot to set your name!');
        } else {
            if (isJoin) {
                changeButtonState();
                clientApi?.join(playerName, playerColor);
            }
            else {
                changeButtonState();
                clientApi?.leave();
            }
        }
    };

    return (
        <div className="player-panel">
            <input type='text' className='input-name' placeholder='Your name' disabled={!isJoin} onChange={handlePlayerNameChange}></input>
            <select className='select-color' disabled={!isJoin} onChange={handleColorChange}> {
                    probs.freeColors.map((color, index) => (
                        <option key={index} value={color}>{color}</option>
                    )
                )}
            </select>
            <button className='join-button' onClick={handleClick}>{isJoin ? 'Join!' : 'Leave'}</button>
        </div>
    )
}

export default PlayerPanel;