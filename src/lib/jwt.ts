import { sign } from "hono/jwt";
import { JWTPayload } from "../types/types";

export const createJWT = async (id: string, secret: string): Promise<string> => {
    const payload: JWTPayload = {
        id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 dias
    };
    return await sign(payload, secret);
};
