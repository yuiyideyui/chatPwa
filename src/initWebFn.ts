import { generateUUID } from "./utils/utils.tsx";
if (!crypto?.randomUUID) {
  //@ts-ignore
  crypto.randomUUID = () => {
    return generateUUID();
  };
}
