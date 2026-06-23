const path = require('path');

function getSingBoxExecutableName(platform = process.platform) {
    return platform === 'win32' ? 'sing-box.exe' : 'sing-box';
}

function resolveSingBoxAssetDir({ resourcesBin, platform = process.platform, arch = process.arch } = {}) {
    if (!['linux', 'win32', 'darwin'].includes(platform)) return null;
    if (!['x64', 'arm64'].includes(arch)) return null;
    return path.join(resourcesBin, 'sing-box', `${platform}-${arch}`);
}

function resolveSingBoxBinary({ resourcesBin, platform = process.platform, arch = process.arch } = {}) {
    const binDir = resolveSingBoxAssetDir({ resourcesBin, platform, arch });
    if (!binDir) return { binDir: null, binPath: null };
    return {
        binDir,
        binPath: path.join(binDir, getSingBoxExecutableName(platform))
    };
}

function getSingBoxVersionArgs() {
    return ['version'];
}

module.exports = {
    getSingBoxExecutableName,
    resolveSingBoxAssetDir,
    resolveSingBoxBinary,
    getSingBoxVersionArgs
};
