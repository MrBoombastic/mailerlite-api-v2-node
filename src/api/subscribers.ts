import type { AxiosInstance } from "axios";
import type {
  SubscriberQuery,
  SubscriberData,
  SubscriberDataUpdate,
  SubscriberSearchQuery,
  SubscriberActivityType,
} from "../types/index.js";

export default function (client: AxiosInstance) {
  return {
    async getSubscribers(params: SubscriberQuery = {}) {
      return await client.get("subscribers", { params });
    },

    async addSubscriber(subscriber: SubscriberData) {
      return await client.post("subscribers", subscriber);
    },

    async getSubscriber(identifier: number | string) {
      return await client.get(`subscribers/${identifier}`);
    },

    async updateSubscriber(
      identifier: number | string,
      subscriber: SubscriberDataUpdate,
    ) {
      return await client.put(`subscribers/${identifier}`, subscriber);
    },

    async searchSubscribers(params: SubscriberSearchQuery = {}) {
      return await client.get("subscribers/search", { params });
    },

    async getSubscriberActivity(identifier: number | string) {
      return await client.get(`subscribers/${identifier}/activity`);
    },

    async getSubscriberActivityByType(
      identifier: number | string,
      activityType: SubscriberActivityType,
    ) {
      const url = [`subscribers/${identifier}/activity`, activityType].join(
        "/",
      );

      return await client.get(url);
    },

    async removeSubscriber(identifier: number | string) {
      return await client.delete(`subscribers/${identifier}`);
    },

    async getSubscriberGroups(identifier: number | string) {
      return await client.get(`subscribers/${identifier}/groups`);
    },
  };
}
