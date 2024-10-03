//@ts-check
const path = require('path');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore warnings from Gun.js
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/gun/ },
    ];
    
    config.externals = [...(config.externals || []), 'bigint', 'node-gyp-build'];

    // This allows you to use both CommonJS and ES modules
    config.module.rules.push({
      test: /\.m?js/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Add alias for @ to point to the web directory
    config.resolve.alias['@'] = path.join(__dirname, '.');

    // Add alias for the anchor project
    config.resolve.alias['@casino-of-life-dashboard/anchor'] = path.join(__dirname, '..', 'anchor');

    // Enhance module resolution
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.join(__dirname, '..'), // Add parent directory to module search path
      'node_modules'
    ];

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
        'text-encoding': require.resolve('text-encoding'),
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
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);