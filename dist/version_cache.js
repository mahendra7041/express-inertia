import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
export class VersionCache {
    constructor(appRoot, assetsVersion) {
        this.appRoot = appRoot;
        this.assetsVersion = assetsVersion;
        this.cachedVersion = assetsVersion;
    }
    async getManifestHash() {
        try {
            const manifestPath = new URL("public/assets/.vite/manifest.json", this.appRoot);
            const manifestFile = await readFile(manifestPath, "utf-8");
            this.cachedVersion = createHash("md5").update(manifestFile).digest("hex");
            return this.cachedVersion;
        }
        catch {
            this.cachedVersion = "1";
            return this.cachedVersion;
        }
    }
    async computeVersion() {
        if (!this.assetsVersion)
            await this.getManifestHash();
        return this;
    }
    getVersion() {
        if (!this.cachedVersion)
            throw new Error("Version has not been computed yet");
        return this.cachedVersion;
    }
    async setVersion(version) {
        this.cachedVersion = version;
    }
}
