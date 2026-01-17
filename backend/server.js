const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'FeetUp API is running...' });
});

// Database Connection Test
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: 'Database connection successful', result: rows[0].result });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

// -- PLACEHOLDER FOR FUTURE ROUTES (Auth, Products, Orders) --

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test DB at: http://localhost:${PORT}/test-db`);
});
