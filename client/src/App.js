import Field from './components/Field';
import Results from './components/Results';
import PlayerPanel from './components/PlayerPanel';
import ScorePanel from './components/ScorePanel';
import InfoPanel from './components/InfoPanel';
import config from './config';
import clientApi from './api/ClientApi';
import { ClientApiContext } from './contexts/ClientApiContext';
import './App.css';


function App() {
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
                        <Results />
                    </div>
                    <div className='panels'>
                        <div className='game-player-panel'>
                            <PlayerPanel freeColors={config.COLORS} maxNameLength={config.MAX_NAME_LENGTH} />
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
