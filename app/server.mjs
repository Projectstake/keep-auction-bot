import { default as express } from "express";
import { default as hbs } from "hbs";
import * as path from "path";
import { default as logger } from "morgan";
import { default as cookieParser } from "cookie-parser";
import * as http from "http";
import { appDir } from "./util.mjs";
const __dirname = appDir;
import {
  normalizePort,
  onError,
  onListening,
  handle404,
  basicErrorHandler,
} from "./util.mjs";

import { router as indexRouter } from "./routes/index.mjs";

export const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "partials"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Router function lists
app.use("/", indexRouter);

// error handlers
// catch 404 and forward to error handler
app.use(handle404);
app.use(basicErrorHandler);

export const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

export const server = http.createServer(app);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

import { bot } from "./app.mjs";

await bot.start();
