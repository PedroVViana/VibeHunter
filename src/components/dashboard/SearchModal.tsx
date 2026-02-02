"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNewLeads } from "@/store/leadsSlice";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

const NICHES = [
    "Clínica de Estética",
    "Odontologia",
    "Dermatologia",
];

export function SearchModal() {
    const dispatch = useAppDispatch();
    const { loading, uploadedLeads, currentStep } = useAppSelector((state) => state.leads);
    const [open, setOpen] = useState(false);
    const [location, setLocation] = useState("");
    const [nicho, setNicho] = useState(NICHES[0]);

    const handleSearch = async () => {
        if (!location.trim()) {
            toast.error("Por favor, informe a localização.");
            return;
        }

        try {
            await dispatch(fetchNewLeads({ location, nicho, existingLeads: uploadedLeads })).unwrap();
            toast.success("Prospecção concluída com sucesso!");
            setOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Erro ao buscar leads.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full bg-black text-white hover:bg-neutral-800 px-6 py-6 h-auto shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Search className="mr-2 h-5 w-5" />
                    <span className="font-semibold text-lg">Começar Prospecção</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-neutral-50 px-8 py-6 border-b border-neutral-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                            Prospecção Inteligente
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 text-base mt-2">
                            Defina o nicho e a localização para o nosso scraper avançado encontrar leads inéditos.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    {loading && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-neutral-400">
                                <span className={currentStep >= 1 ? "text-black" : ""}>1. Scraping</span>
                                <span className={currentStep >= 2 ? "text-black" : ""}>2. Enriquecimento</span>
                                <span className={currentStep >= 3 ? "text-black" : ""}>3. Finalização</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-black transition-all duration-700 ease-in-out"
                                    style={{ width: `${(currentStep / 3) * 100}%` }}
                                />
                            </div>
                            <p className="text-center text-sm font-medium text-neutral-600">
                                {currentStep === 1 && "Buscando clínicas no Google Maps..."}
                                {currentStep === 2 && "Enriquecendo dados com BrasilAPI..."}
                                {currentStep === 3 && "Removendo duplicatas e finalizando..."}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label htmlFor="location" className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                            Onde buscar?
                        </Label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-black transition-colors" />
                            <Input
                                id="location"
                                placeholder="Ex: São Paulo, SP ou Miami, FL"
                                className="pl-12 h-14 rounded-2xl border-neutral-200 focus:border-black focus:ring-0 text-lg transition-all"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                            Qual o nicho?
                        </Label>
                        <Select value={nicho} onValueChange={setNicho} disabled={loading}>
                            <SelectTrigger className="h-14 rounded-2xl border-neutral-200 focus:border-black focus:ring-0 text-lg">
                                <SelectValue placeholder="Selecione o nicho" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-neutral-200">
                                {NICHES.map((item) => (
                                    <SelectItem key={item} value={item} className="h-10 text-lg focus:bg-neutral-100 rounded-lg">
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        className="w-full h-14 rounded-2xl bg-black hover:bg-neutral-800 text-white text-lg font-bold shadow-xl shadow-neutral-200 transition-all active:scale-[0.98] disabled:opacity-70"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            "Buscar Leads Inéditos"
                        )}
                    </Button>

                    <p className="text-center text-xs text-neutral-400 font-medium pb-2">
                        A busca pode levar alguns segundos devido ao processamento do scraper.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
