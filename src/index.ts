import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./routes/taskCreate";
import { TaskDelete } from "./routes/taskDelete";
import { TaskFetch } from "./routes/taskFetch";
import { TaskList } from "./routes/taskList";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
