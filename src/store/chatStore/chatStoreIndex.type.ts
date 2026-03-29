/** 游戏类型枚举 */
export enum GameType {
  TXT = 'TXT',
  TXTGAME = 'TXTGAME',
  STORYGAME = 'STORYGAME'
}

// --- 1. 基础消息内容定义 ---

interface IChatContent {
  chatTime: string;
}

export interface IUserChatContent extends IChatContent {
  role: "user";
  content: string;
}

export interface ISystemChatContent extends IChatContent {
  role: "system"; // 修正了拼写错误
  content: string;
}

// --- 2. 针对不同游戏类型的 Assistant 内容定义 ---

/** 纯文本模式：仅文本 */
interface ITxtAssistantContent {
  talkResponse: string;
}

/** 文本游戏模式：文本 + 选项 + 状态 */
interface ITxtGameAssistantContent {
  talkResponse: string;
  options: string[];
  status: string;
}

/** 故事游戏模式：文本 + 选项 + 背景 + 状态 */
interface IStoryGameAssistantContent {
  talkResponse: string;
  options: string[];
  textBackground: string;
  status: string;
}

// --- 3. 包装成具体的 Assistant 消息类型 ---

export interface ITxtAssistant extends IChatContent {
  role: "assistant";
  content: ITxtAssistantContent;
  typing?: boolean;
}

export interface ITxtGameAssistant extends IChatContent {
  role: "assistant";
  content: ITxtGameAssistantContent;
  typing?: boolean;
}

export interface IStoryGameAssistant extends IChatContent {
  role: "assistant";
  content: IStoryGameAssistantContent;
  typing?: boolean;
}

// --- 4. 核心：定义不同的历史记录接口 ---

interface IChatHistoryBase {
  id: number;
  title: string;
  roleName: string;
  system: string;
  imgUrl: string;
  memory: {
    [key: string]: { chatTime: string; eventContent: string; }[];
  };
}

/** 纯文本历史：Assistant 只有 text */
export interface ITxtChatHistory extends IChatHistoryBase {
  gameType: GameType.TXT;
  chatContent: (IUserChatContent | ISystemChatContent | ITxtAssistant)[];
}

/** 文本游戏历史：Assistant 有选项 */
export interface ITxtGameChatHistory extends IChatHistoryBase {
  gameType: GameType.TXTGAME;
  chatContent: (IUserChatContent | ISystemChatContent | ITxtGameAssistant)[];
}

/** 故事游戏历史：Assistant 有背景故事 */
export interface IStoryGameChatHistory extends IChatHistoryBase {
  gameType: GameType.STORYGAME;
  chatContent: (IUserChatContent | ISystemChatContent | IStoryGameAssistant)[];
}

export type IChatMessage = IUserChatContent | ISystemChatContent | ITxtAssistant | ITxtGameAssistant | IStoryGameAssistant;

export type IChatResponse = ITxtAssistant | ITxtGameAssistant | IStoryGameAssistant

/** 最终导出的联合类型 */
export type IChatHistory = ITxtChatHistory | ITxtGameChatHistory | IStoryGameChatHistory;