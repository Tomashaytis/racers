class Logger {
    constructor(prefix = 'Logger') {
        this.prefix = prefix;
    }
    printMessage(message) {
        console.log(`[${this.prefix}]: ${message}`);
    }
}

module.exports = Logger;