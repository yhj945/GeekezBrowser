const fs = require('fs');
const path = require('path');

const ARCH_NAMES = new Map([
    [0, 'ia32'],
    [1, 'x64'],
    [2, 'armv7l'],
    [3, 'arm64'],
    [4, 'universal']
]);

function normalizeArch(value) {
    if (typeof value === 'number') return ARCH_NAMES.get(value) || String(value);
    const raw = String(value || '').toLowerCase();
    if (raw === 'amd64') return 'x64';
    if (raw === 'aarch64') return 'arm64';
    return raw;
}

function findSingBoxResourceDirs(rootDir, maxDepth = 5) {
    const results = [];

    function walk(currentDir, depth) {
        if (depth > maxDepth) return;
        let entries;
        try {
            entries = fs.readdirSync(currentDir, { withFileTypes: true });
        } catch (e) {
            return;
        }

        if (
            path.basename(currentDir) === 'sing-box' &&
            path.basename(path.dirname(currentDir)) === 'bin' &&
            path.basename(path.dirname(path.dirname(currentDir))) === 'resources'
        ) {
            results.push(currentDir);
            return;
        }

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            walk(path.join(currentDir, entry.name), depth + 1);
        }
    }

    walk(rootDir, 0);
    return results;
}

function pruneSingBoxResources(context) {
    const platform = String(context.electronPlatformName || process.platform);
    const arch = normalizeArch(context.arch || process.arch);
    if (!['linux', 'win32', 'darwin'].includes(platform)) return;
    if (!['x64', 'arm64'].includes(arch)) return;

    const keepName = `${platform}-${arch}`;
    const singBoxDirs = findSingBoxResourceDirs(context.appOutDir);

    for (const singBoxDir of singBoxDirs) {
        for (const entry of fs.readdirSync(singBoxDir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const fullPath = path.join(singBoxDir, entry.name);
            if (entry.name === keepName) continue;
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        console.log(`[afterPack] sing-box resources pruned to ${keepName}`);
    }
}

module.exports = pruneSingBoxResources;
