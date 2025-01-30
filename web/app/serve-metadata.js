const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const startPort = 4000;  // Changed to start at 4000
const maxPort = 4010;    // Changed to max at 4010

function findOpenPort(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      server.close(() => resolve(port));
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        if (port < maxPort) {
          resolve(findOpenPort(port + 1));
        } else {
          reject(new Error('No open ports found'));
        }
      } else {
        reject(err);
      }
    });
  });
}

async function serveMetadata() {
  const port = await findOpenPort(startPort);
  const metadataPath = path.join(__dirname, 'metadata_subzerosmol.json');

  app.get('/metadata', (req, res) => {
    res.sendFile(metadataPath);
  });

  app.listen(port, () => {
    console.log(`Metadata server running at http://localhost:${port}/metadata`);
    console.log(`Use this URL in your metadata: http://localhost:${port}/metadata`);
  });
}

serveMetadata().catch(console.error);