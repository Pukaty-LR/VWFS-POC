module.exports = async function (context, req) {
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

        // Nejdřív to přečteme jako surový text, ať to nespadne
        const responseText = await response.text();
        
        let parsedBody;
        try {
            // Zkusíme to přelouskat jako JSON
            parsedBody = JSON.parse(responseText);
        } catch (e) {
            // Když to JSON není (např. HTML chyba), pošleme to jako raw text
            parsedBody = { rawResponse: responseText };
        }

        context.res = {
            status: response.status,
            body: parsedBody
        };
        
    } catch (error) {
        // Záchrana pro případ, že spadne samotný fetch
        context.res = {
            status: 500,
            body: { error: "Proxy havarovala", details: error.message }
        };
    }
};
