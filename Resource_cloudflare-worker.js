// CLOUFLARE WORKER SCRIPT- EDITED

export default {
  async fetch(request, env) {
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const apiKey = env.OPENAI_API_KEY;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    let userInput = {};
    try {
      userInput = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing JSON body" }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const requestBody = {
      model: "gpt-4o",
      messages: userInput.messages || [],
      max_tokens: 800,
      temperature: 0.5,
      frequency_penalty: 0.8,
    };

    let data;
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      data = await response.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
