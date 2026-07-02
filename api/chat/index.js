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
        let reasoningText = "";
        let usageData = null;

        if (response.ok) {
            // Extrakce textu
            if (data?.output && Array.isArray(data.output)) {
                const assistantMsg = data.output.find(item => item.type === "message" && item.role === "assistant");
                if (assistantMsg && assistantMsg.content && Array.isArray(assistantMsg.content)) {
                    const textItem = assistantMsg.content.find(c => c.type === "output_text" || c.text);
                    if (textItem && textItem.text) reply = textItem.text;
                }

                // Extrakce Chain of Thought (Myšlenkové pochody)
                const reasoningItem = data.output.find(item => item.type === "reasoning");
                if (reasoningItem) {
                    if (reasoningItem.summary?.[0]?.text) reasoningText = reasoningItem.summary[0].text;
                    else if (reasoningItem.content?.[0]?.text) reasoningText = reasoningItem.content[0].text;
                }
            } else if (data?.choices?.[0]?.message?.content) {
                reply = data.choices[0].message.content;
            }

            // Extrakce spotřeby tokenů
            if (data?.usage) usageData = data.usage;

        } else {
            reply = `Zamítnuto agentem ${response.status}: ` + JSON.stringify(data);
        }

        // Posíláme na frontend rozšířený payload!
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
