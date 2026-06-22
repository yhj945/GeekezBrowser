const RUNTIME_ONLY_PROFILE_FIELDS = [
    'id',
    'createdAt',
    'updatedAt',
    'runtimeState',
    'launching',
    'running',
    'pid',
    'browserPid',
    'localPort',
    'debugPort',
    'debuggerEndpoint'
];

function deepClone(value) {
    return JSON.parse(JSON.stringify(value || {}));
}

function buildCopyName(name) {
    const baseName = String(name || '').trim() || 'Profile';
    return `${baseName}-copy`;
}

export function createDuplicateProfilePayload(profile = {}) {
    const payload = deepClone(profile);
    RUNTIME_ONLY_PROFILE_FIELDS.forEach((field) => {
        delete payload[field];
    });

    payload.name = buildCopyName(profile.name);
    payload.isSetup = false;
    if (payload.fingerprint && typeof payload.fingerprint === 'object') {
        delete payload.fingerprint.noiseSeed;
        delete payload.fingerprint.noiseSeedProfileId;
    }

    return payload;
}
