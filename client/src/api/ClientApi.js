import config from "../config";

/**
 * Class ClientApi for implementation of interaction with WebSocketServer
 */
class ClientApi {
    /**
     * Constructor for ClientApi object
     * @param {string} host - IP-address of WebSocketServer
     * @param {number} port - port of WebSocketServer
     * @param {number} maxReconnectAttemps - max reconnect attemps after connection failure
     * @param {number} reconnectInterval - reconnect interval
     */
    constructor(host, port, maxReconnectAttemps = 10, reconnectInterval = 5000) {
        this._url = `ws://${host}:${port}`;
        this._socket = null;
        this._connectionId = null;
        this._role = 'undefined';
        this._reconnectAttempts = 0;
        this._maxReconnectAttempts = maxReconnectAttemps;
        this._reconnectInterval = reconnectInterval;
        this._sendInterval = 0;
        this._reconnectTimer = null;
        this._dataCallback = (data) => {};
        this._playersCallback = (data) => {};
        this._roleCallback = () => {};
        this._playerName = null;
        this._playerColor = null;

        this.initSocket();
    }

    /**
     * Getter for send interval value
     */
    get sendInterval() {
        return this._sendInterval;
    }

    /**
     * Getter for player role value
     */
    get role() {
        return this._role;
    }

    /**
     * Getter for players callback function
     */
    get playersCallback() {
        return this._playersCallback;
    }

    /**
     * Setter for players callback function
     */
    set playersCallback(value) {
        this._playersCallback = value;
    }

    /**
     * Getter for data callback function
     */
    get dataCallback() {
        return this._dataCallback;
    }

    /**
     * Setter for data callback function
     */
    set dataCallback(value) {
        this._dataCallback = value;
    }

    /**
     * Getter for role callback function
     */
    get roleCallback() {
        return this._roleCallback;
    }

    /**
     * Setter for role callback function
     */
    set roleCallback(value) {
        this._roleCallback = value;
    }

    /**
     * Getter for player name value
     */
    get playerName() {
        return this._playerName;
    }

    /**
     * Setter for player name value
     */
    set playerName(value) {
        this._playerName = value;
    }

    /**
     * Getter for player color value
     */
    get playerColor() {
        return this._playerColor;
    }

    /**
     * Setter for player color value
     */
    set playerColor(value) {
        this._playerColor = value;
    }

    /**
     * Initialisation of socket
     */
    initSocket() {
        // If previous socket connection exists
        if (this._socket) {
            this._socket.removeEventListener('open', this.handleClose);
            this._socket.removeEventListener('message', this.handleError);
            this._socket.close();
        }

        this._socket = new WebSocket(this._url);

        // On opening socket connection 
        this._socket.addEventListener('open', () => {
            console.log(`Connection to ${this._url} opened`);
            this._reconnectAttempts = 0;
        });

        // On receiving server message
        this._socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        });

        // On closing socket connection from server
        this._socket.addEventListener('close', (event) => {
            console.log(`Connection closed (code: ${event.code}, reason: ${event.reason}`);
            if (event.code !== 1000) {
                this.reconnect();
            }
        });

        // On closing socket connection from server with error
        this._socket.addEventListener('error', (error) => {
            console.log(`Connection error: ${error}`);
        });
    }

    /**
     * Processing socket closure from server
     * @param {object} event - closure event
     */
    handleClose(event) {
        console.log(`Connection closed (code: ${event.code}, reason: ${event.reason}`);
        if (event.code !== 1000) {
            this.reconnect();
        }
    }

    /**
     * Processing socket closure from server with error
     * @param {object} error - error
     */
    handleError(error) {
        console.log(`Connection error: ${error}`);
    }

    /**
     * Requesting to join the game
     * @param {string} playerName - player name
     * @param {string} playerColor - player color
     */
    join(playerName, playerColor) {
        this._playerName = playerName;
        this._playerColor = playerColor;
        console.log('Joining to game...');
        this.send({
            type: 'JOIN',
            message: 'Join request',
            name: playerName,
            color: playerColor,
        });
    }

    /**
     * Requesting to leave the game
     */
    leave() {
        console.log('Leaving to game...');
        this._playerName = null;
        this._playerColor = null;
        this.send({
            type: 'LEAVE',
            message: 'Leave request',
        });
    }

    /**
     * Sending current player action to server
     * @param {object} action - current player action
     */
    action(action) {
        this.send({
            type: 'ACTION',
            message: 'Sending current action',
            action: action,
        });
    }

    /**
     * Sending data to server
     * @param {object} data - data for sending
     */
    send(data) {
        if (this._socket.readyState === WebSocket.OPEN) {
            this._socket.send(JSON.stringify(data));
        }
    }

    /**
     * Processing received data from server
     * @param {object} data - received data
     */
    handleServerMessage(data) {
        switch(data.type) {
            case 'INIT':
                this._connectionId = data.playerId;
                this._sendInterval = data._sendInterval;
                this._role = 'watcher';
                this._roleCallback()
                console.log(data.message);
                break;
            case 'DATA':
                this._dataCallback(data.data);
                this._playersCallback(data.data);
                break;
            case 'ERROR':
                console.log('Error:', data.message);
                break;
            case 'SUCCESS_JOIN':
                this._role = 'player';
                this._roleCallback()
                console.log(data.message);
                break;
            case 'SUCCESS_LEAVE':
                this._role = 'watcher';
                this._roleCallback()
                console.log(data.message);
                break;
            default:
                console.log('Unknown message type');
                console.log(data);
        }
    }

    /**
     * Reconnection to server 
     */
    reconnect() {
        if (this._reconnectAttempts >= this._maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        clearTimeout(this._reconnectTimer);
      
        this._reconnectAttempts++;
        console.log(`Reconnecting (attempt ${this._reconnectAttempts})...`);


        this._reconnectTimer = setTimeout(() => {
            this.initSocket();
        }, this._reconnectInterval);
    }

    /**
     * Normal closure of socket connection
     */
    close(code = 1000, reason = "Normal closure") {
        if (this._reconnectInterval) {
            clearTimeout(this._reconnectTimer);
        }

        if (this._socket && this._socket.readyState === WebSocket.OPEN) {
            this._socket.close(code, reason);
        }

        this._playerId = null;
        this._reconnectAttempts = 0;
    }
}

const clientApi = new ClientApi(
    config.HOST,
    config.PORT,
    config.MAX_RECONNECT_ATTEMPS,
    config.RECONNECT_INTERVAL,
);

export default clientApi;