import Field from '../components/Field';
import Results from '../components/Results';
import PlayerPanel from '../components/PlayerPanel';
import ScorePanel from '../components/ScorePanel';
import InfoPanel from '../components/InfoPanel';
import './App.css';


function App() {
  return (
    <main>
      <h1 className='main-header'>Racer Battle</h1>
      <div className='main-container'>
        <div className='game-field'>
          <Field />
        </div>
        <div className='game-results'>
          <h2 className='result-header'>Results</h2>
          <Results />
        </div>
        <div className='panels'>
          <div className='game-player-panel'>
            <PlayerPanel className='game-panel' />
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
  );
}

export default App;
