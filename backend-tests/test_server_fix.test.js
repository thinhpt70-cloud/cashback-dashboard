const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream } = require('stream/web');
global.ReadableStream = ReadableStream;
const { Blob, File } = require('buffer');
global.Blob = Blob;
global.File = File;

const { MessageChannel, MessagePort } = require('worker_threads');
global.MessageChannel = MessageChannel;
global.MessagePort = MessagePort;

// Polyfill DOMException
if (typeof global.DOMException === 'undefined') {
    try {
        global.DOMException = require('node-domexception');
    } catch (e) {
        // Simple polyfill if package missing
        global.DOMException = class DOMException extends Error {
            constructor(message, name) {
                super(message);
                this.name = name || 'Error';
            }
        };
    }
}

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server'); // Import app from server.js

// Mock process.env
process.env.NOTION_API_KEY = 'mock_key';
process.env.JWT_SECRET = 'mock_secret';

describe('POST /api/summaries', () => {
    let token;

    beforeAll(() => {
        token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET);
    });

    it('should return 400 if ruleId is "undefined"', async () => {
        const res = await request(app)
            .post('/api/summaries')
            .set('Cookie', `token=${token}`)
            .send({
                cardId: 'valid_card_id',
                month: '2023-10',
                ruleId: 'undefined'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('cardId, month, and ruleId are required');
    });

    it('should return 400 if cardId is "undefined"', async () => {
        const res = await request(app)
            .post('/api/summaries')
            .set('Cookie', `token=${token}`)
            .send({
                cardId: 'undefined',
                month: '2023-10',
                ruleId: 'valid_rule_id'
            });

        expect(res.statusCode).toEqual(400);
    });

    it('should return 400 if month is missing', async () => {
        const res = await request(app)
            .post('/api/summaries')
            .set('Cookie', `token=${token}`)
            .send({
                cardId: 'valid_card_id',
                ruleId: 'valid_rule_id'
            });

        expect(res.statusCode).toEqual(400);
    });
});
