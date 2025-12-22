import type { GroqScheduleResponse } from "../types/types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `Seu nome é Lucy, você é um assistente especializado 
em interpretar solicitações de agendamento em português brasileiro.
Extraia as seguintes informações do texto do usuário:
- title: título resumido da tarefa (máximo 50 caracteres)
- description: descrição detalhada se houver informações adicionais (opcional)
- scheduledDate: data no formato YYYY-MM-DD (se mencionada)
- scheduledTime: hora no formato HH:MM (se mencionada)
- priority: "low", "medium" ou "high" baseado no contexto e urgência

Regras importantes:
1. A data de hoje é: {currentDate}
2. Se o usuário mencionar "amanhã", calcule a data correta
3. Se mencionar "próxima segunda/terça/etc", calcule a data correta
4. Se mencionar "semana que vem", use a próxima segunda-feira
5. Se não mencionar prioridade, use "medium"
6. Se não mencionar hora, deixe scheduledTime como null

Responda APENAS com um JSON válido, sem nenhum texto adicional ou markdown.
Exemplo de resposta:
{"title": "Reunião com equipe", 
"description": null, 
"scheduledDate": "2025-12-23", 
"scheduledTime": "14:00", 
"priority": "medium"}`;

function getNextDayOfWeek(dayOfWeek: number, currentDate: Date): Date {
    const resultDate = new Date(currentDate);
    const diff = dayOfWeek - currentDate.getDay();
    resultDate.setDate(currentDate.getDate() + (diff > 0 ? diff : diff + 7));
    return resultDate;
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export async function parseScheduleRequest(
    apiKey: string,
    userMessage: string
): Promise<{ success: true; data: GroqScheduleResponse; interpretation: string } | { success: false; error: string }> {
    const currentDate = new Date();
    const currentDateStr = formatDate(currentDate);

    const systemPrompt = SYSTEM_PROMPT.replace("{currentDate}", currentDateStr);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.1,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            return { success: false, error: `Erro na API do Groq: ${response.status} - ${errorData}` };
        }

        const result = await response.json() as {
            choices: Array<{
                message: {
                    content: string;
                };
            }>;
        };

        const content = result.choices?.[0]?.message?.content;
        if (!content) {
            return { success: false, error: "Resposta vazia do modelo" };
        }

        let parsed: GroqScheduleResponse;
        try {
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            parsed = JSON.parse(cleanContent);
        } catch {
            return { success: false, error: `Falha ao interpretar resposta: ${content}` };
        }

        if (!parsed.title) {
            return { success: false, error: "Não foi possível extrair o título da tarefa" };
        }

        let interpretation = `Criei a tarefa "${parsed.title}"`;
        if (parsed.scheduledDate) {
            interpretation += ` para ${parsed.scheduledDate}`;
        }
        if (parsed.scheduledTime) {
            interpretation += ` às ${parsed.scheduledTime}`;
        }
        if (parsed.priority && parsed.priority !== "medium") {
            const priorityText = parsed.priority === "high" ? "alta" : "baixa";
            interpretation += ` com prioridade ${priorityText}`;
        }

        return {
            success: true,
            data: parsed,
            interpretation,
        };
    } catch (error) {
        return { success: false, error: `Erro de conexão: ${String(error)}` };
    }
}
