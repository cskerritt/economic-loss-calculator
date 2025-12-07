import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CaseContext {
  plaintiff?: string;
  gender?: string;
  dob?: string;
  dateOfInjury?: string;
  occupation?: string;
  baseEarnings?: number;
  residualEarnings?: number;
  wle?: number;
  medicalSummary?: string;
  employmentHistory?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, caseContext, field, userQuestion } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "generate_narrative") {
      systemPrompt = `You are an expert forensic economist assistant helping prepare economic loss reports for personal injury cases. Generate professional, formal narrative text suitable for court documents and expert reports.

Guidelines:
- Use third-person language (refer to plaintiff by name or as "the plaintiff")
- Be factual and objective
- Use proper legal/economic terminology
- Keep narratives concise but comprehensive
- Format as professional prose paragraphs`;

      const fieldPrompts: Record<string, string> = {
        medicalSummary: `Generate a medical summary narrative based on this case context. Focus on describing injuries, treatment received, and ongoing medical needs. Be formal and suitable for an economic loss report.`,
        employmentHistory: `Generate an employment history narrative. Describe the plaintiff's work history, career progression, and relevant job skills. Be formal and suitable for an economic loss report.`,
        earningsHistory: `Generate an earnings history narrative. Describe the plaintiff's historical earnings, income sources, and documentation. Be formal and suitable for an economic loss report.`,
        preInjuryCapacity: `Generate a pre-injury earning capacity narrative. Describe the plaintiff's earning potential before the injury, including skills, experience, and career trajectory. Be formal and suitable for an economic loss report.`,
        postInjuryCapacity: `Generate a post-injury residual earning capacity narrative. Describe the plaintiff's remaining work capabilities and earning potential after the injury. Be formal and suitable for an economic loss report.`,
        functionalLimitations: `Generate a functional limitations narrative. Describe how the plaintiff's injuries affect their ability to work and their future employability. Be formal and suitable for an economic loss report.`,
      };

      userPrompt = `${fieldPrompts[field] || "Generate a professional narrative for this case."}

Case Context:
- Plaintiff: ${caseContext?.plaintiff || "Not specified"}
- Gender: ${caseContext?.gender || "Not specified"}
- Date of Birth: ${caseContext?.dob || "Not specified"}
- Date of Injury: ${caseContext?.dateOfInjury || "Not specified"}
- Pre-Injury Earnings: ${caseContext?.baseEarnings ? `$${caseContext.baseEarnings.toLocaleString()}` : "Not specified"}
- Post-Injury Earnings: ${caseContext?.residualEarnings ? `$${caseContext.residualEarnings.toLocaleString()}` : "Not specified"}
- Work Life Expectancy: ${caseContext?.wle ? `${caseContext.wle} years` : "Not specified"}
${caseContext?.medicalSummary ? `\nExisting Medical Info: ${caseContext.medicalSummary}` : ""}
${caseContext?.employmentHistory ? `\nExisting Employment Info: ${caseContext.employmentHistory}` : ""}

Generate a 2-3 paragraph professional narrative for the ${field.replace(/([A-Z])/g, " $1").toLowerCase()} section.`;

    } else if (type === "assistant") {
      systemPrompt = `You are an expert forensic economics assistant helping users understand economic concepts and fill out case information for personal injury damage calculations.

Your expertise includes:
- Economic loss calculations (lost wages, earning capacity)
- Present value calculations and discount rates
- Work life expectancy tables and methodology
- Fringe benefits and total compensation
- Life care plan costs
- Household services valuation
- Tax considerations in damage calculations

Guidelines:
- Provide clear, educational explanations
- Use examples when helpful
- Reference standard methodologies (e.g., Skoog-Ciecka tables, BLS data)
- Be helpful but note when users should consult with qualified experts
- Keep responses focused and practical`;

      userPrompt = userQuestion || "How can I help you with the economic analysis?";
    } else {
      throw new Error("Invalid request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
