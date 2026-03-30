import { GameType } from "@/store/chatStore/chatStoreIndex.type";
import { defineComponent, type PropType } from "vue";
import s from "./storyGameTemplate.module.css"; 

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
  setup(props,{emit}) {
    const selectOption = (option: string) => {
        console.log('option',option)
      emit("selectOption", option);
    };
    return () => {
      if (props.gameType !== "STORYGAME" || props.msg.role !== "assistant") {
        return <div class={s['default-msg-text']}>{props.msg.content}</div>;
      }

      const { content } = props.msg as IStoryGameAssistant;

      return (
        <div class={s['story-game-container']}>
          {/* 主体对话：气泡感 */}
          <div class={s['talk-response-bubble']}>
            {content.talkResponse}
          </div>

          {/* 交互选项：移动端友好的按钮组 */}
          {content.options?.length > 0 && (
            <div  class={s['options-grid']}>
              {content.options.map((option, index) => (
                <button onClick={()=>selectOption(option)} key={index} class={s['option-card']}>
                  <span class={s['option-index']}>{index + 1}</span>
                  <span class={s['option-text']}>{option}</span>
                </button>
              ))}
            </div>
          )}

          {/* 剧情背景：弱化处理，增加仪式感 */}
          {content.textBackground && (
            <div class={s['background-context']}>
              <div class={s.divider}>
                <span class={s['divider-text']}>SCENE</span>
              </div>
              <p class={s['context-text']}>{content.textBackground}</p>
            </div>
          )}

          {/* 状态：浮动标签 */}
          {content.status && <div class={s['status-tag']}>{content.status}</div>}
        </div>
      );
    };
  },
});