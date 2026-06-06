import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIClassification, IssueType } from "./types";

function extractBasicDetails(complaint: string) {
  const text = complaint.toLowerCase();

  let product_name = "";
  let color = "";
  let size = "";
  let section = "";

  if (text.includes("jeans")) {
    product_name = "Slim Fit Jeans";
  } else if (text.includes("t-shirt") || text.includes("tshirt")) {
    product_name = "Oversized T-Shirt";
  } else if (text.includes("shirt")) {
    product_name = "Cotton Shirt";
  }

  if (
    text.includes("jeans") ||
    text.includes("shirt") ||
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("mens")
  ) {
    section = "Mens Section";
  } else if (
    text.includes("dress") ||
    text.includes("saree") ||
    text.includes("kurti") ||
    text.includes("womens")
  ) {
    section = "Womens Section";
  } else if (text.includes("kids") || text.includes("children")) {
    section = "Kids Section";
  } else if (
    text.includes("grocery") ||
    text.includes("rice") ||
    text.includes("oil") ||
    text.includes("food")
  ) {
    section = "Grocery Section";
  } else if (
    text.includes("billing") ||
    text.includes("checkout") ||
    text.includes("queue") ||
    text.includes("counter")
  ) {
    section = "Billing Counter";
  } else if (text.includes("trial room") || text.includes("fitting room")) {
    section = "Trial Rooms";
  }

  const colors = ["black", "white", "blue", "red", "green", "grey", "gray"];
  const foundColor = colors.find((item) => text.includes(item));

  if (foundColor) {
    color = foundColor.charAt(0).toUpperCase() + foundColor.slice(1);
  }

  const sizeMatch =
    text.match(/size\s*([0-9]{2}|xs|s|m|l|xl|xxl)/i) ||
    text.match(/\b([0-9]{2})\b/);

  if (sizeMatch?.[1]) {
    size = sizeMatch[1].toUpperCase();
  }

  return {
    product_name,
    color,
    size,
    section,
  };
}

function detectPositiveFeedback(complaint: string) {
  const text = complaint.toLowerCase();

  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "awesome",
    "nice",
    "smooth",
    "helpful",
    "loved",
    "happy",
    "satisfied",
    "soo good",
    "so good",
    "very good",
    "best",
  ];

  const negativeWords = [
    "bad",
    "rude",
    "poor",
    "worst",
    "unavailable",
    "not available",
    "out of stock",
    "dirty",
    "waiting",
    "waited",
    "delay",
    "broken",
    "not working",
    "frustrating",
    "complaint",
    "ignored",
  ];

  const hasPositiveWord = positiveWords.some((word) => text.includes(word));
  const hasNegativeWord = negativeWords.some((word) => text.includes(word));

  return hasPositiveWord && !hasNegativeWord;
}

function detectPriorityIssue(complaint: string): IssueType | null {
  const text = complaint.toLowerCase();

  if (detectPositiveFeedback(complaint)) {
    return null;
  }

  const staffWords = [
    "rude",
    "ignored",
    "ignore",
    "bad behaviour",
    "bad behavior",
    "misbehaved",
    "misbehave",
    "not helpful",
    "no one helped",
    "staff did not help",
    "staff didn't help",
    "staff was rude",
    "employee was rude",
    "salesperson was rude",
    "attitude",
  ];

  if (staffWords.some((word) => text.includes(word))) {
    return "staff_issue";
  }

  const maintenanceWords = [
    "dirty",
    "unclean",
    "not clean",
    "trial room",
    "fitting room",
    "washroom",
    "broken",
    "not working",
    "ac not working",
    "air conditioning",
    "light not working",
    "smelly",
    "bad smell",
    "infrastructure",
  ];

  if (maintenanceWords.some((word) => text.includes(word))) {
    return "maintenance_issue";
  }

  const queueWords = [
    "queue",
    "billing queue",
    "long wait",
    "waited",
    "waiting",
    "billing took",
    "counter",
    "checkout took",
  ];

  if (queueWords.some((word) => text.includes(word))) {
    return "queue_issue";
  }

  const inventoryWords = [
    "unavailable",
    "not available",
    "out of stock",
    "could not find",
    "couldn't find",
    "did not have",
    "didn't have",
    "staff said it was unavailable",
    "size was unavailable",
    "size not available",
    "stock not available",
  ];

  if (inventoryWords.some((word) => text.includes(word))) {
    return "inventory_issue";
  }

  const pricingWords = [
    "wrong price",
    "price mismatch",
    "pricing issue",
    "discount not applied",
    "offer not applied",
    "overcharged",
    "charged extra",
  ];

  if (pricingWords.some((word) => text.includes(word))) {
    return "pricing_issue";
  }

  return null;
}

