module.exports = async function (context, req) {
    // 1. Očekáváme hlavičku Authorization s Bearer tokenem z frontendu
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        context.res = { status: 401, body: { error: "Ověření selhalo. Chybí platný Bearer token." } };
        return;
    }

    const userMessage = req.body?.messages?.[0]?.content;
    if (!userMessage) {
        context.res = { status: 400, body: { error: "Zpráva je prázdná." } };
        return;
    }

    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";
    const payload = { createResponseRequest: { messages: [{ role: "user", content: userMessage }] } };

    try {
        // 2. Odeslání dotazu s Bearer tokenem (Nahrazujeme starý api-key)
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": authHeader, // Zde posíláme identitu uživatele do Foundry
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const textResponse = await response.text();
        
        if (!response.ok) {
            context.res = { status: 200, body: { error: `AZURE ODMÍTL DOTAZ: ${textResponse}` } };
            return;
        }

        context.res = { status: 200, body: JSON.parse(textResponse) };
    } catch (error) {
        context.res = { status: 500, body: { error: `Kritická chyba sítě: ${error.message}` } };
    }
};
