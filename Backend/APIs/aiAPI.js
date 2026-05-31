import exp from 'express';
import Groq from 'groq-sdk';
import env from '../config/env.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { saveAiTripForUser } from '../utils/aiTripBuilder.js';

export const aiAPI = exp.Router();

const fallbackPayload = {
  summary: '',
  estimatedBudget: { hotel: 0, food: 0, transport: 0, activities: 0 },
  hotels: [],
  transport: [],
  food: [],
  tips: [],
  days: [],
};

function normalizeInterests(interests) {
  if (Array.isArray(interests)) return interests.map((item) => String(item).trim()).filter(Boolean);
  if (typeof interests === 'string') return interests.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function buildPrompt({ destination, budget, days, travelers, interests }) {
  return `You are a professional budget travel planner for group trips.

Create a realistic, practical, beginner-friendly travel itinerary.

Trip details:
- Destination: ${destination}
- Total budget: INR ${budget}
- Number of days: ${days}
- Number of travelers: ${travelers}
- Interests: ${interests.join(', ') || 'general sightseeing'}

Planning rules:
- Try to keep the full plan within the given total budget.
- If the budget is low, suggest cheaper alternatives.
- Include day-wise activities with realistic pacing.
- Include transport suggestions.
- Include tips to stay within budget.
- Keep activity descriptions concise.

Recommendation counts (required — do not return only one item per list):
- hotels: return exactly 5 different real or realistic places (mix of budget, mid-range, and best-value stays)
- food: return exactly 5 different restaurants, cafes, or local food spots
- transport: return 3 different transport options
- tips: return at least 4 practical budget tips

Each hotel and food entry must be a distinct place with a specific name and area in ${destination}.

Return ONLY valid JSON. Do not include markdown, comments, explanations, or code fences.

JSON shape:
{
  "summary": "short trip summary",
  "estimatedBudget": {
    "hotel": 0,
    "food": 0,
    "transport": 0,
    "activities": 0
  },
  "hotels": [
    { "name": "Hotel A", "area": "area name", "estimatedCost": "INR per night", "reason": "why choose it" },
    { "name": "Hotel B", "area": "area name", "estimatedCost": "INR per night", "reason": "why choose it" },
    { "name": "Hotel C", "area": "area name", "estimatedCost": "INR per night", "reason": "why choose it" },
    { "name": "Hotel D", "area": "area name", "estimatedCost": "INR per night", "reason": "why choose it" },
    { "name": "Hotel E", "area": "area name", "estimatedCost": "INR per night", "reason": "why choose it" }
  ],
  "transport": [
    { "mode": "", "estimatedCost": "", "tip": "" },
    { "mode": "", "estimatedCost": "", "tip": "" },
    { "mode": "", "estimatedCost": "", "tip": "" }
  ],
  "food": [
    { "name": "Place 1", "type": "cuisine", "estimatedCost": "INR per meal", "tip": "what to try" },
    { "name": "Place 2", "type": "cuisine", "estimatedCost": "INR per meal", "tip": "what to try" },
    { "name": "Place 3", "type": "cuisine", "estimatedCost": "INR per meal", "tip": "what to try" },
    { "name": "Place 4", "type": "cuisine", "estimatedCost": "INR per meal", "tip": "what to try" },
    { "name": "Place 5", "type": "cuisine", "estimatedCost": "INR per meal", "tip": "what to try" }
  ],
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "days": [
    {
      "day": 1,
      "title": "",
      "activities": [
        { "time": "", "name": "", "description": "", "estimatedCost": "" }
      ]
    }
  ]
}`;
}

function parseAiJson(text) {
  const cleaned = String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('AI response did not contain JSON');
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function normalizePayload(payload) {
  return {
    ...fallbackPayload,
    ...payload,
    estimatedBudget: {
      ...fallbackPayload.estimatedBudget,
      ...(payload?.estimatedBudget || {}),
    },
    hotels: Array.isArray(payload?.hotels) ? payload.hotels : [],
    transport: Array.isArray(payload?.transport) ? payload.transport : [],
    food: Array.isArray(payload?.food) ? payload.food : [],
    tips: Array.isArray(payload?.tips) ? payload.tips : [],
    days: Array.isArray(payload?.days) ? payload.days : [],
  };
}

const PLACEHOLDER_KEY_PATTERNS = [
  /^your[_-]?api[_-]?key[_-]?here$/i,
  /^replace[_-]?me$/i,
  /^changeme$/i,
  /^xxx+$/i,
  /^<.*>$/,
];

function isGroqApiKeyConfigured(key) {
  const trimmed = String(key || '').trim();
  if (!trimmed || trimmed.length < 20) return false;
  return !PLACEHOLDER_KEY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function getGroqKeySetupMessage() {
  return 'Set a valid GROQ_API_KEY in Backend/.env. Create one at https://console.groq.com/keys then restart the backend server.';
}

function getGroqErrorResponse(err) {
  const status = err?.status || err?.response?.status;
  const errorText = String(err?.message || err?.error?.message || '');

  if (status === 401 || /invalid api key|authentication/i.test(errorText)) {
    return {
      status: 503,
      body: {
        success: false,
        message: 'Groq API key is invalid',
        errors: [getGroqKeySetupMessage()],
      },
    };
  }

  if (status === 429 || /rate limit/i.test(errorText)) {
    return {
      status: 429,
      body: {
        success: false,
        message: 'Groq rate limit reached',
        errors: ['Please wait a moment and try again.'],
      },
    };
  }

  if (/JSON|parse|malformed/i.test(errorText)) {
    return {
      status: 502,
      body: {
        success: false,
        message: 'AI returned a malformed response',
        errors: ['Could not parse itinerary JSON. Please try again.'],
      },
    };
  }

  if (/ECONNREFUSED|ENOTFOUND|network|fetch failed|timeout/i.test(errorText)) {
    return {
      status: 503,
      body: {
        success: false,
        message: 'Could not reach Groq API',
        errors: ['Check your internet connection and try again.'],
      },
    };
  }

  return null;
}

aiAPI.post('/generate-itinerary', verifyToken, async (req, res) => {
  try {
    const destination = String(req.body.destination || '').trim();
    const budget = Number(req.body.budget || 0);
    const days = Number(req.body.days || 0);
    const travelers = Number(req.body.travelers || 0);
    const interests = normalizeInterests(req.body.interests);

    if (!destination || budget <= 0 || days <= 0 || travelers <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['destination, positive budget, positive days, and positive travelers are required'],
      });
    }

    if (!isGroqApiKeyConfigured(env.groqApiKey)) {
      return res.status(503).json({
        success: false,
        message: 'Groq API key is missing or still set to a placeholder',
        errors: [getGroqKeySetupMessage()],
      });
    }

    const groq = new Groq({ apiKey: env.groqApiKey });
    const model = env.aiModel || 'llama-3.3-70b-versatile';
    const prompt = buildPrompt({ destination, budget, days, travelers, interests });

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a travel planning assistant. Always return strict JSON only. Always include exactly 5 hotels and exactly 5 food recommendations with unique place names.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Groq returned an empty response');
    }

    const payload = normalizePayload(parseAiJson(text));

    res.status(200).json({
      success: true,
      message: 'AI itinerary generated',
      payload,
    });
  } catch (err) {
    const handled = getGroqErrorResponse(err);
    if (handled) {
      return res.status(handled.status).json(handled.body);
    }

    if (err instanceof SyntaxError) {
      return res.status(502).json({
        success: false,
        message: 'AI returned a malformed response',
        errors: ['Could not parse itinerary JSON. Please try again.'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error generating AI itinerary',
      error: err.message,
      errors: [],
    });
  }
});

aiAPI.post('/save-trip', verifyToken, async (req, res) => {
  try {
    const destination = String(req.body.destination || '').trim();
    const budget = Number(req.body.budget || 0);
    const days = Number(req.body.days || 0);
    const travelers = Number(req.body.travelers || 0);
    const interests = normalizeInterests(req.body.interests);
    const aiPlan = req.body.aiPlan;

    if (!destination || budget <= 0 || days <= 0 || travelers <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['destination, positive budget, positive days, and positive travelers are required'],
      });
    }

    if (!aiPlan || !Array.isArray(aiPlan.days)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: ['aiPlan with day-wise activities is required'],
      });
    }

    const trip = await saveAiTripForUser({
      userId: req.user.id,
      destination,
      budget,
      days,
      travelers,
      interests,
      aiPlan,
    });

    res.status(201).json({
      success: true,
      message: 'AI trip saved successfully',
      trip,
      tripId: trip._id,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error saving AI trip',
      error: err.message,
      errors: [],
    });
  }
});

export default aiAPI;
