import path from "path";
import { ResolvedConfig } from "./types";

const defaultConfig: ResolvedConfig = {
  rootElementId: "app",
  encryptHistory: true,
  clientStaticBuildDir: path.resolve(process.cwd(), "build/client"),
  indexEntrypoint: path.resolve(process.cwd(), "index.html"),
  indexBuildEntrypoint: path.resolve(process.cwd(), "build/client/index.html"),
  ssrEnabled: false,
  vite: {
    server: { middlewareMode: true },
    appType: "custom",
  },
};

export default defaultConfig;
