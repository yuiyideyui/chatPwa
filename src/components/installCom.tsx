import { EbMessage } from "@yuiyideyui/everybody-ui";
import type { Ref } from "vue";

export const installIngCom = (downloadProgress: Ref<number>) => {
  const { close } = EbMessage({
    jsx: () => (
      <div class="top-progress-container">
        <div class="loading-toast">
          <span class="spinner"></span>
          {downloadProgress.value < 100
            ? `下载中... ${downloadProgress.value}%`
            : "开始安装..."}
        </div>
      </div>
    ),
    position: "top",
    baseStyle: false,
  });
  return close;
}