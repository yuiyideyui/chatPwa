import { EbMessage, type EbMessageOptions } from '@yuiyideyui/everybody-ui';
import { ref, type CSSProperties } from 'vue';
//@ts-ignore
import { installTTS,terminateTTS } from "@/components/TTS/TTSinstall";
import { setStorage } from '@/utils/storage';
import { useUserStore } from '@/store';


const isShowTTSInstallMessage = ref(false);
// 1. 定义自适应容器样式
const containerStyle: CSSProperties = {
    padding: '24px 20px 20px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    border: '1px solid #f0f0f0',
    position: 'relative',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    width: '90vw',
    maxWidth: '400px',
    boxSizing: 'border-box'
};

// 2. 优化按钮样式
const buttonStyle: CSSProperties = {
    display: 'inline-block',
    padding: '8px 20px',
    backgroundColor: '#409eff',
    color: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'opacity 0.2s',
    textAlign: 'center',
    userSelect: 'none'
};
const showInstallTTS = () => {
    if (isShowTTSInstallMessage.value) return;
    isShowTTSInstallMessage.value = true;
    const options: EbMessageOptions = {
        position: 'center',
        baseStyle: false,
        jsx: () => (
            <div style={containerStyle}>
                <div
                    onClick={() => closeCallback()}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#ccc',
                        lineHeight: '1',
                        fontSize: '18px',
                        transition: 'color 0.2s'
                    }}
                >
                    ✕
                </div>
                <div style={{
                    marginBottom: '20px',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#444',
                    textAlign: 'center'
                }}>
                    安装语言包<br />
                    即可朗读文本内容。
                </div>

                {/* 操作区域 */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                        style={buttonStyle}
                        onClick={() => handleInstallTTS()}
                    >
                        立即安装
                    </div>
                </div>
            </div>
        ),
    };
    const { close } = EbMessage(options)
    const closeCallback = () => {
        close()
        isShowTTSInstallMessage.value = false;
    };
    const handleInstallTTS = () => {
        startInstallTTS();
        closeCallback();
    };
}
/**
 * TTS的实例对象 speak
 */
const ttsInstance = ref<any>(null);
const ttsDownloadingProgress = ref(0);
const startInstallTTS = async () => {
    const endText = ref('')
    const { close } = EbMessage({
        jsx: () => (
            <div class="top-progress-container">
                <div class="loading-toast">
                    <span class="spinner"></span>
                    {
                        !endText.value
                            ? (ttsDownloadingProgress.value !== 100
                                ? `下载中... ${ttsDownloadingProgress.value}%`
                                : '开始安装')
                            : endText.value
                    }
                </div>
            </div>
        ),
        position: 'top',
        baseStyle: false,
    });
    ttsInstance.value = await installTTS(ttsDownloadingProgress);
    endText.value = '语音包安装成功！';
    setTimeout(() => {
        const userStore = useUserStore();
        setStorage('isTTSInstalled', true);
        userStore.setTTSStorage(true);
        close();
    }, 1000);
}
const unInstallTTS = async () => {
    const userStore = useUserStore();
    setStorage('isTTSInstalled', false);
    userStore.setTTSStorage(false);
    ttsInstance.value = null;
    terminateTTS();
}

export {
    showInstallTTS,
    startInstallTTS,
    unInstallTTS,
    ttsInstance,
}
