import {
  startInstallTTS,
  unActiveTTS,
  unInstallTTS,
} from "@/components/TTS/TTScom";
import { useUserStore } from "@/store";
import type { AISetting } from "@/store/userStore/userStoreIndex";
import { installMlc, unActiveMlc, uninstallMlc } from "@/utils/initMlc";
import {
  installTranslator,
  uninstallTranslatorDB,
} from "@/utils/initTransformer";
import { setStorage } from "@/utils/storage";
import { EbMessage } from "@yuiyideyui/everybody-ui";
import { reactive } from "vue";

// --- 类型定义 ---

export interface ResourceItem {
  id: number;
  name: string;
  size: string;
  icon: string;
  status: "installed" | "not_installed";
  progress: number;
  isInstalling: "none" | "installing" | "unInstalling";
  installCallback: (this: ResourceItem) => void | Promise<void>;
  uninstallCallback: (this: ResourceItem) => void | Promise<void>;
  unActiveCallback: (this: ResourceItem) => void | Promise<void>;
  isActive: boolean;
  params?: any;
}

export type ResourceGroup = {
  title: string;
  icon: string;
  items: ResourceItem[];
};

// --- 数据初始化 ---

const ai_models: Record<"pc" | "mobile", ResourceGroup> = reactive({
  pc: { title: "AI 大模型", icon: "AI", items: [] },
  mobile: {
    title: "AI 大模型",
    icon: "AI",
    items: [
      {
        id: 101,
        name: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        size: "700 MB",
        icon: "AI",
        isInstalling: "none",
        status: "not_installed",
        progress: 100,
        isActive: false,
        unActiveCallback: async function () {
          await unActiveMlc();
        },
        installCallback: async function () {
          await installMlc(this.name as any);
        },
        uninstallCallback: async function () {
          await uninstallMlc(this.name as any);
        },
      },
    ],
  },
});

const createTtsItems = (): ResourceItem[] => [
  {
    id: 201,
    name: "sherpaTTS",
    size: "120 MB",
    icon: "TTS",
    isInstalling: "none",
    status: "not_installed",
    progress: 100,
    isActive: false,
    unActiveCallback: async function () {
      await unActiveTTS();
    },
    installCallback: async function () {
      await startInstallTTS();
    },
    uninstallCallback: async function () {
      await unInstallTTS();
    },
  },
];
const tts_engines: Record<"pc" | "mobile", ResourceGroup> = reactive({
  pc: { title: "语音引擎", icon: "Voice", items: createTtsItems() },
  mobile: { title: "语音引擎", icon: "Voice", items: createTtsItems() },
});
const createTranslationItems = (): ResourceItem[] => [
  {
    id: 301,
    params: {},
    name: "opus-mt-en<->zh",
    size: "234 MB",
    icon: "TNS",
    status: "not_installed",
    isInstalling: "none",
    isActive: false,
    unActiveCallback: async function () {
      await uninstallTranslatorDB("opus-mt-en<->zh");
    },
    progress: 0,
    installCallback: async function () {
      await installTranslator("opus-mt-en<->zh");
    },
    uninstallCallback: async function () {
      await uninstallTranslatorDB("opus-mt-en<->zh");
    },
  },
  // {
  //   id: 302,
  //   name: "opus-mt-zh-en",
  //   size: "117 MB",
  //   icon: "TNS",
  //   isActive: false,
  //   unActiveCallback: async function () {
  //     await uninstallTranslatorDB("opus-mt-zh-en");
  //   },
  //   isInstalling: "none",
  //   status: "not_installed",
  //   progress: 32,
  //   installCallback: async function () {
  //     await installTranslator("opus-mt-zh-en");
  //   },
  //   uninstallCallback: async function () {
  //     await uninstallTranslatorDB("opus-mt-zh-en");
  //   },
  // },
];
const translation: Record<"pc" | "mobile", ResourceGroup> = reactive({
  pc: { title: "翻译引擎", icon: "TNS", items: createTranslationItems() },
  mobile: { title: "翻译引擎", icon: "TNS", items: createTranslationItems() },
});

