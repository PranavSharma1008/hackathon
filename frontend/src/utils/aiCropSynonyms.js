/**
 * AI Vernacular Crop Synonyms & Multilingual Local Names Matching Engine
 * Handles regional terms (Hindi, Punjabi, Marathi, Gujarati, etc.)
 * Provides case-insensitive (UPPERCASE and lowercase) fuzzy and exact token matching.
 */

export const VERNACULAR_CROP_DICTIONARY = {
  maize: {
    canonical: 'Yellow Corn / Maize',
    aliases: ['makka', 'makki', 'yellow makka', 'yellow makki', 'bhutta', 'chhalli', 'sweet corn', 'corn', 'maize', 'makka dana', 'makkai']
  },
  corn: {
    canonical: 'Yellow Corn / Maize',
    aliases: ['makka', 'makki', 'yellow makka', 'yellow makki', 'bhutta', 'chhalli', 'sweet corn', 'corn', 'maize', 'makka dana', 'makkai']
  },
  wheat: {
    canonical: 'Sharbati Wheat',
    aliases: ['gehun', 'gehu', 'kanak', 'sharbati', 'sharbati gehun', 'wheat', 'godhumai', 'gahu', 'atta wheat', 'triticum']
  },
  rice: {
    canonical: 'Basmati Rice (Pusa 1121)',
    aliases: ['chawal', 'dhan', 'pusa 1121', 'basmati', 'basmati rice', 'bhat', 'akki', 'arisi', 'vari', 'biryani rice']
  },
  mustard: {
    canonical: 'Mustard Seed (Sarson)',
    aliases: ['sarson', 'rai', 'peeli sarson', 'kali sarson', 'mustard', 'mustard seed', 'kadugu', 'sasive', 'sarso']
  },
  potato: {
    canonical: 'Potato (Kufri Chipsona)',
    aliases: ['aloo', 'alu', 'batata', 'kufri chipsona', 'chipsona', 'potatoes', 'urulaikizhangu']
  },
  soybean: {
    canonical: 'Soybean (JS 335)',
    aliases: ['soya', 'soyabean', 'soya bean', 'js 335', 'soybean seeds', 'bhatmahs']
  },
  cotton: {
    canonical: 'Cotton (Medium Staple)',
    aliases: ['kapas', 'rui', 'cotton', 'raw cotton', 'patti', 'paruthi']
  },
  chana: {
    canonical: 'Chickpea / Bengal Gram (Chana)',
    aliases: ['chana', 'chhole', 'gram', 'bengal gram', 'kala chana', 'kabuli chana', 'harbara']
  },
  bajra: {
    canonical: 'Pearl Millet (Bajra)',
    aliases: ['bajra', 'pearl millet', 'bajri', 'kambu', 'sajje']
  },
  tur: {
    canonical: 'Pigeon Pea / Tur Dal',
    aliases: ['tur', 'arhar', 'toor dal', 'tuvar', 'red gram']
  },
  sugarcane: {
    canonical: 'Sugarcane',
    aliases: ['ganna', 'sugarcane', 'ikshu', 'karumbu', 'cheruku']
  }
};

/**
 * AI Auto-Suggest Local Vernacular Names based on crop name
 */
export function getAiSuggestedLocalNames(cropName = '') {
  if (!cropName) return '';
  const lower = cropName.toLowerCase();

  for (const [key, info] of Object.entries(VERNACULAR_CROP_DICTIONARY)) {
    if (lower.includes(key) || info.aliases.some((a) => lower.includes(a))) {
      return info.aliases.slice(0, 5).join(', ');
    }
  }

  // Fallback heuristic: produce lowercase variations
  const clean = lower.replace(/[^a-z0-9\s]/gi, '').trim();
  return clean ? `${clean}, local ${clean}` : '';
}

/**
 * AI Smart Matcher for Produce Catalog & Marketplace Search
 * Matches across:
 * - Crop Name
 * - Farmer Name
 * - Local Names / Tags
 * - AI Synonyms / Vernacular Aliases
 * Case-insensitive (UPPERCASE & lowercase identical handling).
 */
export function matchProduceWithAi(item, searchTerm = '') {
  if (!searchTerm || !searchTerm.trim()) {
    return { matches: true, matchedTag: null };
  }

  const query = searchTerm.toLowerCase().trim();
  const cropLower = (item.crop_name || '').toLowerCase();
  const farmerLower = (item.farmer_name || '').toLowerCase();
  const localNamesLower = (item.local_names || '').toLowerCase();

  // 1. Direct match on crop name
  if (cropLower.includes(query)) {
    return { matches: true, matchedTag: item.crop_name };
  }

  // 2. Direct match on farmer name
  if (farmerLower.includes(query)) {
    return { matches: true, matchedTag: item.farmer_name };
  }

  // 3. Match on local names / tags string
  if (localNamesLower.includes(query)) {
    const tags = localNamesLower.split(',').map((t) => t.trim());
    const matched = tags.find((t) => t.includes(query) || query.includes(t)) || query;
    return { matches: true, matchedTag: matched };
  }

  // 4. Token match on local tags
  const tagsList = (item.tags || []).map((t) => String(t).toLowerCase().trim());
  for (const tag of tagsList) {
    if (tag.includes(query) || query.includes(tag)) {
      return { matches: true, matchedTag: tag };
    }
  }

  // 5. AI Vernacular Semantic Knowledge Base Matching
  for (const [key, info] of Object.entries(VERNACULAR_CROP_DICTIONARY)) {
    const cropMatchesCategory = cropLower.includes(key) || info.aliases.some((a) => cropLower.includes(a));
    if (cropMatchesCategory) {
      // Check if user query matches any alias of this crop
      const matchedAlias = info.aliases.find((alias) => alias.includes(query) || query.includes(alias));
      if (matchedAlias) {
        return { matches: true, matchedTag: matchedAlias };
      }
    }
  }

  return { matches: false, matchedTag: null };
}
