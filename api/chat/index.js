module.exports = async function (context, req) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const userMessage = req.body?.messages?.[0]?.content;
    
    // Toto je přesně ten koncový bod z tvé fotky ve Foundry
    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: [{ role: "user", content: userMessage }] })
        });

        const data = await response.json();
        
        context.res = { 
            status: 200, 
            body: { response: response.ok ? (data.choices?.[0]?.message?.content || "Žádná odpověď") : ("Chyba Azure: " + JSON.stringify(data)) } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba backendu: " + error.message } };
    }
};
