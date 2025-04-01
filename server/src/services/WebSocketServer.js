const WebSocket = require('ws');
const Racer = require('./Racer');


class WebSocketServer {
    constructor(config) {
        this._port = config.PORT;
        this._maxWatchersCount = config.MAX_WATCHERS_COUNT;
        this._maxPlayersCount = config.MAX_PLAYERS_COUNT;
        this._sendInterval = config.SEND_INTERVAL;
        this._simulateInterval = config.SIMULATE_INTERVAL;
        this._maxNameLength =  config.MAX_NAME_LENGTH;
        this._colors = config.COLORS;
        this._width = config.WIDTH;
        this._height = config.HEIGHT;
        this._bolidSize = config.BOLID_SIZE;
        this._engineOnTtl = config.ENGINE_ON_TTL;
        this._velocityLimit = config.VELOCITY_LIMIT;

        this._wss = new WebSocket.Server({ port: this._port });
        this._connections = new Map();
        this._racers = new Map();
        this._racersNames = [];
        this._racersColors = [];
        this._star = null;
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
                    data: {
                        figures: data,
                        game: {
                            star: this._star,
                        }
                    }
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
                if (this._racers.has(connectionId)) {
                    let index = this._racersNames.indexOf(this._racers.get(connectionId).name);
                    if (index !== -1) {
                        this._racersNames.splice(index, 1);
                    }
                    index = this._racersColors.indexOf(this._racers.get(connectionId).color);
                    if (index !== -1) {
                        this._racersColors.splice(index, 1);
                    }
                    this._racers.delete(connectionId);
                }
                console.log(`User ${connectionId} disconected`);
                this._connections.delete(connectionId)
                clearInterval(sendIntervalId);
            });

            ws.on('error', (error) => {
                console.log(`Error while working with user ${connectionId}: ${error}`);
                ws.close(1011, `Internal server error: ${error}`);
                if (this._racers.has(connectionId)) {
                    let index = this._racersNames.indexOf(this._racers.get(connectionId).name);
                    if (index !== -1) {
                        this._racersNames.splice(index, 1);
                    }
                    index = this._racersColors.indexOf(this._racers.get(connectionId).color);
                    if (index !== -1) {
                        this._racersColors.splice(index, 1);
                    }
                    this._racers.delete(connectionId);
                }
                this._connections.delete(connectionId);
                clearInterval(sendIntervalId);
                ws.terminate();
            });
        });
        
        const simulateIntervalId = setInterval(() => {
            this._racers.forEach((racer, id) => {
                if (racer.move(this._star)) {
                    this._star = racer.generateStar();
                }
            });
            Racer.bolidCollisions(this._racers);
        }, this._simulateInterval);
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
                if (this._racersNames.includes(data.name)) {
                    this.sendErrorMessage(ws, 'Player name already exists');
                    return;
                }
                if (this._racersColors.includes(data.color)) {
                    this.sendErrorMessage(ws, 'Player color already exists');
                    return;
                }

                const avoidedPoints = [];
                this._racers.forEach((racer, id) => {
                    avoidedPoints.push(racer.currentPoint);
                });

                this._racers.set(connectionId, new Racer(data.name, data.color, this._bolidSize, this._velocityLimit, this._engineOnTtl, this._width, this._height, avoidedPoints));
                this._racersNames.push(data.name);
                this._racersColors.push(data.color);
                
                if (this._racers.size === 1) {
                    this._star = this._racers.get(connectionId).generateStar();
                }

                ws.send(JSON.stringify({
                    type: 'SUCCESS_JOIN',
                    message: 'Join successful',
                }));
                console.log(`User ${connectionId} connected as player`);
                break;
            case 'LEAVE':
                if (!this._racers.has(connectionId)) {
                    this.sendErrorMessage(ws, 'Game leaving option available only for players');
                    return;
                }

                let index = this._racersNames.indexOf(this._racers.get(connectionId).name);
                if (index !== -1) {
                    this._racersNames.splice(index, 1);
                }
                index = this._racersColors.indexOf(this._racers.get(connectionId).color);
                if (index !== -1) {
                    this._racersColors.splice(index, 1);
                }
                this._racers.delete(connectionId);
                if (this._racers.size === 0) {
                    this._star = null;
                }

                ws.send(JSON.stringify({
                    type: 'SUCCESS_LEAVE',
                    message: 'Leave successful',
                }));
                console.log(`User ${connectionId} leaving game`);
                break;
            case 'ACTION':
                if (!this._racers.has(connectionId)) {
                    this.sendErrorMessage(ws, 'Action available only for players');
                    return;
                }
                if (!data.hasOwnProperty('action')) {
                    this.sendErrorMessage(ws, 'Action not set');
                    return;
                }

                if (!data.action.hasOwnProperty('forward') || typeof data.action.forward !== 'boolean') {
                    this.sendErrorMessage(ws, 'Incorrect action format');
                    return;
                }
                if (!data.action.hasOwnProperty('backward') || typeof data.action.backward !== 'boolean') {
                    this.sendErrorMessage(ws, 'Incorrect action format');
                    return;
                }
                if (!data.action.hasOwnProperty('left') || typeof data.action.left !== 'boolean') {
                    this.sendErrorMessage(ws, 'Incorrect action format');
                    return;
                }
                if (!data.action.hasOwnProperty('right') || typeof data.action.right !== 'boolean') {
                    this.sendErrorMessage(ws, 'Incorrect action format');
                    return;
                }

                this._racers.get(connectionId).setEngine(data.action);
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