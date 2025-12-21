import { sign, verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";
import { JWTPayload } from "../types/types";

export const createJWT = async (id: string, secret: string): Promise<string> => {
    const payload: JWTPayload = {
        id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 dias
    };
    return await sign(payload, secret);
};

export const verifyJWT = createMiddleware<{ Bindings: Env; Variables: { userId: string } }>(
    async (c, next) => {
        const authHeader = c.req.header("authorization");

        if (!authHeader) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return c.json({ error: "Acesso negado" }, 401);
        }

        const decoded = await verify(token, c.env.JWT_SECRET) as JWTPayload;
        c.set("userId", decoded.id);
        await next();

        if (!decoded) {
            return c.json({ error: "Acesso negado" }, 401);
        }
    }
);
