const { app } = require('./server'); // Import the app
const http = require('http');

async function verify() {
    // Start the server
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(3002, resolve)); // Use a different port
    const baseUrl = 'http://localhost:3002';

    try {
        // 1. Login to get token
        const loginRes = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: process.env.ACCESS_PASSWORD })
        });

        if (!loginRes.ok) throw new Error('Login failed');

        // Get the cookie from the response (Node fetch doesn't handle cookies auto like browser)
        // We need to extract the set-cookie header and pass it
        const cookies = loginRes.headers.get('set-cookie');

        // 2. Fetch Monthly Summary
        console.log("Fetching Monthly Summary...");
        const res = await fetch(`${baseUrl}/api/monthly-summary`, {
            headers: { 'Cookie': cookies }
        });

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const data = await res.json();

        if (data.length > 0) {
            console.log("First record keys:", Object.keys(data[0]));
            if ('reviewed' in data[0]) {
                console.log("SUCCESS: 'reviewed' property FOUND.");
                console.log("Value:", data[0].reviewed);
            } else {
                console.log("FAIL: 'reviewed' property NOT found.");
            }
        } else {
            console.log("No monthly summary records found to verify.");
        }

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        server.close();
    }
}

verify();
