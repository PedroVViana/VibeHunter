"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch } from "react-redux";
import { Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setUploadedLeads } from "@/store/leadsSlice";
import type { LeadUploadRow } from "@/types/lead";

function parseCSV(text: string): LeadUploadRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: LeadUploadRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push({
      nome: row.nome ?? row.name,
      cnpj: row.cnpj,
      email: row.email,
      instagram: row.instagram,
      cidade: row.cidade ?? row.city,
      servico: row.servico ?? row.serviço ?? row.service,
    });
  }
  return rows;
}

export function UploadCard() {
  const dispatch = useDispatch();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const rows = parseCSV(text);
        dispatch(setUploadedLeads(rows));
      };
      reader.readAsText(file, "UTF-8");
    },
    [dispatch]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <Card className="border border-neutral-100 shadow-xl shadow-neutral-100/50 rounded-3xl overflow-hidden bg-white">
      <CardHeader className="pb-6 pt-8 px-8">
        <CardTitle className="text-2xl font-bold text-black tracking-tight">Sincronizar Sua Base</CardTitle>
        <CardDescription className="text-neutral-500 text-base">
          Suba seu CSV com leads atuais para que o VibeHunter ignore duplicatas e foque apenas no que é inédito.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8 text-center sm:text-left transition-all">
        <div
          {...getRootProps()}
          className={`
            flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-300
            ${isDragActive ? "border-black bg-neutral-50 scale-[0.99]" : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-50"}
          `}
        >
          <input {...getInputProps()} />
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
            <Upload className={`h-8 w-8 ${isDragActive ? "text-black" : "text-neutral-300"}`} />
          </div>
          <p className="text-lg font-bold text-black">
            {isDragActive ? "Solte o arquivo agora" : "Arraste seu CSV ou clique para selecionar"}
          </p>
          <p className="mt-2 text-sm font-medium text-neutral-400">
            Colunas esperadas: nome, cnpj, email, telefone, cidade, servico.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
