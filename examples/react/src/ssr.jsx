import ReactDOMServer from "react-dom/server";
import { createInertiaApp } from "@inertiajs/react";
import "./index.css";

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
