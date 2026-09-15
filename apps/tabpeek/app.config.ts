import { googleAnalytics4 } from "@wxt-dev/analytics/providers/google-analytics-4";

export default defineAppConfig({
  analytics: {
    providers: [
      googleAnalytics4({
        apiSecret: import.meta.env.WXT_GA_API_SECRET,
        measurementId: "...",
      }),
    ],
  },
});
