/*global describe, it, beforeEach, afterEach*/
import * as chai from 'chai';
import {createLogger, createFastifyLogger} from "../../../src/utils/logger.js";
import {clearAppConfig} from "../../../src/utils/configs.js";

let expect = chai.expect;

describe('unit Tests for logger', function () {
    let originalNodeEnv;

    beforeEach(function () {
        originalNodeEnv = process.env.NODE_ENV;
        clearAppConfig();
    });

    afterEach(function () {
        process.env.NODE_ENV = originalNodeEnv;
        clearAppConfig();
    });

    describe('createLogger', function () {
        it('should create a logger in development mode', function () {
            // Config has stage: "dev" by default
            const logger = createLogger();

            expect(logger).to.exist;
            expect(typeof logger.info).to.eql('function');
            expect(typeof logger.warn).to.eql('function');
            expect(typeof logger.error).to.eql('function');
            expect(typeof logger.debug).to.eql('function');
        });

        it('should create a logger in production mode', async function () {
            const fs = await import('fs');
            const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
            const config = JSON.parse(originalConfig);
            config.stage = 'prod';
            fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
            clearAppConfig();

            const logger = createLogger();

            expect(logger).to.exist;
            expect(typeof logger.info).to.eql('function');
            expect(typeof logger.warn).to.eql('function');
            expect(typeof logger.error).to.eql('function');

            // Restore original
            fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
        });

        it('should be able to log messages in development', function () {
            const logger = createLogger();

            // Should not throw
            expect(() => logger.info('Test message')).to.not.throw();
            expect(() => logger.warn('Warning message')).to.not.throw();
            expect(() => logger.error('Error message')).to.not.throw();
        });

        it('should be able to log messages in production', async function () {
            const fs = await import('fs');
            const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
            const config = JSON.parse(originalConfig);
            config.stage = 'production';
            fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
            clearAppConfig();

            const logger = createLogger();

            // Should not throw
            expect(() => logger.info('Test message')).to.not.throw();
            expect(() => logger.warn('Warning message')).to.not.throw();
            expect(() => logger.error('Error message')).to.not.throw();

            // Restore original
            fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
        });

        it('should set NODE_ENV to development for dev stage', function () {
            createLogger();
            expect(process.env.NODE_ENV).to.eql('development');
        });

        it('should set NODE_ENV to production for prod stage', async function () {
            const fs = await import('fs');
            const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
            const config = JSON.parse(originalConfig);
            config.stage = 'prod';
            fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
            clearAppConfig();

            createLogger();
            expect(process.env.NODE_ENV).to.eql('production');

            // Restore original
            fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
        });
    });

    describe('createFastifyLogger', function () {
        it('should create Fastify logger config in development mode', function () {
            const loggerConfig = createFastifyLogger();

            expect(loggerConfig).to.exist;
            expect(typeof loggerConfig).to.eql('object');

            // In development mode, should have transport property
            if (loggerConfig.transport) {
                expect(loggerConfig.transport.target).to.exist;
            }
        });

        it('should create Fastify logger config in production mode', async function () {
            const fs = await import('fs');
            const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
            const config = JSON.parse(originalConfig);
            config.stage = 'prod';
            fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
            clearAppConfig();

            const loggerConfig = createFastifyLogger();

            expect(loggerConfig).to.exist;
            expect(typeof loggerConfig).to.eql('object');

            // Restore original
            fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
        });

        it('should return different configs for dev vs prod', async function () {
            // Get dev config
            const devConfig = createFastifyLogger();

            // Change to prod
            const fs = await import('fs');
            const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
            const config = JSON.parse(originalConfig);
            config.stage = 'prod';
            fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
            clearAppConfig();

            const prodConfig = createFastifyLogger();

            // Configs should be different objects
            expect(devConfig).to.not.deep.equal(prodConfig);

            // Restore original
            fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
        });

        it('should set NODE_ENV to development for dev stage', function () {
            createFastifyLogger();
            expect(process.env.NODE_ENV).to.eql('development');
        });

        it('should set NODE_ENV to production for prod stage', async function () {
            const fs = await import('fs');
            const originalConfig = fs.readFileSync(process.env.APP_CONFIG, 'utf8');
            const config = JSON.parse(originalConfig);
            config.stage = 'production';
            fs.writeFileSync(process.env.APP_CONFIG, JSON.stringify(config, null, 2));
            clearAppConfig();

            createFastifyLogger();
            expect(process.env.NODE_ENV).to.eql('production');

            // Restore original
            fs.writeFileSync(process.env.APP_CONFIG, originalConfig);
        });
    });
});
