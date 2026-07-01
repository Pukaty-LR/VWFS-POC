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

        // Tady se dozvíme pravdu
        const responseText = await response.text(); 
        context.res = { 
            status: 200, 
            body: { response: "Azure odpověděl: " + response.status + " | " + responseText } 
        };
    } catch (error) {
        context.res = { status: 200, body: { response: "Chyba kódu: " + error.message } };
    }
};
