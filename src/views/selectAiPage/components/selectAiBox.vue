<template>
  <div class="fixed inset-0 z--1 bg-gradient-to-b from-[#39c5bb] to-[#1a6b65] overflow-hidden">
    <div class="absolute -top-10vw -right-10vw w-60vw h-60vw bg-white/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20vh -left-20vw w-80vw h-80vw bg-black/10 rounded-full blur-3xl"></div>
  </div>

  <div class="flex flex-col h-100vh w-100vw justify-end pb-12 box-border select-none">
    <div class="flex-1 flex flex-col justify-center items-center text-white px-8">
       <transition name="info-fade" mode="out-in">
          <div :key="activeIndex" class="text-center">
            <h1 class="text-4xl font-black italic tracking-tighter mb-2 drop-shadow-md">
              {{ currentRole.name }}
            </h1>
            <p class="text-white/70 text-sm tracking-widest uppercase">—— {{ currentRole.title }} ——</p>
            <div class="mt-4 flex gap-2 justify-center">
                <span v-for="tag in currentRole.tags" :key="tag" 
                      class="px-2 py-1 bg-white/20 rounded-full text-10px backdrop-blur-sm border border-white/10">
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
            activeIndex === index ? 'selected-card scale-125 z-10' : 'scale-90 opacity-40 blur-0.5px'
          ]"
        >
          <div class="absolute inset-0 bg-white/10 backdrop-blur-xl border-1.5px border-white/30 rounded-2xl shadow-2xl"></div>
          
          <div v-if="activeIndex === index" class="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent"></div>

          <div class="absolute inset-0 p-4 flex items-center justify-center">
            <img 
              :src="item.icon" 
              class="w-full h-auto object-contain transition-transform duration-500"
              :style="{ transform: activeIndex === index ? 'scale(1.1) translateY(-5px)' : 'scale(1)' }"
            />
          </div>

          <div class="absolute bottom-0 left-0 w-full h-1.5 bg-white/50" v-if="activeIndex === index"></div>
        </div>
      </div>
      
      <div class="absolute top-1/2 left-4 -translate-y-1/2 text-white/30 animate-pulse pointer-events-none" style="font-size: 40px;">«</div>
      <div class="absolute top-1/2 right-4 -translate-y-1/2 text-white/30 animate-pulse pointer-events-none" style="font-size: 40px;">»</div>
    </div>
    
    <button @click="handleConfirm" class="mx-auto mt-8 px-12 py-3 bg-white text-[#1a6b65] rounded-full font-bold shadow-xl active:scale-95 transition-transform">
      确认选择
    </button>
  </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue'
import { router } from '@/router';
import { useChatStore } from '@/store'

const chatStore = useChatStore()

interface Role {
  name: string;
  title: string;
  icon: string;
  tags: string[];
  system:string;
}

const activeIndex = ref<number>(0)
const scrollContainer = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
const roleList: Role[] = [
  { 
    name: 'ARTHUR', 
    title: '圣殿骑士', 
    icon: 'https://img.icons8.com/color/144/000000/knight.png', 
    tags: ['坦克', '近战'], 
    system: '旧帝国最后的守护者，立誓在永恒之光熄灭前，用盾牌挡住深渊的所有侵蚀。' 
  },
  { 
    name: 'ELENA', 
    title: '秘法导师', 
    icon: 'https://img.icons8.com/color/144/000000/wizard.png', 
    tags: ['爆发', '控制'], 
    system: '奥术议会的放逐者，通过解析禁忌残卷，掌握了逆转时空裂缝的维度秘法。' 
  },
  { 
    name: 'ROBIN', 
    title: '疾风之影', 
    icon: 'https://img.icons8.com/color/144/000000/archer.png', 
    tags: ['持续', '远程'], 
    system: '迷雾森林的放逐游侠，箭尖缠绕着自然的忿怒，她是任何入侵者的噩梦。' 
  },
  { 
    name: 'SHADOW', 
    title: '虚空刺客', 
    icon: 'https://img.icons8.com/color/144/000000/ninja.png', 
    tags: ['敏捷', '突进'], 
    system: '诞生于虚空阴影的无名之辈，没有过去也没有未来，只为执行那改写宿命的最后一击。' 
  },
  { 
    name: 'KAI', 
    title: '武道宗师', 
    icon: 'https://img.icons8.com/color/144/000000/monk.png', 
    tags: ['均衡', '控制'], 
    system: '极北雪山的苦修者，在肉体极限中悟出了气之真谛，通过调和阴阳来维持世界的平衡。' 
  },
];
const currentRole = computed<Role>(() => {
  return roleList[activeIndex.value]!;
});

const setItemRef = (el: any, index: number) => {
  if (el) itemRefs.value[index] = el
}

const handleSelect = (index: number) => {
  activeIndex.value = index
  scrollToCenter(index)
}

const handleConfirm = () => {
  const initChat = {
    id: Date.now(),
    title: currentRole.value.name,
    content: '',
    imgUrl: currentRole.value.icon,
    roleName: currentRole.value.name,
    system: currentRole.value.system,
    chatContent:[],
    memory: {}
  }
  chatStore.addChatHistory(initChat)
  chatStore.setCurrentChat(initChat.id)
  chatStore.saveToIndexedDB()
  router.push('/chatPage')
}

const scrollToCenter = (index: number) => {
  const container = scrollContainer.value
  const targetItem = itemRefs.value[index]
  
  if (container && targetItem) {
    const containerWidth = container.offsetWidth
    const itemWidth = targetItem.offsetWidth
    const itemOffset = targetItem.offsetLeft
    
    // 计算滚动的目标位置，使元素居中
    const scrollLeft = itemOffset - (containerWidth / 2) + (itemWidth / 2)
    
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  // 初始化居中第一个
  setTimeout(() => scrollToCenter(0), 100)
})
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