import { calculateHaversineDistance } from '../utils/geo.js';

// Crop to soil compatibility matrix (0.0 to 1.0)
const SOIL_COMPATIBILITY_MATRIX = {
  wheat: {
    loamy: 1.0,
    alluvial: 0.95,
    'sandy loam': 0.9,
    clay: 0.85,
    black: 0.85,
    silt: 0.8,
    sandy: 0.35
  },
  potato: {
    'sandy loam': 1.0,
    loamy: 0.95,
    sandy: 0.85,
    silt: 0.75,
    black: 0.5,
    clay: 0.35 // Clay restricts tuber development
  },
  potatoes: {
    'sandy loam': 1.0,
    loamy: 0.95,
    sandy: 0.85,
    silt: 0.75,
    black: 0.5,
    clay: 0.35
  },
  rice: {
    clay: 1.0, // Retains water necessary for paddy
    alluvial: 0.95,
    silt: 0.85,
    black: 0.8,
    loamy: 0.7,
    sandy: 0.2
  },
  paddy: {
    clay: 1.0,
    alluvial: 0.95,
    silt: 0.85,
    black: 0.8,
    loamy: 0.7,
    sandy: 0.2
  },
  soybean: {
    loamy: 1.0,
    black: 0.95,
    'sandy loam': 0.9,
    alluvial: 0.85,
    clay: 0.7,
    sandy: 0.4
  },
  cotton: {
    black: 1.0, // Renowned Black Cotton / Regur soil
    alluvial: 0.9,
    loamy: 0.85,
    'sandy loam': 0.75,
    clay: 0.65,
    sandy: 0.3
  },
  corn: {
    loamy: 1.0,
    alluvial: 0.95,
    'sandy loam': 0.9,
    black: 0.8,
    silt: 0.75,
    clay: 0.65,
    sandy: 0.45
  },
  maize: {
    loamy: 1.0,
    alluvial: 0.95,
    'sandy loam': 0.9,
    black: 0.8,
    silt: 0.75,
    clay: 0.65,
    sandy: 0.45
  },
  tomato: {
    loamy: 1.0,
    'sandy loam': 0.95,
    alluvial: 0.9,
    silt: 0.75,
    sandy: 0.6,
    clay: 0.5
  },
  tomatoes: {
    loamy: 1.0,
    'sandy loam': 0.95,
    alluvial: 0.9,
    silt: 0.75,
    sandy: 0.6,
    clay: 0.5
  },
  sugarcane: {
    alluvial: 1.0,
    loamy: 0.95,
    black: 0.9,
    clay: 0.75,
    sandy: 0.35
  }
};

// Benchmark yields in tons per acre under standard conditions
const BENCHMARK_YIELD_PER_ACRE = {
  wheat: 2.2,
  potato: 10.0,
  potatoes: 10.0,
  rice: 2.8,
  paddy: 2.8,
  soybean: 1.4,
  cotton: 1.2,
  corn: 3.5,
  maize: 3.5,
  tomato: 14.0,
  tomatoes: 14.0,
  sugarcane: 30.0,
  default: 2.5
};

// Seasonal harvest calendar windows (typical months 1-12)
const CROP_SEASON_WINDOWS = {
  wheat: { season: 'Rabi (Winter)', peakMonths: [3, 4, 5], plantingMonths: [10, 11, 12] },
  rice: { season: 'Kharif (Monsoon)', peakMonths: [10, 11, 12], plantingMonths: [6, 7] },
  potato: { season: 'Winter / Spring', peakMonths: [1, 2, 3, 4], plantingMonths: [10, 11] },
  soybean: { season: 'Kharif (Monsoon)', peakMonths: [9, 10, 11], plantingMonths: [6, 7] },
  cotton: { season: 'Kharif (Late Autumn)', peakMonths: [11, 12, 1], plantingMonths: [5, 6] },
  corn: { season: 'Kharif & Spring', peakMonths: [5, 6, 9, 10], plantingMonths: [2, 6] },
  tomato: { season: 'Flexible / Multi-season', peakMonths: [1, 2, 3, 4, 11, 12], plantingMonths: [8, 9, 10] }
};

export class MatchingService {
  /**
   * Evaluates soil compatibility for a crop and soil type
   */
  static getSoilCompatibility(cropName, soilType) {
    const cropKey = (cropName || '').toLowerCase().trim();
    const soilKey = (soilType || '').toLowerCase().trim();

    const cropRules = SOIL_COMPATIBILITY_MATRIX[cropKey];
    if (cropRules && cropRules[soilKey] !== undefined) {
      return cropRules[soilKey];
    }

    // Default heuristics based on general soil fertility
    const genericSoilRating = {
      loamy: 0.9,
      alluvial: 0.85,
      'sandy loam': 0.8,
      black: 0.78,
      silt: 0.72,
      clay: 0.6,
      sandy: 0.45
    };

    return genericSoilRating[soilKey] ?? 0.65;
  }

