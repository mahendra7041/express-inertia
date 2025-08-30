import path from "path";
import { ResolvedConfig } from "./types";

const defaultConfig: ResolvedConfig = {
  rootElementId: "app",
  assetsVersion: "v1",
  encryptHistory: true,
  indexEntrypoint: path.resolve(process.cwd(), "index.html"),
  indexBuildEntrypoint: path.resolve(process.cwd(), "public/index.html"),
  ssrEnabled: false,
  vite: {
    server: { middlewareMode: true },
    appType: "custom",
  },
};

export default defaultConfig;
