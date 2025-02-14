/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */

import fastify from "fastify";
import {init, isAuthenticated, addUnAuthenticatedAPI} from "./auth/auth.js";
import {HTTP_STATUS_CODES} from "@aicore/libcommonutils";
import {getConfigs} from "./utils/configs.js";
import {getHelloSchema, hello, getHelloPostSchema, helloPost} from "./api/hello.js";
import {fastifyStatic} from "@fastify/static";
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import compression from '@fastify/compress';

import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = fastify({
    logger: true,
    trustProxy: true,
    bodyLimit: 1048576, // 1MB limit
    connectionTimeout: 30000, // 30 seconds
    keepAliveTimeout: 30000
});

// Register compression
server.register(compression, {
    threshold: 1024 // Only compress responses larger than 1KB
});

// Register security plugins
server.register(helmet, {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            scriptSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: true
});

server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: function (request, context) {
        return {
            code: 429,
            error: 'Too Many Requests',
            message: `Rate limit exceeded, retry in ${context.after}`
        };
    }
});

server.register(cors, {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400,
    preflight: true
});

// Global error handler
server.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : error.message;
    reply.status(500).send({error: message});
});

// Add request validation hook
server.addHook('preValidation', (request, reply, done) => {
    if (request.method === 'POST' && !request.headers['content-type']?.includes('application/json')) {
        reply.code(400).send({error: 'Content-Type must be application/json'});
        return;
    }
    done();
});

// Add timestamp tracking
server.addHook('onRequest', (request, reply, done) => {
    request.startTime = Date.now();
    // Log request size if available
    if (request.headers['content-length']) {
        request.log.info({
            reqId: request.id,
            msg: 'Request size',
            size: `${request.headers['content-length']} bytes`
        });
    }
    done();
});

/* Authentication hook */
server.addHook('onRequest', (request, reply, done) => {
    const urlWithoutQuery = request.url.split('?')[0];
    const sanitizedUrl = urlWithoutQuery.replace(/[<>]/g, '');

    const routeExists = server.hasRoute({
        url: urlWithoutQuery,
        method: request.method
    });

    if (!routeExists) {
        request.log.error({
            reqId: request.id,
            msg: "Route not found",
            url: sanitizedUrl,
            method: request.method,
            ip: request.ips
        });
        reply.code(HTTP_STATUS_CODES.NOT_FOUND);
        return reply.send({error: 'Not Found'});
    } else if (!isAuthenticated(request)) {
        request.log.warn({
            reqId: request.id,
            msg: "Unauthorized access attempt",
            url: sanitizedUrl,
            method: request.method,
            ip: request.ips
        });
        reply.code(HTTP_STATUS_CODES.UNAUTHORIZED);
        return reply.send({error: 'Unauthorized'});
    }
    request.log.info({
        reqId: request.id,
        msg: "Request authenticated",
        url: sanitizedUrl,
        method: request.method
    });
    done();
});

// Request logging hook
server.addHook('onRequest', (request, reply, done) => {
    request.log.info({
        reqId: request.id,
        msg: 'Incoming request',
        url: request.url,
        method: request.method,
        ip: request.ips
    });
    done();
});

// Response logging hook
server.addHook('onResponse', (request, reply, done) => {
    const duration = Date.now() - request.startTime;
    const logData = {
        reqId: request.id,
        msg: 'Request completed',
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        duration: `${duration}ms`
    };
    request.log.info(logData);
    done();
});

// static web pages
console.log("Serving static files from path: ", __dirname + '/www/');
addUnAuthenticatedAPI('/www/*');
server.register(fastifyStatic, {
    root: __dirname + '/www/',
    prefix: '/www/',
    maxAge: 86400000, // 1 day caching
    immutable: true,
    decorateReply: false,
    dotfiles: 'deny',
    etag: true
});

addUnAuthenticatedAPI('/www');
server.get('/www', function (req, res) {
    res.redirect(301, req.url + '/');
});

// Health check endpoint
addUnAuthenticatedAPI('/health');
server.get('/health', (request, reply) => {
    reply.send({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// public hello api
addUnAuthenticatedAPI('/hello');
server.get('/hello', getHelloSchema(), function (request, reply) {
    return hello(request, reply);
});

addUnAuthenticatedAPI('/helloPost');
server.post('/helloPost', getHelloPostSchema(), function (request, reply) {
    return helloPost(request, reply);
});

// Authenticated hello api with timeout
server.get('/helloAuth', {
    ...getHelloSchema(),
    timeout: 5000 // 5 second timeout
}, function (request, reply) {
    return hello(request, reply);
});

/**
 * Starts the server and listens on the port specified in the configs
 */
export async function startServer() {
    const configs = getConfigs();
    init(configs.authKey);

    try {
        await server.listen({
            port: configs.port,
            host: configs.allowPublicAccess ? '0.0.0.0' : 'localhost'
        });
        server.log.info(`Server started on port ${configs.port}`);
    } catch (err) {
        server.log.error('Error starting server:', err);
        process.exit(1);
    }
}

/**
 * Gracefully closes the server
 */
export async function close() {
    server.log.info('Shutting down server...');
    try {
        await server.close();
        server.log.info('Server shut down successfully');
    } catch (err) {
        server.log.error('Error during shutdown:', err);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGTERM', async () => {
    server.log.info('SIGTERM received');
    await close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    server.log.info('SIGINT received');
    await close();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    server.log.error('Uncaught Exception:', err);
    close().then(() => process.exit(1));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    server.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
    close().then(() => process.exit(1));
});
