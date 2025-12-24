import { sign } from "hono/jwt";
import { JWTPayload } from "../types/types";
import { JWT_EXPIRY_SECONDS } from "../config/constants";

export const createJWT = async (id: string, secret: string): Promise<string> => {
    const payload: JWTPayload = {
        id,
        exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS,
    };
    return await sign(payload, secret);
};
