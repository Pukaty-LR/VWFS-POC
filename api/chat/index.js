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
            // TADY JE TA ZMĚNA: Slovo "messages" jsme přepsali na "input" přesně podle požadavku Azure API
            body: JSON.stringify({ input: [{ role: "user", content: userMessage }] })
        });

        const rawText = await response.text();
        
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            context.res = { status: 200, body: { response: `Chyba Foundry (Status: ${response.status}). Zpráva: ${rawText}` } };
            return;
        }
        
        // Zkusíme vytáhnout odpověď z různých struktur, které nové API může používat
        let reply = "Žádná textová odpověď od AI.";
        if (response.ok) {
            reply = data.choices?.[0]?.message?.content 
                 || data.output 
                 || data.text 
                 || JSON.stringify(data); // Pokud se struktura odpovědi úplně změnila, aspoň ji rovnou uvidíme v chatu
        }

        context.res = { 
            status: 200, 
            body: { response: response.ok ? reply : (`Zamítnuto agentem ${response.status}: ` + JSON.stringify(data)) } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba: " + error.message } };
    }
};
