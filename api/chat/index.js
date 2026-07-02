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
            // Formát přesně podle Responses API
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
            // Extrakce přesně podle tvé dokumentace (ResponseOutputMessage -> content -> text)
            if (data?.output?.content && Array.isArray(data.output.content)) {
                const textItem = data.output.content.find(item => item.text || item.type === "output_text");
                if (textItem && textItem.text) {
                    reply = textItem.text;
                } else {
                    reply = JSON.stringify(data.output.content); // Nouzové vypsání
                }
            } 
            // Fallback na starý formát (pro jistotu)
            else if (data?.choices?.[0]?.message?.content) {
                reply = data.choices[0].message.content;
            } 
            // Pokud nic nesedí, pošleme kompletní JSON jako string
            else {
                reply = JSON.stringify(data, null, 2);
            }
        } else {
            reply = `Zamítnuto agentem ${response.status}: ` + JSON.stringify(data);
        }

        // Zásadní: Vždy odesíláme čistý String, aby frontend nespadl
        context.res = { 
            status: 200, 
            body: { response: String(reply) } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba backendu: " + error.message } };
    }
};
