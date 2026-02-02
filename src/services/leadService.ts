import { Lead } from "@/types/lead";
import { sanitizeLeadData } from "@/lib/sanitizer";

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const PHANTOM_BUSTER_WEBHOOK = process.env.PHANTOM_BUSTER_WEBHOOK;

/**
 * Lead Service to integrate with external providers.
 */
export const leadService = {
    /**
     * Fetches leads from external APIs (Apollo.io for international, phantomBuster for BR).
     */
    async fetchExternalLeads(query: string, location: string): Promise<Lead[]> {
        console.log(`Searching leads for: ${query} in ${location}`);

        try {
            // 1. Try Apollo.io (International)
            const apolloLeads = await this.searchApolloLeads(query, location);

            // 2. Try PhantomBuster (Brazil Structure)
            const brLeads = await this.searchPhantomBusterLeads(query, location);

            const allLeads = [...apolloLeads, ...brLeads];

            // Standardize and Sanitize
            return allLeads.map(lead => {
                const sanitized = sanitizeLeadData(lead);
                return sanitized as Lead;
            });

        } catch (error) {
            console.error("Error fetching leads:", error);
            throw error;
        }
    },

    async searchApolloLeads(query: string, location: string): Promise<Partial<Lead>[]> {
        if (!APOLLO_API_KEY) {
            console.warn("APOLLO_API_KEY not found. Skipping Apollo search.");
            return [];
        }

        // Example Apollo Integration
        // const response = await fetch("https://api.apollo.io/v1/mixed_people/search", { ... });

        return [];
    },

    async searchPhantomBusterLeads(query: string, location: string): Promise<Partial<Lead>[]> {
        if (!PHANTOM_BUSTER_WEBHOOK) {
            return [];
        }

        // fetch(PHANTOM_BUSTER_WEBHOOK, { ... })

        return [];
    }
};
