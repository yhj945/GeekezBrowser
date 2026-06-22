<template>
    <div id="outboundProxyModal" class="modal-overlay" :class="{ active: uiStore.outboundProxyModalVisible }">
        <div class="modal-content" style="max-height: 90vh; height: 85vh; width: 90%; max-width: 800px; display: flex; flex-direction: column; overflow: hidden; padding: 25px;">
            <div class="modal-header">
                <span>{{ $t('manageOutboundProxy') }}</span>
                <span style="cursor:pointer" @click="uiStore.closeOutboundProxyManager()">✕</span>
            </div>

            <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px; flex-shrink:0; flex-wrap:wrap;">
                <label style="font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" v-model="proxyStore.settings.enableOutboundProxy" @change="handleSaveSettings" style="width:auto; margin:0;">
                    {{ $t('enableOutboundProxy') }}
                </label>
                <select v-model="proxyStore.settings.outboundMode" @change="handleSaveSettings" style="width:150px; margin:0; font-size:12px;">
                    <option v-for="m in proxyStore.modes" :key="m.value" :value="m.value">
                        {{ $t(m.labelKey || m.label) }}
                    </option>
                </select>
                <span class="status-badge" :style="proxyStore.outboundStatusStyle">{{ proxyStore.outboundStatusText }}</span>
            </div>

            <div style="display:flex; gap:8px; align-items:flex-start; margin-bottom:10px; flex-shrink:0;">
                <textarea
                    v-model="proxyStore.settings.proxyProbeUrls"
                    rows="2"
                    spellcheck="false"
                    autocomplete="off"
                    :placeholder="$t('proxyProbeUrlPlaceholder')"
                    style="flex:1; min-height:52px; font-size:11px; margin:0;"
                ></textarea>
                <button class="outline" @click="handleSaveSettings" style="font-size:11px; min-width:72px;">
                    {{ $t('save') }}
                </button>
            </div>
            <div style="font-size:10px; opacity:0.55; margin-top:-6px; margin-bottom:10px; flex-shrink:0;">
                {{ $t('proxyProbeUrlHint') }}
            </div>

            <div class="outbound-pool-toolbar">
                <div class="outbound-pool-title">
                    {{ $t('outboundProxyPool') }} ({{ proxyStore.outboundNodes.length }})
                </div>
                <label class="chain-pre-selector">
                    <span>{{ $t('chainPreProxyLabel') }}</span>
                    <select v-model="chainPreProxyId" :disabled="chainPreProxyNodes.length === 0">
                        <option value="">{{ $t('selectPreProxyForChainTest') }}</option>
                        <option v-for="node in chainPreProxyNodes" :key="node.id" :value="node.id">
                            {{ node.remark || node.id }}
                        </option>
                    </select>
                </label>
                <div class="outbound-pool-actions">
                    <button class="outline" @click="handleTestAll" :disabled="hasOutboundLatencyTest" style="font-size:11px;">
                        {{ $t('btnTestOutboundGroup') }}
                    </button>
                    <button class="outline" @click="handleTestAllChain" :disabled="!selectedChainPreProxyUrl || hasOutboundChainTest" style="font-size:11px;">
                        {{ $t('btnTestChainGroup') }}
                    </button>
                    <button class="outline" @click="handleImportYaml" style="font-size:11px;">
                        {{ $t('importYaml') }}
                    </button>
                    <button class="outline" @click="handleExportProxies" style="font-size:11px;">
                        {{ $t('btnExport') }}
                    </button>
                    <button class="outline" @click="batchModalVisible = true" style="font-size:11px;">
                        + {{ $t('batchAdd') || 'Add Nodes' }}
                    </button>
                </div>
            </div>

            <div class="proxy-list-container" style="flex:1; overflow-y:auto; min-height: 100px; margin: 10px 0; border: 1px solid var(--border); border-radius: 4px; padding: 5px;">
                <div v-for="p in proxyStore.outboundNodes" :key="p.id" class="proxy-row outbound-proxy-row no-drag">
                    <div class="proxy-left" style="display:flex; align-items:center; padding:0 6px;">
                        <input
                            :type="proxyStore.settings.outboundMode === 'single' ? 'radio' : 'checkbox'"
                            :checked="isNodeActive(p)"
                            class="no-drag"
                            style="width:auto; margin:0;"
                            @change="handleNodeToggle(p.id)"
                        >
                    </div>
                    <div class="proxy-mid">
                        <div class="proxy-header">
                            <span class="proxy-proto">{{ getNodeProto(p.url) }}</span>
                            <span class="proxy-remark" :title="p.remark">{{ p.remark || 'Node' }}</span>
                            <span
                                v-if="p.latency !== undefined"
                                class="proxy-latency"
                                :style="getLatencyStyle(p)"
                                :title="getLatencyTitle(p)"
                            >
                                {{ getLatencyText(p) }}
                            </span>
                            <span v-else-if="proxyStore.testingIds.has(p.id)" class="proxy-latency" style="border:1px solid var(--text-secondary); opacity:0.5;">...</span>
                            <span v-else class="proxy-latency" style="border:1px solid var(--text-secondary); opacity:0.3;">-</span>
                            <span
                                v-if="p.chainLatency !== undefined"
                                class="proxy-latency"
                                :style="getChainLatencyStyle(p)"
                                :title="getChainLatencyTitle(p)"
                            >
                                {{ getChainLatencyText(p) }}
                            </span>
                            <span v-else-if="proxyStore.testingIds.has(`chain:${p.id}`)" class="proxy-latency" style="border:1px solid var(--text-secondary); opacity:0.5;">{{ $t('chainTestShort') }}...</span>
                        </div>
                    </div>
                    <div class="proxy-right">
                        <button class="outline no-drag" @click="proxyStore.testOutboundLatency(p.id)" :disabled="proxyStore.testingIds.has(p.id)">
                            {{ proxyStore.testingIds.has(p.id) ? '...' : $t('btnTest') }}
                        </button>
                        <button class="outline no-drag" @click="handleTestChain(p.id)" :disabled="!selectedChainPreProxyUrl || proxyStore.testingIds.has(`chain:${p.id}`)">
                            {{ proxyStore.testingIds.has(`chain:${p.id}`) ? '...' : $t('btnTestChain') }}
                        </button>
                        <button class="outline no-drag" @click="handleEditNode(p)">
                            {{ $t('btnEdit') }}
                        </button>
                        <button class="danger no-drag" @click="handleDeleteNode(p)">✕</button>
                    </div>
                </div>
                <div v-if="proxyStore.outboundNodes.length === 0" style="text-align:center; padding:40px; opacity:0.5;">
                    {{ $t('outboundProxyEmpty') }}
                </div>
            </div>

            <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border); flex-shrink:0; display:flex; justify-content:flex-end; gap:10px;">
                <button class="primary" @click="uiStore.closeOutboundProxyManager()" style="min-width: 140px; font-weight: 600;">{{ $t('done') }}</button>
            </div>
        </div>
    </div>

    <div v-if="batchModalVisible" class="modal-overlay active" style="z-index: 1300;">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <span>{{ $t('batchAdd') || 'Batch Add Nodes' }}</span>
                <span style="cursor:pointer" @click="batchModalVisible = false">✕</span>
            </div>
            <p style="font-size:12px; opacity:0.7; margin: 10px 0;">Paste links here (one per line). Supports vmess, vless, trojan, ss, socks5.</p>
            <textarea v-model="batchInput" style="height:250px; font-family:monospace; font-size:11px; width: 100%; box-sizing: border-box;" placeholder="vmess://...&#10;ss://..."></textarea>
            <div style="text-align:right; margin-top:15px;">
                <button class="primary" @click="handleSubmitBatch" :disabled="!batchInput.trim()">{{ $t('save') }}</button>
            </div>
        </div>
    </div>

    <div v-if="editNodeModalVisible" class="modal-overlay active" style="z-index: 1300;" @mousedown.self="closeEditNodeModal">
        <div class="modal-content" style="max-width: 560px;">
            <div class="modal-header">
                <span>{{ $t('btnEdit') }} {{ $t('remark') }}</span>
                <span style="cursor:pointer" @click="closeEditNodeModal">✕</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                <label style="font-size:12px; opacity:0.75;">{{ $t('remark') }}</label>
                <input v-model="editNodeForm.remark" type="text" maxlength="120" />

                <label style="font-size:12px; opacity:0.75;">{{ $t('proxyLink') }}</label>
                <textarea
                    v-model="editNodeForm.url"
                    rows="5"
                    spellcheck="false"
                    autocomplete="off"
                    placeholder="vmess:// / vless:// / trojan:// / ss:// / socks:// / http:// / Direct"
                ></textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
                <button class="outline" @click="closeEditNodeModal">{{ $t('cancel') }}</button>
                <button class="primary" @click="handleSubmitEditNode">{{ $t('save') }}</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useUIStore } from '../store/useUIStore';