  /**
   * Evaluates historical past yield performance for the required crop and grade
   */
  static evaluatePastYield(pastHistory, requiredCrop, requiredGrade, quantityNeeded) {
    if (!Array.isArray(pastHistory) || pastHistory.length === 0) {
      return {
        score: 40,
        hasCropExperience: false,
        pastTotalTons: 0,
        gradeMatch: false,
        summary: 'No historical yield records on file; unrated track record'
      };
    }

    const cropKey = (requiredCrop || '').toLowerCase().trim();
    const matchingRecords = pastHistory.filter(
      (item) => (item.crop || '').toLowerCase().trim() === cropKey
    );

    if (matchingRecords.length === 0) {
      // Farmer has farming experience, but in other crops
      const totalOtherTons = pastHistory.reduce((sum, h) => sum + (Number(h.tons) || 0), 0);
      const experienceScore = Math.min(60, 35 + Math.min(25, totalOtherTons * 0.5));
      return {
        score: Math.round(experienceScore),
        hasCropExperience: false,
        pastTotalTons: totalOtherTons,
        gradeMatch: false,
        summary: `Has ${totalOtherTons * 10} Quintals (${totalOtherTons} MT) total experience across other crops, but has not grown ${requiredCrop}`
      };
    }

    // Has grown required crop before!
    const totalCropTons = matchingRecords.reduce((sum, h) => sum + (Number(h.tons) || 0), 0);
    const avgCropTons = totalCropTons / matchingRecords.length;

    // Check grade match (e.g. required 'Grade A', 'A', 'Premium')
    const gradeTarget = (requiredGrade || '').toLowerCase().replace('grade', '').trim();
    const hasGradeMatch = matchingRecords.some((h) => {
      const g = (h.grade || '').toLowerCase().replace('grade', '').trim();
      return g === gradeTarget || g === 'premium' || (gradeTarget === 'b' && g === 'a');
    });

    // Experience base
    let score = 65;

    // Grade bonus (up to 20 pts)
    if (hasGradeMatch) {
      score += 20;
    } else {
      score += 8;
    }

    // Volume alignment bonus (up to 15 pts)
    const volumeRatio = avgCropTons / Math.max(1, quantityNeeded);
    if (volumeRatio >= 0.8) {
      score += 15;
    } else if (volumeRatio >= 0.4) {
      score += 10;
    } else {
      score += 5;
    }

    score = Math.min(100, Math.round(score));

    return {
      score,
      hasCropExperience: true,
      pastTotalTons: totalCropTons,
      gradeMatch: hasGradeMatch,
      summary: `Verified history of ${totalCropTons * 10} Quintals (${totalCropTons} MT) ${requiredCrop}${hasGradeMatch ? ` matching ${requiredGrade}` : ''}`
    };
  }

