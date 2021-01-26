const LogLevel = {
    DEV: 0,
    INFO: 10,
    DEBUG: 20,
    WARN: 30,
    PROD: 40,
    TEST: 50
}

class Logger {

    constructor(config) {
        config = config || {}
        this.config = {
            logLevel: LogLevel[(config.logLevel || 'PROD')],
        }
    }

    log (...args) {
        if (this.config.logLevel <= LogLevel.DEV) {
            console.log(...args)
        }
    }

    info (...args) {
        if (this.config.logLevel <= LogLevel.INFO) {
            console.log(...args)
        }
    }

    debug (...args) {
        if (this.config.logLevel <= LogLevel.DEBUG) {
            console.debug(...args)
        }
    }

    warn (...args) {
        if (this.config.logLevel <= LogLevel.WARN) {
            console.warn(...args)
        }
    }

    error (...args) {
        if (this.config.logLevel <= LogLevel.PROD) {
            console.error(...args)
        }
    }
}

module.exports = Logger