import { useProxyStore } from '../store/useProxyStore';
import { settingService } from '../services/setting.service';

const uiStore = useUIStore();
const proxyStore = useProxyStore();

const batchInput = ref('');
const batchModalVisible = ref(false);
const chainPreProxyId = ref('');
const editNodeModalVisible = ref(false);
const editNodeForm = ref({
    id: '',
    remark: '',
    url: ''
});

const chainPreProxyNodes = computed(() => proxyStore.usablePreProxyNodes);
const selectedChainPreProxyUrl = computed(() => {
    const selected = chainPreProxyNodes.value.find(node => node.id === chainPreProxyId.value);
    return selected?.url || '';
});
const hasOutboundLatencyTest = computed(() => proxyStore.outboundNodes.some(node => proxyStore.testingIds.has(node.id)));
const hasOutboundChainTest = computed(() => proxyStore.outboundNodes.some(node => proxyStore.testingIds.has(`chain:${node.id}`)));

watch(chainPreProxyNodes, (nodes) => {
    if (nodes.some(node => node.id === chainPreProxyId.value)) return;

    const selectedNode = nodes.find(node => node.id === proxyStore.settings.selectedId);
    chainPreProxyId.value = (selectedNode || nodes[0])?.id || '';
}, { immediate: true });

const getNodeProto = (url) => {
    return (url.split('://')[0] || 'UNK').toUpperCase();
};

