const express = require('express');
const app = express();
const port = 8080;
const path = require('path');

// Serve static files from the 'public' directory (now one level up)
app.use(express.static(path.join(__dirname, '../public')));

// Parse JSON bodies
app.use(express.json());

// Set up routes
app.get('/api/data', (req, res) => {
  res.json({ message: 'Data retrieved successfully' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});