import { Resend } from "resend";

export async function sendPasswordResetEmail(
    apiKey: string,
    fromEmail: string,
    toEmail: string,
    token: string,
    userName: string
): Promise<{ success: boolean; error?: string }> {
    const resend = new Resend(apiKey);

    try {
        const { error } = await resend.emails.send({
            from: fromEmail,
            to: toEmail,
            subject: "AgendAI - Código de Recuperação de Senha",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Olá, ${userName}!</h2>
                    <p>Você solicitou a recuperação de senha da sua conta AgendAI.</p>
                    <p>Use o código abaixo para redefinir sua senha:</p>
                    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${token}</span>
                    </div>
                    <p style="color: #666;">Este código é válido por <strong>10 minutos</strong>.</p>
                    <p style="color: #666;">Se você não solicitou essa recuperação, ignore este email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">AgendAI - Sistema de Agendamento</p>
                </div>
            `,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: String(err) };
    }
}