const getLatencyText = (node) => {
    if (node.latency === -1 || node.latency === 9999) return 'Fail';
    const target = node.latencyTarget ? ` · ${node.latencyTarget}` : '';
    return `${node.latency}ms${target}`;
};

const getLatencyTitle = (node) => {
    if (node.latencyErr) return node.latencyErr;
    return node.latencyTarget ? `Probe target: ${node.latencyTarget}` : '';
};

const getLatencyStyle = (node) => {
    if (node.latency === -1 || node.latency === 9999) return { borderColor: '#e74c3c', color: '#e74c3c' };
    const color = node.latency < 500 ? '#27ae60' : (node.latency < 1000 ? '#f39c12' : '#e74c3c');
    return { borderColor: color, color: color };
};

const getChainLatencyText = (node) => {
    if (node.chainLatency === -1 || node.chainLatency === 9999) return `${window.t?.('chainTestShort') || 'Chain'} Fail`;
    const target = node.chainLatencyTarget ? ` · ${node.chainLatencyTarget}` : '';
    return `${window.t?.('chainTestShort') || 'Chain'} ${node.chainLatency}ms${target}`;
};

const getChainLatencyTitle = (node) => {
    if (node.chainLatencyErr) return node.chainLatencyErr;
    return node.chainLatencyTarget ? `Probe target: ${node.chainLatencyTarget}` : '';
};

const getChainLatencyStyle = (node) => {
    if (node.chainLatency === -1 || node.chainLatency === 9999) return { borderColor: '#e74c3c', color: '#e74c3c' };
    const color = node.chainLatency < 500 ? '#27ae60' : (node.chainLatency < 1000 ? '#f39c12' : '#e74c3c');
    return { borderColor: color, color: color };
};

const handleSaveSettings = async () => {
    try {
        await proxyStore.saveSettings();
    } catch (e) {
        await proxyStore.loadSettings();
        uiStore.showAlert((window.t?.('outboundProxySaveFailed') || '保存出口代理设置失败：') + (e?.message || e));
    }
};

const handleTestAll = async () => {
    if (hasOutboundLatencyTest.value) return;
    await proxyStore.testAllOutboundLatency();
};

const handleTestChain = async (id) => {
    if (!selectedChainPreProxyUrl.value) return;
    await proxyStore.testOutboundChainLatency(id, selectedChainPreProxyUrl.value);
};

const handleTestAllChain = async () => {
    if (!selectedChainPreProxyUrl.value || hasOutboundChainTest.value) return;
    await proxyStore.testAllOutboundChainLatency(selectedChainPreProxyUrl.value);
};

const isNodeSelected = (id) => {
    return proxyStore.settings.outboundMode === 'single' && proxyStore.settings.selectedOutboundId === id;
};

const isNodeActive = (node) => {
    if (proxyStore.settings.outboundMode === 'single') return isNodeSelected(node.id);
    return node.enable !== false;
};

