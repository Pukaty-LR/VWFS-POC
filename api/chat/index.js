module.exports = async function (context, req) {
    // 1. Identita uživatele je automaticky v hlavičce 'x-ms-client-principal'
    // Tuto hlavičku Azure SWA automaticky vyplní po úspěšném přihlášení
    const clientPrincipal = req.headers['x-ms-client-principal'];
    
    if (!clientPrincipal) {
        context.res = { status: 401, body: "Uživatel není přihlášen" };
        return;
    }

    // 2. Volání Foundry přes autorizovanou proxy
    // POZOR: V tomto případě předáváš požadavek dál pod identitou aplikace, 
    // která je vázána na tvoje předplatné.
    const url = "https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/VWFS-POC-Agent1/endpoint/protocols/openai/responses?api-version=2025-11-15-preview";
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // ZDE se místo API klíče použije autorizace založená na identitě 
            // (vyžaduje, aby Azure SWA měla zapnutou "Managed Identity")
            "Authorization": "Bearer " + process.env.ACCESS_TOKEN_BEARER 
        },
        body: JSON.stringify(req.body)
    });

    context.res = {
        status: response.status,
        body: await response.json()
    };
};
