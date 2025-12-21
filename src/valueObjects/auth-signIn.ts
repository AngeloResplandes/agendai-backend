import z from "zod";

export const authSignIn = z.object({
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres")
});