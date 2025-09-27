import type { AxiosInstance } from "axios";
import type { Stats } from "../types/index.js";

export default function (client: AxiosInstance) {
  return {
    async getStats(): Promise<Stats> {
      return await client.get("stats");
    },
  };
}
