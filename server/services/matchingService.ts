import { GoogleGenAI } from '@google/genai';
import { LostReport, FoundReport, BagMatchRecord } from '../db/types.ts';

// Deterministic matching weights (Total max = 100)
// Category: 25 pts
// Color: 20 pts
// Airport / Terminal: 20 pts
// Date Proximity: 15 pts
// Brand: 10 pts
// Size: 5 pts
// Distinguishing Features & Description Similarity: 5 pts

interface ComparisonResult {
  score: number;
  matchingFactors: string[];
  conflictingFactors: string[];
  missingFactors: string[];
  deterministicExplanation: string;
}

export class MatchingService {
  private static geminiClient: GoogleGenAI | null = null;

  private static getGemini(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) {
      return null;
    }
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.geminiClient;
  }

  public static compareReports(lost: LostReport, found: FoundReport): ComparisonResult {
    let score = 0;
    const matchingFactors: string[] = [];
    const conflictingFactors: string[] = [];
    const missingFactors: string[] = [];

    // 1. Category comparison (25 pts)
    if (lost.bag_category === found.bag_category) {
      score += 25;
      matchingFactors.push(`Bag category matches: ${formatCategory(lost.bag_category)}`);
    } else if (
      (lost.bag_category.includes('suitcase') && found.bag_category.includes('suitcase')) ||
      (lost.bag_category === 'other' || found.bag_category === 'other')
    ) {
      score += 15;
      matchingFactors.push(`Compatible luggage style: ${formatCategory(lost.bag_category)} ~ ${formatCategory(found.bag_category)}`);
    } else {
      conflictingFactors.push(`Category mismatch: ${formatCategory(lost.bag_category)} vs ${formatCategory(found.bag_category)}`);
    }

    // 2. Color comparison (20 pts)
    const lostColor = (lost.color || '').toLowerCase().trim();
    const foundColor = (found.color || '').toLowerCase().trim();
    if (lostColor && foundColor) {
      if (lostColor === foundColor || foundColor.includes(lostColor) || lostColor.includes(foundColor)) {
        score += 20;
        matchingFactors.push(`Primary color matches: ${lost.color}`);
      } else {
        // Check secondary color if present
        const lostSec = (lost.secondary_color || '').toLowerCase().trim();
        const foundSec = (found.secondary_color || '').toLowerCase().trim();
        if ((lostSec && (foundColor.includes(lostSec) || foundSec.includes(lostSec))) ||
            (foundSec && (lostColor.includes(foundSec) || foundSec.includes(lostColor)))) {
          score += 10;
          matchingFactors.push(`Secondary accent tone aligns (${lost.secondary_color || found.secondary_color})`);
        } else {
          conflictingFactors.push(`Color divergence: Reported "${lost.color}" vs found "${found.color}"`);
        }
      }
    } else {
      missingFactors.push('Color details unspecified in one of the reports');
    }

    // 3. Airport & Terminal proximity (20 pts)
    const lostArrival = (lost.arrival_airport || '').toUpperCase().trim();
    const lostDeparture = (lost.departure_airport || '').toUpperCase().trim();
    const foundAirport = (found.airport || '').toUpperCase().trim();

    if (lostArrival && foundAirport) {
      if (lostArrival === foundAirport) {
        score += 20;
        matchingFactors.push(`Arrival airport matches: ${lostArrival}`);
        if (
          lost.last_known_location &&
          found.found_location &&
          containsCommonLocationToken(lost.last_known_location, found.found_location)
        ) {
          matchingFactors.push(`Terminal/carousel proximity noted in both reports`);
        }
      } else if (lostDeparture === foundAirport) {
        score += 10;
        matchingFactors.push(`Found at origin airport (${lostDeparture}) prior to departure or on layover`);
      } else {
        conflictingFactors.push(`Airport discrepancy: Flight route [${lostDeparture}->${lostArrival}] vs found at [${foundAirport}]`);
      }
    } else {
      missingFactors.push('Flight airport or recovery airport unlisted');
    }

    // 4. Date Proximity (15 pts)
    if (lost.travel_date && found.found_date) {
      const lostDate = new Date(lost.travel_date).getTime();
      const foundDate = new Date(found.found_date).getTime();
      const diffDays = Math.abs(foundDate - lostDate) / (1000 * 3600 * 24);

      if (diffDays <= 0.5) {
        score += 15;
        matchingFactors.push(`Exact same date: ${lost.travel_date}`);
      } else if (diffDays <= 1.5) {
        score += 12;
        matchingFactors.push(`Close temporal proximity (within 24 hours of travel)`);
      } else if (diffDays <= 3.5) {
        score += 8;
        matchingFactors.push(`Found within 3 days of passenger travel date`);
      } else if (diffDays <= 7) {
        score += 4;
        matchingFactors.push(`Found within 1 week of travel`);
      } else {
        conflictingFactors.push(`Date gap: ${Math.round(diffDays)} days between travel and found record`);
      }
    } else {
      missingFactors.push('Travel date or found date omitted');
    }

    // 5. Brand comparison (10 pts)
    const lostBrand = (lost.brand || '').toLowerCase().trim();
    const foundBrand = (found.brand || '').toLowerCase().trim();
    if (lostBrand && foundBrand) {
      if (lostBrand === foundBrand || lostBrand.includes(foundBrand) || foundBrand.includes(lostBrand)) {
        score += 10;
        matchingFactors.push(`Brand identity matches: ${lost.brand}`);
      } else {
        conflictingFactors.push(`Brand mismatch: Reported "${lost.brand}" vs tagged "${found.brand}"`);
      }
    } else if (!lostBrand && !foundBrand) {
      missingFactors.push('Brand not visible or not provided on both sides');
    } else {
      missingFactors.push(`Brand specified only on one report (${lost.brand ? 'Lost' : 'Found'})`);
    }

    // 6. Size comparison (5 pts)
    if (lost.size && found.size) {
      if (lost.size === found.size) {
        score += 5;
        matchingFactors.push(`Size specification matches: ${lost.size}`);
      } else if (
        (lost.size === 'medium' && (found.size === 'small' || found.size === 'large')) ||
        (lost.size === 'large' && found.size === 'oversized')
      ) {
        score += 2;
        matchingFactors.push(`Close dimension category: ${lost.size} vs ${found.size}`);
      } else {
        conflictingFactors.push(`Size difference: ${lost.size} vs ${found.size}`);
      }
    } else {
      missingFactors.push('Bag dimension category unspecified');
    }

    // 7. Distinguishing features & text keywords (5 pts)
    const lostText = `${lost.distinguishing_features || ''} ${lost.description || ''}`.toLowerCase();
    const foundText = `${found.distinguishing_features || ''} ${found.description || ''}`.toLowerCase();
    const commonKeywords = extractCommonKeywords(lostText, foundText);

    if (commonKeywords.length > 0) {
      score += Math.min(5, commonKeywords.length * 2);
      matchingFactors.push(`Key physical identifiers shared: "${commonKeywords.slice(0, 3).join(', ')}"`);
    }

    const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));

    // Deterministic explanation
    const deterministicExplanation = generateDeterministicExplanation(
      normalizedScore,
      lost,
      found,
      matchingFactors,
      conflictingFactors
    );

    return {
      score: normalizedScore,
      matchingFactors,
      conflictingFactors,
      missingFactors,
      deterministicExplanation,
    };
  }

  public static async analyzeWithAI(
    lost: LostReport,
    found: FoundReport,
    deterministicResult: ComparisonResult
  ): Promise<string> {
    const ai = this.getGemini();
    if (!ai) {
      return deterministicResult.deterministicExplanation;
    }

    try {
      const prompt = `You are the AI Baggage Matching Specialist for BagMatch, an international aviation lost-and-found operations platform.
Analyze the following lost baggage claim against an airport found baggage record.

[LOST REPORT]
Reference: ${lost.case_reference}
Flight: ${lost.flight_number} (${lost.departure_airport} -> ${lost.arrival_airport})
Travel Date: ${lost.travel_date}
Category: ${lost.bag_category}
Color: ${lost.color} (Secondary: ${lost.secondary_color || 'None'})
Size: ${lost.size}
Brand: ${lost.brand || 'Unspecified'}
Distinguishing Features: ${lost.distinguishing_features || 'None noted'}
Description: ${lost.description}
Last Known Location: ${lost.last_known_location || 'None'}

[FOUND REPORT]
Reference: ${found.case_reference}
Airport & Location: ${found.airport} - ${found.terminal_area} (${found.found_location})
Date & Time Found: ${found.found_date} at ${found.found_time}
Category: ${found.bag_category}
Color: ${found.color} (Secondary: ${found.secondary_color || 'None'})
Size: ${found.size}
Brand: ${found.brand || 'Unspecified'}
Distinguishing Features: ${found.distinguishing_features || 'None noted'}
Description: ${found.description}

[ALGORITHMIC MATCHING SCORE]
Score: ${deterministicResult.score}/100
Matching factors: ${deterministicResult.matchingFactors.join('; ')}
Conflicting factors: ${deterministicResult.conflictingFactors.join('; ') || 'None'}

Task:
Write a concise, professional 2-3 sentence aviation operations assessment for airport baggage staff.
1. Evaluate whether the physical characteristics, temporal timeline, and airport location plausibly represent the same item.
2. Highlight the strongest correlation and any potential anomaly to verify.
3. State a recommended verification question for the passenger (e.g. lock combo, specific contents, baggage tag serial).
Keep it objective, concise, and focused. Do NOT declare final ownership. Return plain text only.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text?.trim();
      if (text && text.length > 20) {
        return text;
      }
      return deterministicResult.deterministicExplanation;
    } catch (err) {
      console.warn('Gemini API match analysis fallback to deterministic:', err);
      return deterministicResult.deterministicExplanation;
    }
  }
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function containsCommonLocationToken(loc1: string, loc2: string): boolean {
  const words1 = loc1.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const words2 = loc2.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  return words1.some((w) => words2.includes(w));
}

function extractCommonKeywords(text1: string, text2: string): string[] {
  const stopWords = new Set([
    'with', 'this', 'that', 'from', 'have', 'near', 'some', 'small', 'large', 'color', 'black', 'blue',
    'side', 'front', 'back', 'handle', 'zipper', 'pocket', 'wheel', 'wheels', 'carry', 'inside', 'case'
  ]);
  const words1 = new Set(
    text1
      .split(/\W+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4 && !stopWords.has(w))
  );
  const words2 = text2
    .split(/\W+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  const common: string[] = [];
  for (const w of words2) {
    if (words1.has(w) && !common.includes(w)) {
      common.push(w);
    }
  }
  return common;
}

function generateDeterministicExplanation(
  score: number,
  lost: LostReport,
  found: FoundReport,
  matching: string[],
  conflicting: string[]
): string {
  if (score >= 80) {
    return `High confidence candidate (${score}%). Physical attributes (${lost.color} ${formatCategory(
      lost.bag_category
    )}${lost.brand ? `, ${lost.brand}` : ''}) strongly match found record at ${found.airport} on ${found.found_date}. Recommended for ownership verification.`;
  } else if (score >= 50) {
    return `Moderate match (${score}%). Category and location are aligned, but notable variations or missing markers require staff review: ${
      conflicting.length > 0 ? conflicting.join('; ') : 'unverified brand/features'
    }.`;
  } else {
    return `Low similarity score (${score}%). Significant divergence in location, dates, or luggage profile (${
      conflicting.join('; ') || 'incompatible attributes'
    }).`;
  }
}
