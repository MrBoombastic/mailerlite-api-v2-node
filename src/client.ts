import axios, { type AxiosInstance } from "axios";
import camelCase from "camelcase-keys";
import snakeCase from "snakecase-keys";
import type { Options } from "./types/index.js";

export default function MailerLiteClient(
  apiKey: string,
  {
    axiosOptions = {},
    baseURL = "https://api.mailerlite.com/api/v2/",
    useCaseConverter = true,
    headers = {},
  }: Options = {},
): AxiosInstance {
  if (typeof apiKey !== "string") throw new Error("No API key provided");

  const axiosConfig = {
    ...axiosOptions,
    baseURL,
    headers: {
      "Content-Type": "application/json",
      "X-MailerLite-ApiKey": apiKey,
      "User-Agent": "MailerLite API v2 Node",
      ...headers,
    },
  };

  const client: AxiosInstance = axios.create(axiosConfig);

  if (useCaseConverter) {
    client.interceptors.request.use(
      (request) => {
        if (request.data != null && typeof request.data === "object") {
          request.data = snakeCase(request.data, { deep: true });
        }

        return request;
      },
      async (error) => await Promise.reject(error),
    );
  }

  client.interceptors.response.use(
    (response) => {
      if (!useCaseConverter) return response.data;

      return camelCase(response.data, { deep: true });
    },
    async (error) => await Promise.reject(error),
  );

  return client;
}
