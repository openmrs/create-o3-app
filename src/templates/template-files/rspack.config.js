const config = require('openmrs/default-rspack-config');

// The 244 KiB asset-size budget rspack warns about isn't meaningful for O3
// modules: framework + Carbon design system push every bundle past it, so the
// hint just adds noise on every build. Disable it.
config.overrides.performance = { hints: false };

module.exports = config;
