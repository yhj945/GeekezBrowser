const path = require('path');
const { generateXrayConfig } = require('../utils');

function resolveXrayBinary({ resourcesBin, platform = process.platform, arch = process.arch } = {}) {
    const platformArch = `${platform}-${arch}`;
    const binaryName = platform === 'win32' ? 'xray.exe' : 'xray';
    const binDir = path.join(resourcesBin, platformArch);
    return {
        binDir,
        binPath: path.join(binDir, binaryName),
        legacyBinDir: resourcesBin,
        legacyBinPath: path.join(resourcesBin, binaryName)
    };
}

function generateXrayCoreConfig(options) {
    return generateXrayConfig(
        options.mainProxyStr,
        options.localPort,
        options.preProxyConfig,
        options.profileFingerprint,
        options.dnsLeakProtection
    );
}

function getXraySpawnOptions(configPath, env = {}) {
    const resolved = resolveXrayBinary(env);
    return {
        command: resolved.binPath,
        args: ['-c', configPath],
        cwd: resolved.binDir,
        env: { ...process.env, XRAY_LOCATION_ASSET: env.resourcesBin }
    };
}

module.exports = {
    resolveXrayBinary,
    generateXrayCoreConfig,
    getXraySpawnOptions
};
