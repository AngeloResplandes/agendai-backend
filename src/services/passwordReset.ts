import { eq, and, gt } from "drizzle-orm";
import { createDb, schema } from "../lib/drizzle";
import { hashPassword } from "../lib/password";
import type { ForgotPassword, ValidateToken, ResetPasswordRequest } from "../types/types";

function generateToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createPasswordResetToken(data: ForgotPassword) {
    const drizzle = createDb(data.db);

    const user = await drizzle.query.user.findFirst({
        where: eq(schema.user.email, data.email),
    });

    if (!user) {
        return null;
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await drizzle
        .update(schema.passwordResetToken)
        .set({ used: true })
        .where(eq(schema.passwordResetToken.userId, user.id));

    await drizzle.insert(schema.passwordResetToken).values({
        userId: user.id,
        token,
        expiresAt,
    });

    return { token, expiresAt, userName: user.name, userEmail: user.email };
}

export async function validatePasswordResetToken(data: ValidateToken) {
    const drizzle = createDb(data.db);

    const user = await drizzle.query.user.findFirst({
        where: eq(schema.user.email, data.email),
    });

    if (!user) {
        return { valid: false, error: "Usuário não encontrado" };
    }

    const resetToken = await drizzle.query.passwordResetToken.findFirst({
        where: and(
            eq(schema.passwordResetToken.userId, user.id),
            eq(schema.passwordResetToken.token, data.token),
            eq(schema.passwordResetToken.used, false),
            gt(schema.passwordResetToken.expiresAt, new Date().toISOString())
        ),
    });

    if (!resetToken) {
        return { valid: false, error: "Token inválido ou expirado" };
    }

    return { valid: true, userId: user.id, tokenId: resetToken.id };
}

export async function resetPassword(data: ResetPasswordRequest) {
    const validation = await validatePasswordResetToken({
        db: data.db,
        email: data.email,
        token: data.token
    });

    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    const drizzle = createDb(data.db);

    const hashedPassword = await hashPassword(data.newPassword);

    await drizzle
        .update(schema.user)
        .set({ password: hashedPassword })
        .where(eq(schema.user.id, validation.userId!));

    await drizzle
        .update(schema.passwordResetToken)
        .set({ used: true })
        .where(eq(schema.passwordResetToken.id, validation.tokenId!));

    return { success: true };
}
