import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { registerRoutes } from "./routes";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
	origin: (origin) => {
		const allowedOrigins = [
			"http://localhost:3000",
			"http://localhost:5173",
			"https://agendai-backend.angeloresplandes.workers.dev",
			// Adicione o URL do seu frontend aqui
		];
		if (!origin || allowedOrigins.includes(origin)) {
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

app.use("*", secureHeaders({
	xFrameOptions: "DENY",
	xContentTypeOptions: "nosniff",
	referrerPolicy: "strict-origin-when-cross-origin",
	crossOriginEmbedderPolicy: false,
	crossOriginResourcePolicy: false,
	crossOriginOpenerPolicy: false,
}));

app.use("*", async (c, next) => {
	const requestId = crypto.randomUUID();
	c.res.headers.set("X-Request-Id", requestId);
	await next();
});

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

// Add security scheme to OpenAPI spec
openapi.registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "Insira seu token JWT. Faça login em /api/auth/signin para obter o token.",
});

registerRoutes(openapi);

export default app;
