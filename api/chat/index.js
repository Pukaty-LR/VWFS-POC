module.exports = async function (context, req) {
    // Upravený payload dle požadavku Azure Foundry
    const payload = {
        createResponseRequest: {
            messages: req.body.messages // Předáme zprávy tak, jak jdou z webu
        }
    };

    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "api-key": process.env.FOUNDRY_API_TOKEN, // Použijeme tvůj klíč
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload) // Odešleme správně zabalený objekt
    });

    const data = await response.json();
    context.res = {
        status: response.status,
        body: data
    };
};
