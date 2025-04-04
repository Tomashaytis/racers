import Field from './components/Field';
import Results from './components/Results';
import PlayerPanel from './components/PlayerPanel';
import ScorePanel from './components/ScorePanel';
import InfoPanel from './components/InfoPanel';
import config from './config';
import clientApi from './api/ClientApi';
import { ClientApiContext } from './contexts/ClientApiContext';
import { useTimer } from './hooks/useTimer';
import { useState, useEffect, useCallback } from 'react';
import './App.css';

/**
 * Main page of React App
 * @returns jsx
 */
function App() {
    // On role change
    const [role, setRole] = useState(clientApi.role);
    useEffect(() => {
        const handler = () => setRole(clientApi.role);
        clientApi.roleCallback = handler;
        return () => {
            clientApi.roleCallback = () => {};
        };
    }, []);

    // On players change
    const [players, setPlayers] = useState([]);
    useEffect(() => {
        const handler = (data) => {
            const playerData = [];
            for (let figure of data.figures) {
                playerData.push({
                    name: figure.name,
                    color: figure.color,
                    score: figure.score,
                    isBot: figure.isBot,
                });
            }
            setPlayers(playerData);
        } 
        clientApi.playersCallback = handler;
        return () => {
            clientApi.playersCallback = (data) => {};
        };
    }, [players]);

    // Starting timer to send current player actions to server
    const handleKeys = useCallback((pressedKeys) => {
        const action = {
            forward: pressedKeys.includes('w'),
            backward: pressedKeys.includes('s'),
            left: pressedKeys.includes('a'),
            right: pressedKeys.includes('d'),
        };
        clientApi.action(action);
    }, []);
    useTimer(clientApi.sendInterval, handleKeys, role === 'player');

    return (
        <ClientApiContext.Provider value={clientApi}>
            <main>
                <h1 className='main-header'>Racer Battle</h1>
                <div className='main-container'>
                    <div className='game-field'>
                        <Field width={config.FIELD_SIZE.WIDTH} height={config.FIELD_SIZE.HEIGHT} />
                    </div>
                    <div className='game-results'>
                        <h2 className='result-header'>Results</h2>
                        <Results players={players} />
                    </div>
                    <div className='panels'>
                        <div className='game-player-panel'>
                            <PlayerPanel colors={config.COLORS} maxNameLength={config.MAX_NAME_LENGTH} players={players} />
                       </div>
                        <div className='game-score-panel'>
                           <ScorePanel players={players} />
                        </div>
                    </div>
                    <div className='game-info-panel'>
                        <InfoPanel players={players} />
                    </div>
                </div>
            </main>
        </ClientApiContext.Provider>
    );
}

export default App;
