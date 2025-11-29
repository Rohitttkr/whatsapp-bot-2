const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');
const express = require('express');

const app = express();

// ------------------ Express Server ------------------
app.get('/', (req, res) => {
    res.send('✅ WhatsApp bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ------------------ WhatsApp Bot ------------------
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true } // background mode
});

// QR code for first time login
client.on('qr', qr => {
    console.log('Scan this QR code:');
    qrcode.generate(qr, { small: true });
});

// Bot ready
client.on('ready', () => {
    console.log('✅ WhatsApp bot is ready!');
    scheduleMessages();
});

// Function to send message
async function sendMessage(numberOrGroupId, message) {
    try {
        await client.sendMessage(numberOrGroupId, message);
        console.log(`✅ Message sent to ${numberOrGroupId}`);
    } catch (err) {
        console.log('❌ Error sending message:', err);
    }
}

// Schedule messages based on messages.json
function scheduleMessages() {
    const messages = JSON.parse(fs.readFileSync('messages.json', 'utf-8'));

    messages.forEach(item => {
        const [hour, minute] = item.time.split(':');

        // Cron format: 'm h * * *'
        const cronTime = `${minute} ${hour} * * *`;

        cron.schedule(cronTime, () => {
            sendMessage(item.number, item.message);
        });

        console.log(`Scheduled message to ${item.number} at ${item.time}`);
    });
}

// Start WhatsApp client
client.initialize();
