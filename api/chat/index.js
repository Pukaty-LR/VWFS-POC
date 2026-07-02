module.exports = async function (context, req) {
    // 1. Vytáhneme token z naší skryté hlavičky, protože SWA normální "authorization" smazal
    const authHeader = req.headers["x-custom-auth"];
    const userMessage = req.body?.messages?.[0]?.content;
    
    // Zkontrolujeme, jestli vůbec dorazil
    if (!authHeader) {
        context.res = { status: 401, body: { response: "Chyba: Token se z frontendu nepřenesl." } };
        return;
    }

    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": authHeader, // 2. Tady už posíláme agentovi klasický Authorization
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: [{ role: "user", content: userMessage }] })
        });

        const rawText = await response.text();
        
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            context.res = { status: 200, body: { response: `Chyba Foundry (Status: ${response.status}). Zpráva: ${rawText}` } };
            return;
        }
        
        context.res = { 
            status: 200, 
            body: { response: response.ok ? (data.choices?.[0]?.message?.content || "Žádná textová odpověď od AI.") : (`Zamítnuto agentem ${response.status}: ` + JSON.stringify(data)) } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba: " + error.message } };
    }
};
