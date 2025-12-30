const { ethers } = require('ethers');
const request = require('supertest');

const db = require('../database/db');
const { app } = require('../server');

describe('Authentication API', () => {
  let testWallet;

  beforeAll(async () => {
    // Initialize database
    await db.initializeDatabase();

    // Create test wallet
    testWallet = ethers.Wallet.createRandom();
  });

  afterAll(async () => {
    // Cleanup test data
    if (db.pool) {
      await db.pool.end();
    }
  });

  describe('POST /api/auth/nonce', () => {
    it('should return a nonce for valid wallet address', async () => {
      const res = await request(app)
        .post('/api/auth/nonce')
        .send({ walletAddress: testWallet.address });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('nonce');
      expect(typeof res.body.nonce).toBe('string');
    });

    it('should reject invalid wallet address', async () => {
      const res = await request(app)
        .post('/api/auth/nonce')
        .send({ walletAddress: 'invalid-address' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing wallet address', async () => {
      const res = await request(app).post('/api/auth/nonce').send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should authenticate with valid signature', async () => {
      // Get nonce
      const nonceRes = await request(app)
        .post('/api/auth/nonce')
        .send({ walletAddress: testWallet.address });

      const nonce = nonceRes.body.nonce;

      // Sign nonce
      const message = `Blockrent Login\n\nNonce: ${nonce}\nWallet: ${testWallet.address}`;
      const signature = await testWallet.signMessage(message);

      // Verify signature
      const res = await request(app).post('/api/auth/verify').send({
        walletAddress: testWallet.address,
        signature: signature,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sessionId');
      expect(res.body).toHaveProperty('user');
    });

    it('should reject invalid signature', async () => {
      const res = await request(app).post('/api/auth/verify').send({
        walletAddress: testWallet.address,
        signature: '0xinvalid',
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
