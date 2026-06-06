import { ERP_STORAGE_KEY, cloneSeedData } from "./app1.js/data.js";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function formatCurrency(value) {
  return currency.format(Number(value || 0));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function loadState() {
  const persisted = localStorage.getItem(ERP_STORAGE_KEY);
  if (!persisted) return cloneSeedData();

  try {
    return JSON.parse(persisted);
  } catch {
    return cloneSeedData();
  }
}

export function saveState(state) {
  localStorage.setItem(ERP_STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  const state = cloneSeedData();
  saveState(state);
  return state;
}

export function nextId(prefix, collection) {
  const next = collection.length + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
}

export function getVendor(state, vendorId) {
  return state.vendors.find((vendor) => vendor.id === vendorId);
}

export function getRfq(state, rfqId) {
  return state.rfqs.find((rfq) => rfq.id === rfqId);
}

export function getQuotation(state, quotationId) {
  return state.quotations.find((quotation) => quotation.id === quotationId);
}

export function getPo(state, poId) {
  return state.purchaseOrders.find((po) => po.id === poId);
}

export function addActivity(state, type, text, actor = state.user.name) {
  state.activities.unshift({
    id: `ACT-${Date.now()}`,
    at: new Date().toISOString().slice(0, 16).replace("T", " "),
    type,
    text,
    actor
  });
}

export function createVendor(state, form) {
  const vendor = {
    id: nextId("VEN", state.vendors),
    name: form.get("name").trim(),
    category: form.get("category"),
    contact: form.get("contact").trim(),
    email: form.get("email").trim(),
    phone: form.get("phone").trim(),
    rating: Number(form.get("rating")),
    risk: form.get("risk"),
    compliance: form.get("compliance"),
    paymentTerms: form.get("paymentTerms").trim(),
    address: form.get("address").trim(),
    spendYtd: 0
  };

  state.vendors.push(vendor);
  addActivity(state, "Vendor", `${vendor.name} registered as ${vendor.category} vendor.`);
  return vendor;
}

export function createRfq(state, form) {
  const itemNames = form.get("items").split("\n").map((line) => line.trim()).filter(Boolean);
  const rfq = {
    id: `RFQ-2606-${String(state.rfqs.length + 16).padStart(3, "0")}`,
    title: form.get("title").trim(),
    category: form.get("category"),
    department: form.get("department"),
    requester: form.get("requester").trim(),
    status: "Open",
    dueDate: form.get("dueDate"),
    budget: Number(form.get("budget")),
    items: itemNames.map((name, index) => ({
      name,
      qty: Number(form.get(`qty-${index}`) || 1),
      unit: "unit",
      targetPrice: 0
    })),
    vendorIds: state.vendors.filter((vendor) => vendor.category === form.get("category")).map((vendor) => vendor.id),
    notes: form.get("notes").trim()
  };

  state.rfqs.unshift(rfq);
  addActivity(state, "RFQ", `${rfq.id} created for ${rfq.title}.`);
  return rfq;
}

export function receiveQuotation(state, form) {
  const amount = Number(form.get("amount"));
  const quotation = {
    id: nextId("QTN", state.quotations),
    rfqId: form.get("rfqId"),
    vendorId: form.get("vendorId"),
    amount,
    tax: Math.round(amount * 0.18),
    deliveryDays: Number(form.get("deliveryDays")),
    validity: form.get("validity"),
    warranty: form.get("warranty").trim(),
    status: "Received",
    score: Number(form.get("score")),
    submittedAt: todayIso()
  };

  state.quotations.push(quotation);
  const rfq = getRfq(state, quotation.rfqId);
  if (rfq) rfq.status = "Quotations Received";
  const vendor = getVendor(state, quotation.vendorId);
  addActivity(state, "Quotation", `${vendor?.name || "Vendor"} submitted ${quotation.id} for ${quotation.rfqId}.`);
  return quotation;
}

export function recommendQuotation(state, quotationId) {
  const quotation = getQuotation(state, quotationId);
  if (!quotation) return;

  state.quotations
    .filter((item) => item.rfqId === quotation.rfqId)
    .forEach((item) => {
      item.status = item.id === quotationId ? "Recommended" : "Received";
    });

  let approval = state.approvals.find((item) => item.rfqId === quotation.rfqId);
  if (!approval) {
    approval = {
      id: nextId("APR", state.approvals),
      rfqId: quotation.rfqId,
      quotationId,
      status: "Pending Procurement",
      requestedBy: state.user.name,
      currentStep: "Procurement Manager",
      steps: [
        { role: "Requester", actor: state.user.name, status: "Approved", date: todayIso(), note: "Business need confirmed." },
        { role: "Procurement Manager", actor: "Pending", status: "Pending", date: "", note: "" },
        { role: "Finance Controller", actor: "Pending", status: "Waiting", date: "", note: "" },
        { role: "CFO", actor: "Pending", status: "Waiting", date: "", note: "" }
      ]
    };
    state.approvals.unshift(approval);
  } else {
    approval.quotationId = quotationId;
  }

  addActivity(state, "Approval", `${quotation.id} recommended and routed for approval.`);
}

export function approveCurrentStep(state, approvalId) {
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval) return;

  const pendingIndex = approval.steps.findIndex((step) => step.status === "Pending");
  if (pendingIndex === -1) return;

  const step = approval.steps[pendingIndex];
  step.status = "Approved";
  step.actor = state.user.name;
  step.date = todayIso();
  step.note = "Approved in VendorBridge.";

  const nextStep = approval.steps[pendingIndex + 1];
  if (nextStep) {
    nextStep.status = "Pending";
    approval.currentStep = nextStep.role;
    approval.status = `Pending ${nextStep.role}`;
  } else {
    approval.currentStep = "Complete";
    approval.status = "Approved";
    const rfq = getRfq(state, approval.rfqId);
    if (rfq) rfq.status = "Approved";
  }

  addActivity(state, "Approval", `${step.role} approved ${approval.quotationId}.`);
}

export function generatePurchaseOrder(state, approvalId) {
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval || approval.status !== "Approved") return null;

  const existing = state.purchaseOrders.find((po) => po.quotationId === approval.quotationId);
  if (existing) return existing;

  const quotation = getQuotation(state, approval.quotationId);
  if (!quotation) return null;

  const po = {
    id: `PO-2606-${String(state.purchaseOrders.length + 9).padStart(3, "0")}`,
    rfqId: quotation.rfqId,
    quotationId: quotation.id,
    vendorId: quotation.vendorId,
    status: "Issued",
    issueDate: todayIso(),
    deliveryDate: addDays(todayIso(), quotation.deliveryDays),
    amount: quotation.amount + quotation.tax,
    owner: state.user.name
  };

  state.purchaseOrders.unshift(po);
  addActivity(state, "PO", `${po.id} generated from ${quotation.id}.`);
  return po;
}

export function generateInvoice(state, poId) {
  const po = getPo(state, poId);
  if (!po) return null;

  const existing = state.invoices.find((invoice) => invoice.poId === poId);
  if (existing) return existing;

  const quotation = getQuotation(state, po.quotationId);
  const invoice = {
    id: `INV-2026-${String(state.invoices.length + 103).padStart(3, "0")}`,
    poId: po.id,
    vendorId: po.vendorId,
    status: "Draft",
    issueDate: todayIso(),
    dueDate: addDays(todayIso(), 30),
    subtotal: quotation?.amount || po.amount,
    tax: quotation?.tax || 0,
    total: po.amount,
    billTo: "Acme Manufacturing Pvt Ltd",
    sentAt: ""
  };

  state.invoices.unshift(invoice);
  addActivity(state, "Invoice", `${invoice.id} generated from ${po.id}.`);
  return invoice;
}

export function markInvoiceSent(state, invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  invoice.status = "Sent";
  invoice.sentAt = new Date().toISOString().slice(0, 16).replace("T", " ");
  addActivity(state, "Invoice", `${invoice.id} marked as emailed to vendor.`);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
}
