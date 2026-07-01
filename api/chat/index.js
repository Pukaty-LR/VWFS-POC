module.exports = async function (context, req) {
    // Získáme Bearer token z frontendu
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    
    if (!authHeader) {
        context.res = { status: 401, body: { error: "Chybí Authorization header." } };
        return;
    }

    const userMessage = req.body?.messages?.[0]?.content;
    
    // Endpoint na tvého agenta ve Foundry
    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": authHeader, // Přeposíláme token z prohlížeče dál
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                createResponseRequest: {
                    messages: [{ role: "user", content: userMessage }]
                }
            })
        });

        const data = await response.json();
        
        // Pokud Azure Foundry vrátí chybu, pošleme ji na frontend
        if (!response.ok) {
            context.res = { status: response.status, body: { error: JSON.stringify(data) } };
        } else {
            context.res = { status: 200, body: data };
        }
    } catch (error) {
        context.res = { status: 500, body: { error: error.message } };
    }
};
