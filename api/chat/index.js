const { AIProjectClient } = require("@azure/ai-projects");

module.exports = async function (context, req) {
    if (!req.body || !req.body.messages || req.body.messages.length === 0) {
        context.res = { status: 400, body: { error: "Chybí zpráva" } };
        return;
    }

    const userMessage = req.body.messages[0].content;
    const connectionString = process.env.FOUNDRY_CONN_STRING;
    const agentId = process.env.AGENT_ID;

    if (!connectionString || !agentId) {
        context.res = { status: 500, body: { error: "Chybí konfigurace na serveru (proměnné prostředí)." } };
        return;
    }

    try {
        // Připojení k Foundry projektu
        const client = AIProjectClient.fromConnectionString(connectionString);

        // 1. Vytvoření komunikačního vlákna
        const thread = await client.agents.createThread();

        // 2. Vložení tvé zprávy do vlákna
        await client.agents.createMessage(thread.id, {
            role: "user",
            content: userMessage
        });

        // 3. Spuštění Agenta
        let run = await client.agents.createRun(thread.id, {
            assistantId: agentId
        });

        // 4. Čekáme, dokud agent nedopřemýšlí (Polling)
        while (run.status === "queued" || run.status === "in_progress") {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Počkáme 1 sekundu
            run = await client.agents.getRun(thread.id, run.id);
        }

        if (run.status !== "completed") {
            context.res = { status: 500, body: { error: `Agent selhal se statusem: ${run.status}` } };
            return;
        }

        // 5. Stažení výsledné odpovědi
        const messages = await client.agents.listMessages(thread.id);
        
        // Zprávy jsou seřazené od nejnovější, vezmeme tu první od asistenta
        const agentResponse = messages.data.find(m => m.role === 'assistant').content[0].text.value;

        context.res = {
            status: 200,
            body: { response: agentResponse } // Vracíme čistý text na frontend
        };

    } catch (error) {
        context.res = {
            status: 500,
            body: { error: "Chyba komunikace s Foundry SDK", details: error.message }
        };
    }
};