export const updateResourceGroups = () => {
  setAiSettings(getAiSettings());
};

/**
 * 核心更新方法：将外部简化的 AISetting 数据同步到本地复杂的 ResourceGroup 对象中
 */
export const setAiSettings = (resourceGroups: AISetting) => {
  if (!resourceGroups) return;
  // 定义一个内部更新函数
  const syncGroup = (localGroup: ResourceGroup, remoteItems: any[]) => {
    localGroup.items.forEach((localItem) => {
      const remoteItem = remoteItems.find((r) => r.id === localItem.id);
      if (remoteItem) {
        // 仅同步数据状态，不覆盖 installCallback 等方法
        localItem.status = remoteItem.status;
        localItem.isActive = remoteItem.isActive;
      }
    });
  };

  // 遍历传入的所有资源组进行同步
  for (const key in resourceGroups) {
    const remoteData = resourceGroups[key];
    if (!remoteData) continue;
    // 同步对应的本地资源（同时同步 PC 和 Mobile 的状态，保证一致性）
    if (key === "ai_models") {
      syncGroup(ai_models.pc, remoteData.items);
      syncGroup(ai_models.mobile, remoteData.items);
    } else if (key === "tts_engines") {
      syncGroup(tts_engines.pc, remoteData.items);
      syncGroup(tts_engines.mobile, remoteData.items);
    } else if (key === "translation") {
      syncGroup(translation.pc, remoteData.items);
      syncGroup(translation.mobile, remoteData.items);
    }
  }
  console.log("resourceGroups", getAiSettings());
  setStorage("aiSetting", resourceGroups);
};

export const getAiSettings = (): AISetting => {
  const resourceGroups = getResourceGroups();
  const entries = Object.entries(resourceGroups).map(([key, group]) => {
    return [
      key,
      {
        title: group.title,
        icon: group.icon,
        items: group.items.map(({ name, id, status, isActive }) => ({
          name,
          id,
          status,
          isActive,
        })),
      },
    ];
  });
  return Object.fromEntries(entries) as AISetting;
};

/**
 * 获取当前环境（移动端/桌面端）的资源组
 */
export const getResourceGroups = () => {
  const userStore = useUserStore();
  const mode = userStore.isMobile ? "mobile" : "pc";
  return {
    ai_models: ai_models[mode],
    tts_engines: tts_engines[mode],
    translation: translation[mode],
  };
};

const install_or_uninstall = async (item: ResourceItem) => {
  if (item.isInstalling !== "none") {
    EbMessage({
      jsx: () => {
        return (
          <div class="flex items-center gap-2">
            <span class="spinner"></span>
            <span>
              {item.isInstalling === "installing" ? "安装中..." : "卸载中..."}
            </span>
          </div>
        );
      },
      position: "center",
      timeClose: 1000,
    });
    return;
  }
  if (item.status === "not_installed") {
    item.isInstalling = "installing";
    await item.installCallback();
    item.status = "installed";
    item.isInstalling = "none";
    updateResourceGroups();
  } else {
    item.isInstalling = "unInstalling";
    await item.uninstallCallback();
    item.status = "not_installed";
    item.isInstalling = "none";
    updateResourceGroups();
  }
};
const changeActive = (item: ResourceItem, group: ResourceGroup) => {
  const targetState = !item.isActive;
  if (targetState) {
    const activeItem = group.items.find((i) => i.isActive && i !== item);
    if (activeItem) {
      activeItem.isActive = false;
      activeItem.unActiveCallback();
    }
    item.isActive = true;
    item.installCallback();
  } else {
    item.isActive = false;
    item.unActiveCallback();
  }
  updateResourceGroups();
};
export const actionMap = {
  install: (item: ResourceItem) => {
    install_or_uninstall(item);
  },
  uninstall: (item: ResourceItem) => {
    install_or_uninstall(item);
  },
  changeActive,
};
