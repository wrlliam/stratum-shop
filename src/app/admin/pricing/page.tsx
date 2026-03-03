"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface PricingInputs {
  printTimeHours: number;
  printTimeMinutes: number;
  filamentUsedGrams: number;
  filamentCostPerKg: number;
  electricityCostPerKwh: number;
  printerWattage: number;
  labourMinutes: number;
  labourCostPerHour: number;
  failureRate: number;
  profitMargin: number;
}

const hardDefaults: PricingInputs = {
  printTimeHours: 0,
  printTimeMinutes: 0,
  filamentUsedGrams: 0,
  filamentCostPerKg: 1799, // £17.99 in pence
  electricityCostPerKwh: 29, // 29p per kWh
  printerWattage: 200, // typical FDM printer
  labourMinutes: 10,
  labourCostPerHour: 1200, // £12/hr in pence
  failureRate: 5, // 5%
  profitMargin: 40, // 40%
};

// Keys saved to localStorage (reusable settings, not per-product)
const SAVED_KEYS: (keyof PricingInputs)[] = [
  "filamentCostPerKg",
  "electricityCostPerKwh",
  "printerWattage",
  "labourMinutes",
  "labourCostPerHour",
  "failureRate",
  "profitMargin",
];

const LS_KEY = "stratum-pricing-defaults";

function loadSavedDefaults(): Partial<PricingInputs> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function calculatePrice(inputs: PricingInputs) {
  const totalPrintMinutes =
    inputs.printTimeHours * 60 + inputs.printTimeMinutes;
  const totalPrintHours = totalPrintMinutes / 60;

  const filamentCost =
    (inputs.filamentUsedGrams / 1000) * inputs.filamentCostPerKg;
  const electricityCost =
    totalPrintHours *
    (inputs.printerWattage / 1000) *
    inputs.electricityCostPerKwh;
  const labourCost = (inputs.labourMinutes / 60) * inputs.labourCostPerHour;

  const subtotal = filamentCost + electricityCost + labourCost;
  const withFailure = subtotal * (1 + inputs.failureRate / 100);
  const finalPrice = withFailure * (1 + inputs.profitMargin / 100);

  return {
    filamentCost: Math.round(filamentCost),
    electricityCost: Math.round(electricityCost),
    labourCost: Math.round(labourCost),
    subtotal: Math.round(subtotal),
    failureAdjustment: Math.round(withFailure - subtotal),
    profitAmount: Math.round(finalPrice - withFailure),
    totalPrice: Math.round(finalPrice),
    priceWithVat: Math.round(finalPrice * 1.2),
  };
}

