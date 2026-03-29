import { openDB } from "idb";

const dbPromise = openDB("Transformers-IDB-Cache", 1, {
  upgrade(db) {
    // 检查是否已存在，防止重复创建报错
    if (!db.objectStoreNames.contains("models")) {
      db.createObjectStore("models");
    }
  },
});

export const IDBCache = {
  // 辅助函数：归一化 URL，去掉查询参数
  normalizeUrl(request: Request | string): string {
    const url = typeof request === "string" ? request : request.url;
    const urlObj = new URL(url);
    urlObj.search = ""; // 清空所有 ?v=xxx 等参数
    return urlObj.toString();
  },

  async match(request: Request | string) {
    const cleanUrl = this.normalizeUrl(request);
    const db = await dbPromise;
    const blob = await db.get("models", cleanUrl);

    if (!blob) return undefined;

    console.log("🎯 IDB 命中缓存:", cleanUrl);

    return new Response(blob, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": blob.size.toString(),
      },
    });
  },

  async put(request: Request | string, response: Response) {
    const cleanUrl = this.normalizeUrl(request);

    // 重要：Response Body 只能读取一次。
    // 如果 Transformers.js 正在使用这个 response，直接调用 .blob() 会报错。
    // 所以必须 clone 一份。
    const responseClone = response.clone();
    const blob = await responseClone.blob();

    const db = await dbPromise;
    await db.put("models", blob, cleanUrl);
    console.log("💾 已存入 IndexedDB:", cleanUrl);
  },
};
