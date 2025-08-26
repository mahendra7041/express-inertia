# express-inertia

[![npm version](https://img.shields.io/npm/v/express-inertia)](https://www.npmjs.com/package/express-inertia)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Express.js adapter for [Inertia.js](https://inertiajs.com/) that enables you to build modern, single-page applications with server-side routing and client-side rendering. Seamlessly integrate React, Vue, or Svelte components while maintaining the simplicity of traditional server-rendered applications.

## Features

- **Server-Side Rendering (SSR)** support for improved SEO and performance
- **Vite integration** for fast development and optimized builds
- **Framework agnostic** - works with React, Vue, or Svelte
- **Lightweight** Express middleware with minimal configuration
- **TypeScript support** with full type definitions

## Quick Start

The fastest way to get started is using our official template:

```bash
npx degit mahendra7041/react-inertia my-inertia-app

cd my-inertia-app
npm install
npm run dev
```

## Setup Guide

### Prerequisites

- Node.js 18 or higher
- Express.js
- Vite

### Step 1: Create a Vite Project

First, create a new project using Vite with your preferred framework:

```bash
# For React (used in this guide)
npm create vite@latest my-inertia-app -- --template react
# For Vue
npm create vite@latest my-inertia-app -- --template vue
# For Svelte
npm create vite@latest my-inertia-app -- --template svelte

cd my-inertia-app
```

### Step 2: Install Required Packages

Install the necessary dependencies for Express and Inertia:

```bash
# For React (used in this guide)
npm install express-inertia express @inertiajs/react

# For Vue
npm install express-inertia express @inertiajs/vue3

# For Svelte
npm install express-inertia express @inertiajs/svelte

# Additional dev dependencies
npm install -D nodemon
```

### Step 3: Project Structure

Set up your project structure as follows:

```
my-inertia-app/
├── build/                 # Generated build artifacts
├── public/                # Static assets
├── src/
│   ├── pages/            # Inertia page components
│   ├── assets/           # Styles, images, etc.
│   ├── main.jsx          # Client entry point (or .js/.vue/.svelte)
│   └── ssr.jsx           # SSR entry point (optional)
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── server.js             # Express server
└── package.json
```

### Step 4: Express Server Setup (`server.js`)

```javascript
import express from "express";
import { inertiaMiddleware } from "express-inertia";
import { createServer } from "vite";

async function bootstrap() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(express.static("public"));

  if (process.env.NODE_ENV === "production") {
    app.use(
      express.static("build/client", {
        index: false,
      })
    );
  }

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);

  const config = {
    rootElementId: "root",
    encryptHistory: true,
    client: {
      entrypoint: "index.html",
      bundle: "build/client/index.html",
    },
    // for server side rendering
    // ssr:{
    //   entrypoint: "src/ssr.jsx",
    //   bundle: "build/ssr/ssr.js"
    // }
  };

  app.use(inertiaMiddleware(config, vite));

  app.get("/", (req, res) => {
    res.inertia.render("home");
  });

  app.get("/about", (req, res) => {
    res.inertia.render("about");
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch(console.error);
```

### Step 5: Update Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "build": "npm run build:client && npm run build:ssr",
    "build:client": "vite build --outDir build/client --ssrManifest",
    "build:ssr": "vite build --outDir build/ssr --ssr src/ssr.jsx",
    "serve": "NODE_ENV=production node server.js",
    "preview": "vite preview"
  }
}
```

### Step 6: Client Entry Point (src/main.jsx)

Update your framework's main entry point accordingly. For more details, visit [Inertia.js Client-Side Setup](https://inertiajs.com/client-side-setup#initialize-the-inertia-app):

```javascript
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";

createInertiaApp({
  id: "root",
  resolve: (name) => {
    const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });
    const page = pages[`./pages/${name}.jsx`];

    if (!page) {
      throw new Error(`Page not found: ${name}`);
    }

    return page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
```

### Step 7: SSR Entry Point (src/ssr.jsx) - Optional

Add Server-Side Rendering support for improved SEO and performance.

```javascript
import ReactDOMServer from "react-dom/server";
import { createInertiaApp } from "@inertiajs/react";

export default function render(page) {
  return createInertiaApp({
    id: "root",
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });
      const page = pages[`./pages/${name}.jsx`];

      if (!page) {
        throw new Error(`Page not found: ${name}`);
      }

      return page;
    },
    setup: ({ App, props }) => <App {...props} />,
  });
}
```

## Configuration

### Middleware Options

| Option              | Type      | Default      | Description                                     |
| ------------------- | --------- | ------------ | ----------------------------------------------- |
| `encryptHistory`    | `boolean` | `true`       | Encrypts the Inertia history state for security |
| `client.entrypoint` | `string`  | **Required** | Path to your HTML template                      |
| `client.bundle`     | `string`  | **Required** | Path to the built client-side bundle            |
| `ssr.entrypoint`    | `string`  | Optional     | Path to your SSR entry point                    |
| `ssr.bundle`        | `string`  | Optional     | Path to the built SSR bundle                    |
| `sharedData`        | `object`  | `{}`         | Data/functions to share with all pages          |

## API Reference

### `inertiaMiddleware(config, vite?)`

Initializes and returns the Express middleware.

```javascript
app.use(inertiaMiddleware(config, viteDevServer));
```

### `res.inertia.render(component, props?)`

Renders an Inertia page component.

```javascript
app.get('/users', (req, res) => {
  res.inertia.render('Users', {
    users: await User.findAll(),
    page: req.query.page || 1
  });
});
```

### `res.inertia.share(data)`

Shares data with the current and subsequent requests.

```javascript
app.use((req, res, next) => {
  res.inertia.share({
    auth: {
      user: req.user,
      can: (permission) => req.user?.permissions?.includes(permission),
    },
  });
  next();
});
```

## Examples

### Shared Data Example

```javascript
// Middleware to share data across all requests
app.use((req, res, next) => {
  res.inertia.share({
    auth: {
      user: req.user,
      isAdmin: req.user?.role === "admin",
    },
    flash: {
      success: req.flash("success"),
      error: req.flash("error"),
    },
  });
  next();
});
```

### Form Handling Example

```javascript
app.post("/contact", async (req, res) => {
  try {
    await Contact.create(req.body);
    req.flash("success", "Message sent successfully!");
    res.inertia.redirect("/contact");
  } catch (error) {
    req.flash("error", "Failed to send message");
    res.inertia.redirect("/contact");
  }
});
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

## 🔗 Resources

- [Inertia.js Documentation](https://inertiajs.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
