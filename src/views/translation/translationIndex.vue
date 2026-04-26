<template>
  <div class="translate-container">
    <header class="header">
      <h2>AI 智能翻译</h2>
    </header>

    <div class="lang-selector">
      <div class="lang-item active">{{ sourceLang.label }}</div>
      <div class="exchange-btn" @click="swapLanguages">
        <span class="icon">⇌</span>
      </div>
      <div class="lang-item active">{{ targetLang.label }}</div>
    </div>

    <main class="main-content">
      <div class="card input-card">
        <textarea
          v-model="sourceText"
          placeholder="请输入需要翻译的内容..."
        ></textarea>
        <div class="card-footer">
          <span class="char-count">{{ sourceText.length }}/2000</span>
          <button v-if="sourceText" class="icon-btn" @click="clearInput">
            ✕
          </button>
        </div>
      </div>

      <div class="card output-card" :class="{ 'is-loading': loading }">
        <div v-if="loading" class="loading-spinner">翻译中...</div>
        <div v-else class="result-text">
          {{ translatedText || "翻译结果将在此显示" }}
        </div>
        <div class="card-footer" v-if="translatedText">
          <button class="action-btn" @click="copyResult">复制结果</button>
        </div>
      </div>
    </main>

    <footer class="footer">
      <button class="translate-trigger" @click="doTranslate">立即翻译</button>
    </footer>
  </div>
</template>

<script setup lang="tsx">
import { ref } from "vue";
import { useTransformerStore } from "@/store/index";
import { TranslateType } from "@/store/transformerStore/transformerStoreIndex";
const transformerStore = useTransformerStore();

// 状态定义
const sourceText = ref("");
const translatedText = ref("");
const loading = ref(false);
const sourceLang = ref({
  label: "中文",
  value: "zh-cn",
});
const targetLang = ref({
  label: "英文",
  value: "en-us",
});

// 语言切换
const swapLanguages = () => {
  [sourceLang.value, targetLang.value] = [targetLang.value, sourceLang.value];
  if (translatedText.value) {
    const temp = sourceText.value;
    sourceText.value = translatedText.value;
    translatedText.value = temp;
  }
};

// 清除输入
const clearInput = () => {
  sourceText.value = "";
  translatedText.value = "";
};

// 模拟翻译逻辑
const doTranslate = async () => {
  if (!sourceText.value.trim()) return;

  loading.value = true;
  let result = "";
  if (targetLang.value.value === "zh-cn") {
    result = await transformerStore.translate(
      sourceText.value,
      TranslateType.EnToZh,
    );
  } else {
    result = await transformerStore.translate(
      sourceText.value,
      TranslateType.ZhToEn,
    );
  }
  translatedText.value = result;
  loading.value = false;
};

// 复制
const copyResult = () => {
  navigator.clipboard.writeText(translatedText.value);
  alert("已复制到剪贴板");
};
</script>

<style scoped lang="less">
@primary-color: #0052d9;
@bg-color: #f3f5f8;
@border-radius: 12px;

.translate-container {
  min-height: 100vh;
  background-color: @bg-color;
  display: flex;
  flex-direction: column;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 0 16px;

  .header {
    padding: 20px 0;
    text-align: center;
    h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
    }
  }

  .lang-selector {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 8px;
    border-radius: @border-radius;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;

    .lang-item {
      flex: 1;
      text-align: center;
      font-weight: 500;
      color: @primary-color;
    }

    .exchange-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      .icon {
        font-size: 20px;
        color: #666;
      }
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .card {
      background: #fff;
      border-radius: @border-radius;
      padding: 16px;
      display: flex;
      flex-direction: column;
      min-height: 160px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);

      textarea {
        flex: 1;
        border: none;
        outline: none;
        resize: none;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        &::placeholder {
          color: #bbb;
        }
      }

      .result-text {
        flex: 1;
        font-size: 16px;
        color: #333;
        white-space: pre-wrap;
      }

      .card-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 8px;
        border-top: 1px solid #f0f0f0;
        padding-top: 8px;

        .char-count {
          font-size: 12px;
          color: #999;
          margin-right: auto;
        }
        .icon-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 18px;
        }
        .action-btn {
          background: none;
          border: 1px solid @primary-color;
          color: @primary-color;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
        }
      }
    }

    .is-loading {
      justify-content: center;
      align-items: center;
      color: #999;
    }
  }

  .footer {
    padding: 24px 0;
    .translate-trigger {
      width: 100%;
      background-color: @primary-color;
      color: #fff;
      border: none;
      padding: 14px;
      border-radius: @border-radius;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0, 82, 217, 0.3);
      &:active {
        opacity: 0.8;
      }
    }
  }
}

// 适配桌面端
@media (min-width: 768px) {
  .translate-container {
    max-width: 1000px;
    margin: 0 auto;

    .main-content {
      flex-direction: row;
      .card {
        flex: 1;
        min-height: 300px;
      }
    }

    .footer {
      display: none;
    } // 宽屏通常使用实时翻译，隐藏底部按钮
  }
}
</style>
