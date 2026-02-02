"use client";

import { useAppSelector } from "@/store/hooks";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UploadCard } from "@/components/dashboard/UploadCard";
import { LeadsDataTable } from "@/components/dashboard/LeadsDataTable";

import { SearchModal } from "@/components/dashboard/SearchModal";

export default function DashboardPage() {
  const { filteredLeads, lastDeduplicationCount, uploadedLeads } = useAppSelector((state) => state.leads);
  const totalUploaded = uploadedLeads.length;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neutral-500">
              PRO VERSION v2.0
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
              VibeHunter
            </h1>
            <p className="text-xl text-neutral-500 max-w-xl leading-relaxed">
              O futuro da prospecção inteligente. Nosso scraper avançado encontra leads inéditos e os filtra em tempo real.
            </p>
          </div>
          <div className="flex shrink-0">
            <SearchModal />
          </div>
        </header>

        <section className="mb-12 grid gap-6 sm:grid-cols-3">
          <MetricCard
            title="Sua Base Envida"
            value={totalUploaded}
            description="Leads carregados via CSV"
          />
          <MetricCard
            title="Duplicados Removidos"
            value={lastDeduplicationCount}
            description="Encontrados na última busca"
          />
          <MetricCard
            title="Novos Leads"
            value={filteredLeads.length}
            description="Leads únicos encontrados"
          />
        </section>

        <section className="mb-12">
          <UploadCard />
        </section>

        <section>
          <LeadsDataTable />
        </section>
      </div>
    </main>
  );
}
