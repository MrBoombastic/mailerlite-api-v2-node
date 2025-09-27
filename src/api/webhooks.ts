import type { AxiosInstance } from "axios";
import type { WebhookData, WebhooksResponse } from "../types/index.js";

export default function (client: AxiosInstance) {
  return {
    async getWebhooks() {
      const { webhooks } = await this.getWebhooksRaw();
      return webhooks;
    },

    async getWebhooksCount() {
      const { count } = await this.getWebhooksRaw();
      return count;
    },

    async getWebhooksRaw(): Promise<WebhooksResponse> {
      return await client.get("webhooks");
    },

    async getWebhook(webhookId: number) {
      return await client.get(`webhooks/${webhookId}`);
    },

    async createWebhook(webhook: WebhookData) {
      return await client.post("webhooks", webhook);
    },

    async updateWebhook(webhookId: number, webhookUpdate: WebhookData) {
      return await client.put(`webhooks/${webhookId}`, webhookUpdate);
    },

    async removeWebhook(webhookId: number) {
      return await client.delete(`webhooks/${webhookId}`);
    },
  };
}
