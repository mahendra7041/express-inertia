import { ResolvedConfig } from "./types";

const defaultConfig: ResolvedConfig = {
  rootElementId: "app",
  encryptHistory: true,
  clientStaticBuildDir: "build/client",
  indexEntrypoint: "index.html",
  indexBuildEntrypoint: "build/client/index.html",
  ssrEnabled: false,
  vite: {
    server: { middlewareMode: true },
    appType: "custom",
  },
};

export default defaultConfig;
