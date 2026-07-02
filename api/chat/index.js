module.exports = async function (context, req) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const userMessage = req.body?.messages?.[0]?.content;
    
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

        // 1. Nejdřív to přečteme jako syrový text (tohle zabrání pádu "Unexpected end of JSON input")
        const rawText = await response.text();
        
        let data;
        try {
            // 2. Teprve teď zkusíme udělat JSON
            data = JSON.parse(rawText);
        } catch (parseError) {
            // 3. Pokud Azure poslal něco jiného (např. prázdný body nebo plain text chybu)
            context.res = { 
                status: 200, // Záměrně 200, ať se to propíše na frontend
                body: { response: `Azure odpověděl ne-JSON formátem (Status: ${response.status}). Obsah: ${rawText || "Prázdná odpověď"}` } 
            };
            return;
        }
        
        // 4. Pokud je to validní JSON, zpracujeme ho jako normálně
        context.res = { 
            status: 200, 
            body: { response: response.ok ? (data.choices?.[0]?.message?.content || "JSON dorazil, ale chybí v něm odpověď AI.") : (`Chyba Azure ${response.status}: ` + JSON.stringify(data)) } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba backendu: " + error.message } };
    }
};
