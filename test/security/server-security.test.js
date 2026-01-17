const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream } = require('stream/web');
global.ReadableStream = ReadableStream;

const { MessagePort } = require('worker_threads');
global.MessagePort = MessagePort;

const request = require('supertest');
const { app } = require('../../server'); // Adjust path as needed

// Mock Notion Client
jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        databases: {
          query: jest.fn().mockResolvedValue({ results: [], next_cursor: null }),
        },
      };
    }),
  };
});

// Mock JWT verification middleware to bypass auth
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn((token, secret, cb) => {
    cb(null, { user: 'test' });
  }),
}));

describe('Security: Input Validation', () => {

  // Need to set a dummy cookie to pass the "verifyToken" check
  const cookie = 'token=dummy_token';

  test('GET /api/transactions should reject invalid month format', async () => {
    const invalidMonths = ['ABCDEF', '2023', '20231', '2023133', 'YYYYMM', '12345!'];

    for (const month of invalidMonths) {
      const res = await request(app)
        .get(`/api/transactions?month=${month}`)
        .set('Cookie', [cookie]);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/month query parameter.*required/); // Matching current error msg
    }
  });

  test('GET /api/transactions should accept valid month format', async () => {
    const validMonth = '202301';

    const res = await request(app)
      .get(`/api/transactions?month=${validMonth}`)
      .set('Cookie', [cookie]);

    // Should be 200 OK (empty list mocked)
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/transactions should reject invalid filterBy values', async () => {
    const invalidFilters = ['injection', 'drop table', 'script', 'toString', 'constructor'];

    for (const filter of invalidFilters) {
      const res = await request(app)
        .get(`/api/transactions?month=202301&filterBy=${filter}`)
        .set('Cookie', [cookie]);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Invalid filterBy parameter/);
    }
  });
});
