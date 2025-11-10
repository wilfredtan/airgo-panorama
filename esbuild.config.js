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
} else {
  // Development-specific options
  config.sourcemap = true;
}

export default config;
