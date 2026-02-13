#!/usr/bin/env node

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3500;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-file requests
app.use((req, res, next) => {
  // If request doesn't have an extension, serve index.html
  if (!path.extname(req.path)) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mubyn Dashboard running on http://localhost:${PORT}`);
  console.log(`   Open http://localhost:${PORT} to view it in your browser`);
});
