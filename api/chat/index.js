module.exports = async function (context, req) {
    // 1. Získáme text zprávy z tvého webu
    let userMessage = "test";
    if (req.body && req.body.messages && req.body.messages.length > 0) {
        userMessage = req.body.messages[0].content;
    }

    // 2. Vytáhneme klíč přímo z toho stringu, co jsi tam uložil (žádné další klikání v Azure!)
    const connString = process.env.FOUNDRY_CONN_STRING || "";
    const match = connString.match(/key=([^;]+)/);
    const apiKey = match ? match[1] : null;

    if (!apiKey) {
        context.res = { status: 500, body: { error: "Nenašel jsem klíč v proměnné FOUNDRY_CONN_STRING." } };
        return;
    }

    // 3. Toto je ten koncový bod, který už nám jednou odpověděl (tehdy tě stoplo jen OBO)
    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";
    
    // 4. Zabaleno přesně tak, jak si o to Foundry řeklo v logu
    const payload = {
        createResponseRequest: {
            messages: [{ role: "user", content: userMessage }]
        }
    };

    try {
        // 5. Suplujeme standardní volání, žádné složité balíčky
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // 6. Robustní zpracování odpovědi
        const textResponse = await response.text();
        let data;
        try {
            data = JSON.parse(textResponse);
        } catch(e) {
            data = { error: "Neplatný JSON od Foundry", raw: textResponse.substring(0, 200) };
        }
        
        context.res = {
            status: response.status,
            body: data
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: "Kritická chyba spojení (proxy)", details: error.message }
        };
    }
};
