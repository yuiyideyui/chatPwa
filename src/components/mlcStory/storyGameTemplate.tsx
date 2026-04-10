import { GameType } from "@/store/chatStore/chatStoreIndex.type";
import { defineComponent, type PropType } from "vue";
import s from "./storyGameTemplate.module.css";
import voiceIcon from '@/assets/icons8-voice-100.png';
import { ttsInstance } from "@/components/TTS/TTScom";
// 假设你的类型定义
interface IStoryGameAssistant {
  role: "assistant";
  content: {
    talkResponse: string;
    options: string[];
    textBackground: string;
    status: string;
  };
}

export const StoryGameTemplate = defineComponent({
  name: "StoryGameTemplate",
  props: {
    msg: { type: Object as PropType<any>, required: true },
    gameType: { type: String as PropType<GameType>, required: true },
  },
  setup(props, { emit }) {
    const formatContent = (text: string) => {
      if (!text) return "";
      // 将字符串里的 "\\n" 替换为真正的换行符 "\n"
      return text.replace(/\\n/g, "\n");
    };
    const selectOption = (option: string) => {
      // console.log("option", option);
      emit("selectOption", option);
    };
    return () => {
      if (props.gameType !== "STORYGAME" || props.msg.role !== "assistant") {
        return <div class={s["default-msg-text"]}>{props.msg.content}</div>;
      }

      const { content } = props.msg as IStoryGameAssistant;
      // console.log("content", content);
      return (
        <>
          <div class={s["story-game-container"]}>
            {/* 主体对话 */}
            <div class={s["talk-response-bubble"]}>{formatContent(content.talkResponse)}</div>
            <div>
              <img onClick={()=>startTTS(formatContent(content.talkResponse))} src={voiceIcon} alt="" style={{ width: '1rem', height: '1rem' }} />
            </div>

            {/* 交互选项 */}
            {content.options?.length > 0 && (
              <div class={s["options-grid"]}>
                {content.options.map((option, index) => (
                  <button
                    onClick={() => selectOption(option)}
                    key={index}
                    class={s["option-card"]}
                  >
                    <span class={s["option-index"]}>{index + 1}</span>
                    <span class={s["option-text"]}>{formatContent(option)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 剧情背景 */}
            {content.textBackground && (
              <div class={s["background-context"]}>
                <div class={s.divider}>
                  <span class={s["divider-text"]}>SCENE</span>
                </div>
                <p class={s["context-text"]}>{formatContent(content.textBackground)}</p>
              </div>
            )}

            {/* 状态 */}
            {content.status && (
              <div class={s["status-tag"]}>{formatContent(content.status)}</div>
            )}
          </div>
        </>
      );
    };
  },
});

const startTTS = (text: string) => {
  ttsInstance.value?.speak(text);
}