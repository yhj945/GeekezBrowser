const MANAGED_EXTENSION_ARG_NAMES = new Set([
    '--load-extension',
    '--disable-extensions-except'
]);

function getArgName(arg) {
    return String(arg || '').split('=')[0];
}

function parseCustomLaunchArgs(rawValue) {
    return String(rawValue || '')
        .split(/[\n\s]+/)
        .map(arg => arg.trim())
        .filter(arg => arg && arg.startsWith('--'))
        .filter(arg => !MANAGED_EXTENSION_ARG_NAMES.has(getArgName(arg)));
}

module.exports = {
    parseCustomLaunchArgs
};
