// server.js

// 1. आवश्यक मॉड्यूल्स लोड करा (Load required modules)
require('dotenv').config(); // .env फाइल लोड करण्यासाठी
const express = require('express');
const app = express();
const sql = require('mssql');
const cors = require('cors');

// 2. सर्व्हर पोर्ट आणि डेटाबेस क्रेडेंशियल्स (Server Port and DB Credentials)
const PORT = process.env.PORT || 3000;

// 3. डेटाबेस कॉन्फिगरेशन (Database Configuration)
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.SQL_SERVER, 
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Dev/Local environment साठी false सेट करा
        trustServerCertificate: true // Self-signed certificates साठी
    }
};

// 4. डेटाबेस कनेक्शन फंक्शन (Database Connection Function)
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log('बॅकएंड सर्व्हर सुरू: MSSQL डेटाबेसशी यशस्वीरित्या जोडले।');
    } catch (err) {
        console.error(`डेटाबेसशी जोडणी करण्यात अंतिम त्रुटी (Final Error): ${err.message}`);
        console.error('कृपया पुढील गोष्टी तपासा: Server Name, DB User, DB Password');
        // प्रोसेस थांबवा (Stop process) जर कनेक्शन अयशस्वी झाले
        process.exit(1); 
    }
}

// 5. एक्सप्रेस मिडलवेअर (Express Middleware)
const allowedOrigins = ['http://localhost:8080','http://127.0.0.1:8080',]; 
const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json()); // JSON बॉडीज पार्स करण्यासाठी
app.use(express.urlencoded({ extended: true }));

// 6. रूट (Routes)

// A. बेस रूट (Base Root) - 'Cannot GET /' त्रुटी टाळण्यासाठी
app.get('/', (req, res) => {
    res.status(200).send('Welcome to the MahaShetiApp Backend! Server is running and connected.');
});

// B. उदाहरण API रूट (Example API Route)
app.get('/api/crops', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM dbo.Crops`; // 'Users' हे तुमच्या टेबलचे नाव बदला
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: 'Error fetching users from database.', error: err.message });
    }
});
// C. बाजार दर (Market Rates Data)
app.get('/api/rates', async (req, res) => { // <--- रूट (/api/rates) असाच असावा!
    try {
        // SQL क्वेरीमध्ये टेबलचे नाव बरोबर असल्याची खात्री करा
        const result = await sql.query`SELECT * FROM dbo.Market_Rates`; 
        res.json(result.recordset);
    } catch (err) {
        // जर डेटाबेसमध्ये 'Market_Rates' टेबल सापडला नाही
        res.status(500).send({ message: 'Error fetching market rates data.', error: err.message });
    }
});

// D. शासकीय योजना (Schemes Data)
app.get('/api/schemes', async (req, res) => { // <--- 'schemes' स्पेलिंग तपासा
    try {
        // SQL क्वेरीमध्ये टेबलचे नाव बरोबर असल्याची खात्री करा
        const result = await sql.query`SELECT * FROM dbo.Schemes`; 
        res.json(result.recordset);
    } catch (err) {
        // जर डेटाबेसमध्ये 'Schemes' टेबल सापडला नाही
        res.status(500).send({ message: 'Error fetching schemes data.', error: err.message });
    }
});


// 7. सर्व्हर सुरू करा (Start the Server)
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Node.js सर्व्हर http://localhost:${PORT} वर सुरू झाला आहे।`);
    });
});