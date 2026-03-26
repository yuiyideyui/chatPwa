import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useUserStore = defineStore('user', () => {
  const userInfo = ref<{
    name:string
    type:string
  }>({
    name:'',
    type:'',
  })

  return { userInfo }
})