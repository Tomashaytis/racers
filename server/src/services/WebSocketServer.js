const WebSocket = require('ws');
const Racer = require('./Racer');
const Random = require('./Random');

/**
 * Server based on web-sockets
 */
class WebSocketServer {
    /**
     * Constructor for WebSocketServer object
     * @param {object} config - config for WebSocketServer object
     */
    constructor(config) {
        this._port = config.PORT;
        this._maxWatchersCount = config.MAX_WATCHERS_COUNT;
        this._maxPlayersCount = config.MAX_PLAYERS_COUNT;
        this._maxBotsCount = config.MAX_BOTS_COUNT;
        this._currentBotsCount = 0;
        this._sendInterval = config.SEND_INTERVAL;
        this._receiveInterval = config.RECEIVE_INTERVAL;
        this._simulateInterval = config.SIMULATE_INTERVAL;
        this._maxNameLength =  config.MAX_NAME_LENGTH;
        this._colors = config.COLORS;
        this._width = config.WIDTH;
        this._height = config.HEIGHT;
        this._bolideSize = config.BOLIDE_SIZE;
        this._engineOnTtl = config.ENGINE_ON_TTL;
        this._velocityLimit = config.VELOCITY_LIMIT;
        this._botNames = config.BOT_NAMES;

        this._wss = new WebSocket.Server({ port: this._port });
        this._connections = new Map();
        this._racers = new Map();
        this._racersNames = [];
        this._racersColors = [];
        this._playersIds = [];
        this._star = null;
    }

    /**
     * listening of server port
     */
    listen() {
        console.log(`Server is running on port ${this._port}`);

        // When player connecting to server
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
                    sendInterval: this._sendInterval,
                }));
            } else {
                ws.close(1008, "Server is overloaded");
            }

            // Sending actual data to client
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

            // When server received message from client
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

            // When connection has been closed
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
                    if (this._playersIds.includes(connectionId)) {
                        this._racers.delete(connectionId);
                        index = this._playersIds.indexOf(connectionId);
                        if (index !== -1) {
                            this._playersIds.splice(index, 1);
                        }
                        if (this._playersIds.length === 0) {
                            this._racers = new Map();
                            this._racersNames = [];
                            this._racersColors = [];
                            this._star = null;
                            this._currentBotsCount = 0;
                        }
                    }
                }
                console.log(`User ${connectionId} disconected`);
                this._connections.delete(connectionId)
                clearInterval(sendIntervalId);
            });

            // When connection has been closed with error
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
                    if (this._playersIds.includes(connectionId)) {
                        this._racers.delete(connectionId);
                        index = this._playersIds.indexOf(connectionId);
                        if (index !== -1) {
                            this._playersIds.splice(index, 1);
                        }
                        if (this._playersIds.length === 0) {
                            this._racers = new Map();
                            this._racersNames = [];
                            this._racersColors = [];
                            this._star = null;
                            this._currentBotsCount = 0;
                        }
                    }
                }
                this._connections.delete(connectionId);
                clearInterval(sendIntervalId);
                ws.terminate();
            });
        });
        
        // Simulation of player movement
        const simulateIntervalId = setInterval(() => {
            this._racers.forEach((racer, id) => {
                if (racer.move(this._star)) {
                    this._star = racer.generateStar();
                }
            });
            Racer.bolideCollisions(this._racers);
        }, this._simulateInterval);

        // Simulation of ai players actions
        const botsIntervalId = setInterval(() => {
            this._racers.forEach((racer, id) => {
                if (racer.isBot) {
                    racer.AutoEngine(this._star);
                }
            });
        }, this._receiveInterval);
    }

    /**
     * Sending error message to client
     * @param {object} ws - web-socket connection
     * @param {object} message - error message
     */
    sendErrorMessage(ws, message) {
        ws.send(JSON.stringify({
            type: 'ERROR',
            message: message,
        }));
    }
    
    /**
     * Processing client messages
     * @param {*} connectionId - web-socket connection id
     * @param {*} ws - web-socket connection
     * @param {*} data - client message
     */
    handleClientMessage(connectionId, ws, data) {
        if (!data.hasOwnProperty('type')) {
            this.sendErrorMessage(ws, 'Invalid request format');
            return;
        }
        switch(data.type) {
            case 'JOIN':
                if (this._racers.size === this._maxPlayersCount && this._currentBotsCount === 0) {
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
                
                if (this._racers.size === this._maxPlayersCount && this._currentBotsCount !== 0) {
                    let botId = '';
                    this._racers.forEach((racer, id) => {
                        if (racer.isBot) {
                            botId = id;
                        }
                    });
                    let index = this._racersNames.indexOf(this._racers.get(botId).name);
                    if (index !== -1) {
                        this._racersNames.splice(index, 1);
                    }
                    index = this._racersColors.indexOf(this._racers.get(botId).color);
                    if (index !== -1) {
                        this._racersColors.splice(index, 1);
                    }
                    this._racers.delete(botId);
                    this._currentBotsCount -= 1;
                }

                const avoidedPoints = [];
                this._racers.forEach((racer, id) => {
                    avoidedPoints.push(racer.position);
                });

                this._racers.set(connectionId, new Racer(data.name, data.color, this._bolideSize, this._velocityLimit, this._engineOnTtl, false, this._width, this._height, avoidedPoints));
                this._racersNames.push(data.name);
                this._racersColors.push(data.color);
                this._playersIds.push(connectionId);
                
                if (this._racers.size === 1) {
                    this._star = this._racers.get(connectionId).generateStar();
                }

                if (this._playersIds.length > 0 && this._currentBotsCount < this._maxBotsCount && this._playersIds.length < this._maxPlayersCount) {
                    let freeNames = [];
                    for (const name of this._botNames) {
                        if (!this._racersNames.includes(name)) {
                            freeNames.push(name);
                        }
                    }
                    let freeColors = [];
                    for (const color of this._colors) {
                        if (!this._racersColors.includes(color)) {
                            freeColors.push(color);
                        }
                    }
                    freeNames = Random.shuffle(freeNames);
                    freeColors = Random.shuffle(freeColors);
                    const shift = this._currentBotsCount;
                    for (let i = this._currentBotsCount; i < Math.min(this._maxBotsCount, this._maxPlayersCount - this._playersIds.length); i++) {
                        let botName = freeNames[i - shift];
                        let botColor = freeColors[i - shift];
                        const avoidedPoints = [];
                        this._racers.forEach((racer, id) => {
                            avoidedPoints.push(racer.position);
                        });
                        this._racers.set(this.generateId(), new Racer(botName, botColor, this._bolideSize, this._velocityLimit, this._engineOnTtl, true, this._width, this._height, avoidedPoints));
                        this._racersNames.push(botName);
                        this._racersColors.push(botColor);
                        this._currentBotsCount += 1;
                    }
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
                index = this._playersIds.indexOf(connectionId);
                if (index !== -1) {
                    this._playersIds.splice(index, 1);
                }

                this._racers.delete(connectionId);
                if (this._racers.size === 0) {
                    this._star = null;
                }

                if (this._playersIds.length === 0) {
                    this._racers = new Map();
                    this._racersNames = [];
                    this._racersColors = [];
                    this._star = null;
                    this._currentBotsCount = 0;
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

    /**
     * Generation of random connection id
     * @returns random connection id
     */
    generateId() {
        return Math.random().toString(36).slice(2, 9);
    }
}

module.exports = WebSocketServer;