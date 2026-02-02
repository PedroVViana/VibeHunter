export type StatusVerificacao = "verificado" | "pendente" | "nao_verificado";

export interface Lead {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  dominio?: string;
  instagram: string;
  cidade: string;
  servico: string;
  status_verificacao: StatusVerificacao;
  capital_social?: number;
  data_abertura?: string;
  // --- AI ENRICHMENT ---
  lead_score?: number;
  perfil_publico?: string;
  tipo_entidade?: string;
  dica_abordagem?: string;
  especialidades?: string[];
  ai_status?: "pending" | "processed" | "failed";
}

export interface LeadUploadRow {
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  dominio?: string;
  instagram?: string;
  cidade?: string;
  servico?: string;
}
