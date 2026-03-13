/**
 * Shared pricing calculation used by admin pricing page and customer quote estimates.
 */

export interface PricingInputs {
  printTimeHours: number
  printTimeMinutes: number
  filamentUsedGrams: number
  filamentCostPerKg: number       // pence
  electricityCostPerKwh: number   // pence
  printerWattage: number          // watts
  labourMinutes: number
  labourCostPerHour: number       // pence
  failureRate: number             // percentage
  profitMargin: number            // percentage
}

export interface PricingResult {
  filamentCost: number
  electricityCost: number
  labourCost: number
  subtotal: number
  failureAdjustment: number
  profitAmount: number
  totalPrice: number
  priceWithVat: number
}

export const PRICING_DEFAULTS: PricingInputs = {
  printTimeHours: 0,
  printTimeMinutes: 0,
  filamentUsedGrams: 0,
  filamentCostPerKg: 1799,       // £17.99
  electricityCostPerKwh: 29,     // 29p/kWh
  printerWattage: 200,           // typical FDM
  labourMinutes: 10,
  labourCostPerHour: 1200,       // £12/hr
  failureRate: 5,                // 5%
  profitMargin: 40,              // 40%
}

export function calculatePrice(inputs: PricingInputs): PricingResult {
  const totalPrintMinutes = inputs.printTimeHours * 60 + inputs.printTimeMinutes
  const totalPrintHours = totalPrintMinutes / 60

  const filamentCost = (inputs.filamentUsedGrams / 1000) * inputs.filamentCostPerKg
  const electricityCost = totalPrintHours * (inputs.printerWattage / 1000) * inputs.electricityCostPerKwh
  const labourCost = (inputs.labourMinutes / 60) * inputs.labourCostPerHour

  const subtotal = filamentCost + electricityCost + labourCost
  const withFailure = subtotal * (1 + inputs.failureRate / 100)
  const finalPrice = withFailure * (1 + inputs.profitMargin / 100)

  return {
    filamentCost: Math.round(filamentCost),
    electricityCost: Math.round(electricityCost),
    labourCost: Math.round(labourCost),
    subtotal: Math.round(subtotal),
    failureAdjustment: Math.round(withFailure - subtotal),
    profitAmount: Math.round(finalPrice - withFailure),
    totalPrice: Math.round(finalPrice),
    priceWithVat: Math.round(finalPrice * 1.2),
  }
}

/**
 * Estimate print parameters from model volume.
 * @param volumeCm3 Model volume in cm³
 * @returns Estimated filament grams and print time
 */
export function estimateFromVolume(volumeCm3: number): {
  filamentGrams: number
  printTimeHours: number
  printTimeMinutes: number
} {
  // PLA density ≈ 1.24 g/cm³
  // Typical infill 20% + walls/top/bottom → effective fill ~30% of bounding volume
  // But volumeCm3 here is the solid model volume, so with ~20% infill:
  // effective weight ≈ volume * density * infill_ratio
  // where infill_ratio accounts for infill (0.2) + perimeters/top/bottom (~0.15 extra)
  const PLA_DENSITY = 1.24 // g/cm³
  const EFFECTIVE_FILL = 0.35 // ~20% infill + shells
  const filamentGrams = Math.round(volumeCm3 * PLA_DENSITY * EFFECTIVE_FILL)

  // Rough print speed estimate: ~10-15 cm³/hour effective throughput
  const CM3_PER_HOUR = 12
  const totalMinutes = Math.round((volumeCm3 / CM3_PER_HOUR) * 60 * EFFECTIVE_FILL)
  const printTimeHours = Math.floor(totalMinutes / 60)
  const printTimeMinutes = totalMinutes % 60

  return { filamentGrams, printTimeHours, printTimeMinutes }
}
