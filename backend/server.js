// server.js (UPDATED for PostgreSQL and Render Deployment)

// 1. आवश्यक मॉड्यूल्स लोड करा (Load required modules)
require('dotenv').config(); // .env फाइल लोड करण्यासाठी (लोकल टेस्टिंगसाठी)
const express = require('express');
const app = express();
const cors = require('cors');

// ✅ PostgreSQL साठी 'pg' मॉड्यूल वापरा
const { Client } = require('pg'); 

// 2. सर्व्हर पोर्ट आणि डेटाबेस क्रेडेंशियल्स (Server Port and DB Credentials)
// Render स्वयंचलितपणे PORT सेट करते (उदा. 10000)
const PORT = process.env.PORT || 3000; 

// ✅ Render Environment Variable (DATABASE_URL) वापरा
const connectionString = process.env.DATABASE_URL; 

// 3. डेटाबेस कनेक्शन कॉन्फिगरेशन
if (!connectionString) {
    console.error("DATABASE_URL Environment Variable सेट नाही. कृपया Render सेटिंग्ज तपासा.");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    // Render वापरत असल्याने, SSL आवश्यक आहे
    ssl: {
        rejectUnauthorized: false 
    }
});

// 4. डेटाबेस कनेक्शन आणि स्कीमा इनिशिएलायझेशन फंक्शन (Connect DB & Initialize Schema)
async function connectDB() {
    try {
        await client.connect();
        console.log('बॅकएंड सर्व्हर सुरू: PostgreSQL डेटाबेसशी यशस्वीरित्या जोडले।');

        // 5. आवश्यक टेबल तयार करा (CREATE TABLE IF NOT EXISTS)
        // PostgreSQL स्कीमा इनिशिएलायझेशन (DB मध्ये टेबल्स नसतील तर तयार करा)
        await client.query(`
            CREATE TABLE IF NOT EXISTS Crops (id SERIAL PRIMARY KEY, name VARCHAR(255), info TEXT);
            CREATE TABLE IF NOT EXISTS Market_Rates (id SERIAL PRIMARY KEY, crop_name VARCHAR(255), rate NUMERIC);
            CREATE TABLE IF NOT EXISTS Schemes (id SERIAL PRIMARY KEY, scheme_name VARCHAR(255), details TEXT);
        `);
        console.log('डेटाबेस टेबल्स यशस्वीरित्या तयार केल्या (if not exists).');
    } catch (err) {
        console.error(`डेटाबेसशी जोडणी करण्यात अंतिम त्रुटी (Final Error): ${err.message}`);
        console.error('कृपया DATABASE_URL आणि डेटाबेस उपलब्धता तपासा.');
        // प्रोसेस थांबवा
        process.exit(1); 
    }
}

// 6. एक्सप्रेस मिडलवेअर (Express Middleware)
// ✅ Cors मध्ये GitHub Pages URL जोडणे आवश्यक आहे
const allowedOrigins = ['https://technicalpxn.github.io', 'http://localhost:8080', 'http://127.0.0.1:8080']; 
const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json()); // JSON बॉडीज पार्स करण्यासाठी
app.use(express.urlencoded({ extended: true }));

// 7. रूट (Routes)

// A. बेस रूट 
app.get('/', (req, res) => {
    res.status(200).send('Welcome to the MahaShetiApp Backend! Server is running and connected to PostgreSQL.');
});

// B. पिकांची माहिती (Crops Data)
app.get('/api/crops', async (req, res) => {
    try {
        // PostgreSQL मध्ये क्वेरी
        const result = await client.query('SELECT * FROM Crops');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send({ message: 'Error fetching crops data.', error: err.message });
    }
});

// C. बाजार दर (Market Rates Data)
app.get('/api/rates', async (req, res) => { 
    try {
        // PostgreSQL मध्ये क्वेरी
        const result = await client.query('SELECT * FROM Market_Rates'); 
        res.json(result.rows);
    } catch (err) {
        res.status(500).send({ message: 'Error fetching market rates data.', error: err.message });
    }
});

// D. शासकीय योजना (Schemes Data)
app.get('/api/schemes', async (req, res) => { 
    try {
        // PostgreSQL मध्ये क्वेरी
        const result = await client.query('SELECT * FROM Schemes'); 
        res.json(result.rows);
    } catch (err) {
        res.status(500).send({ message: 'Error fetching schemes data.', error: err.message });
    }
});


// 8. सर्व्हर सुरू करा (Start the Server)
connectDB().then(() => {
    app.listen(PORT, () => {
        // Render वर लाईव्ह झाल्यावर, ही URL तुमच्या Render URL द्वारे बदलली जाईल.
        console.log(`Node.js सर्व्हर http://localhost:${PORT} वर सुरू झाला आहे।`);
    });
});