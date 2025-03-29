const WebSocket = require('ws');
const Racer = require('./Racer');


class WebSocketServer {
    constructor(config) {
        this._port = config.PORT;
        this._maxWatchersCount = config.MAX_WATCHERS_COUNT;
        this._maxPlayersCount = config.MAX_PLAYERS_COUNT;
        this._sendInterval = config.SEND_INTERVAL;
        this._maxNameLength =  config.MAX_NAME_LENGTH;
        this._colors = config.COLORS;
        this._width = config.WIDTH;
        this._height = config.HEIGHT;
        this._bolidSize = config.BOLID_SIZE;

        this._wss = new WebSocket.Server({ port: this._port });
        this._connections = new Map();
        this._racers = new Map();
    }

    listen() {
        console.log(`Server is running on port ${this._port}`);
        this._wss.on('connection', (ws) => {
            const connectionId = this.generateId(); 
            console.log(`User ${connectionId} is trying to connect`);
            if (this._connections.size < this._maxWatchersCount) {
                this._connections.set(connectionId, ws);
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
                const data = []
                this._racers.forEach((racer, id) => {
                    data.push(racer.toDto());
                });
                ws.send(JSON.stringify({
                    type: 'DATA',
                    message: 'Accept actual data',
                    data: data,
                }));
            }, this._sendInterval);

            ws.on('message', (message) => {
                let data = null;
                try {
                    data = JSON.parse(message);
                } catch (error) {
                    this.sendErrorMessage(ws, 'Invalid request format');
                }

                try {
                    this.handleClientMessage(connectionId, ws, data);
                } catch (error) {
                    console.log(error);
                    this.sendErrorMessage(ws, 'Internal server error');
                }
            });
          
            ws.on('close', () => {
                this._connections.delete(connectionId)
                this._racers.delete(connectionId);
                console.log(`User ${connectionId} disconected`);
                clearInterval(sendIntervalId);
            });

            ws.on('error', (error) => {
                console.log(`Error while working with user ${connectionId}: ${error}`);
                ws.close(1011, `Internal server error: ${error}`);
                this._connections.delete(connectionId);
                this._racers.delete(connectionId);
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

    sendErrorMessage(ws, message) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: message,
        }));
    }
    
    handleClientMessage(connectionId, ws, data) {
        if (!data.hasOwnProperty('type')) {
            this.sendErrorMessage(ws, 'Invalid request format');
            return;
        }
        switch(data.type) {
            case 'JOIN':
                if (this._racers.size === this._maxPlayersCount) {
                    this.sendErrorMessage(ws, 'Game field is completely filled by other players');
                    return;
                }
                if (this._racers.has(connectionId)) {
                    this.sendErrorMessage(ws, 'Game joining option available only for watchers');
                    return;
                }
                if (!data.hasOwnProperty('name')) {
                    this.sendErrorMessage(ws, 'Unknown player name');
                    return;
                }
                if (!data.hasOwnProperty('color') || !this._colors.includes(data.color)) {
                    this.sendErrorMessage(ws, 'Unknown player color');
                    return;
                }
                if (data.name.length === 0 || data.name.length > this._maxNameLength) {
                    this.sendErrorMessage(ws, 'Invalid player name');
                    return;
                }

                const avoidedPoints = [];
                this._racers.forEach((racer, id) => {
                    avoidedPoints.push(racer.currentPoint);
                });

                this._racers.set(connectionId, new Racer(data.name, data.color, this._bolidSize, this._width, this._height, avoidedPoints));
                console.log(`User ${connectionId} connected as player`);
                break;
            case 'LEAVE':
                if (!this._racers.has(connectionId)) {
                    this.sendErrorMessage(ws, 'Game leaving option available only for players');
                    return;
                }
                console.log(`User ${connectionId} leaving game`);
                this._racers.delete(connectionId);
                break;
            default:
                this.sendErrorMessage(ws, 'Unknown request type');
        }
    }
 
    generateId() {
        return Math.random().toString(36).slice(2, 9);
    }
}

module.exports = WebSocketServer;