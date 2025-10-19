import * as fs from "fs";

let APP_CONFIG = null;

function _getValidatedConfig(configText) {
    let config = JSON.parse(configText);
    if(typeof config.port !== 'number'){
        throw new Error("Invalid port(expected number) in config " + config.port);
    }
    return config;
}

/**
 * It returns an object with the port, authKey, and mySqlConfigs
 * @returns An object with the following properties:
 *     port: The port number for the database server default port is 5000.
 *     authKey: A random string used to authenticate the client. this value can also be given using environment variable
 *
 */
export function getConfigs() {
    if (APP_CONFIG) {
        return APP_CONFIG;
    }
    if (!process.env.APP_CONFIG) {
        throw new Error('Please provide valid app config file by setting APP_CONFIG environment variable' +
            ' for example APP_CONFIG=./abc.json');
    }
    APP_CONFIG = _getAppConfig(process.env.APP_CONFIG);
    return APP_CONFIG;
}

function _getAppConfig(file) {
    const appConfigFile = fs.readFileSync(file);
    return _getValidatedConfig(appConfigFile.toString());
}

export function clearAppConfig() {
    APP_CONFIG = null;
}

/**
 * Gets the stage from app.json and sets NODE_ENV accordingly
 * Supports both short and long stage names:
 * - "dev" or "development" → NODE_ENV="development"
 * - "prod" or "production" → NODE_ENV="production"
 * @returns {string} The stage value from config
 */
export function getStage() {
    const config = getConfigs();
    const stage = config.stage || 'development';

    // Normalize stage names (case-insensitive)
    const normalizedStage = stage.toLowerCase();
    const isDev = normalizedStage === 'dev' || normalizedStage === 'development';

    // Set NODE_ENV based on stage
    if (isDev) {
        process.env.NODE_ENV = 'development';
    } else {
        process.env.NODE_ENV = 'production';
    }

    return stage;
}
