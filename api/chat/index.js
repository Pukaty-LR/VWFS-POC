module.exports = async function (context, req) {
    const authHeader = req.headers["x-custom-auth"];
    // Přijímáme celou historii konverzace, ne jen jednu zprávu!
    const messages = req.body?.messages || []; 
    // Přijímáme ID agenta (Knowledge Base), výchozí je Octavia
    const agentId = req.body?.agentId || "VWFS-POC-Agent1"; 

    if (!authHeader) {
        context.res = { status: 401, body: { response: "Chyba: Token se z frontendu nepřenesl." } };
        return;
    }

    if (messages.length === 0) {
        context.res = { status: 400, body: { response: "Chyba: Prázdná konverzace." } };
        return;
    }

    // URL se dynamicky mění podle toho, jakého agenta uživatel vybral v UI
    const url = `https://vwfs-poc.services.ai.azure.com/api/projects/vwfs-poc/agents/${agentId}/endpoint/protocols/openai/responses?api-version=2025-11-15-preview`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
            },
            // Posíláme celou historii (pole zpráv) pro udržení kontextu
            body: JSON.stringify({ input: messages }) 
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
        let reasoningText = "";
        let usageData = null;

        if (response.ok) {
            if (data?.output && Array.isArray(data.output)) {
                const assistantMsg = data.output.find(item => item.type === "message" && item.role === "assistant");
                if (assistantMsg && assistantMsg.content && Array.isArray(assistantMsg.content)) {
                    const textItem = assistantMsg.content.find(c => c.type === "output_text" || c.text);
                    if (textItem && textItem.text) reply = textItem.text;
                }

                const reasoningItem = data.output.find(item => item.type === "reasoning");
                if (reasoningItem) {
                    if (reasoningItem.summary?.[0]?.text) reasoningText = reasoningItem.summary[0].text;
                    else if (reasoningItem.content?.[0]?.text) reasoningText = reasoningItem.content[0].text;
                }
            } else if (data?.choices?.[0]?.message?.content) {
                reply = data.choices[0].message.content;
            }

            if (data?.usage) usageData = data.usage;

        } else {
            reply = `Zamítnuto agentem ${response.status}: ` + JSON.stringify(data);
        }

        context.res = { 
            status: 200, 
            body: { 
                response: String(reply),
                reasoning: reasoningText,
                usage: usageData
            } 
        };
    } catch (error) {
        context.res = { status: 500, body: { response: "Kritická chyba backendu: " + error.message } };
    }
};
