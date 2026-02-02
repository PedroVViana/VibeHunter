import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Lead, LeadUploadRow } from "@/types/lead";
import { leadService } from "@/services/leadService";

function normalizeForComparison(value: string): string {
  return value?.trim().toLowerCase().replace(/\s+/g, "") ?? "";
}

function rowToLead(row: LeadUploadRow, index: number): Partial<Lead> {
  return {
    id: `upload-${index}`,
    nome: row.nome ?? "",
    cnpj: (row.cnpj ?? "").replace(/\D/g, ""),
    email: (row.email ?? "").trim().toLowerCase(),
    telefone: row.telefone ?? "",
    dominio: row.dominio ?? "",
    instagram: row.instagram ?? "",
    cidade: row.cidade ?? "",
    servico: row.servico ?? "",
    status_verificacao: "pendente",
  };
}

export const searchLeads = createAsyncThunk(
  "leads/search",
  async ({ query, location }: { query: string; location: string }) => {
    const leads = await leadService.fetchExternalLeads(query, location);
    return leads;
  }
);

function normalizeName(name: string): string {
  if (!name) return "";
  // Remove everything after |, -, :, •
  return name.split(/[|\-:•]/)[0].trim();
}

export const fetchNewLeads = createAsyncThunk(
  "leads/fetchNew",
  async ({ location, nicho, existingLeads }: { location: string; nicho: string; existingLeads: Lead[] }, { dispatch }) => {
    // Step 1: Scraper (Google Maps)
    dispatch(leadsSlice.actions.setStep(1));
    const response = await fetch("/api/leads/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, nicho, existingLeads }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch leads");
    }

    let leads = await response.json();
    console.log(`[Thunk] Step 1 Complete: Found ${leads.length} leads.`);

    // --- TASK 1 & 4: Normalization & Sync ---
    // Advance currentStep ONLY after normalization
    const normalizedLeads = leads.map((l: any) => ({
      ...l,
      nome: normalizeName(l.nome)
    }));

    // Step 2: Enrichment (AI + BrasilAPI)
    dispatch(leadsSlice.actions.setStep(2));

    try {
      const enrichResponse = await fetch("/api/leads/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: normalizedLeads, location, nicho }),
      });

      if (enrichResponse.ok) {
        leads = await enrichResponse.json();
        const aiCount = leads.filter((l: any) => l.ai_status === 'processed').length;
        console.log(`[Thunk] Step 2 Complete: ${aiCount} enriched by IA.`);
      }
    } catch (e) {
      console.error("[Thunk] Enrichment failed", e);
    }

    // Step 3: Deduplication & Finalization
    dispatch(leadsSlice.actions.setStep(3));

    return leads;
  }
);

export interface LeadsState {
  uploadedLeads: Lead[];
  availableLeads: Lead[];
  filteredLeads: Lead[];
  filteredResults: Lead[];
  loading: boolean;
  error: string | null;
  lastDeduplicationCount: number;
  currentStep: number;
}

const initialState: LeadsState = {
  uploadedLeads: [],
  availableLeads: [],
  filteredLeads: [],
  filteredResults: [],
  loading: false,
  error: null,
  lastDeduplicationCount: 0,
  currentStep: 0,
};

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    setUploadedLeads: (state, action: { payload: LeadUploadRow[] }) => {
      state.uploadedLeads = action.payload
        .map((row, i) => rowToLead(row, i))
        .filter((l) => l.email || l.cnpj) as Lead[];
    },
    addUploadedLead: (state, action: { payload: Lead }) => {
      state.uploadedLeads.push(action.payload);
    },
    clearUploadedLeads: (state) => {
      state.uploadedLeads = [];
    },
    resetSearch: (state) => {
      state.filteredLeads = [];
      state.filteredResults = [];
      state.lastDeduplicationCount = 0;
      state.currentStep = 0;
    },
    setStep: (state, action: { payload: number }) => {
      state.currentStep = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchLeads.fulfilled, (state, action) => {
        state.loading = false;

        const newLeads = action.payload;
        const userBase = state.uploadedLeads;

        // Deduplication logic: filter by email or dominio
        const filtered = newLeads.filter(n => {
          const isDuplicate = userBase.some(u => {
            const sameEmail = u.email && n.email && normalizeForComparison(u.email) === normalizeForComparison(n.email);
            const sameDomain = u.dominio && n.dominio && normalizeForComparison(u.dominio) === normalizeForComparison(n.dominio);
            return sameEmail || sameDomain;
          });
          return !isDuplicate;
        });

        state.lastDeduplicationCount = newLeads.length - filtered.length;
        state.filteredLeads = filtered;
      })
      .addCase(searchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Falha ao buscar leads";
      })
      .addCase(fetchNewLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.filteredLeads = [];
        state.filteredResults = [];
        state.lastDeduplicationCount = 0;
      })
      .addCase(fetchNewLeads.fulfilled, (state, action) => {
        state.loading = false;
        const incomingLeads = action.payload;
        const existingBase = state.uploadedLeads;

        // Deduplication using CNPJ or Email as primary key
        const uniqueInedites = incomingLeads.filter((n: any) => {
          return !existingBase.some((u: Lead) => {
            const sameCnpj = u.cnpj && n.cnpj && u.cnpj.replace(/\D/g, "") === n.cnpj.replace(/\D/g, "");
            const sameEmail = u.email && n.email && normalizeForComparison(u.email) === normalizeForComparison(n.email);
            return sameCnpj || sameEmail;
          });
        });

        state.lastDeduplicationCount = incomingLeads.length - uniqueInedites.length;
        state.filteredResults = uniqueInedites;
        state.filteredLeads = uniqueInedites;
      })
      .addCase(fetchNewLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Falha na prospecção VibeHunter";
      });
  },
});

export const { setUploadedLeads, addUploadedLead, clearUploadedLeads, resetSearch } =
  leadsSlice.actions;
export default leadsSlice.reducer;
