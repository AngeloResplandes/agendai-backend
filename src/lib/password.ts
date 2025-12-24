import { PASSWORD_HASH } from "../config/constants";

const { iterations: ITERATIONS, saltLength: SALT_LENGTH, keyLength: KEY_LENGTH, algorithm: HASH_ALGORITHM } = PASSWORD_HASH;


export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: ITERATIONS,
            hash: HASH_ALGORITHM,
        },
        keyMaterial,
        KEY_LENGTH * 8
    );

    const hashArray = new Uint8Array(derivedBits);
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    return `${saltBase64}:${hashBase64}`;
}


export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltBase64, hashBase64] = storedHash.split(":");

    if (!saltBase64 || !hashBase64) {
        return false;
    }

    const encoder = new TextEncoder();
    const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: ITERATIONS,
            hash: HASH_ALGORITHM,
        },
        keyMaterial,
        KEY_LENGTH * 8
    );

    const newHashBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

    return newHashBase64 === hashBase64;
}
