module.exports = async function (context, req) {
    const authHeader = req.headers["x-custom-auth"];
    const userMessage = req.body?.messages?.[0]?.content;
    
    if (!authHeader) {
        context.res = { status: 401, body: { response: "Chyba: Token se z frontendu nepřenesl." } };
        return;
    }

    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
            },
            // Nový formát pro Responses API
            body: JSON.stringify({ input: [{ role: "user", content: userMessage }] })
        });

        const rawText = await response.text();
        
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            context.res = { status: 200, body: { response: `Chyba formátu z Azure: ${rawText}` } };
            return;
        }
        
        // Agresivní extrakce odpovědi (pokryje všechny verze Azure API)
        let reply = "AI vygenerovalo prázdnou odpověď.";
        if (response.ok) {
            reply = data?.output?.content 
                 || data?.output 
                 || data?.choices?.[0]?.message?.content 
                 || data?.message?.content 
                 || JSON.stringify(data, null, 2); // Když selže vše, vypíše krásně zformátovaný surový JSON
        }

        context.res = { 
            status: 200, 
            body: { response: response.ok ? reply : (`Zamítnuto agentem ${response.status}: ` + JSON.stringify(data)) } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba: " + error.message } };
    }
};
