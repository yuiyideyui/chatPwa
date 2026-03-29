import type { GameType } from "@/store/chatStore/chatStoreIndex.type";

export interface Role {
  name: string;
  title: string;
  icon: string;
  tags: string[];
  system: string;
  gameType: GameType;
}
