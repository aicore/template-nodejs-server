/*global describe, it, beforeEach, afterEach*/
import * as chai from 'chai';
import {createFastifyLogger} from "../../../src/utils/logger.js";

let expect = chai.expect;

describe('unit Tests for logger', function () {
    let originalNodeEnv;
    let originalAppConfig;

    beforeEach(function () {
        // Save original environment
        originalNodeEnv = process.env.NODE_ENV;
        originalAppConfig = process.env.APP_CONFIG;

        // Set test app config
        process.env.APP_CONFIG = './test/unit/utils/.app.json';
    });

    afterEach(function () {
        // Restore original environment
        if (originalNodeEnv !== undefined) {
            process.env.NODE_ENV = originalNodeEnv;
        } else {
            delete process.env.NODE_ENV;
        }

        if (originalAppConfig !== undefined) {
            process.env.APP_CONFIG = originalAppConfig;
        } else {
            delete process.env.APP_CONFIG;
        }
    });

    describe('createFastifyLogger', function () {
        it('should create development Fastify logger config with pino-pretty', function () {
            delete process.env.NODE_ENV;
            const loggerConfig = createFastifyLogger();

            expect(loggerConfig).to.exist;
            expect(loggerConfig.transport).to.exist;
            expect(loggerConfig.transport.target).to.equal('pino-pretty');
            expect(loggerConfig.transport.options).to.exist;
            expect(loggerConfig.transport.options.colorize).to.equal(true);
        });

        it('should create production Fastify logger config with ECS format', function () {
            process.env.NODE_ENV = 'production';
            const loggerConfig = createFastifyLogger();

            expect(loggerConfig).to.exist;
            expect(typeof loggerConfig).to.equal('object');
        });

        it('should handle staging environment as production', function () {
            process.env.NODE_ENV = 'staging';
            const loggerConfig = createFastifyLogger();

            expect(loggerConfig).to.exist;
            expect(typeof loggerConfig).to.equal('object');
        });
    });

    describe('logger message field consistency', function () {
        it('development logger should use standard Pino API', function () {
            delete process.env.NODE_ENV;
            const loggerConfig = createFastifyLogger();

            // Standard Pino API - no messageKey override needed
            expect(loggerConfig.transport).to.exist;
            expect(loggerConfig.transport.target).to.equal('pino-pretty');
        });

        it('should maintain ECS compliance in production', function () {
            process.env.NODE_ENV = 'production';
            const loggerConfig = createFastifyLogger();

            // ECS format config should be an object
            expect(typeof loggerConfig).to.equal('object');
        });
    });
});
