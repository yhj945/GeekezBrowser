const fs = require('fs');
const os = require('os');
const path = require('path');
const AdmZip = require('adm-zip');

const BUNDLED_BASENAMES = {
    darwin: ['Google Chrome for Testing'],
    linux: ['chrome', 'google-chrome', 'chromium', 'chromium-browser'],
    win32: ['chrome.exe']
};

const PATH_CANDIDATES = {
    darwin: ['Google Chrome for Testing', 'Google Chrome'],
    linux: ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium', 'chrome'],
    win32: ['chrome.exe', 'chrome']
};

const CHROMIUM_CACHE_ENV = 'GEEKEZ_CHROMIUM_CACHE_DIR';
const CACHE_COMPLETE_MARKER = '.geekez-chromium-extracted.json';

const BUNDLED_EXECUTABLE_BASENAMES = {
    darwin: [...BUNDLED_BASENAMES.darwin, 'chrome_crashpad_handler'],
    linux: [...BUNDLED_BASENAMES.linux, 'chrome-wrapper', 'chrome_crashpad_handler', 'chrome_sandbox'],
    win32: [...BUNDLED_BASENAMES.win32]
};

function isExecutableFile(filePath, platform = process.platform) {
    if (!filePath) return false;
    try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) return false;
        if (platform === 'win32') return true;
        fs.accessSync(filePath, fs.constants.X_OK);
        return true;
    } catch (error) {
        return false;
    }
}

function scoreBundledCandidate(filePath, platform = process.platform) {
    const normalized = filePath.toLowerCase();
    let score = 0;

    if (platform === 'darwin') {
        if (filePath.endsWith(path.join('Contents', 'MacOS', 'Google Chrome for Testing'))) score += 200;
        if (normalized.includes('google chrome for testing.app')) score += 100;
    } else if (platform === 'linux') {
        if (path.basename(filePath) === 'chrome') score += 200;
        if (normalized.includes('chrome-linux')) score += 100;
        if (normalized.includes('chrome-for-testing')) score += 50;
    } else if (platform === 'win32') {
        if (path.basename(filePath).toLowerCase() === 'chrome.exe') score += 200;
        if (normalized.includes('chrome-win')) score += 100;
    }

    return score;
}

function getChromiumCacheDir(env = process.env) {
    if (env[CHROMIUM_CACHE_ENV]) return env[CHROMIUM_CACHE_ENV];
    return path.join(os.homedir(), '.cache', 'geekez-browser', 'chromium');
}

function findBundledChromiumPath(basePath, platform = process.platform) {
    if (!basePath || !fs.existsSync(basePath)) return null;

    const basenames = new Set(BUNDLED_BASENAMES[platform] || []);
    let bestMatch = null;

    function walk(dir, depth = 0) {
        if (depth > 8) return;

        let entries = [];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (error) {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath, depth + 1);
                continue;
            }

            if (!entry.isFile()) continue;
            if (!basenames.has(entry.name)) continue;
            if (!isExecutableFile(fullPath, platform)) continue;

            const score = scoreBundledCandidate(fullPath, platform);
            if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && fullPath.length < bestMatch.path.length)) {
                bestMatch = { path: fullPath, score };
            }
        }
    }

    walk(basePath);
    return bestMatch ? bestMatch.path : null;
}

function findBundledChromiumZip(basePath, platform = process.platform) {
    if (!basePath || !fs.existsSync(basePath)) return null;

    let bestMatch = null;

    function walk(dir, depth = 0) {
        if (depth > 6) return;

        let entries = [];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (error) {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath, depth + 1);
                continue;
            }

            if (!entry.isFile() || !entry.name.endsWith('.zip')) continue;

            const normalized = entry.name.toLowerCase();
            let score = 0;
            if (platform === 'linux' && normalized.includes('chrome-linux')) score += 200;
            if (platform === 'darwin' && normalized.includes('chrome-mac')) score += 200;
            if (platform === 'win32' && normalized.includes('chrome-win')) score += 200;
            if (score === 0) continue;
            if (normalized.includes('chrome')) score += 50;

            if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && fullPath.length < bestMatch.path.length)) {
                bestMatch = { path: fullPath, score };
            }
        }
    }

    walk(basePath);
    return bestMatch ? bestMatch.path : null;
}

function isSafeZipEntryName(entryName) {
    const normalized = String(entryName || '').replace(/\\/g, '/');
    const parts = normalized.endsWith('/') ? normalized.slice(0, -1).split('/') : normalized.split('/');
    if (!normalized || normalized.startsWith('/') || /^[a-zA-Z]:\//.test(normalized)) return false;
    return parts.every(part => part && part !== '.' && part !== '..');
}

function isSafeArchiveId(archiveId) {
    return /^[A-Za-z0-9._-]+$/.test(archiveId) && archiveId !== '.' && archiveId !== '..';
}

function isWithinDirectory(parentDir, childPath) {
    const parent = path.resolve(parentDir);
    const child = path.resolve(childPath);
    const relative = path.relative(parent, child);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function hasSafeCacheMarker(targetDir, zipPath) {
    try {
        const marker = JSON.parse(fs.readFileSync(path.join(targetDir, CACHE_COMPLETE_MARKER), 'utf8'));
        const zipStat = fs.statSync(zipPath);
        return marker.zipSize === zipStat.size && marker.zipMtimeMs === zipStat.mtimeMs;
    } catch (error) {
        return false;
    }
}

function writeCacheMarker(targetDir, zipPath) {
    const zipStat = fs.statSync(zipPath);
    fs.writeFileSync(path.join(targetDir, CACHE_COMPLETE_MARKER), JSON.stringify({
        zipSize: zipStat.size,
        zipMtimeMs: zipStat.mtimeMs
    }));
}

function hardenChromiumTreePermissions(basePath, platform = process.platform) {
    if (platform === 'win32' || !basePath || !fs.existsSync(basePath)) return;

    const executableBasenames = new Set(BUNDLED_EXECUTABLE_BASENAMES[platform] || []);

    function walk(dir, depth = 0) {
        if (depth > 12) return;

        let entries = [];
        try {
            fs.chmodSync(dir, 0o700);
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (error) {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath, depth + 1);
                continue;
            }

            if (!entry.isFile()) continue;

            try {
                fs.chmodSync(fullPath, executableBasenames.has(entry.name) ? 0o700 : 0o600);
            } catch (error) {
                // Ignore chmod failures here; isExecutableFile will reject unusable paths.
            }
        }
    }

    walk(basePath);
}

function makeBundledChromiumExecutables(basePath, platform = process.platform) {
    if (platform === 'win32' || !basePath || !fs.existsSync(basePath)) return;

    const basenames = new Set(BUNDLED_EXECUTABLE_BASENAMES[platform] || []);

    function walk(dir, depth = 0) {
        if (depth > 8) return;

        let entries = [];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (error) {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath, depth + 1);
                continue;
            }

            if (!entry.isFile()) continue;
            if (!basenames.has(entry.name)) continue;

            try {
                fs.chmodSync(fullPath, 0o755);
            } catch (error) {
                // Ignore chmod failures here; isExecutableFile will reject unusable paths.
            }
        }
    }

    walk(basePath);
}

