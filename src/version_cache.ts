import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { AssetsVersion } from "./types.js";

export class VersionCache {
  private cachedVersion?: AssetsVersion;

  constructor(protected appRoot: URL, protected assetsVersion?: AssetsVersion) {
    this.cachedVersion = assetsVersion;
  }

  private async getManifestHash(): Promise<AssetsVersion> {
    try {
      const manifestPath = new URL(
        "public/assets/.vite/manifest.json",
        this.appRoot
      );
      const manifestFile = await readFile(manifestPath, "utf-8");
      this.cachedVersion = createHash("md5").update(manifestFile).digest("hex");

      return this.cachedVersion;
    } catch {
      this.cachedVersion = "1";
      return this.cachedVersion;
    }
  }

  async computeVersion() {
    if (!this.assetsVersion) await this.getManifestHash();
    return this;
  }

  getVersion() {
    if (!this.cachedVersion)
      throw new Error("Version has not been computed yet");
    return this.cachedVersion;
  }

  async setVersion(version: AssetsVersion) {
    this.cachedVersion = version;
  }
}
