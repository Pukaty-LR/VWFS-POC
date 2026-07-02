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
        
        let reply = "AI nevygenerovalo žádný text.";

        if (response.ok) {
            // Přesná extrakce na základě tvého reálného JSON payloadu
            if (data?.output && Array.isArray(data.output)) {
                // 1. Najdeme objekt, který je typu "message" a role "assistant"
                const assistantMsg = data.output.find(item => item.type === "message" && item.role === "assistant");
                
                if (assistantMsg && assistantMsg.content && Array.isArray(assistantMsg.content)) {
                    // 2. Uvnitř najdeme samotný text
                    const textItem = assistantMsg.content.find(c => c.type === "output_text" || c.text);
                    if (textItem && textItem.text) {
                        reply = textItem.text;
                    }
                }
            } 
            // Fallback pro jistotu
            if (reply === "AI nevygenerovalo žádný text." && data?.choices?.[0]?.message?.content) {
                reply = data.choices[0].message.content;
            }
        } else {
            reply = `Zamítnuto agentem ${response.status}: ` + JSON.stringify(data);
        }

        context.res = { 
            status: 200, 
            body: { response: String(reply) } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba backendu: " + error.message } };
    }
};
