import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { aiAgent } from "@/services/aiAgent";
import { brasilApi } from "@/services/brasilApi";

export const maxDuration = 60; // Increased for AI processing

export async function POST(req: Request) {
    let browser;
    try {
        const { leads, location, nicho } = await req.json();

        if (!leads || !Array.isArray(leads)) {
            return NextResponse.json({ error: "Leads array is required" }, { status: 400 });
        }

        const token = process.env.BROWSERLESS_TOKEN;
        if (!token) throw new Error("BROWSERLESS_TOKEN missing");

        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://chrome.browserless.io?token=${token}`,
        });

        const enrichedLeads = [];

        for (const lead of leads) {
            console.log(`\n[Enrichment] Processing lead: ${lead.nome}`);

            let website = lead.website || null;
            let email = lead.email || null;
            let instagram = lead.instagram || null;
            let cnpj = lead.cnpj || null;
            let status = lead.status_verificacao || "pendente";
            let rawWebsiteText = "";
            let brasilData = null;

            // 1. Website Discovery (if missing)
            if (!website) {
                try {
                    const searchPage = await browser.newPage();
                    const searchQuery = encodeURIComponent(`site oficial ${lead.nome} ${location}`);
                    await searchPage.goto(`https://www.google.com/search?q=${searchQuery}&hl=pt-BR`, { waitUntil: "domcontentloaded", timeout: 10000 });

                    website = await searchPage.evaluate(() => {
                        const firstLink = document.querySelector('#search a[href^="http"]:not([href*="google.com"]):not([href*="instagram.com"]):not([href*="facebook.com"])');
                        return firstLink?.getAttribute('href') || "";
                    });
                    await searchPage.close();
                    if (website) console.log(`   - Found website: ${website}`);
                } catch (e) { }
            }

            // 2. Deep Website Scrape
            if (website) {
                try {
                    const wsPage = await browser.newPage();
                    await wsPage.goto(website, { waitUntil: "domcontentloaded", timeout: 10000 });
                    const pageData = await wsPage.evaluate(() => {
                        const body = document.body.innerText;
                        const emails = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                        const igLink = (document.querySelector('a[href*="instagram.com"]') as HTMLAnchorElement)?.href;
                        return { email: emails ? emails[0] : null, instagram: igLink, rawText: body.substring(0, 10000) };
                    });
                    email = pageData.email || email;
                    instagram = pageData.instagram || instagram;
                    rawWebsiteText = pageData.rawText;
                    await wsPage.close();
                } catch (e) { }
            }

            // 3. Instagram Search (if still missing)
            if (!instagram) {
                try {
                    const searchPage = await browser.newPage();
                    const searchQuery = encodeURIComponent(`instagram ${lead.nome} ${location}`);
                    await searchPage.goto(`https://www.google.com/search?q=${searchQuery}&hl=pt-BR`, { waitUntil: "domcontentloaded" });
                    instagram = await searchPage.evaluate(() => {
                        return document.querySelector('a[href*="instagram.com/"]')?.getAttribute('href') || null;
                    });
                    await searchPage.close();
                } catch (e) { }
            }

            // 4. CNPJ Discovery
            if (!cnpj) {
                try {
                    const searchPage = await browser.newPage();
                    const searchQuery = encodeURIComponent(`CNPJ ${lead.nome} ${location}`);
                    await searchPage.goto(`https://www.google.com/search?q=${searchQuery}&hl=pt-BR`, { waitUntil: "domcontentloaded" });
                    cnpj = await searchPage.evaluate(() => {
                        const match = document.body.innerText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
                        return match ? match[0].replace(/\D/g, "") : null;
                    });
                    await searchPage.close();
                } catch (e) { }
            }

            // 5. BrasilAPI
            if (cnpj) {
                brasilData = await brasilApi.getCnpjData(cnpj);
                if (brasilData?.situacao_cadastral === 2 || String(brasilData?.situacao_cadastral) === "2") {
                    status = "verificado";
                }
            }

            // 6. AI Agent Analysis
            let leadScore = lead.lead_score || 1;
            let especialidades = lead.especialidades || [];
            let perfilPublico = "";
            let tipoEntidade = "empresa";
            let dicaAbordagem = "";
            let aiStatus = "processed";

            // Task 3: Trigger AI even if webText is empty (Fallback logic)
            const aiData = await aiAgent.processLeadData(rawWebsiteText, {
                name: lead.nome,
                location,
                nicho,
                telefone: lead.telefone
            });

            if (aiData) {
                email = aiData.email || email;
                cnpj = aiData.cnpj || cnpj;
                instagram = aiData.instagram || instagram;
                leadScore = aiData.lead_score;
                especialidades = aiData.especialidades;
                perfilPublico = aiData.perfil_publico;
                tipoEntidade = aiData.tipo_entidade;
                dicaAbordagem = aiData.dica_abordagem;
                if (aiData.divergencia_nome) status = "revisão_necessária";
            } else {
                aiStatus = "failed";
            }

            enrichedLeads.push({
                ...lead,
                email,
                cnpj: cnpj ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : lead.cnpj,
                instagram,
                status_verificacao: status,
                lead_score: leadScore,
                especialidades: especialidades,
                perfil_publico: perfilPublico,
                tipo_entidade: tipoEntidade,
                dica_abordagem: dicaAbordagem,
                ai_status: aiStatus,
                capital_social: brasilData?.capital_social || lead.capital_social || 0,
                data_abertura: brasilData?.data_abertura || lead.data_abertura || ""
            });
        }

        return NextResponse.json(enrichedLeads);

    } catch (error: any) {
        console.error("[Enrichment Error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}
