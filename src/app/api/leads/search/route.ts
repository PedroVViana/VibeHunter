import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { brasilApi } from "@/services/brasilApi";
import { aiAgent } from "@/services/aiAgent";

export const maxDuration = 45;

export async function POST(req: Request) {
    let browser;
    try {
        const { location, nicho, existingLeads = [] } = await req.json();
        console.log(`\n>>> [API] Search started: ${nicho} in ${location} <<<`);

        if (!location || !nicho) {
            return NextResponse.json(
                { error: "Location and Nicho are required fields." },
                { status: 400 }
            );
        }

        const token = process.env.BROWSERLESS_TOKEN;
        if (!token) {
            throw new Error("BROWSERLESS_TOKEN is not configured.");
        }

        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://chrome.browserless.io?token=${token}`,
        });

        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
            else req.continue();
        });

        const queryStr = `${nicho} em ${location}`.trim();
        const query = encodeURIComponent(queryStr);
        // Task 1: Correção da URL e Navegação com hl=pt-BR
        const url = `https://www.google.com/maps/search/${query}?hl=pt-BR`;

        console.log(`[Scraper] Navigating to: ${url}`);
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Consent Bypass (Common in EU and some BR regions)
        try {
            const consentButton = await page.$('button[aria-label="Aceitar tudo"], button[aria-label="Agree"], button[aria-label="Aceito"]');
            if (consentButton) {
                console.log("[Scraper] Consent dialog detected, clicking accept...");
                await consentButton.click();
                await page.waitForNavigation({ waitUntil: "networkidle2" });
            }
        } catch (e) {
            console.log("[Scraper] No consent dialog found or failed to bypass.");
        }

        console.log("[Scraper] Waiting for results list...");
        // Task 2: Utilizar o seletor principal .hfpxzc
        try {
            await page.waitForSelector('.hfpxzc', { timeout: 15000 });
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error("[Scraper] Timeout waiting for .hfpxzc. HTML sample:", (await page.content()).substring(0, 500));
            throw new Error("Não foi possível encontrar resultados no Google Maps (.hfpxzc)");
        }

        const results = await page.evaluate(() => {
            // Task 2: Implementar lógica de evaluate que capture Nome, Telefone e Website
            const items = Array.from(document.querySelectorAll('.hfpxzc'));
            console.log(`[Scraper] Evaluate total .hfpxzc items: ${items.length}`);

            const seenNames = new Set();
            const validItems = [];

            for (const el of items) {
                // Nome: Do atributo aria-label do elemento .hfpxzc
                const name = el.getAttribute('aria-label') || "";
                if (!name || seenNames.has(name)) continue;
                seenNames.add(name);

                const parent = el.closest('[role="article"]') || el.parentElement;
                const allText = parent?.textContent || "";

                // Telefone: Padrão Regex para telefones brasileiros
                const phoneMatch = allText.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/);
                const phone = phoneMatch ? phoneMatch[0] : "";

                // Website: Capture links que não contenham "google.com" dentro do card
                let website = "";

                // --- TASK 2: Robust selector [data-item-id="authority"] ---
                const authorityLink = parent?.querySelector('a[data-item-id="authority"]');
                if (authorityLink) {
                    website = authorityLink.getAttribute('href') || "";
                }

                if (!website) {
                    const links = Array.from(parent?.querySelectorAll('a') || []);
                    const webLink = links.find(l => {
                        const href = l.getAttribute('href');
                        return href && !href.includes('google.com') && !href.includes('javascript') && href.startsWith('http');
                    });
                    website = webLink?.getAttribute('href') || "";
                }

                validItems.push({
                    nome: name,
                    telefone: phone,
                    website: website
                });
                if (validItems.length >= 10) break;
            }
            return validItems;
        });

        console.log(`[Scraper] Extracted ${results.length} valid results.`);

        const leads = results.map(res => ({
            id: crypto.randomUUID(),
            nome: res.nome,
            telefone: res.telefone ? (res.telefone.replace(/\D/g, "").startsWith("55") ? `+${res.telefone.replace(/\D/g, "")}` : `+55${res.telefone.replace(/\D/g, "")}`) : "-",
            website: res.website || "",
            cidade: location,
            servico: nicho,
            status_verificacao: "pendente",
            ai_status: "pending"
        }));

        return NextResponse.json(leads);

    } catch (error: any) {
        console.error("[Scraper Error]:", error);
        return NextResponse.json({ error: error.message || "Failed to extract leads" }, { status: 500 });
    } finally {
        if (browser) await browser.close();
    }
}
