import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock Notion client to avoid API calls and errors
jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        databases: {
          query: jest.fn().mockResolvedValue({ results: [] }),
          retrieve: jest.fn().mockResolvedValue({ properties: {} }),
          update: jest.fn().mockResolvedValue({}),
        },
        pages: {
          create: jest.fn().mockResolvedValue({ id: 'test-id', properties: {} }),
          retrieve: jest.fn().mockResolvedValue({ id: 'test-id', properties: {} }),
          update: jest.fn().mockResolvedValue({ id: 'test-id', properties: {} }),
        },
      };
    }),
  };
});

// Set necessary environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NOTION_API_KEY = 'test-key';
process.env.NOTION_TRANSACTIONS_DB_ID = 'test-db';

// Import app AFTER mocks
const { app } = require('../../server');

describe('Security: Rate Limiting', () => {
  let token;

  beforeAll(() => {
    token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET);
  });

  it('should enforce rate limits on write endpoints', async () => {
    // The limit is 20 per minute.
    // We will make 20 requests and assert they don't return 429.
    // The 21st should return 429.

    const agent = request.agent(app);

    // Using an arbitrary valid payload structure to minimize 500s (though 500s are fine for this test)
    const payload = {
        amount: 100,
        merchant: 'Test Merchant',
        date: '2023-10-27',
        cardId: 'test-card'
    };

    const makeRequest = () =>
      agent
        .post('/api/transactions')
        .set('Cookie', [`token=${token}`])
        .send(payload);

    // Exhaust the limit (20 requests)
    for (let i = 0; i < 20; i++) {
      const res = await makeRequest();
      if (res.status === 429) {
          throw new Error(`Hit rate limit too early at request ${i + 1}`);
      }
    }

    // The 21st request should fail with 429 Too Many Requests
    const res = await makeRequest();
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/Too many data modification attempts/);
  });
});
