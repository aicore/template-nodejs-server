/*global describe, it, beforeEach, afterEach*/
import * as chai from 'chai';
import {clearAppConfig, getConfigs, getStage} from "../../../src/utils/configs.js";

let expect = chai.expect;

describe('unit Tests for config', function () {

    it('verify config fail if APP_CONFIG not set properly', function () {
        const backEnv = process.env.APP_CONFIG;
        delete process.env.APP_CONFIG;
        clearAppConfig();
        let exceptionOccurred = false;
        try {
            getConfigs();
        } catch (e) {
            expect(e.toString()).eql('Error: Please provide valid app config file by setting APP_CONFIG' +
                ' environment variable for example APP_CONFIG=./abc.json');
            exceptionOccurred = true;
        }
        expect(exceptionOccurred).eql(true);
        process.env.APP_CONFIG = backEnv;

    });
    it('getConfigShould pass', function () {
        let configs = getConfigs();
        _verifyConfigs(configs);
        configs = getConfigs();
        // call verify config second time
        _verifyConfigs(configs);

    });
    it('default port should be 5000', function () {
        let configs = getConfigs();
        _verifyConfigs(configs);
        configs = getConfigs();
        // call verify config second time
        _verifyConfigs(configs);
    });
});

function _verifyConfigs(configs) {
    expect(configs.port).to.eql(5000);
    expect(configs.authKey).to.eql("hehe");
    expect(configs.mysql.port).to.eql('3306');
    expect(configs.mysql.user.length).to.gt(0);
    expect(configs.mysql.password.length).to.gt(0);
    expect(configs.mysql.host.length).to.gt(0);
    expect(configs.mysql.database.length).to.gt(0);

}

describe('unit Tests for getStage', function () {
    let originalNodeEnv;

    beforeEach(function () {
        originalNodeEnv = process.env.NODE_ENV;
        clearAppConfig();
    });

    afterEach(function () {
        process.env.NODE_ENV = originalNodeEnv;
        clearAppConfig();
    });

    it('should return "dev" and set NODE_ENV to "development" for stage "dev"', function () {
        const stage = getStage();
        expect(stage).to.eql('dev');
        expect(process.env.NODE_ENV).to.eql('development');
    });

    it('should handle "development" stage and set NODE_ENV correctly', async function () {
        // Temporarily modify config to test different stage
        const fs = await import('fs');
        const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
        const config = JSON.parse(originalConfig);
        config.stage = 'development';
        fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
        clearAppConfig();

        const stage = getStage();
        expect(stage).to.eql('development');
        expect(process.env.NODE_ENV).to.eql('development');

        // Restore original
        fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
    });

    it('should handle "prod" stage and set NODE_ENV to "production"', async function () {
        const fs = await import('fs');
        const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
        const config = JSON.parse(originalConfig);
        config.stage = 'prod';
        fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
        clearAppConfig();

        const stage = getStage();
        expect(stage).to.eql('prod');
        expect(process.env.NODE_ENV).to.eql('production');

        // Restore original
        fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
    });

    it('should handle "production" stage and set NODE_ENV correctly', async function () {
        const fs = await import('fs');
        const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
        const config = JSON.parse(originalConfig);
        config.stage = 'production';
        fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
        clearAppConfig();

        const stage = getStage();
        expect(stage).to.eql('production');
        expect(process.env.NODE_ENV).to.eql('production');

        // Restore original
        fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
    });

    it('should default to "development" when stage is missing', async function () {
        const fs = await import('fs');
        const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
        const config = JSON.parse(originalConfig);
        delete config.stage;
        fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
        clearAppConfig();

        const stage = getStage();
        expect(stage).to.eql('development');
        expect(process.env.NODE_ENV).to.eql('development');

        // Restore original
        fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
    });

    it('should be case insensitive - DEV should work', async function () {
        const fs = await import('fs');
        const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
        const config = JSON.parse(originalConfig);
        config.stage = 'DEV';
        fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
        clearAppConfig();

        const stage = getStage();
        expect(stage).to.eql('DEV');
        expect(process.env.NODE_ENV).to.eql('development');

        // Restore original
        fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
    });

    it('should be case insensitive - PROD should work', async function () {
        const fs = await import('fs');
        const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
        const config = JSON.parse(originalConfig);
        config.stage = 'PROD';
        fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
        clearAppConfig();

        const stage = getStage();
        expect(stage).to.eql('PROD');
        expect(process.env.NODE_ENV).to.eql('production');

        // Restore original
        fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
    });
});
