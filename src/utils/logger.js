/*
 * GNU AGPL-3.0 License
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 */

import {pino} from 'pino';
import {ecsFormat} from '@elastic/ecs-pino-format';
import {getStage} from './configs.js';

/**
 * Creates a logger instance based on the stage configuration
 * - Development: Pretty formatted, colorized logs
 * - Production/Staging: ECS JSON format for Elasticsearch
 * @returns {pino.Logger} Configured Pino logger instance
 */
export function createLogger() {
    // This sets NODE_ENV internally based on app.json stage
    getStage();

    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        // Pretty logs for development
        return pino({
            messageKey: 'message',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                    singleLine: false,
                    messageKey: 'message'
                }
            }
        });
    }

    // ECS format for production/staging
    return pino(ecsFormat());
}

/**
 * Creates a Fastify logger configuration based on the stage
 * - Development: Pretty formatted, colorized logs
 * - Production/Staging: ECS JSON format for Elasticsearch
 * @returns {object} Fastify logger configuration
 */
export function createFastifyLogger() {
    // This sets NODE_ENV internally based on app.json stage
    getStage();

    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        // Pretty logs for development
        return {
            messageKey: 'message',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss',
                    ignore: 'pid,hostname',
                    singleLine: false,
                    messageKey: 'message'
                }
            }
        };
    }

    // ECS format for production/staging
    return ecsFormat({
        convertReqRes: true  // Converts req/res to ECS HTTP fields
    });
}
