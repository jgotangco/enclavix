/** Synthetic S04 calculation primitive. Never accepts a client-authoritative posted amount. */
export type AssessmentBasis = "fixed" | "lot_area" | "floor_area" | "ownership_share" | "asset_quantity";
export interface AssessmentInput {
  basis: AssessmentBasis;
  rate: string;
  quantity?: string;
}

const SCALE = BigInt("100000000");
const MAX_MINOR = BigInt("99999999999999");

function decimal(value: string): bigint {
  // Explicit canonical decimal contract: no exponent, whitespace, sign or silent precision loss.
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,11})(\.\d{1,8})?$/.test(value)) {
    throw new Error("Expected a nonnegative decimal string with at most 12 integer and 8 fractional digits");
  }
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(8, "0"));
}

function money(minor: bigint): string {
  if (minor < BigInt("0") || minor > MAX_MINOR) throw new Error("Assessment amount exceeds supported range");
  return `${minor / BigInt("100")}.${(minor % BigInt("100")).toString().padStart(2, "0")}`;
}

/** Round once per charge, half-up to two places; JSON transport stays decimal strings. */
export function calculateAssessment(input: AssessmentInput): string {
  const rate = decimal(input.rate);
  let quantity: bigint;
  switch (input.basis) {
    case "fixed":
      if (input.quantity !== undefined) throw new Error("Fixed charges cannot carry a quantity");
      quantity = SCALE;
      break;
    case "lot_area":
    case "floor_area":
    case "ownership_share":
    case "asset_quantity":
      if (input.quantity === undefined) throw new Error("Assessment quantity is required");
      quantity = decimal(input.quantity);
      if (input.basis === "ownership_share" && (quantity === BigInt("0") || quantity > SCALE)) {
        throw new Error("Ownership share must be greater than zero and at most one");
      }
      if (input.basis === "asset_quantity" && quantity % SCALE !== BigInt("0")) {
        throw new Error("Asset quantity must be a whole number");
      }
      break;
    default:
      throw new Error("Unknown assessment basis");
  }
  const denominator = SCALE * SCALE / BigInt("100");
  return money((rate * quantity + denominator / BigInt("2")) / denominator);
}

/** Sum already-rounded charge amounts, without rounding the combined raw formulas again. */
export function totalAssessments(amounts: readonly string[]): string {
  if (amounts.length > 10_000) throw new Error("Too many assessment lines");
  let total = BigInt("0");
  for (const amount of amounts) {
    if (typeof amount !== "string" || !/^(0|[1-9]\d{0,11})\.\d{2}$/.test(amount)) {
      throw new Error("Expected a rounded nonnegative money string");
    }
    total += decimal(amount) / (SCALE / BigInt("100"));
    if (total > MAX_MINOR) throw new Error("Assessment total exceeds supported range");
  }
  return money(total);
}
