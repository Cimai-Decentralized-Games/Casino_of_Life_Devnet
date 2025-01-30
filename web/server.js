const { createServer } = require('http')
const { createServer: createHttpsServer } = require('https')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const { startGunHost, MainGun } = require('./gunHost')
const fs = require('fs')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST || 'cimai.biz'
const nextPort = parseInt(process.env.PORT, 10) || 3000
const gunHostPort = parseInt(process.env.GUN_PORT, 10) || 9000

const app = next({
  dev,
  dir: __dirname,
  conf: {
    distDir: '.next',
    configOrigin: 'next.config.js',
    useFileSystemPublicRoutes: true,
    generateEtags: true,
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    target: 'server',
    poweredByHeader: false, // Disable X-Powered-By header
    compress: true,
    assetPrefix: '',
    webpack: (config, options) => {
      config.resolve.alias['webpack-runtime'] = path.join(__dirname, '.next', 
'static', 'chunks', 'webpack-89f1b819d0bbb9cd.js');
      return config;
    }
  }
})

const handle = app.getRequestHandler()

// Rate limiter setup
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

let mainGun

app.prepare().then(async () => {
  try {
    mainGun = await startGunHost()
    console.log(`> Gun host is running on https${dev ? '' : 's'}://${hostname}:${gunHostPort}/gun`)

    // Initialize chat graph
    await mainGun.chain.get('chat').put({ initialized: true });

    // Use mainGun.chain to interact with your Gun database
    await mainGun.chain.models().put({ name: 'Test Model', data: 'Some data' })

    let server
    if (dev) {
      server = createServer(requestHandler)
    } else {
      const httpsOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
      }
      server = createHttpsServer(httpsOptions, requestHandler)
    }

    server.listen(nextPort, (err) => {
      if (err) throw err
      console.log(`> Next.js app ready on http${dev ? '' : 's'}://${hostname}:${nextPort}`)
    })
  } catch (err) {
    console.error('Failed to start Gun host:', err)
    process.exit(1)
  }
})

async function requestHandler(req, res) {
  try {
    // Apply security headers
    helmet()(req, res, () => {});

    if (req.url.startsWith('/api/gun')) {
      return handleGunApi(req, res)
    }

    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  } catch (err) {
    console.error('Error occurred handling', req.url, err)
    res.statusCode = 500
    res.end('Internal server error')
  }
}

function handleGunApi(req, res) {
  // Apply rate limiting to Gun API
  limiter(req, res, () => {
    const path = req.url.slice(9) // Remove '/api/gun' from the beginning
    console.log('Gun API request for path:', path); // Debug log

    if (path === '/chat') {
      if (req.method === 'GET') {
        // Get all chat messages
        const messages = [];
        mainGun.chain.get('chat').map().on((data, key) => {
          if (data) {
            messages.push({ ...data, key });
          }
        });

        // Wait a bit to collect messages before responding
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(messages));
        }, 100);

      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString() });
        req.on('end', async () => {
          try {
            const message = JSON.parse(body);
            const messageId = `msg_${Date.now()}`;
            
            // Store the message in Gun
            await mainGun.chain.get('chat').get(messageId).put(message);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id: messageId }));
          } catch (err) {
            console.error('Error handling chat message:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    } else {
      // Your existing general Gun API handling
      if (req.method === 'GET') {
        const watchStream = mainGun.chain.get(path).watch();
        let hasResponded = false;
        watchStream.subscribe(({value}) => {
          if (!hasResponded) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(value));
            hasResponded = true;
          }
        });
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString() });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            await mainGun.chain.get(path).put(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    }
  });
}
