import { ipcService } from './ipc.service';
import { decodeBase64Content, getProxyRemark, uuidv4 } from '../utils/helpers';

const MAX_PROXY_LATENCY_BATCH_SIZE = 100;
const MAX_PROXY_LATENCY_CONCURRENCY = 6;

async function mapWithConcurrency(items, concurrency, worker) {
    const results = new Array(items.length);
    let cursor = 0;
    const runners = Array.from({ length: Math.max(1, Math.min(concurrency, items.length || 1)) }, async () => {
        while (true) {
            const index = cursor++;
            if (index >= items.length) return;
            results[index] = await worker(items[index], index);
        }
    });
    await Promise.all(runners);
    return results;
}

/**
 * 代理与订阅服务 - 处理节点测试、订阅同步与数据解析
 */
export const proxyService = {
    /**
     * 测试单个节点的延迟
     */
    async testLatency(url, options = {}) {
        try {
            const res = await ipcService.invoke('test-proxy-latency', url, options);
            return {
                success: res.success,
                latency: res.success ? res.latency : -1,
                target: res.target || '',
                error: res.success ? '' : (res.msg || 'Fail')
            };
        } catch (error) {
            return { success: false, latency: -1, error: error.message || 'Error' };
        }
    },

    /**
     * 批量测试节点延迟
     */
    async testBatchLatency(nodes, options = {}) {
        try {
            return await ipcService.invoke(
                'test-proxy-latency-batch',
                nodes.map((p) => ({ id: p.id, url: p.url })),
                options
            );
        } catch (error) {
            const fallbackNodes = nodes.slice(0, MAX_PROXY_LATENCY_BATCH_SIZE);
            return await mapWithConcurrency(fallbackNodes, MAX_PROXY_LATENCY_CONCURRENCY, async (p) => {
                const res = await this.testLatency(p.url, options);
                return { id: p.id, ...res };
            });
        }
    },

    /**
     * 测试前置代理 + 出口代理链路延迟
     */
    async testChainLatency(outboundUrl, preProxyUrl, options = {}) {
        try {
            const res = await ipcService.invoke('test-proxy-chain-latency', {
                outboundUrl,
                preProxyUrl
            }, options);
            return {
                success: res.success,
                latency: res.success ? res.latency : -1,
                target: res.target || '',
                error: res.success ? '' : (res.msg || 'Fail')
            };
        } catch (error) {
            return { success: false, latency: -1, error: error.message || 'Error' };
        }
    },

    /**
     * 同步订阅节点
     */
    async syncSubscription(sub) {
        try {
            const content = await ipcService.invoke('fetch-url', sub.url);
            let decoded = content;
            
            // 尝试处理 Base64 编码的订阅内容
            try { 
                if (!content.includes('://')) {
                    decoded = decodeBase64Content(content);
                }
            } catch (e) {
                console.warn('[Proxy Service] Base64 decode failed, using raw content');
            }

            const lines = decoded.split(/[\r\n]+/);
            const newNodes = [];
            let count = 0;

            lines.forEach(line => {
                line = line.trim();
                if (line && line.includes('://')) {
                    const remark = getProxyRemark(line) || `Node ${count + 1}`;
                    newNodes.push({
                        id: uuidv4(),
                        remark,
                        url: line,
                        enable: true,
                        groupId: sub.id
                    });
                    count++;
                }
            });

            return { success: true, count, nodes: newNodes };
        } catch (error) {
            console.error('[Proxy Service] Sync failed:', error);
            return { success: false, error: error.message || 'Update failed' };
        }
    },

    /**
     * 保存代理设置
     */
    async saveSettings(settings) {
        return await ipcService.saveSettings(settings);
    }
};
