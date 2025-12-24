import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { registerRoutes } from "./routes";
import { ALLOWED_ORIGINS } from "./config/constants";
import { createLogger } from "./lib/logger";

const app = new Hono<{ Bindings: Env }>();

// Middleware de logging com request ID e timing
app.use("*", async (c, next) => {
	const requestId = crypto.randomUUID();
	const startTime = Date.now();

	// Adiciona request ID ao header de resposta
	c.res.headers.set("X-Request-Id", requestId);

	// Cria logger com contexto do request
	const logger = createLogger({
		requestId,
		method: c.req.method,
		path: c.req.path,
	});

	// Armazena logger e requestId no contexto para uso posterior
	c.set("logger" as never, logger as never);
	c.set("requestId" as never, requestId as never);

	try {
		await next();
	} finally {
		const duration = Date.now() - startTime;
		logger.info("Request completed", {
			status: c.res.status,
			duration,
		});
	}
});

// CORS
app.use("*", cors({
	origin: (origin) => {
		if (!origin || ALLOWED_ORIGINS.includes(origin as typeof ALLOWED_ORIGINS[number])) {
			return origin || "*";
		}
		return null;
	},
	allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	exposeHeaders: ["Content-Length", "X-Request-Id"],
	credentials: true,
	maxAge: 86400,
}));

// Secure Headers
app.use("*", secureHeaders({
	xFrameOptions: "DENY",
	xContentTypeOptions: "nosniff",
	referrerPolicy: "strict-origin-when-cross-origin",
	crossOriginEmbedderPolicy: false,
	crossOriginResourcePolicy: false,
	crossOriginOpenerPolicy: false,
}));

const openapi = fromHono(app, {
	docs_url: "/",
	schema: {
		info: {
			title: "AgendAI API",
			version: "1.0.0",
			description: "API para o sistema AgendAI",
		},
		security: [{ bearerAuth: [] }],
	},
});

openapi.registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "Insira seu token JWT. Faça login em /api/auth/signin para obter o token.",
});

registerRoutes(openapi);

export default app;
