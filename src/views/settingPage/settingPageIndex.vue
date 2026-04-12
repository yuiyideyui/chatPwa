<template>
    <div class="min-h-screen bg-gray-50 md:py-8 flex justify-center">
        <div
            class="w-full md:max-w-3xl md:rounded-2xl md:shadow-lg bg-white overflow-hidden flex flex-col h-screen md:h-[850px]">

            <header class="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                <div class="flex gap-3 items-center">
                    <button @click="$router.back()"
                        class="group flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-90 active:bg-gray-200 md:hover:bg-gray-100">
                        <span
                            class="text-xl font-light text-gray-500 group-hover:text-gray-800 transform -translate-x-0.5">&lt;</span>
                    </button>
                    <h1 class="text-xl font-bold text-gray-800">资源管理</h1>
                </div>
                <div class="flex gap-2">
                    <span class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded">在线</span>
                </div>
            </header>

            <main class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-4">

                <div v-for="(group, groupKey) in resourceGroups" :key="groupKey"
                    class="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

                    <div @click="toggleGroup(groupKey)"
                        class="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center">
                                <span class="material-icons text-sm">{{ group.icon }}</span>
                            </div>
                            <div>
                                <h2 class="font-bold text-gray-700">{{ group.title }}</h2>
                                <p class="text-[10px] text-gray-400 uppercase tracking-tighter">{{ group.items.length }}
                                    个资源可用</p>
                            </div>
                        </div>
                        <span class="material-icons text-gray-400 transition-transform duration-300"
                            :class="{ 'rotate-180': openGroups.includes(groupKey) }">expand_more</span>
                    </div>

                    <div v-show="openGroups.includes(groupKey)"
                        class="border-t border-gray-50 bg-gray-50/30 p-4 space-y-3">
                        <div v-for="item in group.items" :key="item.id"
                            class="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                    <span class="material-icons text-lg">{{ item.icon }}</span>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="text-sm font-semibold text-gray-800 truncate whitespace-pre-wrap">{{
                                        item.name }}</h3>
                                    <p class="text-xs text-gray-400">{{ item.size || '未知大小' }}</p>
                                </div>
                            </div>

                            <div class="flex items-center gap-2">
                                <button v-if="item.status === 'not_installed'" @click="handleAction(groupKey, item)"
                                    class="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all whitespace-nowrap">安装</button>

                                <button v-else-if="item.status === 'installed'" @click="handleAction(groupKey, item)"
                                    class="text-xs font-medium text-gray-400 hover:text-red-500 px-3 py-1.5"
                                    whitespace-nowrap>卸载</button>

                                <div v-else class="flex flex-col items-end w-16">
                                    <div class="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-500 transition-all"
                                            :style="{ width: item.progress + '%' }"></div>
                                    </div>
                                    <span class="text-[9px] text-blue-500 mt-1">{{ item.progress }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            <footer class="p-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div class="text-[10px] text-gray-400 uppercase font-bold">存储空间 {{ storageMetrics.usedGB }} GB/{{
                    storageMetrics.totalGB }} GB</div>
                <div class="flex items-center gap-2">
                    <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-green-400 transition-all duration-500"
                            :style="{ width: storageMetrics.percentUsed + '%' }"></div>
                    </div>
                    <span class="text-xs font-bold text-gray-600">
                        {{ storageMetrics.freeGB }} GB 剩余
                    </span>
                </div>
            </footer>
        </div>
    </div>
</template>

<script setup lang="tsx">
import { startInstallTTS, unInstallTTS } from '@/components/TTS/TTScom';
import { useTransformerStore, useUserStore } from '@/store';
import { uninstallMlc } from '@/utils/initMlc';
import { installTranslator, uninstallTranslatorDB } from '@/utils/initTransformer';
import { EbMessage } from '@yuiyideyui/everybody-ui';
import { computed, onMounted, reactive, ref, type Ref } from 'vue';

const userStore = useUserStore();
const transformerStore = useTransformerStore();
// 定义组
const openGroups = ref(['ai_models']); // 默认打开 AI 模型组