const handleNodeToggle = async (id) => {
    try {
        if (proxyStore.settings.outboundMode === 'single') {
            await proxyStore.selectOutboundProxy(id);
        } else {
            await proxyStore.toggleOutboundProxy(id);
        }
    } catch (e) {
        await proxyStore.loadSettings();
        uiStore.showAlert((window.t?.('outboundProxySaveFailed') || '保存出口代理设置失败：') + (e?.message || e));
    }
};

const handleImportYaml = async () => {
    try {
        const res = await settingService.importData();
        if (res) {
            await proxyStore.loadSettings();
            uiStore.showAlert(window.t?.('msgImportSuccess') || 'Import successful');
        }
    } catch (e) {
        uiStore.showAlert('Import Failed: ' + (e?.message || e));
    }
};

const handleExportProxies = async () => {
    try {
        const res = await settingService.exportSelectedData({ type: 'proxies', profileIds: [] });
        if (res?.success) {
            uiStore.showAlert(window.t?.('msgExportSuccess') || 'Export successful');
        }
    } catch (e) {
        uiStore.showAlert('Export Failed: ' + (e?.message || e));
    }
};

const handleEditNode = (node) => {
    if (!node) return;
    editNodeForm.value = {
        id: node.id,
        remark: node.remark || '',
        url: node.url || ''
    };
    editNodeModalVisible.value = true;
};

const closeEditNodeModal = () => {
    editNodeModalVisible.value = false;
};

const handleDeleteNode = async (node) => {
    try {
        const result = await proxyStore.deleteOutboundProxy(node.id);
        if (result?.success === false && result.referencedBy?.length > 0) {
            const names = result.referencedBy.map(profile => profile.name || profile.id).join(', ');
            uiStore.showAlert((window.t?.('outboundProxyInUse') || '出口代理正在被环境使用，不能删除：') + names);
        } else if (result?.success === false && result.error) {
            uiStore.showAlert(result.error);
        }
    } catch (e) {
        await proxyStore.loadSettings();
        uiStore.showAlert((window.t?.('outboundProxySaveFailed') || '保存出口代理设置失败：') + (e?.message || e));
    }
};

const handleSubmitEditNode = async () => {
    try {
        const ok = await proxyStore.updateOutboundProxy(editNodeForm.value.id, editNodeForm.value);
        if (!ok) {
            uiStore.showAlert(window.t?.('proxyRequiredMsg') || 'Please select or enter a proxy link.');
            return;
        }
        closeEditNodeModal();
    } catch (e) {
        await proxyStore.loadSettings();
        uiStore.showAlert((window.t?.('outboundProxySaveFailed') || '保存出口代理设置失败：') + (e?.message || e));
    }
};

const handleSubmitBatch = async () => {
    if (!batchInput.value.trim()) return;

    try {
        const count = await proxyStore.batchAddOutboundProxy(batchInput.value);
        if (count > 0) {
            uiStore.showAlert(`${window.t('batchAddSuccess') || 'Nodes added successfully.'} (${count})`);
            batchInput.value = '';
            batchModalVisible.value = false;
            await proxyStore.loadSettings();
        } else {
            uiStore.showAlert(window.t('batchAddFail') || 'No valid proxy nodes found.');
        }
    } catch (e) {
        await proxyStore.loadSettings();
        uiStore.showAlert((window.t?.('outboundProxySaveFailed') || '保存出口代理设置失败：') + (e?.message || e));
    }
};

onMounted(() => {
    proxyStore.loadSettings();
});
</script>

<style scoped>
.outbound-pool-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.1);
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 10px;
    flex-shrink: 0;
    flex-wrap: wrap;
}

.outbound-pool-title {
    font-weight: bold;
    font-size: 13px;
    color: var(--accent);
    margin-right: auto;
}

.chain-pre-selector {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-secondary);
}

.chain-pre-selector select {
    width: 170px;
    margin: 0;
    font-size: 11px;
}

.outbound-pool-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.outbound-proxy-row {
    height: auto;
    min-height: 40px;
    align-items: flex-start;
    padding-top: 6px;
    padding-bottom: 6px;
}

.outbound-proxy-row .proxy-mid {
    height: auto;
    min-width: 0;
}

.outbound-proxy-row .proxy-header {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 5px;
}

.outbound-proxy-row .proxy-remark {
    flex-basis: 180px;
    min-width: 120px;
    height: var(--row-height);
}

.outbound-proxy-row .proxy-latency {
    max-width: 220px;
    min-width: 58px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    line-height: calc(var(--row-height) - 1px);
}

.outbound-proxy-row .proxy-right {
    height: auto;
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 210px;
}
</style>
