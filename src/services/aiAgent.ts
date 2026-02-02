import axios from 'axios';

export interface AIProcessedLead {
    email: string | null;
    cnpj: string | null;
    instagram: string | null;
    whatsapp: string | null;
    divergencia_nome: boolean;
    especialidades: string[];
    lead_score: number;
    perfil_publico: string;
    tipo_entidade: 'profissional_liberal' | 'empresa';
    dica_abordagem: string;
}

class AIAgentService {
    private apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

    async processLeadData(rawText: string, mapsMetadata: { name: string; location: string; nicho: string; telefone?: string }): Promise<AIProcessedLead | null> {
        console.log(`[AI Agent] API Key Check: ${this.apiKey ? 'PRESENT (starts with ' + this.apiKey.substring(0, 5) + ')' : 'MISSING'}`);
        if (!this.apiKey) {
            console.error('[AI Agent] API Key missing');
            return null;
        }

        const systemPrompt = `Você é um extrator de dados. Receba o nome '${mapsMetadata.name}' e local '${mapsMetadata.location}'. Retorne APENAS um JSON com os campos: instagram (handle), email, cnpj, lead_score (1-5), perfil_publico, tipo_entidade e dica_abordagem. Se não souber, estime com base no mercado de estética de Recife. Use este contexto do site se disponível: ${rawText && rawText.trim().length > 0 ? rawText.substring(0, 5000) : "SITIO NÃO ENCONTRADO"}`;

        try {
            console.log(`\n🤖 [AI AGENT] >>> ANALYZING: ${mapsMetadata.name} <<<`);
            console.log(`📍 Location: ${mapsMetadata.location} | 🎯 Niche: ${mapsMetadata.nicho}`);
            console.log(`📄 Input Size: ${rawText ? rawText.length : 0} chars | Source: ${rawText && rawText.length > 0 ? 'Website' : 'Fallback (Maps Only)'}`);
            console.log('----------------------------------------------------------');

            const response = await axios.post(
                `${this.apiUrl}?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{ text: systemPrompt }]
                    }]
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            let resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("RAW AI RESPONSE:", resultText);

            if (!resultText) {
                console.log(`⚠️ [AI AGENT] EMPTY RESPONSE FOR: ${mapsMetadata.name}`);
                throw new Error("Empty response");
            }

            // --- TASK: Robust JSON Parsing (Markdown Strip) ---
            // Remove markdown syntax ```json or ``` if present
            resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

            const processedData = JSON.parse(resultText) as AIProcessedLead;
            console.log(`✨ [AI RESULT] Score: ${processedData.lead_score}/5 | Public: ${processedData.perfil_publico}`);
            console.log(`💡 Dica: ${processedData.dica_abordagem}`);
            console.log('----------------------------------------------------------\n');

            return {
                ...processedData,
                especialidades: processedData.especialidades || [mapsMetadata.nicho],
                divergencia_nome: processedData.divergencia_nome || false
            };
        } catch (error: any) {
            console.error('[AI Agent] ❌ Error. Using local fallback for:', mapsMetadata.name);
            console.log("Error details:", error.response?.data || error.message);

            // Hard fallback if AI fails or returns invalid JSON
            return {
                email: null,
                cnpj: null,
                instagram: null,
                whatsapp: null,
                divergencia_nome: false,
                especialidades: [mapsMetadata.nicho],
                lead_score: 1,
                perfil_publico: "Não identificado",
                tipo_entidade: mapsMetadata.name.toLowerCase().includes('dra') || mapsMetadata.name.toLowerCase().includes('dr.') ? 'profissional_liberal' : 'empresa',
                dica_abordagem: `Abordagem focada em serviços de ${mapsMetadata.nicho} para ${mapsMetadata.name}.`
            };
        }
    }
}

export const aiAgent = new AIAgentService();
