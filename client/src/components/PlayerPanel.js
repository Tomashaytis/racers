import './PlayerPanel.css';
import { ClientApiContext } from '../contexts/ClientApiContext';
import { useContext, useState } from 'react';

/**
 * Component for game player panel rendering
 * @param {object} props - props
 * @returns jsx
 */
function PlayerPanel(props) {
    const clientApi = useContext(ClientApiContext); 

    const [playerName, setPlayerName] = useState('');
    const handlePlayerNameChange = (e) => {
        setPlayerName(e.target.value);
    };

    const existingNames = [];
    let availableColors = structuredClone(props.colors);
    for (const player of props.players) {
        existingNames.push(player.name);
        const index = availableColors.indexOf(player.color);
        if (index !== -1 && player.color !== clientApi.playerColor) {
            availableColors.splice(index, 1);
        }
    }

    const [isJoin, setJoinValue] = useState(true);
    const changeButtonState = () => {
        setJoinValue(!isJoin);
    }

    const handleClick = () => {
        if (playerName.length > props.maxNameLength) {
            alert('Your name too long!');
        } else if (playerName.length === 0) {
            alert('You forgot to set your name!');
        } else if (isJoin && existingNames.includes(playerName)) {
            alert('This name already exists!');
        } else {
            if (isJoin) {
                changeButtonState();
                const currentColor = document.querySelector('.select-color').value;
                clientApi?.join(playerName, currentColor);
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
            <select className='select-color' disabled={!isJoin}> {
                    availableColors.map((color, index) => (
                        <option key={index} value={color}>{color}</option>
                    )
                )}
            </select>
            <button className='join-button' onClick={handleClick}>{isJoin ? 'Join!' : 'Leave'}</button>
        </div>
    )
}

export default PlayerPanel;