const { webpackConfig } = require('@openmrs/webpack-config');

// See rspack.config.js for the rationale: O3 modules can't realistically hit
// the default 244 KiB asset-size budget, so the hint just adds noise.
const disablePerformanceHints = (cfg) => ({
  ...cfg,
  performance: { ...(cfg.performance ?? {}), hints: false },
});

module.exports =
  typeof webpackConfig === 'function'
    ? (...args) => disablePerformanceHints(webpackConfig(...args))
    : disablePerformanceHints(webpackConfig);
