/**
 * geminiReport.js
 * Generate clinical report using Gemini AI API or fast local fallback format
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateClinicalReport(analysisData) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    // Return formatted deterministic report if no API key is provided
    return formatFallbackReport(analysisData);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Act as an expert ophthalmologist. 
Analyze this raw Diabetic Retinopathy screening data and generate a concise 3-line clinical report.
Data:
- ICDR Level: ${analysisData.level} (${analysisData.icdr_name || 'Level ' + analysisData.level})
- Quality: ${analysisData.quality || 'Gradeable'}
- Microaneurysms: ${analysisData.ma_count || 0}
- Exudate Area: ${analysisData.exudate_area_pct || 0}%
- Hemorrhages: ${analysisData.hemorrhage_count || 0}
- Neovascularization: ${analysisData.neovascularization ? 'YES' : 'NO'}
- Recommended Action: ${analysisData.action || 'Screening'}

Format strictly:
Line 1: Severity level and key lesion findings.
Line 2: Clinical implications & referable status.
Line 3: Immediate recommended treatment/referral action.
Keep total length under 60 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.warn("AI API Error, returning formatted clinical summary:", error);
    return formatFallbackReport(analysisData);
  }
}

function formatFallbackReport(data) {
  const level = data.level !== undefined ? data.level : 0;
  const lesions = data.lesions || "Microaneurysms, Hard Exudates";
  const action = data.action || (level >= 2 ? "Refer to ophthalmologist within 4 weeks." : "Annual screening.");

  return `• ICDR Level ${level}: ${lesions}.
• Clinical Implication: ${level >= 2 ? "Referable Diabetic Retinopathy (Level 2+) requiring clinical intervention." : "Non-referable DR. Baseline monitoring recommended."}
• Action Plan: ${action}`;
}