import { generateUUID } from "./utils/utils";
if (!crypto?.randomUUID) {
    //@ts-ignore
    crypto.randomUUID = () => {
        return generateUUID();
    }
}