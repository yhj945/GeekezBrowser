const fs = require('fs');
const { generateSingBoxConfig } = require('./sing-box-config');
const { resolveSingBoxBinary } = require('./sing-box-assets');

function generateSingBoxCoreConfig(options) {
    return generateSingBoxConfig(
        options.mainProxyStr,
        options.localPort,
        options.preProxyConfig,
        options.profileFingerprint,
        options.singBoxOptions
    );
}

function getSingBoxSpawnOptions(configPath, env = {}) {
    const resolved = resolveSingBoxBinary(env);
    const bundledBinary = resolved.binPath && fs.existsSync(resolved.binPath);
    return {
        command: bundledBinary ? resolved.binPath : 'sing-box',
        args: ['run', '-c', configPath],
        cwd: bundledBinary ? resolved.binDir : process.cwd(),
        env: { ...process.env }
    };
}

module.exports = {
    generateSingBoxCoreConfig,
    getSingBoxSpawnOptions
};
