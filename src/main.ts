import { createClient, type PolkadotClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { DIRECTIONS, type DirectionId, type SourceChain } from "./config";
import { resolveAccount, toPlanck } from "./inputs";
import { buildCall, prewarm } from "./build";
import "./style.css";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const els = {
  directionLabel: $("direction-label"),
  switch: $<HTMLButtonElement>("switch"),
  endpoint: $<HTMLSelectElement>("endpoint"),
  status: $("status"),
  amount: $<HTMLInputElement>("amount"),
  amountUnit: $("amount-unit"),
  amountPlanck: $("amount-planck"),
  beneficiary: $<HTMLInputElement>("beneficiary"),
  beneficiaryHex: $("beneficiary-hex"),
  proxyToggle: $<HTMLInputElement>("proxy-toggle"),
  proxyField: $("proxy-field"),
  proxyReal: $<HTMLInputElement>("proxy-real"),
  proxyHex: $("proxy-hex"),
  generate: $<HTMLButtonElement>("generate"),
  error: $("error"),
  output: $("output"),
  summary: $("summary"),
  callData: $<HTMLTextAreaElement>("call-data"),
  callHash: $<HTMLInputElement>("call-hash"),
};

let directionId: DirectionId = "dotToKsm";
let client: PolkadotClient | null = null;
let ready = false;
let connectionSeq = 0;

const source = (): SourceChain => DIRECTIONS[directionId];

function setStatus(text: string, kind: "" | "ok" | "err" = "") {
  els.status.textContent = text;
  els.status.className = `status ${kind}`;
}

function renderDirection() {
  const s = source();
  els.directionLabel.textContent = `${s.label} → ${s.targetLabel}`;
  els.amountUnit.textContent = `(${s.symbol})`;
  els.endpoint.innerHTML = "";
  s.endpoints.forEach((e, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${e.name} — ${e.url}`;
    els.endpoint.append(opt);
  });
  updateAmountHint();
}

function updateAmountHint() {
  const s = source();
  try {
    const planck = toPlanck(els.amount.value, s.decimals);
    els.amountPlanck.textContent = `= ${planck.toString()} planck`;
  } catch {
    els.amountPlanck.textContent = "";
  }
}

function updateAddressHint(input: HTMLInputElement, hint: HTMLElement) {
  try {
    hint.textContent = input.value.trim() ? `= ${resolveAccount(input.value).hex}` : "";
    hint.className = "hint";
  } catch (e) {
    hint.textContent = (e as Error).message;
    hint.className = "hint err";
  }
}

async function connect() {
  const seq = ++connectionSeq;
  ready = false;
  els.generate.disabled = true;
  client?.destroy();
  client = null;

  const endpoint = source().endpoints[Number(els.endpoint.value)];
  setStatus(`Connecting to ${endpoint.name}…`);
  try {
    const c = createClient(getWsProvider(endpoint.url));
    await prewarm(c, source());
    if (seq !== connectionSeq) {
      c.destroy();
      return;
    }
    client = c;
    ready = true;
    els.generate.disabled = false;
    setStatus(`Connected to ${endpoint.name}`, "ok");
  } catch (e) {
    if (seq !== connectionSeq) return;
    setStatus(`Failed to connect: ${(e as Error).message}`, "err");
  }
}

async function generate() {
  els.error.textContent = "";
  els.output.hidden = true;
  if (!client || !ready) {
    els.error.textContent = "Not connected yet.";
    return;
  }
  const s = source();
  try {
    const amountPlanck = toPlanck(els.amount.value, s.decimals);
    const beneficiary = resolveAccount(els.beneficiary.value);
    const proxyReal = els.proxyToggle.checked
      ? resolveAccount(els.proxyReal.value)
      : undefined;

    els.generate.disabled = true;
    setStatus("Building call…");
    const built = await buildCall(client, {
      source: s,
      amountPlanck,
      beneficiaryBytes: beneficiary.bytes,
      proxyRealBytes: proxyReal?.bytes,
    });

    els.callData.value = built.callData;
    els.callHash.value = built.callHash;
    els.summary.innerHTML = "";
    const rows: [string, string][] = [
      ["Direction", `${s.label} → ${s.targetLabel}`],
      ["Amount", `${els.amount.value.trim()} ${s.symbol} = ${amountPlanck} planck`],
      ["Recipient", beneficiary.hex],
      ["Proxy", proxyReal ? `real: ${proxyReal.hex}` : "none"],
    ];
    for (const [k, v] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      els.summary.append(dt, dd);
    }
    els.output.hidden = false;
    setStatus(`Connected to ${s.endpoints[Number(els.endpoint.value)].name}`, "ok");
  } catch (e) {
    els.error.textContent = (e as Error).message;
  } finally {
    els.generate.disabled = !ready;
  }
}

els.switch.addEventListener("click", () => {
  directionId = directionId === "dotToKsm" ? "ksmToDot" : "dotToKsm";
  renderDirection();
  void connect();
});
els.endpoint.addEventListener("change", () => void connect());
els.amount.addEventListener("input", updateAmountHint);
els.beneficiary.addEventListener("input", () =>
  updateAddressHint(els.beneficiary, els.beneficiaryHex),
);
els.proxyReal.addEventListener("input", () =>
  updateAddressHint(els.proxyReal, els.proxyHex),
);
els.proxyToggle.addEventListener("change", () => {
  els.proxyField.hidden = !els.proxyToggle.checked;
});
els.generate.addEventListener("click", () => void generate());

document.querySelectorAll<HTMLButtonElement>("button.copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = $<HTMLInputElement | HTMLTextAreaElement>(btn.dataset.target!);
    await navigator.clipboard.writeText(target.value);
    const prev = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = prev), 1200);
  });
});

renderDirection();
void connect();
