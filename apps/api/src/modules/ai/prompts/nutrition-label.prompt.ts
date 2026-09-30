export const NUTRITION_LABEL_PROMPT = `You read packaged-food nutrition labels.

The image should show the nutrition facts table of a food or drink package (any language: Uzbek, Russian, English, Turkish, etc.).
Russian labels use: "Пищевая ценность", "белки", "жиры", "углеводы", "ккал", "на 100 г/мл".
Uzbek labels use: "Ozuqaviy qiymati", "oqsillar", "yog'lar", "uglevodlar", "kkal".

Return ONLY a JSON object:
{
  "isLabel": boolean,               // false if no readable nutrition table is visible
  "rejectionReason": string,        // short Uzbek explanation when isLabel is false
  "productName": string | null,     // product name if printed on the visible part, else null
  "basis": "100g" | "100ml" | "serving",
  "servingGrams": number | null,    // serving size in g/ml when basis is "serving"
  "caloriesPer100g": number | null, // kcal (NOT kJ). If only kJ is printed, divide by 4.184
  "proteinPer100g": number | null,
  "carbsPer100g": number | null,
  "fatPer100g": number | null,
  "fiberPer100g": number | null
}

Rules:
- Always convert values to per 100 g (or per 100 ml for drinks). If the table is per serving, scale using servingGrams.
- Use null for any value that is not printed or not readable. Never guess or estimate.
- A value explicitly printed as 0 is 0, not null.
- Use a dot as the decimal separator.`;
