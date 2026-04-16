<template>
  <div class="min-h-screen bg-gray-50 md:py-8 flex justify-center">
    <div
      class="w-full md:max-w-3xl md:rounded-2xl md:shadow-lg bg-white overflow-hidden flex flex-col h-screen md:h-[850px]"
    >
      <header
        class="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0"
      >
        <div class="flex gap-3 items-center">
          <button
            @click="$router.back()"
            class="group flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-90 active:bg-gray-200 md:hover:bg-gray-100"
          >
            <span
              class="text-xl font-light text-gray-500 group-hover:text-gray-800 transform -translate-x-0.5"
              >&lt;</span
            >
          </button>
          <h1 class="text-xl font-bold text-gray-800">资源管理</h1>
        </div>
        <div class="flex gap-2">
          <span
            class="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded"
            >在线</span
          >
        </div>
      </header>

      <main
        class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-4"
      >
        <div
          v-for="(group, groupKey) in resourceGroups"
          :key="groupKey"
          class="border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
        >
          <div
            @click="toggleGroup(groupKey)"
            class="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center"
              >
                <span class="material-icons text-sm">{{ group.icon }}</span>
              </div>
              <div>
                <h2 class="font-bold text-gray-700">{{ group.title }}</h2>
                <p class="text-[10px] text-gray-400 uppercase tracking-tighter">
                  {{ group.items.length }} 个资源可用
                </p>
              </div>
            </div>
            <span
              class="material-icons text-gray-400 transition-transform duration-300"
              :class="{ 'rotate-180': openGroups.includes(groupKey) }"
              >expand_more</span
            >
          </div>

          <div
            v-show="openGroups.includes(groupKey)"
            class="border-t border-gray-50 bg-gray-50/30 p-4 space-y-3"
          >
            <div
              v-for="item in group.items"
              :key="item.id"
              class="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 position-relative min-h-30"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"
                >
                  <span class="material-icons text-lg">{{ item.icon }}</span>
                </div>
                <div class="min-w-0">
                  <h3
                    class="text-sm font-semibold text-gray-800 truncate whitespace-pre-wrap"
                  >
                    {{ item.name }}
                  </h3>
                  <p class="text-xs text-gray-400">
                    {{ item.size || "未知大小" }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  v-if="item.status === 'not_installed'"
                  @click="handleAction(item, 'install', group)"
                  class="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all whitespace-nowrap"
                >
                  安装
                </button>

                <button
                  v-else-if="item.status === 'installed'"
                  @click="handleAction(item, 'uninstall', group)"
                  class="text-xs font-medium text-gray-400 hover:text-red-500 px-3 py-1.5"
                  whitespace-nowrap
                >
                  卸载
                </button>
              </div>

              <div class="position-absolute right-0 bottom-0 p-3">
                <label class="labeled-switch">
                  <input
                    type="checkbox"
                    @click.prevent="handleAction(item, 'changeActive', group)"
                    :disabled="item.status !== 'installed'"
                  />
                  <span
                    class="slider"
                    :class="{ isActive: item.isActive }"
                  ></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        class="p-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0"
      >
        <div class="text-[10px] text-gray-400 uppercase font-bold">
          存储空间 {{ storageMetrics.usedGB }} GB/{{ storageMetrics.totalGB }}
          GB
        </div>
        <div class="flex items-center gap-2">
          <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-green-400 transition-all duration-500"
              :style="{ width: storageMetrics.percentUsed + '%' }"
            ></div>
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
import { computed, onMounted, reactive, ref, type Ref } from "vue";
import {
  actionMap,
  getResourceGroups,
  type ResourceGroup,
} from "./resourceGroups.tsx";

type ResourceItem = ResourceGroup["items"][number];

// 定义组
const openGroups = ref(["ai_models"]); // 默认打开 AI 模型组

const resourceGroups: Ref<Record<string, ResourceGroup>> = computed(() => {
  return getResourceGroups();
});

const toggleGroup = (key: string) => {
  if (openGroups.value.includes(key)) {
    openGroups.value = openGroups.value.filter((k) => k !== key);
  } else {
    openGroups.value.push(key);
  }
};

const handleAction = async (
  item: ResourceItem,
  type: "install" | "uninstall" | "changeActive",
  group: ResourceGroup,
) => {
  actionMap[type](item, group);
};

// 存储指标状态
const storageMetrics = reactive({
  percentUsed: 0,
  freeGB: "0.0",
  usedGB: "0.0",
  totalGB: "0.0",
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
      const used = usage / 1024 ** 3; // 转换为 GB
      const total = quota / 1024 ** 3; // 转换为 GB
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

/* 1. Switch 整体容器 */
.labeled-switch {
  position: relative;
  display: inline-block;
  /* 增加宽度以容纳文字 */
  width: 68px;
  height: 30px;
}

/* 2. 隐藏原生的 Checkbox */
.labeled-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* 3. 滑块轨道 (背景) */
.labeled-switch .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e2e8f0; /* 默认禁用状态的背景色 */
  transition: 0.4s;
  border-radius: 30px;
  /* 关键：使用 flex 布局，让文字居中 */
  display: flex;
  align-items: center;
  /* 关键：为文字预留位置 */
  padding: 0 8px;
  box-sizing: border-box;
}

/* 4. 滑块轨道上的文字 (核心优化) */
.labeled-switch .slider::after {
  content: "停用"; /* 默认状态显示的文字 */
  font-size: 12px;
  color: #718096;
  font-weight: 600;
  width: 100%;
  /* 文字默认偏右显示 */
  text-align: right;
  transition: 0.4s;
}

/* 5. 圆形滑块本体 */
.labeled-switch .slider::before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* 确保圆形滑块总是在最上层 */
  z-index: 2;
}

/* --- 6. 选中 (启用) 时的状态 --- */

/* 背景颜色变蓝 (使用优雅的绿色或蓝色) */
.labeled-switch input + .slider.isActive {
  background-color: #4fd1c5; /* Teal 色，比纯蓝更柔和 */
}

/* 圆形滑块位移 (移动到右侧) */
.labeled-switch input + .slider.isActive::before {
  transform: translateX(38px);
}

/* 文字内容和位置改变 */
.labeled-switch input + .slider.isActive::after {
  content: "启用"; /* 选中时的文字 */
  color: white;
  text-align: left;
}

/* --- 7. Disabled (未安装) 时的特殊样式 --- */

.labeled-switch input:disabled + .slider {
  background-color: #f7fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

.labeled-switch input:disabled + .slider::after {
  color: #a0aec0;
}
</style>
