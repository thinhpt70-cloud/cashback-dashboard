
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

describe('Transactions API - Undefined String Handling', () => {
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

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ user: 'admin' }, 'test-secret');

  test('POST /api/transactions should omit cardId if it is "undefined" string', async () => {
    notionMock.pages.create.mockResolvedValue({ id: 'new-tx-id', properties: {} });
    notionMock.pages.retrieve.mockResolvedValue({ id: 'new-tx-id', properties: {} });

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`token=${token}`])
      .send({
        merchant: 'Test Merchant',
        amount: 100,
        date: '2023-10-27',
        cardId: 'undefined'
      });

    expect(res.status).toBe(201);
    const createCall = notionMock.pages.create.mock.calls[0][0];
    expect(createCall.properties['Card']).toBeUndefined();
  });

  test('POST /api/transactions should omit applicableRuleId if it is "undefined" string', async () => {
    notionMock.pages.create.mockResolvedValue({ id: 'new-tx-id', properties: {} });
    notionMock.pages.retrieve.mockResolvedValue({ id: 'new-tx-id', properties: {} });

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', [`token=${token}`])
      .send({
        merchant: 'Test Merchant',
        amount: 100,
        date: '2023-10-27',
        cardId: 'valid-card',
        applicableRuleId: 'undefined'
      });

    expect(res.status).toBe(201);
    const createCall = notionMock.pages.create.mock.calls[0][0];
    expect(createCall.properties['Applicable Rule']).toBeUndefined();
  });

  test('PATCH /api/transactions/:id should omit cardId if it is "undefined" string', async () => {
    notionMock.pages.update.mockResolvedValue({ id: 'tx-id', properties: {} });
    notionMock.pages.retrieve.mockResolvedValue({ id: 'tx-id', properties: {} });

    const res = await request(app)
      .patch('/api/transactions/tx-id')
      .set('Cookie', [`token=${token}`])
      .send({
        cardId: 'undefined',
        amount: 200
      });

    expect(res.status).toBe(200);
    const updateCall = notionMock.pages.update.mock.calls[0][0];
    expect(updateCall.properties['Card']).toBeUndefined();
    expect(updateCall.properties['Amount']).toBeDefined();
  });

  test('PATCH /api/transactions/:id should omit applicableRuleId if it is "undefined" string', async () => {
    notionMock.pages.update.mockResolvedValue({ id: 'tx-id', properties: {} });
    notionMock.pages.retrieve.mockResolvedValue({ id: 'tx-id', properties: {} });

    const res = await request(app)
      .patch('/api/transactions/tx-id')
      .set('Cookie', [`token=${token}`])
      .send({
        applicableRuleId: 'undefined',
        notes: 'Updated note'
      });

    expect(res.status).toBe(200);
    const updateCall = notionMock.pages.update.mock.calls[0][0];
    expect(updateCall.properties['Applicable Rule']).toBeUndefined();
    expect(updateCall.properties['Notes']).toBeDefined();
  });
});
