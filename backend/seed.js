const { Pool } = require('pg');

const connectionString = 'postgresql://mahashetiapp_db_user:oNMNoDKxzq2U2C3BLBKQckvm6nQDmObA@dpg-d50hjrv5r7bs739er84g-a.oregon-postgres.render.com/mahashetiapp_db?ssl=true';

const pool = new Pool({
    connectionString: connectionString,
});

const seedData = async () => {
    try {
        console.log("टेबल्स रीसेट आणि डेटा भरण्यास सुरुवात होत आहे...");

        // १. जुने टेबल्स काढून टाकणे आणि नवीन योग्य टेबल्स तयार करणे
        await pool.query(`
            DROP TABLE IF EXISTS crops, schemes, rates;

            CREATE TABLE crops (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                season VARCHAR(100),
                information TEXT
            );

            CREATE TABLE schemes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                benefit TEXT,
                eligibility TEXT
            );

            CREATE TABLE rates (
                id SERIAL PRIMARY KEY,
                crop_name VARCHAR(255),
                market VARCHAR(255),
                price VARCHAR(100)
            );
        `);

        console.log("✅ टेबल्स तयार झाले. आता माहिती भरत आहे...");

        // २. पिकांची माहिती भरणे
        await pool.query(`INSERT INTO crops (name, season, information) VALUES 
            ('गहू', 'रब्बी', 'गव्हाचे पीक थंड हवामानात चांगले येते.'),
            ('कापूस', 'खरीप', 'महाराष्ट्रातील काळी जमीन कापसासाठी उत्तम आहे.')`);

        // ३. शासकीय योजना भरणे
        await pool.query(`INSERT INTO schemes (name, benefit, eligibility) VALUES 
            ('पीक विमा योजना', 'नैसर्गिक आपत्तीत आर्थिक मदत', 'सर्व शेतकरी'),
            ('नमो शेतकरी महासन्मान', 'वार्षिक ६००० रुपये', 'अल्पभूधारक शेतकरी')`);

        // ४. बाजार दर भरणे
        await pool.query(`INSERT INTO rates (crop_name, market, price) VALUES 
            ('सोयाबीन', 'लातूर', '५२००'),
            ('कांदा', 'नाशिक', '२८००')`);

        console.log("🚀 सर्व डेटा यशस्वीरित्या भरला गेला आहे!");
        process.exit();
    } catch (err) {
        console.error("❌ त्रुटी:", err);
        process.exit(1);
    }
};

seedData();