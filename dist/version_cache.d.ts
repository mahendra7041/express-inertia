import type { AssetsVersion } from "./types.js";
export declare class VersionCache {
    protected appRoot: URL;
    protected assetsVersion?: AssetsVersion;
    private cachedVersion?;
    constructor(appRoot: URL, assetsVersion?: AssetsVersion);
    private getManifestHash;
    computeVersion(): Promise<this>;
    getVersion(): string | number;
    setVersion(version: AssetsVersion): Promise<void>;
}
