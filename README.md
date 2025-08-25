# express-inertia

[![npm version](https://img.shields.io/npm/v/express-inertia)](https://www.npmjs.com/package/express-inertia)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Express.js adapter for [Inertia.js](https://inertiajs.com/). Build modern, single-page applications with the simplicity of server-side routing and the power of client-side rendering, using React, Vue, or Svelte.

---

## Features

- **Seamless Integration**: Simple middleware to connect Inertia.js to your Express server.
- **SSR Ready**: Full support for Server-Side Rendering with Vite.
- **Universal Framework Support**: Works effortlessly with React, Vue, and Svelte.
- **Shared Data**: Easily pass common data to every page using `res.inertia.share()` or global config.
- **TypeScript Friendly**: Includes type definitions for a better development experience.

---

## Quick Start

The fastest way to get started is to use the official template, which includes a pre-configured setup with Vite, React, and SSR.

```bash
npm create vite@latest my-inertia-app -- --template github:/mahendra7041/react-inertia
cd my-inertia-app
npm install
npm run dev
```

---

## Manual Installation

Install the package in your existing Express.js project:

```bash
npm install express-inertia express @inertiajs/react react react-dom

npm install --save-dev vite @vitejs/plugin-react
```

### 1. Basic Server Setup (`server.js`)

Configure the Inertia middleware and apply it to your Express app.

```javascript
import express from "express";
import inertia from "express-inertia";
import { inertiaConfig } from "./configs/inertia.config.js";
import router from "./app/router.js";

async function bootstrap() {
  const app = express();

  // Initialize the Inertia middleware
  const inertiaMiddleware = await inertia(inertiaConfig);
  app.use(inertiaMiddleware);

  // Add your application routes
  app.use(router);

  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
  );
}

bootstrap().catch(console.error);
```

### 2. Configuration (`configs/inertia.config.js`)

Create a config file to define your client/SSR entry points and global shared data.

```javascript
export const inertiaConfig = {
  // Encrypts history state for security
  encryptHistory: true,

  // Client-side configuration (required)
  client: {
    entrypoint: "index.html", // Entrypoint for development (Vite)
    bundle: "build/client/index.html", // Path to built client bundle for production
  },

  // SSR configuration (optional)
  ssr: {
    entrypoint: "src/ssr.jsx", // SSR entrypoint for development
    bundle: "build/ssr/ssr.js", // Path to built SSR bundle for production
  },

  // Global shared data (available to all pages)
  sharedData: {
    user: (req, res) => req.session.user || null,
  },
};
```

### 3. Define Your Routes (`app/router.js`)

Use the `res.inertia.render()` method to render your Inertia pages and share request-specific data.

```javascript
import { Router } from "express";
const router = Router();

// Middleware to share data for specific routes
router.use((req, res, next) => {
  // Share data with all subsequent requests
  res.inertia.share({
    currentUrl: req.originalUrl,
    isAuthenticated: !!req.user,
  });
  next();
});

router.get("/", (req, res) => {
  // Share additional data just for this request
  res.inertia.share({
    notification: "Welcome back!",
  });

  res.inertia.render("home", {
    user: { name: "Mahendra" },
    title: "Welcome to my App",
  });
});

router.get("/about", (req, res) => {
  res.inertia.render("about", {
    framework: "Express + Inertia + React",
  });
});

router.get("/user/:id", (req, res) => {
  res.inertia.render("user/show", {
    userId: req.params.id,
  });
});

export default router;
```

### 4. Scripts (`package.json`)

Add these scripts to your `package.json` for development and building.

```json
"scripts": {
  "dev": "nodemon server.js",
  "build": "npm run build:client && npm run build:ssr",
  "build:client": "vite build --outDir build/client --ssrManifest",
  "build:ssr": "vite build --outDir build/ssr --ssr src/ssr.jsx",
  "serve": "NODE_ENV=production node server.js"
}
```

---

### Project Structure

A typical project layout will look like this:

```
my-inertia-app/
├── build/                 # Generated build artifacts (client & SSR)
├── configs/
│   └── inertia.config.js  # Main configuration file
├── app/
│   ├── router.js          # Express routes using `res.inertia.render()`
│   └── utils/
├── public/                # Static assets
├── src/
│   ├── pages/             # Your Inertia page components (e.g., Home.jsx)
│   ├── assets/
│   ├── main.jsx           # Client-side entry point
│   └── ssr.jsx            # SSR entry point
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
└── server.js              # Express server entry point
```

---

### Vite Config (`vite.config.js`)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

### SSR Entry Point (`src/ssr.jsx`)

```javascript
import ReactDOMServer from "react-dom/server";
import { createInertiaApp } from "@inertiajs/react";

export default function render(page) {
  const { html, head } = createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });
      return pages[`./pages/${name}.jsx`];
    },
    setup: ({ App, props }) => <App {...props} />,
  });

  return { html, head };
}
```

### Client Entry Point (`src/main.jsx`)

```javascript
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });
    return pages[`./pages/${name}.jsx`];
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
```

---

## API Reference

### `inertia(config: Configuration): Middleware`

The default export initializes and returns the Express middleware.

#### Configuration Object

| Key                 | Type      | Description                                             |
| :------------------ | :-------- | :------------------------------------------------------ |
| `encryptHistory`    | `boolean` | Encrypts the Inertia history state. Defaults to `true`. |
| `client.entrypoint` | `string`  | **Required.** Path to your HTML template.               |
| `client.bundle`     | `string`  | **Required.** Path to the built client-side bundle.     |
| `ssr.entrypoint`    | `string`  | Path to your SSR entry point.                           |
| `ssr.bundle`        | `string`  | Path to the built SSR bundle.                           |
| `sharedData`        | `object`  | Object of data/functions to share with all pages.       |

### `res.inertia.render(component: string, props?: object)`

Renders an Inertia page.

- `component`: The name of the page component (e.g., `"Home"` for `Home.jsx`).
- `props`: Optional object of data to pass as props to the page component.

### `res.inertia.share(data: object)`

Shares data with the current and subsequent requests.

- `data`: Object of data to merge with existing shared properties.

---

## Contributing

1.  Fork the repository
2.  Create a feature branch: `git checkout -b feat/amazing-feature`
3.  Commit your changes: `git commit -m 'Add amazing feature'`
4.  Push to the branch: `git push origin feat/amazing-feature`
5.  Open a Pull Request

---

## License

MIT License - see [LICENSE](https://opensource.org/licenses/MIT) for details.
