//@ts-check
const path = require('path');
const webpack = require('webpack');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Remove the 'output: 'export'' line to allow for server-side rendering
  distDir: 'dist/web',
  webpack: (config, { isServer, dev }) => {
    console.log(`Webpack build: isServer: ${isServer}, dev: ${dev}`);

    // Add webpack plugin to handle text-encoding
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /\/lib\/text-encoding$/,
        require.resolve('fast-text-encoding')
      ),
      // Add this new plugin to handle pino-pretty
      new webpack.NormalModuleReplacementPlugin(
        /pino-pretty/,
        path.join(__dirname, 'src/mocks/pino-pretty.js')
      )
    );

    // Ignore warnings from Gun.js and other modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/gun/ },
      { module: /node_modules\/pino/ },
    ];

    // Combine all externals in one place
    config.externals = [
      ...(config.externals || []),
      'bigint',
      'node-gyp-build',
      'encoding',
      'text-encoding',
      'lokijs',
      '@reown/appkit',
      '@reown/appkit-adapter-solana',
      { 'pino-pretty': 'commonjs pino-pretty' },
      { 'ws': 'WebSocket' }
    ];

    // Configure aliases for text-encoding and other modules
     // config.resolve.alias = {
    //    ...config.resolve.alias,
    //    '@': path.join(__dirname, '.'),
    //    '@casino-of-life-dashboard/anchor': path.join(__dirname, '..', 'anchor')
     // };

    // This allows you to use both CommonJS and ES modules
    config.module.rules.push({
      test: /\.m?js/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

        // Add CSS module support
      config.module.rules.push({
        test: /\.css$/,
        use: [
        'style-loader',
        'css-loader',
        ],
       });

    // Enhance module resolution
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.join(__dirname, '..'), // Add parent directory to module search path
      'node_modules'
    ];

    // Handle WebSocket and other aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      'ws': require.resolve('ws/browser.js'),
    };

    // Add fallbacks for Node.js core modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url/'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert/'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        punycode: require.resolve('punycode/'),
        '@mapbox/node-pre-gyp': false,
        'mock-aws-s3': false,
        nock: false,
        child_process: false,
        module: false,
        encoding: false,
        lokijs: false,
        'pino-pretty': false,
        ws: false
      };
    }

    return config;
  },
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  // Add this to handle ES module packages
  experimental: {
    esmExternals: 'loose',
  },
  // Add this new section for headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "connect-src 'self' https: wss: ws: data:;",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
              "style-src 'self' 'unsafe-inline';",
              "img-src 'self' data: https:;",
              "font-src 'self' data:;"
            ].join(' ')
          }
        ],
      }
    ];
  },
};

console.log('Next.js config loaded:', nextConfig);

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);