/**
 * Constantes de configuração centralizadas do AgendAI Backend
 */

// ============================================
// JWT
// ============================================
export const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 dias

// ============================================
// Password Hashing (PBKDF2)
// ============================================
export const PASSWORD_HASH = {
    iterations: 100000,
    saltLength: 16,
    keyLength: 32,
    algorithm: "SHA-256",
} as const;

// ============================================
// Password Reset Token
// ============================================
export const PASSWORD_RESET = {
    expiryMs: 10 * 60 * 1000, // 10 minutos
    tokenLength: 6,
} as const;

// ============================================
// Validation
// ============================================
export const VALIDATION = {
    password: {
        minLength: 6,
        maxLength: 100,
    },
    name: {
        minLength: 2,
        maxLength: 255,
    },
    bio: {
        maxLength: 100,
    },
    task: {
        titleMaxLength: 255,
        descriptionMaxLength: 1000,
    },
} as const;

// ============================================
// API
// ============================================
export const API = {
    groqUrl: "https://api.groq.com/openai/v1/chat/completions",
    groqModel: "llama-3.3-70b-versatile",
    groqMaxTokens: 1000,
    groqTemperature: 0.3,
} as const;

// ============================================
// CORS Origins
// ============================================
export const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://agendai-backend.angeloresplandes.workers.dev",
] as const;
