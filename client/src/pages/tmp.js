import './App.css';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Проверка подключения
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    // Обработка сообщений от сервера
    socket.on('receiveMessage', (data) => {
      console.log('Received message from server:', data);
    });

    // Очистка подписок при размонтировании компонента
    return () => {
      socket.off('connect');
      socket.off('receiveMessage');
    };
  }, []);


  const sendData = () => {
    const testData = { text: 'Hello, server!', timestamp: new Date() };
    socket.emit('sendMessage', testData);
    setMessage('Message sent!');
  };
  return (
    <div className="App">
      <button onClick={sendData}>test</button>
    </div>
  );
}

export default App;
