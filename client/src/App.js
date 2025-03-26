import Field from './components/Field';
import Results from './components/Results';
import PlayerPanel from './components/PlayerPanel';
import ScorePanel from './components/ScorePanel';
import InfoPanel from './components/InfoPanel';
import config from './config';
import ClientApi from './api/ClientApi';
import { ClientApiContext } from './contexts/ClientApiContext';
import { useEffect, useRef } from 'react';
import './App.css';


function App() {
    const clientApiRef = useRef(null);
    useEffect(() => {
        if (!clientApiRef.current) {
            clientApiRef.current = new ClientApi(config.HOST, config.PORT, config.MAX_RECONNECT_ATTEMPS, config.RECONNECT_INTERVAL);
        }
        return () => clientApiRef.current?.close();
    }, []);
    
    return (
        <ClientApiContext.Provider value={clientApiRef.current}>
            <main>
                <h1 className='main-header'>Racer Battle</h1>
                <div className='main-container'>
                    <div className='game-field'>
                        <Field width={config.FIELD_SIZE.WIDTH} height={config.FIELD_SIZE.HEIGHT}/>
                    </div>
                    <div className='game-results'>
                        <h2 className='result-header'>Results</h2>
                        <Results />
                    </div>
                    <div className='panels'>
                        <div className='game-player-panel'>
                            <PlayerPanel freeColors={config.COLORS} />
                       </div>
                        <div className='game-score-panel'>
                           <ScorePanel playerScore='?' playerPlace='?' />
                        </div>
                    </div>
                    <div className='game-info-panel'>
                        <InfoPanel playerCount='0' aiPlayerCount='0' />
                    </div>
                </div>
            </main>
        </ClientApiContext.Provider>
    );
}

export default App;
