module.exports = async function (context, req) {
    // 1. Zkontrolujeme hlavičku (pokud ji Azure předává)
    const user = req.headers['x-ms-client-principal'];
    if (!user) {
        context.res = { status: 401, body: "Nepřihlášen" };
        return;
    }

    try {
        const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + process.env.FOUNDRY_API_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        // 2. Tady je ta oprava: přečteme text a pak se rozhodneme
        const responseText = await response.text();
        let body;
        try {
            body = JSON.parse(responseText);
        } catch (e) {
            body = { error: "Foundry vrátilo neplatný formát", raw: responseText };
        }

        context.res = {
            status: response.status,
            body: body
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: { error: "Proxy chyba", details: err.message }
        };
    }
};
