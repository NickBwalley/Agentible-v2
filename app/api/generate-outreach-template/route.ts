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

    const systemPrompt = `You are a cold outreach email expert. Generate a cold email with TWO separate parts:

1) SUBJECT LINE (one line): A short, dynamic subject. Use ONLY these placeholders: ${ALLOWED_PLACEHOLDERS}. No other variables.

2) EMAIL BODY: Start directly with the greeting (e.g. Hi {{firstName}},). Do NOT write "Subject:" or repeat the subject inside the body. The body is only the email content.

Use ONLY these exact placeholders in both subject and body, no others: ${ALLOWED_PLACEHOLDERS}.
- {{firstName}} = recipient's first name
- {{org_name}} = recipient's company/organization name
- {{yourName}} = sender's name (to be filled later)
Keep the email concise (3-5 short paragraphs max). Blend the prospect's problems with the solution and offer.`;

    const userPrompt = `Problems & pain-points the sender wants to address:\n${icpDescription}\n\nSolution & offer (how they help, proof, CTA):\n${offerDescription}\n\nSample of leads (use this to match tone and relevance to org_name/org_description):\n${JSON.stringify(sample)}\n\nGenerate one cold email. You MUST respond in this exact format:\nSubject: <your subject line with optional {{firstName}}, {{org_name}}, {{yourName}}>\n\n<email body starting with Hi {{firstName}}, and no "Subject:" line inside the body>`;

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
    const raw =
      data.choices?.[0]?.message?.content?.trim() ??
      `Hi {{firstName}},\n\nI noticed {{org_name}} and thought you might be interested in our solution.\n\nBest,\n{{yourName}}`;

    // Split "Subject: ...\n\n<body>" so subject goes to subject field and body has no "Subject:" line
    const subjectMatch = raw.match(/^Subject:\s*(.+?)(?:\r?\n\r?\n)([\s\S]*)/im);
    let subject: string | undefined;
    let template: string;
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      template = subjectMatch[2].trim();
      // Remove any stray "Subject: ..." line at the start of the body
      template = template.replace(/^Subject:\s*.+(\r?\n)?/im, "").trim();
    } else {
      template = raw.replace(/^Subject:\s*.+(\r?\n)?/im, "").trim() || raw;
    }

    return NextResponse.json({ subject, template });
  } catch (e) {
    console.error("generate-outreach-template error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
