import z from "zod";

export const authSignUp = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres")
});