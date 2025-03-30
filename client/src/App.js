import Field from './components/Field';
import Results from './components/Results';
import PlayerPanel from './components/PlayerPanel';
import ScorePanel from './components/ScorePanel';
import InfoPanel from './components/InfoPanel';
import config from './config';
import clientApi from './api/ClientApi';
import { ClientApiContext } from './contexts/ClientApiContext';
import { useTimer } from './hooks/useTimer';
import { useState, useEffect } from 'react';
import './App.css';


function App() {
    const [role, setRole] = useState(clientApi.role);

    useEffect(() => {
        const handler = () => setRole(clientApi.role);
        clientApi.roleCallback = handler;
        return () => {
            clientApi.roleCallback = () => {};
        };
    }, []);

    const [players, setPlayers] = useState([]);

    useEffect(() => {
        const handler = (data) => {
            const playerData = [];
            for (let figure of data.figures) {
                playerData.push({
                    name: figure.name,
                    color: figure.color,
                    score: figure.score,
                });
            }
            setPlayers(playerData);
        } 
        clientApi.playersCallback = handler;
        return () => {
            clientApi.playersCallback = (data) => {};
        };
    }, [players]);

    useTimer(config.SEND_INTERVAL, (pressedKeys) => {
        const action = {
            forward: pressedKeys.includes('w'),
            backward: pressedKeys.includes('s'),
            left: pressedKeys.includes('a'),
            right: pressedKeys.includes('d'),
        }
        clientApi.action(action);
    }, role === 'player');

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
                        <InfoPanel playerCount={players.length} aiPlayerCount='0' />
                    </div>
                </div>
            </main>
        </ClientApiContext.Provider>
    );
}

export default App;
