module.exports = async function (context, req) {
    const user = req.headers['x-ms-client-principal'];
    
    // Pokud není uživatel přihlášen, vrátíme chybu
    if (!user) {
        context.res = { status: 401, body: "Nepřihlášen" };
        return;
    }

    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + process.env.FOUNDRY_API_TOKEN,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
    });

    context.res = {
        status: response.status,
        body: await response.json()
    };
};
