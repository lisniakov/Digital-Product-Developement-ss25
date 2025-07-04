const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// turn OFF the new “package-exports” resolver
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
