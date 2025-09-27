import type { AxiosInstance } from "axios";
import type { SegmentQuery, SegmentsResponse } from "../types/index.js";

export default function (client: AxiosInstance) {
  return {
    async getSegments(params: SegmentQuery = {}) {
      const { data } = await this.getSegmentsRaw(params);
      return data;
    },

    async getSegmentsCount(params: SegmentQuery = {}) {
      const { meta } = await this.getSegmentsRaw(params);
      return meta.pagination.count;
    },

    async getSegmentsRaw(params: SegmentQuery = {}): Promise<SegmentsResponse> {
      return await client.get("segments", { params });
    },
  };
}