  /**
   * Evaluates seasonal suitability based on deadline and crop growth calendar
   */
  static evaluateSeason(cropName, deadlineStr) {
    const cropKey = (cropName || '').toLowerCase().trim();
    const cropConfig = CROP_SEASON_WINDOWS[cropKey] || {
      season: 'Temperate / Year-round',
      peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      plantingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };

    let deadlineMonth = new Date().getMonth() + 1; // Default to current
    let daysUntilDeadline = 90;

    if (deadlineStr) {
      const d = new Date(deadlineStr);
      if (!isNaN(d.getTime())) {
        deadlineMonth = d.getMonth() + 1;
        const diffMs = d.getTime() - Date.now();
        daysUntilDeadline = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    const isPeakHarvest = cropConfig.peakMonths.includes(deadlineMonth);
    let score = isPeakHarvest ? 95 : 80;

    // Adequate lead time check (crops need ~60-120 days minimum for fresh cultivation, or immediate if in peak season)
    if (daysUntilDeadline < 30 && !isPeakHarvest) {
      score -= 25;
    } else if (daysUntilDeadline >= 60) {
      score += 5;
    }

    score = Math.max(20, Math.min(100, score));

    return {
      score,
      seasonName: cropConfig.season,
      isOptimalTiming: isPeakHarvest,
      daysLeadTime: daysUntilDeadline
    };
  }

  /**
   * Evaluates acreage capacity to fulfill demand volume
   */
  static evaluateCapacity(farmerAcreage, cropName, quantityNeeded) {
    const cropKey = (cropName || '').toLowerCase().trim();
    const benchmarkYield = BENCHMARK_YIELD_PER_ACRE[cropKey] || BENCHMARK_YIELD_PER_ACRE.default;
    const requiredAcres = Math.round((quantityNeeded / benchmarkYield) * 10) / 10;

    const acreage = Number(farmerAcreage) || 0;
    const coverageRatio = acreage / Math.max(0.1, requiredAcres);

    let score = 50;
    if (coverageRatio >= 1.5) {
      score = 100; // Ample acreage with safety margin
    } else if (coverageRatio >= 1.0) {
      score = 88; // Sufficient acreage
    } else if (coverageRatio >= 0.7) {
      score = 70; // Tight capacity
    } else {
      score = Math.max(20, Math.round(coverageRatio * 80)); // Likely requires multi-farmer aggregation
    }

    return {
      score,
      requiredAcres,
      totalAcreage: acreage,
      coverageRatio: Math.round(coverageRatio * 100) / 100
    };
  }

  /**
   * Main Matchmaker calculation function
   * Calculates compatibility score between processor demand and all registered farmers
   */
  static calculateMatches(processor, farmers, options = {}) {
    const { includeOutOfRadius = true } = options;

    const results = farmers.map((farmer) => {
      // 1. Geospatial Haversine distance
      const distanceKm = calculateHaversineDistance(
        processor.location.latitude,
        processor.location.longitude,
        farmer.location.latitude,
        farmer.location.longitude
      );

      const maxDistance = Number(processor.max_distance_km) || 100;
      const isWithinRadius = distanceKm <= maxDistance;

      // Distance Score (0 to 100)
      let distanceScore = 0;
      if (distanceKm <= maxDistance) {
        // Linear decay from 100 down to 20 at max boundary
        distanceScore = Math.max(20, Math.round(100 - (distanceKm / maxDistance) * 80));
      } else {
        // Penalty for exceeding radius
        const excessKm = distanceKm - maxDistance;
        distanceScore = Math.max(0, Math.round(20 - (excessKm / maxDistance) * 20));
      }

      // 2. Soil Compatibility (0 to 100 across all land parcels)
      let bestSoilMultiplier = this.getSoilCompatibility(processor.required_crop, farmer.soil_type);
      let bestMatchingParcel = null;

      if (Array.isArray(farmer.land_parcels) && farmer.land_parcels.length > 0) {
        for (const parcel of farmer.land_parcels) {
          const mult = this.getSoilCompatibility(processor.required_crop, parcel.soil_type);
          if (mult >= bestSoilMultiplier) {
            bestSoilMultiplier = mult;
            bestMatchingParcel = parcel;
          }
        }
      }

      const soilMultiplier = bestSoilMultiplier;
      const soilScore = Math.round(soilMultiplier * 100);

      // 3. Past Yield History (0 to 100)
      const pastYieldEval = this.evaluatePastYield(
        farmer.past_yield_history,
        processor.required_crop,
        processor.required_grade,
        processor.quantity_needed_tons
      );

      // 4. Seasonal Feasibility (0 to 100)
      const seasonEval = this.evaluateSeason(processor.required_crop, processor.deadline);

      // 5. Acreage Capacity (0 to 100)
      const capacityEval = this.evaluateCapacity(
        farmer.total_acreage,
        processor.required_crop,
        processor.quantity_needed_tons
      );

      // Weighted Multi-factor Composite Score
      // Weights: Distance: 25%, Soil: 25%, Past Yield: 30%, Season & Capacity: 20% (Season 10%, Capacity 10%)
      const weightedScore = (
        distanceScore * 0.25 +
        soilScore * 0.25 +
        pastYieldEval.score * 0.3 +
        seasonEval.score * 0.1 +
        capacityEval.score * 0.1
      );

      // Severe penalty if out of max distance radius
      const finalScore = isWithinRadius
        ? Math.round(weightedScore * 10) / 10
        : Math.round(weightedScore * 0.45 * 10) / 10;

      // Determine match grade/tier
      let matchTier = 'Low Compatibility';
      if (finalScore >= 85) matchTier = 'Optimal Match';
      else if (finalScore >= 70) matchTier = 'Strong Match';
      else if (finalScore >= 55) matchTier = 'Moderate Match';

      // Generate AI recommendation narrative
      const aiNarrative = this.generateAiNarrative({
        farmer,
        processor,
        finalScore,
        matchTier,
        distanceKm,
        isWithinRadius,
        soilScore,
        pastYieldEval,
        seasonEval,
        capacityEval,
        bestMatchingParcel
      });

      // Key risks or caveats
      const riskFactors = [];
      if (!isWithinRadius) {
        riskFactors.push(`Exceeds max delivery distance limit by ${(distanceKm - maxDistance).toFixed(1)} km`);
      }
      if (soilScore < 70) {
        riskFactors.push(`Soil profile (${farmer.soil_types?.join(', ') || farmer.soil_type}) is sub-optimal for ${processor.required_crop}`);
      }
      if (!pastYieldEval.hasCropExperience) {
        riskFactors.push(`No logged historical production of ${processor.required_crop}`);
      } else if (!pastYieldEval.gradeMatch) {
        riskFactors.push(`Historical records do not explicitly certify ${processor.required_grade}`);
      }
      if (capacityEval.coverageRatio < 1.0) {
        riskFactors.push(`Total acreage (${farmer.total_acreage} acres) is below ideal capacity (${capacityEval.requiredAcres} acres needed)`);
      }

      const isServiceActive = farmer.is_service_active !== false && farmer.is_service_active !== 0;
      if (!isServiceActive) {
        riskFactors.push('Farmer services are currently turned OFF (Not accepting new contract requests)');
      }

      return {
        farmer_id: farmer.id,
        farmer_name: farmer.name,
        location: farmer.location,
        soil_type: bestMatchingParcel ? bestMatchingParcel.soil_type : farmer.soil_type,
        soil_types: farmer.soil_types || [farmer.soil_type],
        total_acreage: farmer.total_acreage,
        land_parcels: farmer.land_parcels || [],
        best_matching_parcel: bestMatchingParcel,
        is_service_active: isServiceActive,
        distance_km: distanceKm,
        is_within_radius: isWithinRadius,
        compatibility_score: finalScore,
        match_tier: matchTier,
        score_breakdown: {
          distance_score: distanceScore,
          soil_compatibility_score: soilScore,
          past_yield_score: pastYieldEval.score,
          seasonal_score: seasonEval.score,
          capacity_score: capacityEval.score
        },
        ai_recommendation: aiNarrative,
        risk_factors: riskFactors
      };
    });

    // Filter by radius if requested, otherwise rank all
    const filtered = includeOutOfRadius
      ? results
      : results.filter((r) => r.is_within_radius);

    // Sort descending by compatibility score
    filtered.sort((a, b) => b.compatibility_score - a.compatibility_score);

    // Add 1-based rank
    return filtered.map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  }

  /**
   * Generates natural language AI synthesis explaining why this farmer was ranked
   */
  static generateAiNarrative({
    farmer,
    processor,
    finalScore,
    matchTier,
    distanceKm,
    isWithinRadius,
    soilScore,
    pastYieldEval,
    capacityEval,
    bestMatchingParcel
  }) {
    const parts = [];

    parts.push(
      `${farmer.name} is classified as an ${matchTier} (${finalScore}% score) for ${processor.company_name}'s demand of ${processor.quantity_needed_tons * 10} Quintals (${processor.quantity_needed_tons} MT) of ${processor.required_crop} (${processor.required_grade}).`
    );

    if (isWithinRadius) {
      parts.push(
        `Conveniently situated ${distanceKm} km away (comfortably within the ${processor.max_distance_km} km radius), minimizing transit degradation and freight overhead.`
      );
    } else {
      parts.push(
        `Located ${distanceKm} km away, which exceeds the designated ${processor.max_distance_km} km radius and requires logistics accommodation.`
      );
    }

    const soilLabel = bestMatchingParcel
      ? `parcel '${bestMatchingParcel.name}' (${bestMatchingParcel.soil_type} soil, ${bestMatchingParcel.acreage} Acres)`
      : `${farmer.soil_type} soil`;

    if (soilScore >= 90) {
      parts.push(
        `The farm's ${soilLabel} exhibits peak agronomic suitability for ${processor.required_crop} cultivation.`
      );
    } else if (soilScore >= 70) {
      parts.push(
        `The farm's ${soilLabel} provides good growing conditions for ${processor.required_crop}.`
      );
    } else {
      parts.push(
        `Note that ${farmer.soil_type} soil presents moderate agronomic hurdles for ${processor.required_crop}.`
      );
    }

    if (pastYieldEval.hasCropExperience) {
      parts.push(
        `Historical performance validates proven capability: ${pastYieldEval.summary}.`
      );
    } else {
      parts.push(
        `While lacking logged ${processor.required_crop} yield records, the grower possesses general farming capacity.`
      );
    }

    if (capacityEval.coverageRatio >= 1.2) {
      parts.push(
        `With ${farmer.total_acreage} total acres, the grower has ${capacityEval.coverageRatio}x the estimated land required (${capacityEval.requiredAcres} acres) to guarantee target volumes.`
      );
    }

    return parts.join(' ');
  }
}
