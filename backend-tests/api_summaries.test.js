
// Polyfills for undici in Jest environment
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

if (!global.DOMException) {
    global.DOMException = class DOMException extends Error {
        constructor(message, name) {
            super(message);
            this.name = name || 'DOMException';
        }
    };
}

const request = require('supertest');
const { Client } = require('@notionhq/client');

// Mock the Notion Client
jest.mock('@notionhq/client', () => {
  const mClient = {
    pages: {
      retrieve: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    databases: {
      query: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
  };
  return { Client: jest.fn(() => mClient) };
});

describe('POST /api/summaries Validation', () => {
  let app;
  let notionMock;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    // Load server AFTER setting env and mocking
    const serverModule = require('../server');
    app = serverModule.app;

    // Get the mock instance
    notionMock = new Client();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Need to authenticate or bypass auth
  // server.js uses `app.use(verifyToken)` for all API routes except login/logout/verify-auth
  // So we need to mock verifyToken or sign a token.
  // Since verifyToken uses jwt.verify, we can create a valid token.
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ user: 'admin' }, 'test-secret');

  test('should return 400 if cardId is "undefined" string', async () => {
    notionMock.pages.retrieve.mockImplementation(({ page_id }) => {
        if (page_id === 'undefined') {
            const err = new Error('path failed validation: path.page_id should be a valid uuid, instead was "undefined".');
            err.code = 'validation_error';
            err.status = 400;
            throw err;
        }
        return Promise.resolve({ id: page_id, properties: {} });
    });

    const res = await request(app)
      .post('/api/summaries')
      .set('Cookie', [`token=${token}`])
      .send({
        cardId: 'undefined',
        month: '2023-10',
        ruleId: 'valid-rule-id'
      });

    // Currently it returns 500 because the error is caught and logged
    // We want it to be 400 with a specific error message about invalid ID
    // But currently it fails with 500 (or 400 from Notion error being rethrown? check secureLog or console.error in server.js)

    // In server.js:
    // catch (error) {
    //    console.error('Error in find-or-create summary:', error.body || error);
    //    res.status(500).json({ error: 'Failed to find or create summary' });
    // }

    // So we expect 500 currently. After fix, we expect 400.

    // Expect 400 Bad Request with specific error message
    expect(res.status).toBe(400);
    // The server should validate IDs before calling Notion
    expect(notionMock.pages.retrieve).not.toHaveBeenCalled();
  });

  test('should return 400 if ruleId is "undefined" string', async () => {
    notionMock.pages.retrieve.mockImplementation(({ page_id }) => {
        if (page_id === 'undefined') {
            const err = new Error('path failed validation: path.page_id should be a valid uuid, instead was "undefined".');
            err.code = 'validation_error';
            err.status = 400;
            throw err;
        }
        return Promise.resolve({ id: page_id, properties: {} });
    });

    const res = await request(app)
      .post('/api/summaries')
      .set('Cookie', [`token=${token}`])
      .send({
        cardId: 'valid-card-id',
        month: '2023-10',
        ruleId: 'undefined'
      });

    expect(res.status).toBe(400);
    expect(notionMock.pages.retrieve).not.toHaveBeenCalled();
  });
});