function InputField({
  label,
  value,
  onChange,
  suffix,
  prefix,
  step,
  min,
  max,
  help,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
  min?: number;
  max?: number;
  help?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-brand-muted mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step ?? 1}
          min={min ?? 0}
          max={max}
          className={`w-full px-3 py-2.5 text-sm bg-white border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all ${prefix ? "pl-7" : ""} ${suffix ? "pr-12" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted">
            {suffix}
          </span>
        )}
      </div>
      {help && <p className="text-[11px] text-brand-muted mt-1">{help}</p>}
    </div>
  );
}

function fmtGbp(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function generateInvoiceHtml(
  inputs: PricingInputs,
  result: ReturnType<typeof calculatePrice>,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ref = `EST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const printHours =
    inputs.printTimeHours +
    Math.round((inputs.printTimeMinutes / 60) * 10) / 10;
  const printTimeStr = `${inputs.printTimeHours}h ${inputs.printTimeMinutes}min`;

  const row = (label: string, value: string, bold = false) =>
    `<tr style="border-bottom:1px solid #E8EAED">
      <td style="padding:9px 0;color:${bold ? "#1a1a2e" : "#6b7280"};font-size:13px;${bold ? "font-weight:600" : ""}">${label}</td>
      <td style="padding:9px 0;text-align:right;font-family:monospace;font-size:13px;${bold ? "font-weight:700;color:#1a1a2e" : "color:#374151"}">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${ref} — Stratum Cost Estimate</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #F8F9FA; color: #1a1a2e; padding: 40px; max-width: 720px; margin: 0 auto; }
  @media print {
    body { padding: 20px; background: #fff; }
    .no-print { display: none !important; }
    @page { margin: 1cm; }
  }
  .card { background: #fff; border-radius: 12px; border: 1px solid #E8EAED; overflow: hidden; }
  .accent-bar { height: 4px; background: #6CBCE3; }
  .header-inner { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 28px; border-bottom: 1px solid #E8EAED; }
  .logo { font-size: 24px; font-weight: 900; letter-spacing: 6px; color: #1a1a2e; }
  .logo-sub { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #6CBCE3; margin-top: 4px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .doc-title p { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .body-inner { padding: 24px 28px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .meta-block { background: #F5F5F5; border: 1px solid #E8EAED; border-radius: 8px; padding: 14px; }
  .meta-block h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #3A9FD4; margin-bottom: 8px; }
  .meta-block p { font-size: 13px; color: #374151; line-height: 1.7; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #3A9FD4; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #6CBCE3; }
  table { width: 100%; border-collapse: collapse; }
  .total-row td { padding: 12px 0; font-weight: 700; font-size: 15px; color: #1a1a2e; border-top: 2px solid #E8EAED; }
  .total-row td:last-child { color: #6CBCE3; }
  .note { margin-top: 20px; padding: 12px 16px; background: #EBF6FC; border: 1px solid #6CBCE3; border-radius: 8px; font-size: 12px; color: #374151; line-height: 1.6; }
  .print-btn { display: inline-block; margin-bottom: 24px; padding: 10px 24px; background: #6CBCE3; color: #1a1a2e; font-weight: 700; font-size: 14px; border: none; border-radius: 8px; cursor: pointer; }
  .footer { margin-top: 24px; padding-top: 16px; font-size: 11px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<button class="no-print print-btn" onclick="setTimeout(()=>window.print(),100)">Print / Save as PDF</button>

<div class="card">
  <div class="accent-bar"></div>
  <div class="header-inner">
    <div>
      <div class="logo">STRATUM</div>
      <div class="logo-sub">Precision 3D Prints</div>
    </div>
    <div class="doc-title">
      <h1>Cost Estimate</h1>
      <p>${ref}</p>
      <p>${dateStr}</p>
    </div>
  </div>

  <div class="body-inner">
    <div class="meta">
      <div class="meta-block">
        <h3>Print Specifications</h3>
        <p>
          Print time: ${printTimeStr}<br>
          Filament used: ${inputs.filamentUsedGrams}g<br>
          Filament cost: ${fmtGbp(inputs.filamentCostPerKg)}/kg<br>
          Electricity: ${inputs.electricityCostPerKwh}p/kWh @ ${inputs.printerWattage}W
        </p>
      </div>
      <div class="meta-block">
        <h3>Cost Assumptions</h3>
        <p>
          Labour: ${inputs.labourMinutes} min @ ${fmtGbp(inputs.labourCostPerHour)}/hr<br>
          Failure buffer: ${inputs.failureRate}%<br>
          Profit margin: ${inputs.profitMargin}%<br>
          VAT rate: 20%
        </p>
      </div>
    </div>

    <div class="section-title">Cost Breakdown</div>
    <table>
      ${row("Filament", fmtGbp(result.filamentCost))}
      ${row("Electricity", fmtGbp(result.electricityCost))}
      ${row("Labour", fmtGbp(result.labourCost))}
      ${row("Subtotal", fmtGbp(result.subtotal))}
      ${row(`Failure buffer (${inputs.failureRate}%)`, fmtGbp(result.failureAdjustment))}
      ${row(`Profit margin (${inputs.profitMargin}%)`, fmtGbp(result.profitAmount))}
      ${row("Suggested price (ex. VAT)", fmtGbp(result.totalPrice), true)}
      ${row("VAT (20%)", fmtGbp(result.priceWithVat - result.totalPrice))}
      <tr class="total-row">
        <td>Total price (inc. VAT)</td>
        <td style="text-align:right;font-family:monospace">${fmtGbp(result.priceWithVat)}</td>
      </tr>
    </table>

    <p class="note">
      This is an internal cost estimate generated by Stratum's pricing calculator.
      The suggested price is based on material, energy, and labour costs and should be
      reviewed against market rates before being applied to a product listing.
      Print time used for electricity calculation: ${printHours.toFixed(2)} hours.
    </p>
  </div>
</div>

<div class="footer">
  Stratum · Precision 3D Prints · hello@stratum3d.co.uk
</div>
</body>
</html>`;
}

function CostRow({
  label,
  amount,
  highlight,
}: {
  label: string;
  amount: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${highlight ? "font-bold text-brand-text" : "text-brand-muted"}`}
    >
      <span className="text-sm">{label}</span>
      <span
        className={`text-sm font-mono ${highlight ? "text-brand-blue text-base" : ""}`}
      >
        {formatPrice(amount)}
      </span>
    </div>
  );
}

export default function AdminPricingPage() {
  const [inputs, setInputs] = useState<PricingInputs>(hardDefaults);
  const [loaded, setLoaded] = useState(false);

  // Load saved defaults from localStorage on mount
  useEffect(() => {
    const saved = loadSavedDefaults();
    if (Object.keys(saved).length > 0) {
      setInputs((prev) => ({ ...prev, ...saved }));
    }
    setLoaded(true);
  }, []);

  const update = (field: keyof PricingInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const result = calculatePrice(inputs);

  const reset = () => {
    setInputs(hardDefaults);
    localStorage.removeItem(LS_KEY);
    toast.success("Reset to factory defaults");
  };

  const exportInvoice = () => {
    const html = generateInvoiceHtml(inputs, result);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      toast.error("Pop-up blocked — please allow pop-ups for this site");
      URL.revokeObjectURL(url);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const saveDefaults = () => {
    const toSave: Partial<PricingInputs> = {};
    for (const key of SAVED_KEYS) {
      toSave[key] = inputs[key] as never;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    toast.success("Settings saved as defaults");
  };

  if (!loaded) return null;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text">
          Pricing Calculator
        </h1>
        <p className="text-brand-muted text-sm mt-1">
          Calculate a suggested price based on print costs, labour, and profit
          margin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Print Time */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-semibold text-brand-text mb-4">
              Print Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InputField
                label="Print Time (hours)"
                value={inputs.printTimeHours}
                onChange={(v) => update("printTimeHours", v)}
                suffix="hrs"
              />
              <InputField
                label="Print Time (minutes)"
                value={inputs.printTimeMinutes}
                onChange={(v) => update("printTimeMinutes", v)}
                suffix="min"
                max={59}
              />
              <InputField
                label="Filament Used"
                value={inputs.filamentUsedGrams}
                onChange={(v) => update("filamentUsedGrams", v)}
                suffix="g"
                help="Weight of filament in grams"
              />
            </div>
          </div>

          {/* Material Costs */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-semibold text-brand-text mb-4">
              Material &amp; Energy Costs
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InputField
                label="Filament Cost per kg"
                value={inputs.filamentCostPerKg / 100}
                onChange={(v) =>
                  update("filamentCostPerKg", Math.round(v * 100))
                }
                prefix="£"
                step={0.01}
                help="Default: £17.99/kg"
              />
              <InputField
                label="Electricity Cost"
                value={inputs.electricityCostPerKwh}
                onChange={(v) => update("electricityCostPerKwh", v)}
                suffix="p/kWh"
                help="Default: 29p per kWh"
              />
              <InputField
                label="Printer Wattage"
                value={inputs.printerWattage}
                onChange={(v) => update("printerWattage", v)}
                suffix="W"
                help="Typical FDM: 150-300W"
              />
            </div>
          </div>

          {/* Labour & Margins */}
          <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-semibold text-brand-text mb-4">
              Labour &amp; Margins
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InputField
                label="Labour Time"
                value={inputs.labourMinutes}
                onChange={(v) => update("labourMinutes", v)}
                suffix="min"
                help="Post-processing, packing"
              />
              <InputField
                label="Labour Rate"
                value={inputs.labourCostPerHour / 100}
                onChange={(v) =>
                  update("labourCostPerHour", Math.round(v * 100))
                }
                prefix="£"
                suffix="/hr"
                step={0.5}
              />
              <InputField
                label="Failure Rate"
                value={inputs.failureRate}
                onChange={(v) => update("failureRate", v)}
                suffix="%"
                help="Account for failed prints"
              />
              <InputField
                label="Profit Margin"
                value={inputs.profitMargin}
                onChange={(v) => update("profitMargin", v)}
                suffix="%"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={saveDefaults}
              className="text-sm font-medium text-brand-blue hover:underline transition-colors"
            >
              Save as defaults
            </button>
            <span className="text-brand-border">·</span>
            <button
              onClick={reset}
              className="text-sm text-brand-muted hover:text-brand-text transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-card sticky top-8">
            <h2 className="text-sm font-semibold text-brand-text mb-4">
              Cost Breakdown
            </h2>

            <div className="divide-y divide-brand-border">
              <CostRow label="Filament" amount={result.filamentCost} />
              <CostRow label="Electricity" amount={result.electricityCost} />
              <CostRow label="Labour" amount={result.labourCost} />
              <CostRow label="Subtotal" amount={result.subtotal} />
              <CostRow
                label={`Failure buffer (${inputs.failureRate}%)`}
                amount={result.failureAdjustment}
              />
              <CostRow
                label={`Profit (${inputs.profitMargin}%)`}
                amount={result.profitAmount}
              />
            </div>

            <div className="mt-4 pt-4 border-t-2 border-brand-border">
              <CostRow
                label="Suggested Price (ex. VAT)"
                amount={result.totalPrice}
                highlight
              />
              <CostRow
                label="Price inc. VAT (20%)"
                amount={result.priceWithVat}
                highlight
              />
            </div>

            <div className="mt-4 p-3 bg-brand-arctic rounded-xl">
              <p className="text-xs text-brand-muted">
                Use the suggested price as a starting point. Adjust based on
                market demand, complexity, and perceived value.
              </p>
            </div>

            <button
              onClick={exportInvoice}
              className="mt-4 w-full px-4 py-2.5 text-sm font-semibold bg-brand-text text-white rounded-xl hover:bg-brand-text/90 transition-colors"
            >
              Export as Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
