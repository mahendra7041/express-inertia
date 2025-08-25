import { InertiaMiddleware } from "./inertia_middleware.js";
import { createServer } from "vite";
async function inertia(config, vite) {
    const middlewares = [];
    const isProd = process.env.NODE_ENV === "production";
    if (!vite && !isProd) {
        vite = await createServer({
            server: { middlewareMode: true },
            appType: "custom",
        });
    }
    if (vite && !isProd) {
        middlewares.push(vite.middlewares);
    }
    const inertia = new InertiaMiddleware(config, vite);
    const inertiaMiddleware = async (req, res, next) => {
        return await inertia.handle(req, res, next);
    };
    return [...middlewares, inertiaMiddleware];
}
export default inertia;
