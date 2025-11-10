const isProduction = process.env.NODE_ENV === 'production'; // eslint-disable-line no-undef

// Configuration object
const config = {
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outdir: 'build',
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
    '.woff': 'file',
    '.woff2': 'file',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'), // eslint-disable-line no-undef
  },
};

// Production-specific options
if (isProduction) {
  config.minify = true;
  config.sourcemap = false;
  config.define['process.env.REACT_APP_API_BASE_URL'] = JSON.stringify(process.env.REACT_APP_API_BASE_URL || 'https://your-api-url.com'); // eslint-disable-line no-undef
} else {
  // Development-specific options
  config.sourcemap = true;
  config.define['process.env.REACT_APP_API_BASE_URL'] = JSON.stringify('http://localhost:3000');
}

export default config;
