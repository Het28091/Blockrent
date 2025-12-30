// Jest setup file
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'blockrent_test';
process.env.JWT_SECRET = 'test_jwt_secret_32_characters_long_for_testing';
process.env.SESSION_SECRET = 'test_session_secret_32_chars_long_test';
process.env.PORT = 5001; // Different port for tests
