const serverless = require('serverless-http');
// 1. This line imports the main 'app' object from your server.js file.
// The '../../' path goes up two directories from /netlify/functions/ to the project root.
const { app } = require('../../server');

// 2. This line wraps your entire Express application in a serverless handler.
// This is the standard way to make an Express app work with Netlify Functions.
module.exports.handler = serverless(app);

