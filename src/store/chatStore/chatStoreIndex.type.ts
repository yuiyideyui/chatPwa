
    export interface IChatHistory{
      id: number;
      title: string;
      content: string;
      roleName:string;
      system:string;
      imgUrl:string;
      chatContent:{
        role:'user' | 'assistant' | 'syetem';
        content:string;
        chatTime:string;
      }[];
      memory: {
        [key: string]: {
          chatTime: string;
          eventContent: string;
        }[];
      };
    }