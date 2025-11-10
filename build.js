import * as esbuild from 'esbuild';
import config from './esbuild.config.js';

esbuild.build(config).catch(() => process.exit(1)); // eslint-disable-line no-undef
