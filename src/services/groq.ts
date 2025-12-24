import type { GroqAgentTask, GroqFullResponse } from "../types/types";
import { SYSTEM_PROMPT } from "../lib/system-prompt";
import { API } from "../config/constants";

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

type UserTask = {
    title: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    status?: string;
};

function formatTasksContext(tasks: UserTask[]): string {
    if (!tasks || tasks.length === 0) {
        return "TAREFAS DO USUÁRIO: Nenhuma tarefa agendada.";
    }

    const futureTasks = tasks
        .filter(t => t.scheduledDate && t.status !== 'completed' && t.status !== 'cancelled')
        .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

    if (futureTasks.length === 0) {
        return "TAREFAS DO USUÁRIO: Nenhuma tarefa pendente agendada.";
    }

    const taskList = futureTasks.map(t => {
        const time = t.scheduledTime ? ` às ${t.scheduledTime}` : '';
        return `- ${t.scheduledDate}${time}: ${t.title}`;
    }).join('\n');

    return `TAREFAS DO USUÁRIO (use para responder sobre disponibilidade):\n${taskList}`;
}

export async function parseAgentRequest(
    apiKey: string,
    userMessage: string,
    userTasks?: UserTask[]
): Promise<{ success: true; data: GroqFullResponse; interpretations: string[] } | { success: false; error: string }> {
    const currentDate = new Date();
    const currentDateStr = formatDate(currentDate);

    const tasksContext = formatTasksContext(userTasks || []);
    const systemPrompt = SYSTEM_PROMPT
        .replace("{currentDate}", currentDateStr)
        .replace("{userTasksContext}", tasksContext);

    try {
        const response = await fetch(API.groqUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: API.groqModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: API.groqTemperature,
                max_tokens: API.groqMaxTokens,
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

        let parsed: GroqFullResponse;
        try {
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            parsed = JSON.parse(cleanContent);
        } catch {
            return { success: false, error: `Falha ao interpretar resposta: ${content}` };
        }

        if ('isConversation' in parsed && parsed.isConversation === true) {
            return {
                success: true,
                data: parsed,
                interpretations: [],
            };
        }

        const taskResponse = parsed as { isConversation: false; tasks: GroqAgentTask[] };

        if (!taskResponse.tasks || !Array.isArray(taskResponse.tasks) || taskResponse.tasks.length === 0) {
            return { success: false, error: "Nenhuma tarefa identificada na solicitação" };
        }
        for (const task of taskResponse.tasks) {
            if (!task.action) {
                return { success: false, error: "Ação não identificada em uma das tarefas" };
            }

            if (task.action === "create" && !task.title) {
                return { success: false, error: "Título obrigatório para criar tarefa" };
            }

            if ((task.action === "update" || task.action === "delete") && !task.taskIdentifier) {
                return { success: false, error: "Identificador obrigatório para atualizar/deletar tarefa" };
            }
        }

        const interpretations: string[] = taskResponse.tasks.map((task: GroqAgentTask) => {
            let interpretation = "";
            switch (task.action) {
                case "create":
                    interpretation = `Criei a tarefa "${task.title}"`;
                    if (task.scheduledDate) interpretation += ` para ${task.scheduledDate}`;
                    if (task.scheduledTime) interpretation += ` às ${task.scheduledTime}`;
                    break;
                case "update":
                    interpretation = `Atualizei a tarefa "${task.taskIdentifier}"`;
                    if (task.scheduledDate) interpretation += ` - nova data: ${task.scheduledDate}`;
                    if (task.scheduledTime) interpretation += ` - novo horário: ${task.scheduledTime}`;
                    if (task.status) interpretation += ` - status: ${task.status}`;
                    break;
                case "delete":
                    interpretation = `Deletei a tarefa "${task.taskIdentifier}"`;
                    break;
            }
            return interpretation;
        });

        return {
            success: true,
            data: taskResponse,
            interpretations,
        };
    } catch (error) {
        return { success: false, error: `Erro de conexão: ${String(error)}` };
    }
}

export function generateHumanizedInterpretation(
    task: GroqAgentTask,
    userName: string,
    success: boolean
): string {
    const firstName = userName.split(" ")[0];

    if (!success) {
        return `Desculpe ${firstName}, não consegui processar essa tarefa. 😔`;
    }

    const greetings = [
        `Pronto, ${firstName}! `,
        `Feito, ${firstName}! `,
        `Certo, ${firstName}! `,
        `Ok, ${firstName}! `,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    switch (task.action) {
        case "create": {
            let msg = `${greeting}✅ Agendei "${task.title}" para você`;
            if (task.scheduledDate) {
                const dateFormatted = formatDateHuman(task.scheduledDate);
                msg += ` ${dateFormatted}`;
            }
            if (task.scheduledTime) {
                msg += ` às ${task.scheduledTime}`;
            }
            msg += ". Pode deixar que eu te lembro! 📅";
            return msg;
        }
        case "update": {
            let msg = `${greeting}✏️ Atualizei "${task.taskIdentifier}"`;
            if (task.scheduledTime) {
                msg += ` - novo horário: ${task.scheduledTime}`;
            }
            if (task.scheduledDate) {
                const dateFormatted = formatDateHuman(task.scheduledDate);
                msg += ` - nova data: ${dateFormatted}`;
            }
            if (task.status === "completed") {
                msg = `${greeting}🎉 Marquei "${task.taskIdentifier}" como concluída! Parabéns pela produtividade!`;
            } else if (task.status === "cancelled") {
                msg = `${greeting}❌ Tarefa "${task.taskIdentifier}" foi cancelada.`;
            }
            return msg;
        }
        case "delete": {
            return `${greeting}🗑️ Removi "${task.taskIdentifier}" da sua agenda. Menos uma preocupação!`;
        }
        default:
            return `${greeting}Tarefa processada com sucesso!`;
    }
}


function formatDateHuman(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return "para hoje";
    if (daysDiff === 1) return "para amanhã";
    if (daysDiff === -1) return "para ontem";
    if (daysDiff > 1 && daysDiff <= 7) {
        const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
        return `para ${days[date.getDay()]}`;
    }

    return `para ${date.getDate()}/${date.getMonth() + 1}`;
}
