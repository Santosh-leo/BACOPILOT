/**
 * AIAgent-BA Server Entry Point
 * Express server with crawling, extraction, LLM, and export services.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/screenshots', express.static(path.join(__dirname, '..', 'data', 'screenshots')));

app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 AIAgent-BA server running on http://localhost:${PORT}`);
});
