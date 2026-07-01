module.exports = async function (context, req) {
    let userMessage = "test";
    if (req.body && req.body.messages && req.body.messages.length > 0) {
        userMessage = req.body.messages[0].content;
    }

    const connString = process.env.FOUNDRY_CONN_STRING || "";
    const match = connString.match(/key=([^;]+)/);
    const apiKey = match ? match[1] : null;

    if (!apiKey) {
        context.res = { status: 200, body: { error: "Nenašel jsem klíč. Zkontroluj FOUNDRY_CONN_STRING." } };
        return;
    }

    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";
    
    const payload = {
        createResponseRequest: {
            messages: [{ role: "user", content: userMessage }]
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const textResponse = await response.text();
        
        // Pokud Azure vrátí chybu (např. 400 Bad Request), narveme ji do textu, ať ji web 100% ukáže
        if (!response.ok) {
            context.res = { 
                status: 200, // Schválně posíláme 200, aby to náš web přijal a nevyhodil obecnou chybu
                body: { error: `AZURE ODMÍTL DOTAZ: ${textResponse}` } 
            };
            return;
        }

        context.res = {
            status: 200,
            body: JSON.parse(textResponse)
        };
    } catch (error) {
        context.res = {
            status: 200,
            body: { error: `Kritická chyba: ${error.message}` }
        };
    }
};
