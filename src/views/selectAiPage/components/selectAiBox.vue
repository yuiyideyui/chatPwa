<template>
  <div
    class="fixed inset-0 z--1 bg-gradient-to-b from-[#39c5bb] to-[#1a6b65] overflow-hidden"
  >
    <div
      class="absolute -top-10vw -right-10vw w-60vw h-60vw bg-white/10 rounded-full blur-3xl"
    ></div>
    <div
      class="absolute bottom-20vh -left-20vw w-80vw h-80vw bg-black/10 rounded-full blur-3xl"
    ></div>
  </div>

  <div
    class="flex flex-col h-100dvh w-100vw justify-end pb-12 box-border select-none"
  >
    <div
      class="flex-1 flex flex-col justify-center items-center text-white px-8"
    >
      <transition name="info-fade" mode="out-in">
        <div :key="activeIndex" class="text-center">
          <h1
            class="text-4xl font-black italic tracking-tighter mb-2 drop-shadow-md"
          >
            {{ currentRole.name }}
          </h1>
          <p class="text-white/70 text-sm tracking-widest uppercase">
            —— {{ currentRole.title }} ——
          </p>
          <div class="mt-4 flex gap-2 justify-center">
            <span
              v-for="tag in currentRole.tags"
              :key="tag"
              class="px-2 py-1 bg-white/20 rounded-full text-10px backdrop-blur-sm border border-white/10"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </transition>
    </div>

    <div class="relative w-100vw">
      <div
        ref="scrollContainer"
        class="role-scroll-container flex items-center overflow-x-auto gap-6 px-45vw no-scrollbar py-8"
      >
        <div
          v-for="(item, index) in roleList"
          :key="index"
          :ref="(el) => setItemRef(el, index)"
          @click="handleSelect(index)"
          :class="[
            'role-card relative flex-shrink-0 w-32vw h-42vw rounded-2xl transition-all duration-500 ease-out cursor-pointer overflow-hidden',
            activeIndex === index
              ? 'selected-card scale-125 z-10'
              : 'scale-90 opacity-40 blur-0.5px',
          ]"
        >
          <div
            class="absolute inset-0 bg-white/10 backdrop-blur-xl border-1.5px border-white/30 rounded-2xl shadow-2xl"
          ></div>

          <div
            v-if="activeIndex === index"
            class="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent"
          ></div>

          <div class="absolute inset-0 p-4 flex items-center justify-center">
            <img
              :src="item.icon"
              class="w-full h-auto object-contain transition-transform duration-500"
              :style="{
                transform:
                  activeIndex === index
                    ? 'scale(1.1) translateY(-5px)'
                    : 'scale(1)',
              }"
            />
          </div>

          <div
            class="absolute bottom-0 left-0 w-full h-1.5 bg-white/50"
            v-if="activeIndex === index"
          ></div>
        </div>
      </div>

      <div
        class="absolute top-1/2 left-4 -translate-y-1/2 text-white/30 animate-pulse cursor-pointer z-10"
        style="font-size: 40px"
        @click="selectLeft"
      >
        «
      </div>
      <div
        class="absolute top-1/2 right-4 -translate-y-1/2 text-white/30 animate-pulse cursor-pointer z-10"
        style="font-size: 40px"
        @click="selectRight"
      >
        »
      </div>
    </div>

    <button
      @click="handleConfirm"
      class="mx-auto mt-8 px-12 py-3 bg-white text-[#1a6b65] rounded-full font-bold shadow-xl active:scale-95 transition-transform"
    >
      确认选择
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { router } from "@/router";
import { useChatStore, useUserStore } from "@/store";
import type { Role } from "./selectAiBox.type";
import { roleListZh } from "./roleListZh";
import type { IChatHistory } from "@/store/chatStore/chatStoreIndex.type";

const chatStore = useChatStore();
const userStore = useUserStore();

const activeIndex = ref<number>(0);
const scrollContainer = ref<HTMLElement | null>(null);
const itemRefs = ref<HTMLElement[]>([]);
const roleList: Role[] = roleListZh;

const currentRole = computed<Role>(() => {
  return roleList[activeIndex.value]!;
});

const setItemRef = (el: any, index: number) => {
  if (el) itemRefs.value[index] = el;
};

const selectLeft = () => {
  console.log("left");
  activeIndex.value =
    (activeIndex.value - 1 + roleList.length) % roleList.length;
  scrollToCenter(activeIndex.value);
};

const selectRight = () => {
  activeIndex.value = (activeIndex.value + 1) % roleList.length;
  scrollToCenter(activeIndex.value);
};

const handleSelect = (index: number) => {
  activeIndex.value = index;
  scrollToCenter(index);
};

const handleConfirm = async () => {
  let initChatEn: IChatHistory | undefined = undefined;
  if (userStore.isMobile) {
    const { roleListEn } = await import("./roleListEn");
    const currentRoleEn = roleListEn[activeIndex.value]!;
    initChatEn = {
      id: Date.now(),
      title: currentRoleEn.name,
      imgUrl: currentRoleEn.icon,
      roleName: currentRoleEn.name,
      system: currentRoleEn.system,
      gameType: currentRoleEn.gameType,
      chatContent: [],
      memory: {},
    };
  }
  const initChat: IChatHistory = {
    id: Date.now(),
    title: currentRole.value.name,
    imgUrl: currentRole.value.icon,
    roleName: currentRole.value.name,
    system: currentRole.value.system,
    gameType: currentRole.value.gameType,
    chatContent: [],
    memory: {},
  };
  chatStore.addChatHistory(initChat, initChatEn);
  chatStore.setCurrentChat(initChat.id);
  chatStore.saveToIndexedDB();
  router.push("/chatPage");
};

const scrollToCenter = (index: number) => {
  const container = scrollContainer.value;
  const targetItem = itemRefs.value[index];

  if (container && targetItem) {
    const containerWidth = container.offsetWidth;
    const itemWidth = targetItem.offsetWidth;
    const itemOffset = targetItem.offsetLeft;

    // 计算滚动的目标位置，使元素居中
    const scrollLeft = itemOffset - containerWidth / 2 + itemWidth / 2;

    container.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  }
};

onMounted(() => {
  // 初始化居中第一个
  setTimeout(() => scrollToCenter(0), 100);
});
</script>

<style scoped>
/* 隐藏滚动条 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 选中卡片的特殊发光效果 */
.selected-card {
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
}

/* 文字切换动画 */
.info-fade-enter-active,
.info-fade-leave-active {
  transition: all 0.4s ease;
}
.info-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.info-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.role-scroll-container {
  /* 确保首尾元素也能居中，利用内边距撑开 */
  scroll-snap-type: x mandatory;
}

.role-card {
  scroll-snap-align: center;
}
</style>
