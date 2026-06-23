<template>
  <div v-show="uiStore.editModalVisible" class="modal-overlay" @mousedown.self="uiStore.closeEditModal">
    <div class="modal-content">
      <div class="modal-header">
        <span>{{ $t('editFingerprint') }}</span>
        <span style="cursor:pointer" @click="uiStore.closeEditModal">✕</span>
      </div>
      <div class="modal-body">
        <label class="label-tiny">{{ $t('profileName') }}</label>
        <input v-model="form.name" type="text" placeholder="Name">

        <label class="label-tiny">{{ $t('tagsLabel') }}</label>
        <input v-model="form.tags" type="text" placeholder="tiktok, fb...">

        <label class="label-tiny">{{ $t('profileNotesLabel') }}</label>
        <textarea
          v-model="form.notes"
          rows="4"
          class="profile-notes-textarea"
          :placeholder="$t('profileNotesPlaceholder')"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
        <div class="hint-text">{{ $t('profileNotesHint') }}</div>

        <label class="label-tiny">{{ $t('timezoneLabel') }}</label>
        <div class="timezone-wrapper">
          <input v-model="timezoneSearch" type="text" placeholder="Type to search or select..." autocomplete="off" @focus="openTimezoneList">
          <div v-if="showTimezoneList" class="timezone-dropdown active">
            <div v-for="tz in filteredTimezones" :key="tz" class="timezone-item" @click="selectTimezone(tz)">
              {{ tz }}
            </div>
          </div>
        </div>

        <label class="label-tiny mt-10">{{ $t('locationLabel') }}</label>
        <div class="timezone-wrapper">
          <input v-model="citySearch" type="text" placeholder="Type to search city..." autocomplete="off" @focus="openCityList">
          <div v-if="showCityList" class="timezone-dropdown active">
            <div v-for="city in filteredCities" :key="city.name" class="timezone-item" @click="selectCity(city)">
              {{ city.name }}
            </div>
          </div>
        </div>
        <div class="hint-text">{{ $t('geoHint') }}</div>

        <label class="label-tiny mt-10">{{ $t('languageLabel') }}</label>
        <div class="timezone-wrapper">
          <input v-model="languageSearch" type="text" placeholder="Type to search language..." autocomplete="off" @focus="openLanguageList">
          <div v-if="showLanguageList" class="timezone-dropdown active">
            <div v-for="lang in filteredLanguages" :key="lang.code" class="timezone-item" @click="selectLanguage(lang)">
              {{ lang.name }} ({{ lang.code }})
            </div>
          </div>
        </div>

        <template v-if="showUaWebglModify">
          <label class="label-tiny">{{ $t('browserVersionPresetLabel') }}</label>
          <select v-model="form.browserVersionPreset">
            <option v-for="opt in browserVersionPresetOptions" :key="opt.value" :value="opt.value">
              {{ getOptionLabel(opt) }}
            </option>
          </select>

          <label class="label-tiny">{{ $t('webglProfileLabel') }}</label>
          <select v-model="form.webglProfile">
            <option v-for="opt in webglProfileOptions" :key="opt.value" :value="opt.value">
              {{ getOptionLabel(opt) }}
            </option>
          </select>
        </template>

        <div class="canvas-seed-panel mt-10">
          <div class="canvas-seed-header">
            <span class="label-tiny">{{ $t('canvasSeedLabel') }}</span>
            <div class="canvas-seed-actions">
              <button class="outline mini-button" :disabled="isPreviewingCanvas" @click="refreshCanvasPreview()">
                {{ isPreviewingCanvas ? $t('testWait') : $t('canvasSeedPreview') }}
              </button>
              <button class="outline mini-button" :disabled="isPreviewingCanvas" @click="handleRotateCanvasSeed">
                {{ $t('canvasSeedRotate') }}
              </button>
            </div>
          </div>
          <div class="canvas-seed-grid">
            <span>{{ $t('canvasSeedCurrent') }}</span>
            <strong>{{ canvasSeedText }}</strong>
            <span>{{ $t('canvasSeedPreviewHash') }}</span>
            <strong>{{ canvasPreviewHashText }}</strong>
          </div>
          <div v-if="rotateNoiseSeedPending" class="warning-text">{{ $t('canvasSeedRotatePending') }}</div>
          <div class="hint-text">{{ $t('canvasSeedPreviewHint') }}</div>
        </div>

        <label class="label-tiny mt-10">{{ $t('proxySourceLabel') }}</label>
        <select v-model="form.proxySource">
          <option value="global">{{ $t('proxySourceGlobal') }}</option>
          <option value="managed">{{ $t('proxySourceManaged') }}</option>
          <option value="custom">{{ $t('proxySourceCustom') }}</option>
          <option value="direct">{{ $t('proxySourceDirect') }}</option>
        </select>

        <template v-if="form.proxySource === 'custom'">
          <label class="label-tiny mt-10">{{ $t('proxyLink') }}</label>
          <textarea v-model="form.proxyStr" rows="4"></textarea>
        </template>

        <template v-if="form.proxySource === 'managed'">
          <label class="label-tiny mt-10">{{ $t('managedProxyLabel') }}</label>
          <select v-model="form.proxyId">
            <option value="">{{ $t('selectManagedProxy') }}</option>
            <option v-for="node in managedProxyNodes" :key="node.id" :value="node.id">
              {{ node.remark || node.name || node.id }}
            </option>
          </select>
        </template>

        <div v-if="form.proxySource !== 'direct' && form.proxySource !== 'global'" class="proxy-test-row">
          <button class="outline" :disabled="isTestingProxy" @click="handleTestProxy">
            {{ isTestingProxy ? $t('testWait') : $t('btnTest') }}
          </button>
          <span v-if="proxyTestResult" class="proxy-test-result" :class="{ fail: !proxyTestResult.success }">
            {{ getProxyTestText(proxyTestResult) }}
          </span>
        </div>
        <div v-else-if="form.proxySource === 'global'" class="hint-text">{{ $t('globalProxyHint') }}</div>
        <div v-else class="hint-text">{{ $t('directProxyHint') }}</div>

        <label class="label-tiny">{{ $t('profileProxyCoreLabel') }}</label>
        <select v-model="form.proxyCoreOverride">
          <option value="inherit">{{ $t('profileProxyCoreInherit') }}</option>
          <option value="xray">{{ $t('profileProxyCoreXray') }}</option>
          <option value="sing-box">{{ $t('profileProxyCoreSingBox') }}</option>
        </select>

        <div class="flex-row">
          <div class="flex-1">
            <label class="label-tiny">{{ $t('preProxySetting') }}</label>
            <select v-model="form.preProxyOverride">
              <option value="default">{{ $t('optDefault') }}</option>
              <option value="on">{{ $t('optOn') }}</option>
              <option value="off">{{ $t('optOff') }}</option>
            </select>
            <select v-if="form.preProxyOverride !== 'off'" v-model="form.preProxyId">
              <option value="">{{ $t('preProxyUseGlobal') }}</option>
              <option v-for="node in availablePreProxyNodes" :key="node.id" :value="node.id">
                {{ node.remark || node.name || node.id }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label class="label-tiny">{{ $t('screenRes') }}</label>
            <div class="flex-row gap-5">
              <input v-model.number="form.resW" type="number">
              <input v-model.number="form.resH" type="number">
            </div>
          </div>
        </div>

        <!-- Advanced Sections -->
        <div v-if="settings.enableRemoteDebugging" class="mt-10">
          <label class="label-tiny">Remote Debugging Port</label>
          <input v-model.number="form.debugPort" type="number" placeholder="Leave empty for auto">
          <div class="warning-text">⚠️ Enabling debugging port may increase detection risk</div>
        </div>

        <div v-if="settings.enableCustomArgs" class="mt-10">
          <label class="label-tiny">{{ $t('customArgsLabel') }}</label>
          <textarea v-model="form.customArgs" rows="2" placeholder="--start-maximized" class="mono-text"></textarea>
          <div class="hint-text">{{ $t('customArgsHint') }}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="outline" @click="uiStore.closeEditModal">{{ $t('cancel') }}</button>
        <button @click="handleSave">{{ $t('save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUIStore } from '../store/useUIStore';
import { useProfileStore } from '../store/useProfileStore';
import { proxyService } from '../services/proxy.service';
import { profileService } from '../services/profile.service';
import {
  browserVersionPresetOptions,
  webglProfileOptions,
  getOptionLabel
} from '../utils/fingerprintOptions';

const uiStore = useUIStore();
const profileStore = useProfileStore();

const settings = ref({});
const showUaWebglModify = ref(false);
const isTestingProxy = ref(false);
const isPreviewingCanvas = ref(false);
const proxyTestResult = ref(null);
const canvasPreview = ref(null);
const pendingCanvasSeed = ref(null);
const pendingCanvasSeedProfileId = ref('');
const rotateNoiseSeedPending = ref(false);
const canvasPreviewRequestId = ref(0);
const managedProxyNodes = computed(() => (settings.value.outboundProxies || []).filter(node => String(node.url || '').trim() && node.enable !== false));
const availablePreProxyNodes = computed(() => (settings.value.preProxies || []).filter(node => String(node.url || '').trim() && node.enable !== false));
const canvasSeedText = computed(() => pendingCanvasSeed.value || canvasPreview.value?.noiseSeed || '-');
const canvasPreviewHashText = computed(() => canvasPreview.value?.canvasPreviewHash || '-');

const form = reactive({
  name: '',
  tags: '',
  proxySource: 'custom',
  proxyId: '',
  notes: '',
  proxyStr: '',
  proxyCoreOverride: 'inherit',
  timezone: 'Auto',
  city: 'Auto (IP Based)',
  language: 'auto',
  preProxyOverride: 'default',
  preProxyId: '',
  resW: 1920,
  resH: 1080,
  geolocation: null,
  debugPort: null,
  customArgs: '',
  browserVersionPreset: 'none',
  webglProfile: 'none'
});

function parseBrowserVersionPreset(preset) {
  if (!preset || preset === 'none') {
    return { uaMode: 'none', browserType: 'auto', browserMajorVersion: 'auto' };
  }
  if (preset === 'auto') {
    return { uaMode: 'spoof', browserType: 'auto', browserMajorVersion: 'auto' };
  }
  const [browserTypeRaw, majorRaw] = String(preset).split(':');
  const browserType = browserTypeRaw === 'edge' ? 'edge' : 'chrome';
  const major = Number(majorRaw);
  if (!Number.isFinite(major)) {
    return { uaMode: 'none', browserType: 'auto', browserMajorVersion: 'auto' };
  }
  return { uaMode: 'spoof', browserType, browserMajorVersion: major };
}

function toBrowserVersionPreset(uaMode, browserType, browserMajorVersion) {
  if (uaMode === 'none') return 'none';
  const type = browserType === 'edge' ? 'edge' : (browserType === 'chrome' ? 'chrome' : 'auto');
  const major = Number(browserMajorVersion);
  if (type === 'auto' || !Number.isFinite(major)) return 'none';
  const preset = `${type}:${major}`;
  const exists = browserVersionPresetOptions.some(opt => opt.value === preset);
  return exists ? preset : 'none';
}

// Searchable Dropdowns State
const AUTO_TIMEZONE_LABEL = 'Auto (IP Based)';
const LEGACY_AUTO_TIMEZONE_LABEL = 'Auto (No Change)';
const AUTO_CITY = { name: 'Auto (IP Based)', lat: null, lng: null };

const timezoneSearch = ref(AUTO_TIMEZONE_LABEL);
const showTimezoneList = ref(false);
const citySearch = ref('Auto (IP Based)');
const showCityList = ref(false);
const languageSearch = ref('Auto (System Default)');
const showLanguageList = ref(false);

const allTimezones = window.TIMEZONES || [];
const allCities = [AUTO_CITY, ...(window.CITY_DATA || [])];
const allLanguages = window.LANGUAGE_DATA || [
  { name: 'Auto (System Default)', code: 'auto' },
  { name: 'English (US)', code: 'en-US' }
];

function openTimezoneList() {
  if (timezoneSearch.value === 'Auto (No Change)') timezoneSearch.value = '';
  showTimezoneList.value = true;
}

function openCityList() {
  if (citySearch.value === 'Auto (IP Based)') citySearch.value = '';
  showCityList.value = true;
}

function openLanguageList() {
  if (languageSearch.value === 'Auto (System Default)') languageSearch.value = '';
  showLanguageList.value = true;
}

// Computed filters
const filteredTimezones = computed(() => {
  const s = timezoneSearch.value.toLowerCase();
  return allTimezones.filter(tz => tz.toLowerCase().includes(s)).slice(0, 50);
});
const filteredCities = computed(() => {
  const s = citySearch.value.toLowerCase();
  return allCities.filter(c => c.name.toLowerCase().includes(s)).slice(0, 50);
});
const filteredLanguages = computed(() => {
  const s = languageSearch.value.toLowerCase();
  return allLanguages.filter(l => l.name.toLowerCase().includes(s) || l.code.toLowerCase().includes(s));
});

watch(() => form.preProxyOverride, (newVal) => {
  if (newVal === 'off') form.preProxyId = '';
});

// Backfill logic
watch(() => uiStore.editModalVisible, async (visible) => {
  if (visible && uiStore.currentEditId) {
    const p = profileStore.profiles.find(x => x.id === uiStore.currentEditId);
    if (!p) return;

    settings.value = await window.electronAPI.getSettings();
    showUaWebglModify.value = !!settings.value?.enableUaWebglModify;
    const fp = p.fingerprint || {};

    form.name = p.name;
    form.proxySource = p.proxySource || (p.proxyStr === 'direct' || p.proxyStr === 'direct://' ? 'direct' : 'custom');
    form.proxyId = p.proxyId || '';
    form.proxyStr = p.proxyStr || '';
    form.proxyCoreOverride = ['xray', 'sing-box'].includes(p.proxyCoreOverride) ? p.proxyCoreOverride : 'inherit';
    proxyTestResult.value = null;
    form.tags = (p.tags || []).join(', ');
    form.notes = p.notes || p.note || p.profileNotes || '';
    form.preProxyOverride = p.preProxyOverride || 'default';
    form.preProxyId = p.preProxyId || '';
    form.resW = fp.screen?.width || 1920;
    form.resH = fp.screen?.height || 1080;
    form.debugPort = p.debugPort || null;
    form.customArgs = p.customArgs || '';
    form.browserVersionPreset = toBrowserVersionPreset(fp.uaMode, fp.browserType, fp.browserMajorVersion);
    form.webglProfile = fp.webglProfile || fp.webgl?.profileId || 'none';
    canvasPreview.value = null;
    pendingCanvasSeed.value = null;
    pendingCanvasSeedProfileId.value = '';
    rotateNoiseSeedPending.value = false;

    // Timezone
    form.timezone = fp.timezone || 'Auto';
    timezoneSearch.value = form.timezone === 'Auto' ? AUTO_TIMEZONE_LABEL : form.timezone;

    // City
    form.city = fp.city || null;
    form.geolocation = fp.geolocation || null;
    citySearch.value = form.city || 'Auto (IP Based)';

    // Language
    form.language = fp.language || 'auto';
    const langObj = allLanguages.find(l => l.code === form.language);
    languageSearch.value = langObj ? langObj.name : 'Auto (System Default)';
    refreshCanvasPreview().catch(() => { });
  }
});

function selectTimezone(tz) {
  const isAuto = tz === AUTO_TIMEZONE_LABEL || tz === LEGACY_AUTO_TIMEZONE_LABEL || tz === 'Auto';
  form.timezone = isAuto ? 'Auto' : tz;
  timezoneSearch.value = isAuto ? AUTO_TIMEZONE_LABEL : tz;
  showTimezoneList.value = false;
}

function selectCity(city) {
  if (city.name === 'Auto (IP Based)') {
    form.city = null;
    form.geolocation = null;
    citySearch.value = 'Auto (IP Based)';
  } else {
    form.city = city.name;
    form.geolocation = { latitude: city.lat, longitude: city.lng, accuracy: 100 };
    citySearch.value = city.name;
  }
  showCityList.value = false;
}

function selectLanguage(lang) {
  form.language = lang.code;
  languageSearch.value = lang.name;
  showLanguageList.value = false;
}

function getSelectedManagedProxy() {
  return managedProxyNodes.value.find(node => node.id === form.proxyId) || null;
}

function getCurrentProxyStr() {
  if (form.proxySource === 'direct') return 'direct';
  if (form.proxySource === 'managed') return getSelectedManagedProxy()?.url || '';
  return String(form.proxyStr || '').trim();
}

function getProxyTestText(result) {
  if (!result.success) return result.error || 'Fail';
  const target = result.target ? ` · ${result.target}` : '';
  return `${result.latency}ms${target}`;
}

function toPlainObject(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function buildCanvasPreviewPayload(rotateNoiseSeed = false) {
  const p = profileStore.profiles.find(x => x.id === uiStore.currentEditId);
  if (!p) return null;
  const baseFingerprint = toPlainObject(p.fingerprint || {});
  const browserPreset = parseBrowserVersionPreset(form.browserVersionPreset);
  const fingerprint = {
    ...baseFingerprint,
    screen: { width: form.resW, height: form.resH },
    window: { width: form.resW, height: form.resH },
    timezone: form.timezone,
    city: form.city,
    geolocation: toPlainObject(form.geolocation),
    language: form.language,
    uaMode: browserPreset.uaMode,
    browserType: browserPreset.browserType,
    browserMajorVersion: browserPreset.browserMajorVersion,
    webglProfile: form.webglProfile
  };

  if (pendingCanvasSeed.value) fingerprint.noiseSeed = Number(pendingCanvasSeed.value);
  if (pendingCanvasSeedProfileId.value) fingerprint.noiseSeedProfileId = pendingCanvasSeedProfileId.value;

  return {
    id: p.id,
    profileId: p.id,
    fingerprint,
    rotateNoiseSeed
  };
}

async function refreshCanvasPreview(options = {}) {
  const payload = buildCanvasPreviewPayload(options.rotateNoiseSeed === true);
  if (!payload) return;
  const requestProfileId = payload.profileId;
  const requestId = canvasPreviewRequestId.value + 1;
  canvasPreviewRequestId.value = requestId;

  isPreviewingCanvas.value = true;
  try {
    const preview = await profileService.previewCanvasFingerprint(toPlainObject(payload));
    if (!uiStore.editModalVisible || uiStore.currentEditId !== requestProfileId || canvasPreviewRequestId.value !== requestId) return;
    canvasPreview.value = preview;
    if (options.rotateNoiseSeed === true) {
      pendingCanvasSeed.value = preview.noiseSeed;
      pendingCanvasSeedProfileId.value = preview.noiseSeedProfileId || payload.profileId;
      rotateNoiseSeedPending.value = true;
    }
  } catch (err) {
    if (!uiStore.editModalVisible || uiStore.currentEditId !== requestProfileId || canvasPreviewRequestId.value !== requestId) return;
    const message = err?.message || String(err || '');
    uiStore.showAlert(`${window.t?.('canvasSeedPreviewFailed') || 'Canvas preview failed: '}${message}`);
  } finally {
    if (uiStore.currentEditId === requestProfileId) isPreviewingCanvas.value = false;
  }
}

async function handleRotateCanvasSeed() {
  await refreshCanvasPreview({ rotateNoiseSeed: true });
}

async function handleTestProxy() {
  const proxyStr = getCurrentProxyStr();
  if (!proxyStr) {
    uiStore.showAlert(window.t?.('proxyRequiredMsg') || '请选择或填写代理链接');
    return;
  }

  isTestingProxy.value = true;
  proxyTestResult.value = null;
  try {
    proxyTestResult.value = await proxyService.testLatency(proxyStr, {
      proxyProbeUrls: settings.value.proxyProbeUrls || ''
    });
  } finally {
    isTestingProxy.value = false;
  }
}

function restoreCommittedSearchText() {
  timezoneSearch.value = form.timezone === 'Auto' ? 'Auto (No Change)' : form.timezone;
  citySearch.value = form.city || 'Auto (IP Based)';
  const langObj = allLanguages.find(l => l.code === form.language);
  languageSearch.value = langObj ? langObj.name : 'Auto (System Default)';
}

function handleGlobalClick(e) {
  if (!e.target.closest('.timezone-wrapper')) {
    showTimezoneList.value = false;
    showCityList.value = false;
    showLanguageList.value = false;
    restoreCommittedSearchText();
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleGlobalClick);
});

onUnmounted(() => {
  window.removeEventListener('mousedown', handleGlobalClick);
});

async function handleSave() {
  try {
    const p = profileStore.profiles.find(x => x.id === uiStore.currentEditId);
    if (!p) return;
    const browserPreset = parseBrowserVersionPreset(form.browserVersionPreset);
    const proxyStr = getCurrentProxyStr();
    if (form.proxySource !== 'direct' && form.proxySource !== 'global' && !proxyStr) {
      uiStore.showAlert(window.t?.('proxyRequiredMsg') || '请选择或填写代理链接');
      return;
    }

    const tagsRaw = (form.tags || '').toString();
    const updated = {
      ...p,
      name: form.name,
      proxySource: form.proxySource,
      proxyId: form.proxySource === 'managed' ? form.proxyId : null,
      proxyStr: form.proxySource === 'custom' ? proxyStr : (form.proxySource === 'direct' ? 'direct' : ''),
      proxyCoreOverride: ['xray', 'sing-box'].includes(form.proxyCoreOverride) ? form.proxyCoreOverride : 'inherit',
      tags: tagsRaw.split(/[,，]/).map(s => s.trim()).filter(s => s),
      notes: form.notes,
      preProxyOverride: form.preProxyOverride,
      preProxyId: form.preProxyOverride === 'off' ? null : (form.preProxyId || null),
      uaMode: browserPreset.uaMode,
      browserType: browserPreset.browserType,
      browserMajorVersion: browserPreset.browserMajorVersion,
      webglProfile: form.webglProfile,
      fingerprint: {
        ...(p.fingerprint || {}),
        screen: { width: form.resW, height: form.resH },
        window: { width: form.resW, height: form.resH },
        timezone: form.timezone,
        city: form.city,
        geolocation: form.geolocation,
        language: form.language,
        uaMode: browserPreset.uaMode,
        browserType: browserPreset.browserType,
        browserMajorVersion: browserPreset.browserMajorVersion,
        webglProfile: form.webglProfile,
        ...(pendingCanvasSeed.value ? { noiseSeed: Number(pendingCanvasSeed.value) } : {}),
        ...(pendingCanvasSeedProfileId.value ? { noiseSeedProfileId: pendingCanvasSeedProfileId.value } : {})
      },
      rotateNoiseSeed: rotateNoiseSeedPending.value && !pendingCanvasSeed.value,
      debugPort: form.debugPort,
      customArgs: form.customArgs
    };

    // 这一步彻底洗掉 Vue 的 Proxy 深度监控包装，防止 Electron 的原生底层报错 "An object could not be cloned"
    const safeUpdated = JSON.parse(JSON.stringify(updated));
    await profileStore.updateProfile(safeUpdated);
    uiStore.closeEditModal();
  } catch (err) {
    console.error('Update profile failed:', err);
    uiStore.showAlert("Update Failed: " + err.message);
  }
}
</script>

<style scoped>
.label-tiny {
  font-size: 11px;
  font-weight: bold;
  opacity: 0.8;
  display: block;
}

.hint-text {
  font-size: 10px;
  opacity: 0.5;
  margin-bottom: 8px;
}

.warning-text {
  font-size: 10px;
  color: #f39c12;
  margin-top: 4px;
}

.flex-row {
  display: flex;
  gap: 10px;
}

.flex-1 {
  flex: 1;
}

.mt-10 {
  margin-top: 10px;
}

.gap-5 {
  gap: 5px;
}

.mono-text {
  font-family: monospace;
  font-size: 11px;
}

.proxy-test-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 10px;
}

.proxy-test-result {
  font-size: 11px;
  color: #27ae60;
}

.proxy-test-result.fail {
  color: #e74c3c;
}

.canvas-seed-panel {
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}

.canvas-seed-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.canvas-seed-actions {
  display: flex;
  gap: 6px;
}

.mini-button {
  padding: 4px 8px;
  font-size: 11px;
}

.canvas-seed-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  margin: 6px 0;
  font-size: 11px;
}

.canvas-seed-grid strong {
  font-family: monospace;
  word-break: break-all;
}

.profile-notes-textarea {
  min-height: 86px;
  resize: vertical;
}
</style>
