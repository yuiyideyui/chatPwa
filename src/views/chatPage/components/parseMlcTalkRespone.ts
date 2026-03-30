let allContent = "";

enum responseStatusEmum {
  "pending" = "pending",
  "talkResponse" = "talkResponse",
  "options" = "options",
  "textBackground" = "textBackground",
  "status" = "status",
}
/**改变到下一个状态 */
const nextResponseStatus = () => {
  if (responseStatus === responseStatusEmum.pending) {
    responseStatus = responseStatusEmum.talkResponse;
  } else if (responseStatus === responseStatusEmum.talkResponse) {
    responseStatus = responseStatusEmum.options;
  } else if (responseStatus === responseStatusEmum.options) {
    responseStatus = responseStatusEmum.textBackground;
  } else if (responseStatus === responseStatusEmum.textBackground) {
    responseStatus = responseStatusEmum.status;
  } else if (responseStatus === responseStatusEmum.status) {
    responseStatus = undefined;
  }
};

interface IResponseStatusOptions {
  type: responseStatusEmum.options;
  next?: boolean;
  content?: string;
  isEnd?: boolean;
}

type InoOptions =
  | responseStatusEmum.talkResponse
  | responseStatusEmum.textBackground
  | responseStatusEmum.status;
interface IResponseStatus {
  type: InoOptions;
  content: string;
}
interface IResponseStatusEnd {
  endType: InoOptions;
}
let responseStatus: responseStatusEmum | undefined; // pending, talkResponse, options, textBackground, status
/**开始返回文字 */
let responseTexting = false;
export const parseMlcTalkResponse = (
  text: string,
):
  | IResponseStatus
  | IResponseStatusOptions
  | void
  | string
  | IResponseStatusEnd => {
  const my_text = text.trim();
  if (my_text.includes("{")) {
    responseStatus = responseStatusEmum.pending;
    clearAllContent();
    allContent += my_text.split("{")[1];
    return;
  }
  if (responseStatus === responseStatusEmum.pending) {
    allContent += my_text;
    if (allContent.includes(responseStatusEmum.talkResponse)) {
      responseStatus = responseStatusEmum.talkResponse;
      clearAllContent();
      allContent += my_text.split(responseStatusEmum.talkResponse)[1];
      return;
    }
  } else {
    if (responseStatus === responseStatusEmum.options) {
      return parseMlcTalkResponseOptions(text);
    } else {
      //非options，都进行统一回复筛选逻辑
      if (my_text.includes('"') && responseTexting) {
        const my_responseStatus = responseStatus;
        clearAllContent();
        nextResponseStatus();
        responseTexting = false;
        allContent += my_text.split('"')[1];
        return {
          endType: my_responseStatus as InoOptions,
        };
      }
      if (allContent.includes('":"') && !responseTexting) {
        responseTexting = true;
        clearAllContent();
        allContent += my_text.split('":"')[1];
        return {
          type: responseStatus as InoOptions,
          content: text,
        };
      } else if (responseTexting) {
        return {
          type: responseStatus as InoOptions,
          content: text,
        };
      } else {
        allContent += my_text;
      }
    }
  }
};

let isNextString = "";
const parseMlcTalkResponseOptions = (text: string) => {
  const my_text = text.trim();
  if (my_text.includes("]") && responseTexting) {
    const my_responseStatus = responseStatus;
    clearAllContent();
    nextResponseStatus();
    responseTexting = false;
    allContent += my_text.split("]")[1];
    //在next返回后做翻译就行
    return {
      type: my_responseStatus as responseStatusEmum.options,
      isEnd: true,
      next: true,
    };
  }
  if (responseTexting) {
    isNextString += my_text;
  }
  if (isNextString.includes('","') && responseTexting) {
    clearAllContent();
    allContent += my_text.split('","')[1];
    isNextString = "";
    return {
      type: responseStatus as responseStatusEmum.options,
      next: true,
    };
  }
  if (allContent.includes('":["') && !responseTexting) {
    responseTexting = true;
    clearAllContent();
    allContent += my_text.split('":["')[1];
    return {
      type: responseStatus as responseStatusEmum.options,
      content: text,
      next: false,
    };
  } else if (responseTexting) {
    return {
      type: responseStatus as responseStatusEmum.options,
      content: text,
      next: false,
    };
  } else {
    allContent += my_text;
  }
};

const clearAllContent = () => {
  allContent = "";
};
