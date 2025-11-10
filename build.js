import * as esbuild from 'esbuild';
import config from './esbuild.config.js';

// Get API URL from command line argument or environment variable
const apiUrl = process.argv[2] || process.env.REACT_APP_API_BASE_URL; // eslint-disable-line no-undef

// Override the API URL in the config if provided
if (apiUrl) {
  config.define['process.env.REACT_APP_API_BASE_URL'] = JSON.stringify(apiUrl);
}

esbuild.build(config).catch(() => process.exit(1)); // eslint-disable-line no-undef
