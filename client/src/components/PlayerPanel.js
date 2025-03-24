import './PlayerPanel.css';
import config from '../config';

function PlayerPanel() {
    return (
        <div className="player-panel">
            <input type='text' className='input-name' placeholder='Your name'></input>
            <select className='select-color'> {
                    config.COLORS.map((color, index) => (
                        <option key={index} value={color}>{color}</option>
                    )
                )}
            </select>
            <button className='join-button'>Join!</button>
        </div>
    )
}

export default PlayerPanel;