function fallbackClassify(complaint: string): AIClassification {
  const extracted = extractBasicDetails(complaint);
  const detectedIssue = detectPriorityIssue(complaint);
  const isPositive = detectPositiveFeedback(complaint);

  return {
    issue_type: isPositive ? "general_experience" : detectedIssue || "general_experience",
    sentiment: isPositive ? "positive" : detectedIssue ? "negative" : "neutral",
    product_name: extracted.product_name,
    color: extracted.color,
    size: extracted.size,
    section: extracted.section,
    claim_summary: complaint,
    confidence_score: isPositive ? 88 : detectedIssue ? 84 : 60,
  };
}

export async function classifyFeedback(params: {
  complaint: string;
  product_name?: string;
  color?: string;
  size?: string;
}): Promise<AIClassification> {
  const ruleBasedIssue = detectPriorityIssue(params.complaint);
  const fallbackDetails = extractBasicDetails(params.complaint);
  const ruleBasedPositive = detectPositiveFeedback(params.complaint);

  if (process.env.USE_MOCK_AI === "true" || !process.env.GEMINI_API_KEY) {
    return fallbackClassify(params.complaint);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an AI assistant inside StorePulse AI, an in-store retail experience verification engine.

Classify the customer's store visit feedback and extract the operational claim.

Return JSON only. Do not return markdown.

Allowed issue_type values:
inventory_issue, staff_issue, queue_issue, maintenance_issue, pricing_issue, general_experience, unknown

Allowed sentiment values:
positive, neutral, negative

Allowed section values:
Mens Section, Womens Section, Kids Section, Grocery Section, Billing Counter, Trial Rooms, Customer Service Desk, Store Office, Main Floor

Classification rules:
1. If feedback is positive praise, classify as general_experience and sentiment positive.
2. Do not create an operational issue just because a product, color, or size is mentioned.
3. Inventory issue should only be used when the customer says the product/size/color was unavailable, out of stock, not found, or staff said it was unavailable.
4. Staff issue should be used for rude staff, ignored customer, bad behaviour, or lack of help.
5. Maintenance issue should be used for dirty trial room, dirty fitting room, washroom issue, broken facility, AC issue, light issue, or cleanliness.
6. Queue issue should be used for billing delay, long queue, waiting, or counter delay.
7. Pricing issue should be used for wrong price, discount, offer, or billing price mismatch.
8. Extract the store section if possible. Use one of these values: Mens Section, Womens Section, Kids Section, Grocery Section, Billing Counter, Trial Rooms, Customer Service Desk, Store Office, Main Floor.

Important:
- Positive feedback should not become inventory_issue.
- Example: "I bought black jeans size 32 and the experience was good" must be general_experience with positive sentiment.
- Example: "I wanted black jeans size 32 but staff said it was unavailable" must be inventory_issue with negative sentiment.
- Extract product, color, size, and section if mentioned, even if the issue type is general_experience.

Return this exact JSON shape:
{
  "issue_type": "",
  "sentiment": "",
  "product_name": "",
  "color": "",
  "size": "",
  "section": "",
  "store_hint": "",
  "claim_summary": "",
  "confidence_score": 0
}

Customer complaint:
${params.complaint}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned) as AIClassification;

    const finalSentiment = ruleBasedPositive
      ? "positive"
      : parsed.sentiment || "neutral";

    const finalIssueType =
      finalSentiment === "positive"
        ? "general_experience"
        : ruleBasedIssue || parsed.issue_type || "unknown";

    return {
      issue_type: finalIssueType,
      sentiment: finalSentiment,
      product_name: parsed.product_name || fallbackDetails.product_name,
      color: parsed.color || fallbackDetails.color,
      size: parsed.size || fallbackDetails.size,
      section: parsed.section || fallbackDetails.section || "",
      store_hint: parsed.store_hint || "",
      claim_summary: parsed.claim_summary || params.complaint,
      confidence_score: Number(parsed.confidence_score || 80),
    };
  } catch (error) {
    console.error("Gemini classification failed:", error);
    return fallbackClassify(params.complaint);
  }
}