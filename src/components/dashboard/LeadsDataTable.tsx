"use client";

import { useMemo, useState, useEffect } from "react";
import { searchLeads, resetSearch } from "@/store/leadsSlice";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { Lead } from "@/types/lead";

const PAGE_SIZE = 5;
const CIDADES = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Brasília", "Salvador", "Fortaleza", "Recife", "Campinas", "Goiânia", "Florianópolis", "International"];
const SERVICOS = ["Aesthetic Clinic", "Botox", "Preenchimento", "Laser", "Odontologia"];

function getStatusVariant(status: string) {
  switch (status) {
    case "verificado":
      return "success";
    case "pendente":
      return "warning";
    default:
      return "secondary";
  }
}

export function LeadsDataTable() {
  const dispatch = useAppDispatch();
  const { filteredLeads, loading, lastDeduplicationCount } = useAppSelector((state) => state.leads);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!loading && lastDeduplicationCount > 0) {
      toast.info(`${lastDeduplicationCount} leads duplicados foram removidos da sua busca.`, {
        description: "Eles já constam na sua base de dados enviada.",
      });
    }
  }, [loading, lastDeduplicationCount]);

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE) || 1;
  const paginatedLeads = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [filteredLeads, page]);

  return (
    <Card className="border border-neutral-100 shadow-xl shadow-neutral-100/50 rounded-3xl overflow-hidden bg-white">
      <CardHeader className="pb-6 pt-8 px-8">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-black tracking-tight">Portfólio de Leads Inéditos</CardTitle>
            <CardDescription className="text-neutral-500 text-base">
              Estes são os leads que o VibeHunter encontrou e que ainda não constam na sua base de clientes.
            </CardDescription>
          </div>
          {filteredLeads.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-neutral-400 hover:text-black hover:bg-neutral-50 px-4"
              onClick={() => dispatch(resetSearch())}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar Resultados
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow className="hover:bg-transparent border-neutral-100">
              <TableHead className="px-8 h-14 font-bold text-neutral-500 uppercase tracking-wider text-xs">Clínica / Especialista</TableHead>
              <TableHead className="h-14 font-bold text-neutral-500 uppercase tracking-wider text-xs">Email</TableHead>
              <TableHead className="h-14 font-bold text-neutral-500 uppercase tracking-wider text-xs">CNPJ / ID</TableHead>
              <TableHead className="h-14 font-bold text-neutral-500 uppercase tracking-wider text-xs">Telefone</TableHead>
              <TableHead className="h-14 font-bold text-neutral-500 uppercase tracking-wider text-xs">Local</TableHead>
              <TableHead className="px-8 h-14 font-bold text-neutral-500 uppercase tracking-wider text-xs text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TableRow key={i} className="border-neutral-50">
                  <TableCell className="px-8 py-6"><Skeleton className="h-6 w-48 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-40 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                  <TableCell className="px-8 text-right"><Skeleton className="ml-auto h-8 w-24 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center ">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="bg-neutral-50 p-6 rounded-full">
                      <Search className="h-10 w-10 text-neutral-200" />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <p className="text-lg font-bold text-neutral-900">Nenhum resultado disponível</p>
                      <p className="text-neutral-400 text-sm mt-1">Clique em &quot;Começar Prospecção&quot; para que o VibeHunter vasculhe a web.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead: Lead) => (
                <ExpandableRow key={lead.id} lead={lead} />
              ))
            )}
          </TableBody>
        </Table>

        {!loading && filteredLeads.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-neutral-50 px-8 py-4 bg-neutral-50/30">
            <p className="text-sm text-neutral-400 font-medium">
              Mostrando <span className="text-black">{page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filteredLeads.length)}</span> de <span className="text-black">{filteredLeads.length}</span> resultados
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-neutral-200"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-neutral-200"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpandableRow({ lead }: { lead: Lead }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <TableRow
        className="hover:bg-neutral-50/50 transition-colors border-neutral-100 group cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="px-8 py-6">
          <div className="font-bold text-black text-lg group-hover:text-black transition-colors">{lead.nome}</div>
          <div className="text-neutral-400 text-xs font-medium uppercase tracking-tight">{lead.servico}</div>
        </TableCell>
        <TableCell className="text-neutral-600 font-medium">{lead.email || "-"}</TableCell>
        <TableCell className="font-mono text-sm text-neutral-400">{lead.cnpj || "-"}</TableCell>
        <TableCell className="font-medium text-black">
          {lead.lead_score && (
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-4 rounded-full ${i < (lead.lead_score || 0) ? 'bg-amber-400' : 'bg-neutral-100'}`}
                />
              ))}
            </div>
          )}
          {lead.telefone || "-"}
        </TableCell>
        <TableCell className="text-neutral-600">
          <div className="text-xs text-neutral-400 mb-1">{lead.tipo_entidade === 'profissional_liberal' ? '👤 Profissional' : '🏢 Empresa'}</div>
          {lead.cidade}
        </TableCell>
        <TableCell className="px-8 text-right">
          <Badge className="rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest border-none shadow-sm" variant={getStatusVariant(lead.status_verificacao) as any}>
            {lead.status_verificacao}
          </Badge>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-neutral-50/30 border-neutral-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <TableCell colSpan={6} className="px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* AI Analysis Card */}
              <div className="col-span-2 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">Dica de Abordagem para o Time Comercial</h4>
                  <div className="p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm text-lg text-black leading-relaxed italic">
                    &quot;{lead.dica_abordagem || "Analisando conteúdo para gerar dica personalizada..."}&quot;
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Público-Alvo Estimado</h4>
                    <div className="text-black font-bold text-lg">{lead.perfil_publico || "Calculando..."}</div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Especialidades Identificadas</h4>
                    <div className="flex flex-wrap gap-2">
                      {lead.especialidades?.map((s, i) => (
                        <Badge key={i} variant="outline" className="rounded-lg bg-white border-neutral-200 text-neutral-600 font-bold">
                          {s}
                        </Badge>
                      )) || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Meta Card */}
              <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest border-b pb-2">Informações Adicionais</h4>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Instagram</span>
                    <span className="font-bold text-neutral-800">{lead.instagram || "Não encontrado"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Capital Social</span>
                    <span className="font-bold text-neutral-800">
                      {lead.capital_social ? `R$ ${lead.capital_social.toLocaleString()}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Data de Abertura</span>
                    <span className="font-bold text-neutral-800">{lead.data_abertura || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-neutral-400">Status IA</span>
                    <Badge variant={lead.ai_status === 'processed' ? 'success' : 'secondary'} className="rounded-lg h-5 text-[10px]">
                      {lead.ai_status === 'processed' ? 'PROCESSADO' : 'PENDENTE'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
