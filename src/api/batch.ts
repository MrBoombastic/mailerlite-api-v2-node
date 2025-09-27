import type { AxiosInstance } from "axios";
import type { Batch } from "../types/index.js";

export default function (client: AxiosInstance) {
  return {
    async batch(requests: Batch[]): Promise<any[]> {
      return await client.post("batch", {
        requests,
      });
    },
  };
}
