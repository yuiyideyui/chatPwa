import type { IChatHistory } from "@/store/chatStore/chatStoreIndex.type";

// const DB_NAME = 'chatDb';
const STORE_NAME = "chatHistory";
export enum DB_NAME_ENUM {
  "chatDb" = "chatDb",
  "chatDbEn" = "chatDbEn",
}
/**
 * 打开数据库
 */
export function openDB(
  version = 1,
  DB_NAME = DB_NAME_ENUM.chatDb,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, version);

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = () => {
      console.error("数据库打开失败");
      reject("DB_OPEN_ERROR");
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      // 这里的名字必须和 STORE_NAME 一致
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 使用 IChatHistory 中的 id 作为主键
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        // 根据类型需求创建索引
        objectStore.createIndex("roleName", "roleName", { unique: false });
        objectStore.createIndex("title", "title", { unique: false });
      }
    };
  });
}

/**
 * 新增或更新数据 (建议使用 put，这样 ID 重复时会覆盖旧记录，适合保存聊天)
 */
export async function addChatData(db: IDBDatabase, data: IChatHistory) {
  return new Promise((resolve, reject) => {
    try {
      // 关键：处理 Vue Proxy 对象。如果是 Pinia 数据，建议使用 toRaw 或 JSON 序列化
      const rawData = JSON.parse(JSON.stringify(data));
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // put 方法：存在则更新，不存在则新增
      const request = store.put(rawData);

      request.onsuccess = () => {
        console.log("数据持久化成功");
        resolve(true);
      };

      request.onerror = (event: any) => {
        console.error("数据写入失败", event.target.error);
        reject(event.target.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}
export function deleteChatData(db: IDBDatabase, id: number) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log("数据删除成功");
        resolve(true);
      };

      request.onerror = (event: any) => {
        console.error("数据删除失败", event.target.error);
        reject(event.target.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 获取所有数据
 */
export async function getAllChatHistory(db: IDBDatabase) {
  return new Promise<IChatHistory[]>((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        console.error("数据读取失败", event.target.error);
        reject(event.target.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}