interface ResourceItem {
    id: number;
    name: string;
    size: string;
    icon: string;
    status: 'installed' | 'not_installed';
    progress: number;
    isInstalling: 'none' | 'installing' | 'unInstalling';
    installCallback: (item: ResourceItem) => void;
    uninstallCallback: (item: ResourceItem) => void;
    params?: any
}
type ResourceGroup = {
    title: string;
    icon: string;
    items: ResourceItem[];
};
const resourceGroups: Ref<Record<string, ResourceGroup>> = computed(() => {
    return {
        ai_models: {
            title: 'AI 大模型',
            icon: 'AI',
            items: [
                {
                    id: 101, name: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', size: '700 MB', icon: 'AI', isInstalling: 'none', status: 'installed', progress: 100, installCallback: (item) => {

                    }, uninstallCallback: (item) => {
                        uninstallMlc(item.name)
                    }
                },
            ]
        },
        tts_engines: {
            title: '语音引擎',
            icon: 'Voice',
            items: [
                {
                    id: 201, name: 'sherpaTTS', size: '120 MB', icon: 'TTS', isInstalling: 'none', status: userStore.isTTSInstalled ? 'installed' : 'not_installed', progress: 100, installCallback: async (item) => {
                        item.isInstalling = 'installing';
                        await startInstallTTS()
                        userStore.isTTSInstalled = true;
                        item.isInstalling = 'none';
                    }, uninstallCallback: async (item) => {
                        item.isInstalling = 'unInstalling';
                        await unInstallTTS()
                        userStore.isTTSInstalled = false;
                        item.isInstalling = 'none';
                    }
                },
            ]
        },
        translation: {
            title: '翻译引擎',
            icon: 'TNS',
            items: [
                {
                    id: 301, params: {

                    }, name: 'opus-mt-en-zh', size: '117 MB', icon: 'TNS', status: transformerStore.translatorEnToZh ? 'installed' : 'not_installed', isInstalling: 'none', progress: 0, installCallback: async (item) => {
                        item.isInstalling = 'installing';
                        await installTranslator('opus-mt-en-zh')
                        item.isInstalling = 'none';
                    }, uninstallCallback: async (item) => {
                        item.isInstalling = 'unInstalling';
                        await uninstallTranslatorDB('opus-mt-en-zh')
                        item.isInstalling = 'none';
                    }
                },
                {
                    id: 302, name: 'opus-mt-zh-en', size: '117 MB', icon: 'TNS', isInstalling: 'none', status: transformerStore.translatorZhToEn ? 'installed' : 'not_installed', progress: 32, installCallback: async (item) => {
                        item.isInstalling = 'installing';
                        await installTranslator('opus-mt-zh-en')
                        item.isInstalling = 'none';
                    }, uninstallCallback: async (item) => {
                        item.isInstalling = 'unInstalling';
                        await uninstallTranslatorDB('opus-mt-zh-en')
                        item.isInstalling = 'none';
                    }
                },
            ]
        }
    }
});

const toggleGroup = (key: string) => {
    if (openGroups.value.includes(key)) {
        openGroups.value = openGroups.value.filter(k => k !== key);
    } else {
        openGroups.value.push(key);
    }
};

const handleAction = (groupKey: string, item: ResourceItem) => {
    if (item.isInstalling !== 'none') {
        EbMessage({
            jsx: () => {
                return <div class="flex items-center gap-2">
                    <span class="spinner"></span>
                    <span>{item.isInstalling === 'installing' ? '安装中...' : '卸载中...'}</span>
                </div>
            },
            position: 'center',
            timeClose: 1000,
        })
        return;
    }
    if (item.status === 'not_installed') {
        item.installCallback(item)
        let p = 0;
        const timer = setInterval(() => {
            p += 10;
            item.progress = p;
            if (p >= 100) {
                clearInterval(timer);
                item.status = 'installed';
            }
        }, 150);
    } else {
        item.uninstallCallback(item)
        item.progress = 0;
    }
};

// 存储指标状态
const storageMetrics = reactive({
    percentUsed: 0,
    freeGB: '0.0',
    usedGB: '0.0',
    totalGB: '0.0'
});

/**
 * 获取浏览器存储配额信息 (包含 IndexedDB)
 */
const updateStorageInfo = async () => {
    if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();

        // usage: 已使用的字节数
        // quota: 浏览器分配的总可用字节数
        if (usage !== undefined && quota !== undefined) {
            const used = usage / (1024 ** 3); // 转换为 GB
            const total = quota / (1024 ** 3); // 转换为 GB
            const free = total - used;

            storageMetrics.percentUsed = Math.round((usage / quota) * 100);
            storageMetrics.freeGB = free.toFixed(1);
            storageMetrics.usedGB = used.toFixed(2);
            storageMetrics.totalGB = total.toFixed(1);
        }
    } else {
        console.warn("当前浏览器不支持 StorageManager API");
    }
};

onMounted(() => {
    updateStorageInfo();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #f1f1f1;
    border-radius: 10px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: #e5e7eb;
}
</style>