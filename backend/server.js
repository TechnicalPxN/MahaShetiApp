require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { Client } = require('pg'); 

const PORT = process.env.PORT || 3000; 
const connectionString = process.env.DATABASE_URL; 

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

// ✅ मिडलवेअर - CORS सर्वांसाठी खुला ठेवूया जेणेकरून अडचण येणार नाही
app.use(cors());
app.use(express.json());

// १. बेस रूट - चेक करण्यासाठी सर्व्हर चालू आहे का
app.get('/', (req, res) => {
    res.send('MahaSheti Backend is Live!');
});

// २. पिकांची माहिती (Crops)
app.get('/api/crops', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM crops'); // Small letters वापरा
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ३. बाजार दर (Rates)
app.get('/api/rates', async (req, res) => { 
    try {
        const result = await client.query('SELECT * FROM rates'); 
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ४. शासकीय योजना (Schemes)
app.get('/api/schemes', async (req, res) => { 
    try {
        const result = await client.query('SELECT * FROM schemes'); 
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// डेटाबेस कनेक्शन आणि सर्व्हर स्टार्ट
client.connect()
    .then(() => {
        console.log('PostgreSQL शी जोडले गेले आहे!');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('Connection error', err.stack));