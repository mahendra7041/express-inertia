# express-inertia

[![npm version](https://img.shields.io/npm/v/express-inertia)](https://www.npmjs.com/package/express-inertia)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Express.js middleware/adapter for [Inertia.js](https://inertiajs.com/) that lets you build modern single-page applications with server-side rendering. It allows seamless integration of React, Vue, or Svelte components while preserving the simplicity of classic apps.

## Demo

Check out a live demo of express-inertia in action:
[Pingcrm](https://github.com/mahendra7041/pingcrm-react-inertia)

## Features

- **Server-Side Rendering (SSR)** support for improved SEO and performance
- **Vite integration** for fast development and optimized builds
- **Framework agnostic** - works with React, Vue, or Svelte
- **Lightweight** Express middleware with minimal configuration
- **TypeScript support** with full type definitions

## Quick Start

The fastest way to get started is using our official templates:

```bash
# For React
npx degit mahendra7041/express-inertia/examples/react my-inertia-app

# For Vue
npx degit mahendra7041/express-inertia/examples/vue my-inertia-app

# For Svelte
npx degit mahendra7041/express-inertia/examples/svelte my-inertia-app

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
npm install express-inertia express express-session @inertiajs/react

# For Vue
npm install express-inertia express express-session @inertiajs/vue3

# For Svelte
npm install express-inertia express express-session @inertiajs/svelte

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
import session from "express-session";
import inertia from "express-inertia";

async function bootstrap() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Serve static assets (only in production)
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("build/client", { index: false }));
  }

  // Session middleware (required for flash messages)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Inertia middleware setup
  app.use(
    await inertia({
      rootElementId: "root", // DOM element ID for Inertia app (default: app)
      assetsVersion: "v1", // change to bust client-side cache
      ssrEnabled: true, // enable SSR
      ssrEntrypoint: "src/ssr.jsx", // entry file for SSR in dev
      ssrBuildEntrypoint: "build/ssr/ssr.js", // built SSR file for production
    })
  );

  // Example route
  app.get("/", (req, res) => {
    res.inertia.render("home");
  });

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

bootstrap().catch(console.error);
```

### Step 5: Update Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "cross-env NODE_ENV=production node server.js",
    "build": "npm run build:ssr && npm run build:client",
    "build:client": "vite build --outDir build/client",
    "build:ssr": "vite build --outDir build/ssr --ssr src/ssr.jsx"
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

    return pages[`./pages/${name}.jsx`];
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

      return pages[`./pages/${name}.jsx`];
    },
    setup: ({ App, props }) => <App {...props} />,
  });
}
```

## Configuration

### Middleware Options

| Option                 | Type                 | Default                                                   | Description                                                   |
| ---------------------- | -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `rootElementId`        | `string?`            | `"app"`                                                   | DOM element ID where the Inertia app mounts                   |
| `assetsVersion`        | `string?`            | `"v1"`                                                    | Version string used for inertia                               |
| `encryptHistory`       | `boolean?`           | `true`                                                    | Encrypts the Inertia history state for security               |
| `indexEntrypoint`      | `string?`            | `"index.html"`                                            | Path to your base HTML template (used in dev mode)            |
| `indexBuildEntrypoint` | `string?`            | `"build/client/index.html"`                               | Path to the built client HTML entrypoint (used in production) |
| `ssrEnabled`           | `boolean?`           | `false`                                                   | Enables/disables server-side rendering (SSR)                  |
| `ssrEntrypoint`        | `string?`            | Required if `ssrEnabled: true`                            | Path to your SSR entry file (used in development)             |
| `ssrBuildEntrypoint`   | `string?`            | Required if `ssrEnabled: true`                            | Path to the built SSR bundle (used in production)             |
| `vite`                 | `ViteResolveConfig?` | `{ server: { middlewareMode: true }, appType: "custom" }` | Passes custom options to the Vite dev server                  |

## API Reference

### `inertia(config?, vite?)`

Initializes and returns the Express middleware.

```javascript
app.use(await inertia(config));
```

### `res.inertia.render(component, props?)`

Renders an Inertia page component.

```javascript
app.get('/users', (req, res) => {
  const users = await User.findAll();

  res.inertia.render('user/index', {
    users: users,
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
      permissions: req.user?.permissions,
    },
  });
  next();
});
```

### `res.inertia.redirect(urlOrStatus, url?)`

Redirects the user to a different location while preserving Inertia’s client-side navigation.

```javascript
app.get("/home", (req, res) => {
  // Redirect with default status (302 Found)
  res.inertia.redirect("/dashboard");

  // Redirect with explicit status
  res.inertia.redirect(301, "/new-home");
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

Here’s an updated **Contributing section** with a clear note about discussing **breaking changes** before implementation:

---

## Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Guidelines

1. **Fork** the repository
2. **Create** your feature branch:

   ```bash
   git checkout -b feat/amazing-feature
   ```

3. **Commit** your changes with a descriptive message:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

4. **Push** to your branch:

   ```bash
   git push origin feat/amazing-feature
   ```

5. **Open a Pull Request**

### Breaking Changes

If your contribution introduces a **breaking change** (e.g. changes to configuration options, API methods, or default behavior), please **open an issue or discussion first** before submitting a PR. This ensures we can:

- Discuss the impact on existing users
- Decide if a major version bump is required
- Provide a clear migration path in the documentation

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

## Resources

- [Inertia.js Documentation](https://inertiajs.com/)
- [React.js Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
