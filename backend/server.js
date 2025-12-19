require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { Client } = require('pg');
const admin = require('firebase-admin');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// १. Firebase Admin SDK Setup
// तुमची JSON फाईल याच फोल्डरमध्ये 'firebase-key.json' नावाने ठेवा
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

// २. नवीन नोटिफिकेशन API (Admin साठी)
app.post('/api/send-notification', async (req, res) => {
    const { title, body } = req.body;

    const message = {
        notification: { title: title, body: body },
        topic: 'all_farmers',
        android: {
            notification: {
                priority: 'high',
                sound: 'default'
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ३. जुने बाजार भाव API
app.get('/api/live-rates', async (req, res) => {
    const apiKey = '579b464db66ec23bdd0000016cb8fa246b134e146c91f1583ffdf900';
    const district = req.query.district || 'Nagpur'; 
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&filters[state]=Maharashtra&sort[arrival_date]=desc&limit=200`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const filteredData = data.records.filter(item => 
            item.district.toLowerCase() === district.toLowerCase()
        );

        const simplifiedData = filteredData.map(item => ({
            market: item.market,
            commodity: item.commodity,
            modal_price: item.modal_price,
            date: item.arrival_date
        }));

        res.json(simplifiedData);
    } catch (err) {
        res.status(500).json({ error: "डेटा एरर" });
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

client.connect()
    .then(() => {
        console.log('PostgreSQL Connected!');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('Connection error', err.stack));