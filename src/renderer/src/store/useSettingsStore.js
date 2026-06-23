import { defineStore } from 'pinia';
import { settingService } from '../services/setting.service';
import { ipcService } from '../services/ipc.service';

const EMPTY_PROXY_STARTUP_HEALTH_CHECK = {
    readyTimeoutMs: null,
    direct: {},
    preProxy: {}
};

const DEFAULT_DNS_LEAK_PROTECTION = {
    enabled: true,
    disableQuic: true,
    disableDnsPrefetch: true,
    blockBrowserLocalDns: true,
    xrayDnsEnabled: false,
    xrayDnsExplicit: false,
    dohServers: ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query']
};

const DEFAULT_PROXY_CORE = {
    type: 'xray',
    singBox: {
        dnsEnabled: true,
        dnsStrategy: 'ipv4_only',
        finalDnsTag: 'remote-dns',
        remoteDnsServers: ['https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query'],
        enableDnsThroughProxy: true,
        strictRoute: true,
        disableCache: false,
        independentCache: true
    }
};

function cloneProxyStartupHealthCheck(value = EMPTY_PROXY_STARTUP_HEALTH_CHECK) {
    return JSON.parse(JSON.stringify(value || EMPTY_PROXY_STARTUP_HEALTH_CHECK));
}

function cloneDnsLeakProtection(value = DEFAULT_DNS_LEAK_PROTECTION) {
    const source = value || DEFAULT_DNS_LEAK_PROTECTION;
    const xrayDnsExplicit = source.xrayDnsExplicit === true;
    return {
        ...JSON.parse(JSON.stringify(source)),
        xrayDnsEnabled: xrayDnsExplicit && source.xrayDnsEnabled === true,
        xrayDnsExplicit
    };
}

