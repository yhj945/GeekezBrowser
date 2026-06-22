const MANAGED_LAUNCH_ARG_NAMES = new Set([
    '--load-extension',
    '--disable-extensions-except',
    '--proxy-server',
    '--no-proxy-server',
    '--proxy-bypass-list',
    '--proxy-pac-url',
    '--proxy-auto-detect',
    '--disable-quic',
    '--enable-quic',
    '--dns-prefetch-disable',
    '--host-resolver-rules',
    '--disable-async-dns',
    '--disable-ipv6',
    '--enable-features',
    '--disable-features'
]);

function getArgName(arg) {
    return String(arg || '').split('=')[0];
}

function isManagedLaunchArg(arg) {
    return MANAGED_LAUNCH_ARG_NAMES.has(getArgName(arg));
}

function filterManagedLaunchArgs(args) {
    return (Array.isArray(args) ? args : []).filter(arg => !isManagedLaunchArg(arg));
}

function parseCustomLaunchArgs(rawValue) {
    const args = String(rawValue || '')
        .split(/[\n\s]+/)
        .map(arg => arg.trim())
        .filter(arg => arg && arg.startsWith('--'));
    return filterManagedLaunchArgs(args);
}

module.exports = {
    filterManagedLaunchArgs,
    parseCustomLaunchArgs
};
