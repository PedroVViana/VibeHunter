import axios from "axios";

const BRASIL_API_BASE = "https://brasilapi.com.br/api";

export const brasilApi = {
    async getCnpjData(cnpj: string) {
        try {
            const cleanCnpj = cnpj.replace(/\D/g, "");
            const response = await axios.get(`${BRASIL_API_BASE}/cnpj/v1/${cleanCnpj}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching CNPJ ${cnpj}:`, error);
            return null;
        }
    },

    /**
     * Note: BrasilAPI doesn't have a direct 'search by name' endpoint.
     * We might need to find the CNPJ on the lead's website or via Google Search first.
     */
};