function extractBundledChromiumZip(zipPath, platform = process.platform, env = process.env) {
    if (!zipPath || !fs.existsSync(zipPath)) return null;

    const archiveId = path.basename(zipPath, '.zip');
    if (!isSafeArchiveId(archiveId)) return null;

    const chromeRoot = path.resolve(getChromiumCacheDir(env), 'chrome');
    const targetDir = path.resolve(chromeRoot, archiveId);
    if (!isWithinDirectory(chromeRoot, targetDir)) return null;

    fs.mkdirSync(chromeRoot, { recursive: true, mode: 0o700 });
    fs.chmodSync(chromeRoot, 0o700);

    const existingPath = hasSafeCacheMarker(targetDir, zipPath) ? findBundledChromiumPath(targetDir, platform) : null;
    if (existingPath) return existingPath;

    const tempDir = fs.mkdtempSync(path.join(chromeRoot, `${archiveId}-`));

    try {
        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries();
        if (!entries.every(entry => isSafeZipEntryName(entry.entryName))) {
            throw new Error(`Unsafe Chromium archive entry in ${zipPath}`);
        }

        zip.extractAllTo(tempDir, true);
        makeBundledChromiumExecutables(tempDir, platform);
        hardenChromiumTreePermissions(tempDir, platform);
        writeCacheMarker(tempDir, zipPath);
        hardenChromiumTreePermissions(tempDir, platform);

        const extractedPath = findBundledChromiumPath(tempDir, platform);
        if (!extractedPath) return null;

        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.renameSync(tempDir, targetDir);

        return findBundledChromiumPath(targetDir, platform);
    } catch (error) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        throw error;
    }
}

function findExecutableInPath(names, platform = process.platform, env = process.env) {
    const pathEntries = String(env.PATH || '')
        .split(path.delimiter)
        .filter(Boolean);

    for (const name of names) {
        for (const dir of pathEntries) {
            const fullPath = path.join(dir, name);
            if (isExecutableFile(fullPath, platform)) return fullPath;
            if (platform === 'win32' && !name.toLowerCase().endsWith('.exe') && isExecutableFile(`${fullPath}.exe`, platform)) {
                return `${fullPath}.exe`;
            }
        }
    }

    return null;
}

function listExplicitChromiumCandidates(env = process.env) {
    return [env.CHROME_PATH, env.CHROMIUM_PATH].filter(Boolean);
}

function listStandardChromiumCandidates(platform = process.platform, env = process.env) {
    const homeDir = env.HOME || env.USERPROFILE || '';

    if (platform === 'darwin') {
        return [
            '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            homeDir ? path.join(homeDir, 'Applications', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing') : null,
            homeDir ? path.join(homeDir, 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome') : null
        ].filter(Boolean);
    }

    if (platform === 'win32') {
        const localAppData = env.LOCALAPPDATA || '';
        const programFiles = env.PROGRAMFILES || 'C:\\Program Files';
        const programFilesX86 = env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
        return [
            localAppData ? path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
            path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe')
        ].filter(Boolean);
    }

    return [
        '/opt/google/chrome/chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
    ].filter(Boolean);
}

function resolveChromiumPath({ basePath, platform = process.platform, env = process.env } = {}) {
    const bundledPath = findBundledChromiumPath(basePath, platform);
    if (bundledPath) return bundledPath;

    const bundledZipPath = extractBundledChromiumZip(findBundledChromiumZip(basePath, platform), platform, env);
    if (bundledZipPath) return bundledZipPath;

    for (const candidate of listExplicitChromiumCandidates(env)) {
        if (isExecutableFile(candidate, platform)) return candidate;
    }

    const pathCandidate = findExecutableInPath(PATH_CANDIDATES[platform] || [], platform, env);
    if (pathCandidate) return pathCandidate;

    for (const candidate of listStandardChromiumCandidates(platform, env)) {
        if (isExecutableFile(candidate, platform)) return candidate;
    }

    return null;
}

function getChromiumPath({ isDev, appPath, resourcesPath, platform = process.platform, env = process.env } = {}) {
    const basePath = isDev ? path.join(appPath, 'resources', 'puppeteer') : path.join(resourcesPath, 'puppeteer');
    return resolveChromiumPath({ basePath, platform, env });
}

module.exports = {
    getChromiumPath,
    resolveChromiumPath
};
