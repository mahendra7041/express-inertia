import express from "express";
import session from "express-session";
import inertia from "express-inertia";
import inertiaConfig from "./configs/inertia.config.js";
import sessionConfig from "./configs/session.config.js";

async function bootstrap() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(express.static("public", { index: false }));

  app.use(session(sessionConfig));
  app.use(await inertia(inertiaConfig));

  app.get("/", (req, res) => {
    res.inertia.render("home");
  });

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

bootstrap().catch(console.error);
