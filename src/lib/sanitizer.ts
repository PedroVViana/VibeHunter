import { Lead } from "@/types/lead";

/**
 * Capitalizes the first letter of each word in a string.
 */
export function capitalize(text: string): string {
    if (!text) return "";
    return text
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * Formats a phone number to international standard (E.164-ish).
 * Simple version: removes non-digits and ensures prefix.
 */
export function formatPhoneNumber(phone: string): string {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11) {
        // Assuming BR mobile: 55 + digits
        return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        // Assuming BR landline
        return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Normalizes and validates a domain.
 */
export function normalizeDomain(domain: string): string {
    if (!domain) return "";
    return domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
}

/**
 * Sanitizes lead data for consistency.
 */
export function sanitizeLeadData(lead: Partial<Lead>): Partial<Lead> {
    return {
        ...lead,
        nome: lead.nome ? capitalize(lead.nome) : lead.nome,
        telefone: lead.telefone ? formatPhoneNumber(lead.telefone) : lead.telefone,
        dominio: lead.dominio ? normalizeDomain(lead.dominio) : lead.dominio,
        email: lead.email?.toLowerCase().trim(),
    };
}
