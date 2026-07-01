module.exports = async function (context, req) {
    context.log('Zahajuji komunikaci s Foundry...');

    // 1. Validace vstupu
    if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
        context.res = { status: 400, body: { error: "Neplatný formát požadavku: chybí pole 'messages'" } };
        return;
    }

    // 2. Validace konfigurace
    if (!process.env.FOUNDRY_API_TOKEN) {
        context.log.error('Chyba: FOUNDRY_API_TOKEN není nastaven v prostředí Azure!');
        context.res = { status: 500, body: { error: "Chyba konfigurace serveru" } };
        return;
    }

    const payload = {
        createResponseRequest: {
            messages: req.body.messages
        }
    };

    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";

    try {
        // 3. Volání Foundry s časovým limitem (Timeout 30s)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "api-key": process.env.FOUNDRY_API_TOKEN,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeout);

        // 4. Zpracování odpovědi
        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            context.log.error('Foundry nevrátilo JSON:', responseText);
            data = { error: "Neplatná odpověď od AI agenta", raw: responseText.substring(0, 100) };
        }

        // 5. Odeslání výsledku
        context.res = {
            status: response.status,
            body: data
        };

    } catch (err) {
        context.log.error('Kritická chyba proxy:', err.message);
        const status = err.name === 'AbortError' ? 504 : 500;
        context.res = {
            status: status,
            body: { 
                error: "Proxy selhala", 
                details: err.message,
                type: err.name 
            }
        };
    }
};
