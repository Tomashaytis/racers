import config from "../config";

class ClientApi {
    constructor(host, port, maxReconnectAttemps = 10, reconnectInterval = 5000) {
        this._url = `ws://${host}:${port}`;
        this._socket = null;
        this._connectionId = null;
        this._reconnectAttempts = 0;
        this._maxReconnectAttempts = maxReconnectAttemps;
        this._reconnectInterval = reconnectInterval;
        this._reconnectTimer = null;
        this._callback = (data) => {};

        this.initSocket();
    }

    initSocket() {
        if (this._socket) {
            this._socket.removeEventListener('open', this.handleClose);
            this._socket.removeEventListener('message', this.handleError);
            this._socket.close();
        }

        this._socket = new WebSocket(this._url);

        this._socket.addEventListener('open', () => {
            console.log(`Connection to ${this._url} opened`);
            this._reconnectAttempts = 0;
        });
  
        this._socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        });

        this._socket.addEventListener('close', (event) => {
            console.log(`Connection closed (code: ${event.code}, reason: ${event.reason}`);
            if (event.code !== 1000) {
                this.reconnect();
            }
        });

        this._socket.addEventListener('error', (error) => {
            console.log(`Connection error: ${error}`);
        });
    }

    handleClose(event) {
        console.log(`Connection closed (code: ${event.code}, reason: ${event.reason}`);
        if (event.code !== 1000) {
            this.reconnect();
        }
    }

    handleError(error) {
        console.log(`Connection error: ${error}`);
    }

    get callback() {
        return this._callback;
    }

    set callback(value) {
        this._callback = value;
    }

    join(playerName, playerColor) {
        console.log('Joining to game...');
        this.send({
            type: 'JOIN',
            message: 'Join request',
            name: playerName,
            color: playerColor,
        });
    }

    leave() {
        console.log('Leaving to game...');
        this.send({
            type: 'LEAVE',
            message: 'Leave request',
        });
    }

    send(data) {
        if (this._socket.readyState === WebSocket.OPEN) {
            this._socket.send(JSON.stringify(data));
        }
    }
  
    handleServerMessage(data) {
        switch(data.type) {
            case 'INIT':
                this._connectionId = data.playerId;
                console.log(data.message);
                break;
            case 'DATA':
                this._callback(data.data);
                break;
            case 'Error':
                console.log('Error:', data.message);
                break;
            default:
                console.log('Unknown message type');
                console.log(data);
        }
    }

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