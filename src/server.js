/*
 * GNU AGPL-3.0 License
 * Copyright (c) 2021 - present core.ai . All rights reserved.
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
import * as fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = fastify({
    logger: true,
    trustProxy: true,
    connectionTimeout: 30000,
    keepAliveTimeout: 30000
});
// Add Request ID Propagation
server.decorateRequest('setCorrelationId', function (correlationId) {
    this.correlationId = correlationId;
});

// Add Version Headers
server.addHook('onSend', (request, reply, payload, done) => {
    reply.header('X-API-Version', '1.0.0');
    done();
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

// Response Sanitization
function sanitizeResponse(data) {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    if (typeof data === 'object' && data !== null) {
        const sanitized = {...data};
        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.includes(key.toLowerCase())) {
                delete sanitized[key];
            }
        });
        return sanitized;
    }
    return data;
}

server.addHook('preSerialization', (request, reply, payload, done) => {
    done(null, sanitizeResponse(payload));
});

// Global error handler with correlation ID
server.setErrorHandler((error, request, reply) => {
    const errorLog = {
        reqId: request.id,
        correlationId: request.correlationId,
        url: request.url,
        method: request.method,
        statusCode: error.statusCode || 500,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    request.log.error(errorLog);

    reply.status(error.statusCode || 500).send({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : error.message,
        correlationId: request.correlationId
    });
});

// Add request validation hook
server.addHook('preValidation', (request, reply, done) => {
    if (request.method === 'POST' && !request.headers['content-type']?.includes('application/json')) {
        reply.code(400).send({error: 'Content-Type must be application/json'});
        return;
    }
    done();
});

// Add timestamp tracking and correlation ID
server.addHook('onRequest', (request, reply, done) => {
    const correlationId = request.headers['x-correlation-id'] || request.id;
    request.setCorrelationId(correlationId);
    reply.header('x-correlation-id', correlationId);

    request.startTime = Date.now();
    if (request.headers['content-length']) {
        request.log.info({
            reqId: request.id,
            correlationId: request.correlationId,
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
    console.log(sanitizedUrl);
    // Skip authentication for static files
    if (request.url.startsWith('/www/')) {
        done();
        return;
    }
    const routeExists = server.hasRoute({
        url: urlWithoutQuery,
        method: request.method
    });
    console.log(routeExists);
    if (!routeExists) {
        request.log.error({
            reqId: request.id,
            correlationId: request.correlationId,
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
            correlationId: request.correlationId,
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
        correlationId: request.correlationId,
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
        correlationId: request.correlationId,
        msg: 'Incoming request',
        url: request.url,
        method: request.method,
        ip: request.ips
    });
    done();
});

// Response logging hook with correlation ID
server.addHook('onResponse', (request, reply, done) => {
    const duration = Date.now() - request.startTime;
    const logData = {
        reqId: request.id,
        correlationId: request.correlationId,
        msg: 'Request completed',
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        duration: `${duration}ms`
    };
    request.log.info(logData);
    done();
});

// Register static file serving
server.register(fastifyStatic, {
    root: path.join(__dirname, 'www'),
    prefix: '/www/',
    decorateReply: false,
    serve: true,
    index: ['index.html', 'index.htm']
});


// Enhanced Health Check endpoint
server.get('/health', async (request, reply) => {
    try {
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            pid: process.pid,
            environment: process.env.NODE_ENV || 'development',
            serverInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                cpuArch: process.arch
            }
        };

        try {
            // Add your custom health checks here if needed
            health.dependencies = {
                status: 'OK'
            };
        } catch (error) {
            health.dependencies = {
                status: 'ERROR'
            };
            reply.code(503);
        }

        reply.send(health);
    } catch (error) {
        request.log.error('Health check failed:', error);
        reply.code(503).send({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'production' ?
                'Service Unavailable' :
                error.message
        });
    }
});

addUnAuthenticatedAPI('/ping');
server.get('/ping', async (request, reply) => {
    reply.send({status: 'OK'});
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
        const shutdownTimeout = setTimeout(() => {
            server.log.warn('Forced shutdown after timeout');
            process.exit(1);
        }, 30000);

        await server.close();
        clearTimeout(shutdownTimeout);
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
