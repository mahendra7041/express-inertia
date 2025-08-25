import { Inertia } from "./inertia.js";
import { InertiaHeaders } from "./headers.js";
export class InertiaMiddleware {
    constructor(config, vite) {
        this.config = config;
        this.vite = vite;
    }
    resolveValidationErrors(req, res) {
        if (!res.locals.errors) {
            return {};
        }
        if (!res.locals.errors.E_VALIDATION_ERROR) {
            return res.locals.errors;
        }
        const errors = Object.entries(res.locals.errors.inputErrorsBag).reduce((acc, [field, messages]) => {
            acc[field] = Array.isArray(messages) ? messages[0] : messages;
            return acc;
        }, {});
        const errorBag = req.header(InertiaHeaders.ErrorBag);
        return errorBag ? { [errorBag]: errors } : errors;
    }
    shareErrors(req, res) {
        res.inertia.share({
            errors: res.inertia.always(() => this.resolveValidationErrors(req, res)),
        });
    }
    async handle(req, res, next) {
        try {
            res.inertia = new Inertia(req, res, this.config, this.vite);
            this.shareErrors(req, res);
            next();
            const isInertiaRequest = !!req.get(InertiaHeaders.Inertia);
            if (!isInertiaRequest)
                return;
            res.setHeader("Vary", InertiaHeaders.Inertia);
            const method = req.method;
            if (res.statusCode === 302 &&
                ["PUT", "PATCH", "DELETE"].includes(method)) {
                res.status(303);
            }
            const version = "1";
            if (method === "GET" && req.header(InertiaHeaders.Version) !== version) {
                res.removeHeader(InertiaHeaders.Inertia);
                res.setHeader(InertiaHeaders.Location, req.url);
                res.status(409);
            }
        }
        catch (error) {
            if (this.vite) {
                this.vite.ssrFixStacktrace(error);
            }
            next(error);
        }
    }
}
