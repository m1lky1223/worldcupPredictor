import { appTools, defineConfig } from "@modern-js/app-tools";

export default defineConfig({
  plugins: [appTools()],
  html: {
    title: "2026 World Cup Tracker",
  },
  dev: {
    server: {
      historyApiFallback: true,
    },
  },
});


