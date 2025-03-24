import './Results.css';
import Result from './Result';

function Results() {
    return (
        <div className="results">
            <Result playerColor="red" playerName="bob" playerScore="30" />
            <Result playerColor="blue" playerName="bill" playerScore="20" />
            <Result playerColor="red" playerName="bob" playerScore="30" />
            <Result playerColor="blue" playerName="bill" playerScore="20" />
            <Result playerColor="red" playerName="bob" playerScore="30" />
            <Result playerColor="blue" playerName="bill" playerScore="20" />
            <Result playerColor="red" playerName="bob" playerScore="30" />
            <Result playerColor="blue" playerName="bill" playerScore="20" />
            <Result playerColor="red" playerName="bob" playerScore="30" />
            <Result playerColor="blue" playerName="bill" playerScore="100" />
        </div>
    )
}

export default Results;