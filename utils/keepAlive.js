const https = require('https');

// Keep the app awake by pinging itself every 14 minutes
function keepAlive(url) {
    if (process.env.NODE_ENV !== 'production') {
        return; // Only run in production
    }

    setInterval(() => {
        https.get(url, (res) => {
            console.log(`Keep-alive ping: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error('Keep-alive error:', err.message);
        });
    }, 14 * 60 * 1000); // 14 minutes

    console.log('Keep-alive service started');
}

module.exports = keepAlive;
