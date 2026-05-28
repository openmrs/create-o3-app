const config = require('@openmrs/rspack-config');
const base = config.default ?? config;

// The 244 KiB asset-size budget rspack warns about isn't meaningful for O3
// modules: framework + Carbon design system push every bundle past it, so the
// hint just adds noise on every build. Disable it.
const disablePerformanceHints = (cfg) => ({
  ...cfg,
  performance: { ...(cfg.performance ?? {}), hints: false },
});

// `@openmrs/rspack-config` can export either an object or a function (it
// resolves env/argv lazily). Handle both shapes.
module.exports =
  typeof base === 'function' ? (...args) => disablePerformanceHints(base(...args)) : disablePerformanceHints(base);
