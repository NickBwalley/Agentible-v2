import { NextResponse } from "next/server";

const ALLOWED_PLACEHOLDERS = "{{firstName}}, {{org_name}}, {{yourName}}";

type SampleLead = {
  full_name?: string | null;
  position?: string | null;
  org_name?: string | null;
  org_description?: string | null;
};

type Body = {
  icpDescription: string;
  offerDescription: string;
  sampleLeads: SampleLead[];
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Body;
    const {
      icpDescription = "",
      offerDescription = "",
      sampleLeads = [],
    } = body;

    const sample = sampleLeads.slice(0, 5).map((l) => ({
      full_name: l.full_name ?? null,
      position: l.position ?? null,
      org_name: l.org_name ?? null,
      org_description: l.org_description ?? null,
    }));

    const systemPrompt = `You are a cold outreach email expert. Generate a single short cold email template that will be personalized per recipient.
Use ONLY these exact placeholders, no others: ${ALLOWED_PLACEHOLDERS}.
- {{firstName}} = recipient's first name
- {{org_name}} = recipient's company/organization name
- {{yourName}} = sender's name (to be filled later)
Do not use any other placeholders or variables. Keep the email concise (3-5 short paragraphs max).
Blend the prospect's problems/pain-points with the solution and offer so the email feels relevant and valuable.`;

    const userPrompt = `Problems & pain-points the sender wants to address:\n${icpDescription}\n\nSolution & offer (how they help, proof, CTA):\n${offerDescription}\n\nSample of leads (use this to match tone and relevance to org_name/org_description):\n${JSON.stringify(sample)}\n\nGenerate one cold email template that mixes the problem and solution naturally. Use only {{firstName}}, {{org_name}}, and {{yourName}}.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "LLM request failed", details: err },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const template =
      data.choices?.[0]?.message?.content?.trim() ??
      `Hi {{firstName}},\n\nI noticed {{org_name}} and thought you might be interested in our solution.\n\nBest,\n{{yourName}}`;

    return NextResponse.json({ template });
  } catch (e) {
    console.error("generate-outreach-template error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
