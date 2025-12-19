require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { Client } = require('pg');
const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// १. Firebase Admin SDK Setup
const serviceAccount = require("./firebase-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const PORT = process.env.PORT || 3000; 
const connectionString = process.env.DATABASE_URL; 

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// २. नोटिफिकेशन API
app.post('/api/send-notification', async (req, res) => {
    const { title, body } = req.body;
    const message = {
        notification: { title: title, body: body },
        topic: 'all_farmers',
        android: { notification: { priority: 'high', sound: 'default' } }
    };
    try {
        const response = await admin.messaging().send(message);
        res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ३. सुधारित बाजार भाव API (Error Fix)
app.get('/api/live-rates', async (req, res) => {
    // ही API Key आणि URL परभणी/महाराष्ट्र डेटासाठी ऑप्टिमाइझ केली आहे
    const apiKey = '579b464db66ec23bdd0000016cb8fa246b134e146c91f1583ffdf900';
    const district = req.query.district || 'Parbhani'; 
    
    // आम्ही फिल्टर थेट URL मध्ये लावला आहे जेणेकरून अचूक डेटा मिळेल
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&filters[state]=Maharashtra&filters[district]=${district}`;

    try {
        console.log(`बाजार भाव शोधत आहे: ${district}`);
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.records || data.records.length === 0) {
            // जर डेटा नसेल तर एरर देण्याऐवजी रिकामा लिस्ट पाठवा
            return res.json([]); 
        }

        const simplifiedData = data.records.map(item => ({
            market: item.market,
            commodity: item.commodity,
            modal_price: item.modal_price,
            date: item.arrival_date
        }));

        res.json(simplifiedData);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ error: "API सर्व्हर प्रतिसाद देत नाही" });
    }
});

// ४. जुने स्कीम्स आणि क्रॉप्स API
app.get('/api/crops', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM crops'); 
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/schemes', async (req, res) => { 
    try {
        const result = await client.query('SELECT * FROM schemes'); 
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ५. सर्व्हर सुरू करा
app.get('/', (req, res) => res.send('MahaSheti Backend is Live! ✅'));

client.connect()
    .then(() => {
        console.log('PostgreSQL Connected!');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('Connection error', err.stack));