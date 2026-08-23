const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return response.status(503).json({
      error: "Nimbus AI is not configured. Set OPENAI_API_KEY on the server."
    });
  }

  const { message, context = {} } = request.body || {};
  if (!message || typeof message !== "string") {
    return response.status(400).json({ error: "A message is required." });
  }

  const limitedContext = {
    tasks: Array.isArray(context.tasks) ? context.tasks.slice(0, 20) : undefined,
    habits: Array.isArray(context.habits) ? context.habits.slice(0, 20) : undefined,
    goals: Array.isArray(context.goals) ? context.goals.slice(0, 10) : undefined,
    calendarEvents: context.calendarEvents || undefined,
    currentNote: context.currentNote || undefined
  };

  try {
    const aiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Nimbus, Cloud Notes' friendly productivity assistant. Be concise, warm, practical, and use the provided user context only when relevant. Do not claim to access data that was not provided."
          },
          {
            role: "user",
            content: `User message: ${message}\n\nRelevant Cloud Notes context (minimized): ${JSON.stringify(limitedContext)}`
          }
        ],
        temperature: 0.6,
        max_tokens: 450
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return response.status(aiResponse.status).json({ error: errorText });
    }

    const data = await aiResponse.json();
    return response.status(200).json({ reply: data.choices?.[0]?.message?.content || "I'm here to help. ☁️" });
  } catch (error) {
    console.error("Nimbus AI request failed", error);
    return response.status(500).json({ error: "Nimbus AI request failed." });
  }
}