function cloneProxyCore(value = DEFAULT_PROXY_CORE) {
    const source = value && typeof value === 'object' ? value : DEFAULT_PROXY_CORE;
    const singBox = source.singBox && typeof source.singBox === 'object' ? source.singBox : {};
    const dnsStrategy = ['ipv4_only', 'prefer_ipv4', 'prefer_ipv6', 'ipv6_only', 'as_is'].includes(singBox.dnsStrategy || singBox.strategy)
        ? (singBox.dnsStrategy || singBox.strategy)
        : DEFAULT_PROXY_CORE.singBox.dnsStrategy;
    const remoteDnsServers = Array.isArray(singBox.remoteDnsServers)
        ? singBox.remoteDnsServers.map(v => String(v || '').trim()).filter(Boolean)
        : String(singBox.remoteDnsServers || singBox.servers || '').split(/[\r\n,]+/).map(v => v.trim()).filter(Boolean);
    return {
        type: source.type === 'sing-box' ? 'sing-box' : 'xray',
        singBox: {
            dnsEnabled: singBox.dnsEnabled !== false && singBox.enabled !== false,
            dnsStrategy,
            finalDnsTag: String(singBox.finalDnsTag || DEFAULT_PROXY_CORE.singBox.finalDnsTag),
            remoteDnsServers,
            enableDnsThroughProxy: singBox.enableDnsThroughProxy !== false,
            strictRoute: singBox.strictRoute !== false,
            disableCache: singBox.disableCache === true,
            independentCache: singBox.independentCache !== false
        }
    };
}

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        enableRemoteDebugging: false,
        enableCustomArgs: false,
        enableUaWebglModify: false,
        enableApiServer: false,
        closeBehavior: 'tray',
        apiPort: 12138,
        apiRunning: false,
        apiStarting: false,
        watermarkStyle: 'enhanced',
        userExtensions: [],
        currentDataPath: '',
        isDefaultDataPath: true,
        proxyStartupHealthCheck: cloneProxyStartupHealthCheck(),
        dnsLeakProtection: cloneDnsLeakProtection(),
        proxyCore: cloneProxyCore(),
        activeTab: 'extensions'
    }),

    actions: {
        async loadSettings() {
            try {
                const settings = await ipcService.getSettings();
                if (!settings) {
                    console.warn('[SettingsStore] getSettings returned null, using defaults');
                    return;
                }
                this.enableRemoteDebugging = settings.enableRemoteDebugging || false;
                this.enableCustomArgs = settings.enableCustomArgs || false;
                this.enableUaWebglModify = settings.enableUaWebglModify || false;
                this.enableApiServer = settings.enableApiServer || false;
                this.closeBehavior = settings.closeBehavior === 'quit' ? 'quit' : 'tray';
                this.apiPort = settings.apiPort || 12138;
                this.proxyStartupHealthCheck = cloneProxyStartupHealthCheck(settings.proxyStartupHealthCheck);
                this.dnsLeakProtection = cloneDnsLeakProtection(settings.dnsLeakProtection);
                this.proxyCore = cloneProxyCore(settings.proxyCore);
                this.watermarkStyle = settings.watermarkStyle || 'enhanced';
                localStorage.setItem('geekez_watermark_style', this.watermarkStyle);

                // Load API Status
                try {
                    const apiStatus = await settingService.getApiStatus();
                    this.apiRunning = apiStatus ? apiStatus.running : false;
                    this.apiStarting = false;
                } catch (e) {
                    console.warn('[SettingsStore] getApiStatus failed:', e);
                    this.apiRunning = false;
                    this.apiStarting = false;
                }

                // Load Extensions
                await this.loadExtensions();

                // Load Data Path Info
                try {
                    const pathInfo = await settingService.getDataPathInfo();
                    if (pathInfo) {
                        this.currentDataPath = pathInfo.currentPath || '';
                        this.isDefaultDataPath = pathInfo.isDefault !== false;
                    }
                } catch (e) {
                    console.warn('[SettingsStore] getDataPathInfo failed:', e);
                }
            } catch (e) {
                console.error('[SettingsStore] loadSettings failed:', e);
            }
        },

        async toggleRemoteDebugging(enabled) {
            this.enableRemoteDebugging = enabled;
            const settings = await ipcService.getSettings();
            settings.enableRemoteDebugging = enabled;
            await ipcService.saveSettings(settings);
        },

        async toggleCustomArgs(enabled) {
            this.enableCustomArgs = enabled;
            const settings = await ipcService.getSettings();
            settings.enableCustomArgs = enabled;
            await ipcService.saveSettings(settings);
        },

        async toggleUaWebglModify(enabled) {
            this.enableUaWebglModify = enabled;
            const settings = await ipcService.getSettings();
            settings.enableUaWebglModify = enabled;
            await ipcService.saveSettings(settings);
        },

        async toggleApiServer(enabled) {
            this.enableApiServer = enabled;
            const settings = await ipcService.getSettings();
            settings.enableApiServer = enabled;
            await ipcService.saveSettings(settings);

            if (enabled) {
                this.apiStarting = true;
                try {
                    const res = await settingService.startApiServer(this.apiPort);
                    this.apiRunning = !!res.success;
                } finally {
                    this.apiStarting = false;
                }
            } else {
                await settingService.stopApiServer();
                this.apiRunning = false;
                this.apiStarting = false;
            }
        },

        async setCloseBehavior(mode) {
            this.closeBehavior = mode === 'quit' ? 'quit' : 'tray';
            const settings = await ipcService.getSettings();
            settings.closeBehavior = this.closeBehavior;
            await ipcService.saveSettings(settings);
        },

        async saveApiPort(port) {
            this.apiPort = port;
            const settings = await ipcService.getSettings();
            settings.apiPort = port;
            await ipcService.saveSettings(settings);

            if (this.enableApiServer) {
                await settingService.stopApiServer();
                this.apiStarting = true;
                try {
                    const res = await settingService.startApiServer(port);
                    this.apiRunning = !!res.success;
                } finally {
                    this.apiStarting = false;
                }
            }
        },

        async saveWatermarkStyle(style) {
            this.watermarkStyle = style;
            localStorage.setItem('geekez_watermark_style', style);
            const settings = await ipcService.getSettings();
            settings.watermarkStyle = style;
            await ipcService.saveSettings(settings);
        },

        async saveProxyStartupHealthCheck(config) {
            const settings = await ipcService.getSettings();
            settings.proxyStartupHealthCheck = cloneProxyStartupHealthCheck(config);
            await ipcService.saveSettings(settings);
            await this.loadSettings();
        },

        async saveDnsLeakProtection(config) {
            const settings = await ipcService.getSettings();
            settings.dnsLeakProtection = cloneDnsLeakProtection(config);
            await ipcService.saveSettings(settings);
            await this.loadSettings();
        },

        async saveProxyCore(config) {
            const settings = await ipcService.getSettings();
            settings.proxyCore = cloneProxyCore(config);
            await ipcService.saveSettings(settings);
            await this.loadSettings();
        },

        async loadExtensions() {
            try {
                this.userExtensions = await settingService.getUserExtensions() || [];
            } catch (e) {
                console.warn('[SettingsStore] loadExtensions failed:', e);
                this.userExtensions = [];
            }
        },

        async addExtension(path) {
            await settingService.addUserExtension({ type: 'folder', path });
            await this.loadExtensions();
        },

        async addCrxExtension(path) {
            await settingService.addUserExtension({ type: 'crx', path });
            await this.loadExtensions();
        },

        async addStoreExtension(item) {
            const payload = {
                type: 'store',
                storeId: item?.id || item?.storeId || '',
                name: item?.name || '',
                homepage: item?.homepage || ''
            };
            await settingService.addUserExtension(payload);
            await this.loadExtensions();
        },

        async removeExtension(ext) {
            await settingService.removeUserExtension({ id: ext?.id, path: ext?.path });
            await this.loadExtensions();
        },

        async updateExtensionScope(id, applyMode, profileIds = []) {
            const safeProfileIds = Array.from(profileIds || []).map(v => String(v || '')).filter(Boolean);
            await settingService.updateExtensionScope(String(id || ''), applyMode, safeProfileIds);
            await this.loadExtensions();
        },

        setTab(tab) {
            this.activeTab = tab;
        }
    }
});
