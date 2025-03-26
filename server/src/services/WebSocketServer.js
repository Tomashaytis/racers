const WebSocket = require('ws');

class WebSocketServer {
    constructor(port, maxWatchersCount = 15, maxPlayersCount = 10, sendInterval = 100) {
        this._port = port;
        this._wss = new WebSocket.Server({ port: this._port });
        this._watchers = new Map();
        this._players = new Map();
        this._maxWatchersCount = maxWatchersCount;
        this._maxPlayersCount = maxPlayersCount;
        this._sendInterval = sendInterval;
        this._data = null;
    }

    listen() {
        console.log(`Server is running on port ${this._port}`);
        this._wss.on('connection', (ws) => {
            const connectionId = this.generateId(); 
            console.log(`User ${connectionId} is trying to connect`);
            if (this._watchers.size < this._maxWatchersCount) {
                this._watchers.set(connectionId, ws);
                console.log(`User ${connectionId} connected as watcher`);
                ws.send(JSON.stringify({
                    type: 'INIT',
                    message: 'Connection successful',
                    status: 'WATCHER',
                    connectionId: connectionId,
                }));
            } else {
                ws.close(1008, "Server is overloaded");
            }

            const sendIntervalId = setInterval(() => {
                ws.send(JSON.stringify({
                    type: 'DATA',
                    message: 'Accept actual data',
                    data: Date.now(),
                }));
            }, this._sendInterval);
          
            ws.on('close', () => {
                if (this._watchers.delete(connectionId)) {
                   console.log(`Watcher ${connectionId} disconected`);
                } else if (this._players.delete(connectionId)) {
                    console.log(`Player ${connectionId} disconected`);
                } else {
                    console.log(`User ${connectionId} disconected`);
                } 
                clearInterval(sendIntervalId);
            });

            ws.on('error', (error) => {
                console.log(`Error while working with user ${connectionId}: ${error}`)
                ws.close(1011, `Internal server error: ${error}`);
                this._watchers.delete(connectionId);
                this._players.delete(connectionId);
                clearInterval(sendIntervalId);
                ws.terminate();
            });
        });
    }

    broadcast(data) {
        players.forEach((playerWs) => {
            playerWs.send(JSON.stringify(data));
        });
    }

    
    generateId() {
        return Math.random().toString(36).slice(2, 9);
    }
}

module.exports = WebSocketServer;