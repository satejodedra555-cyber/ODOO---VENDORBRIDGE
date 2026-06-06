import { categories, departments } from "./procurement-data.js";
import {
  approveCurrentStep,
  createRfq,
  createVendor,
  formatCurrency,
  generateInvoice,
  generatePurchaseOrder,
  getPo,
  getQuotation,
  getRfq,
  getVendor,
  loadState,
  markInvoiceSent,
  receiveQuotation,
  recommendQuotation,
  resetState,
  saveState
} from "./procurement-store.js";

let state = loadState();
let activeView = "dashboard";
let selectedInvoiceId = state.invoices[0]?.id || "";

const app = document.querySelector("#app");

const navItems = [
  ["dashboard", "Dashboard"],
  ["vendors", "Vendors"],
  ["rfqs", "RFQs"],
  ["quotations", "Quotations"],
  ["approvals", "Approvals"],
  ["orders", "Purchase Orders"],
  ["invoices", "Invoices"],
  ["activity", "Activity"]
];

function render() {
  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">VB</div>
        <div>
          <strong>VendorBridge</strong>
          <span>Procurement ERP</span>
        </div>
      </div>
      <nav class="nav">
        ${navItems.map(([id, label]) => `<button class="${activeView === id ? "active" : ""}" data-nav="${id}">${label}</button>`).join("")}
      </nav>
      <div class="session-card">
        <span>${state.user.role}</span>
        <strong>${state.user.name}</strong>
        <small>${state.user.email}</small>
      </div>
    </aside>
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Secure procure-to-pay workspace</p>
          <h1>${viewTitle()}</h1>
        </div>
        <div class="topbar-actions">
          <button class="secondary" data-action="reset">Reset demo</button>
          <button data-nav="rfqs">New RFQ</button>
        </div>
      </header>
      ${viewContent()}
    </main>
  `;
}

function viewTitle() {
  return {
    dashboard: "Procurement Control Center",
    vendors: "Vendor Master",
    rfqs: "RFQ Management",
    quotations: "Quotation Comparison",
    approvals: "Approval Workflow",
    orders: "Purchase Orders",
    invoices: "Invoice Desk",
    activity: "Procurement Activity"
  }[activeView];
}

function viewContent() {
  if (activeView === "vendors") return vendorsView();
  if (activeView === "rfqs") return rfqsView();
  if (activeView === "quotations") return quotationsView();
  if (activeView === "approvals") return approvalsView();
  if (activeView === "orders") return ordersView();
  if (activeView === "invoices") return invoicesView();
  if (activeView === "activity") return activityView();
  return dashboardView();
}

function dashboardView() {
  const approvedSpend = state.purchaseOrders.reduce((sum, po) => sum + po.amount, 0);
  const pendingApprovals = state.approvals.filter((item) => item.status !== "Approved").length;
  const openRfqs = state.rfqs.filter((rfq) => rfq.status !== "Approved").length;

  return `
    <section class="kpi-grid">
      ${kpi("Registered Vendors", state.vendors.length, "verified supplier records")}
      ${kpi("Open RFQs", openRfqs, "active sourcing events")}
      ${kpi("Pending Approvals", pendingApprovals, "segregated approval queue")}
      ${kpi("PO Value", formatCurrency(approvedSpend), "issued and draft orders")}
    </section>
    <section class="dashboard-grid">
      <div class="panel wide">
        <div class="panel-head">
          <h2>Procurement Pipeline</h2>
          <span>${state.rfqs.length} RFQs</span>
        </div>
        <div class="pipeline">
          ${state.rfqs.map((rfq) => pipelineCard(rfq)).join("")}
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <h2>Risk Watch</h2>
          <span>${state.vendors.filter((vendor) => vendor.risk !== "Low").length} flagged</span>
        </div>
        <div class="risk-list">
          ${state.vendors.map((vendor) => `
            <div class="risk-row">
              <div>
                <strong>${vendor.name}</strong>
                <span>${vendor.category}</span>
              </div>
              <span class="badge ${tone(vendor.risk)}">${vendor.risk}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
    ${activityView(true)}
  `;
}

function vendorsView() {
  return `
    <section class="split">
      <form class="panel form-panel" data-form="vendor">
        <div class="panel-head"><h2>Register Vendor</h2><span>Master data</span></div>
        ${input("Vendor name", "name", "Northline Components", true)}
        ${input("Primary contact", "contact", "Contact name", true)}
        ${input("Email", "email", "vendor@example.com", true, "email")}
        ${input("Phone", "phone", "+91 90000 00000", true)}
        ${select("Category", "category", categories)}
        <div class="two-col">
          ${select("Risk", "risk", ["Low", "Medium", "High"])}
          ${select("Compliance", "compliance", ["Verified", "Pending", "Blocked"])}
        </div>
        <div class="two-col">
          ${input("Rating", "rating", "4.2", true, "number", "0.1", "0", "5")}
          ${input("Payment terms", "paymentTerms", "Net 30", true)}
        </div>
        ${textarea("Address", "address", "Registered business address", true)}
        <button type="submit">Register vendor</button>
      </form>
      <div class="panel table-panel">
        <div class="panel-head"><h2>Vendor Directory</h2><span>${state.vendors.length} records</span></div>
        ${vendorTable()}
      </div>
    </section>
  `;
}

function rfqsView() {
  return `
    <section class="split">
      <form class="panel form-panel" data-form="rfq">
        <div class="panel-head"><h2>Create RFQ</h2><span>Sourcing event</span></div>
        ${input("RFQ title", "title", "Annual facility maintenance", true)}
        <div class="two-col">
          ${select("Category", "category", categories)}
          ${select("Department", "department", departments)}
        </div>
        <div class="two-col">
          ${input("Requester", "requester", "Requester name", true)}
          ${input("Due date", "dueDate", "", true, "date")}
        </div>
        ${input("Budget", "budget", "1500000", true, "number")}
        ${textarea("Line items", "items", "Item one\nItem two", true)}
        ${textarea("Terms and notes", "notes", "Delivery, warranty, quality, and compliance terms", true)}
        <button type="submit">Create RFQ</button>
      </form>
      <div class="panel table-panel">
        <div class="panel-head"><h2>RFQ Register</h2><span>${state.rfqs.length} events</span></div>
        <div class="card-list">
          ${state.rfqs.map((rfq) => rfqCard(rfq)).join("")}
        </div>
      </div>
    </section>
  `;
}

function quotationsView() {
  return `
    <section class="split top-heavy">
      <form class="panel form-panel" data-form="quotation">
        <div class="panel-head"><h2>Receive Quotation</h2><span>Vendor response</span></div>
        ${select("RFQ", "rfqId", state.rfqs.map((rfq) => rfq.id))}
        ${select("Vendor", "vendorId", state.vendors.map((vendor) => vendor.id))}
        <div class="two-col">
          ${input("Amount", "amount", "1250000", true, "number")}
          ${input("Delivery days", "deliveryDays", "10", true, "number")}
        </div>
        <div class="two-col">
          ${input("Validity", "validity", "", true, "date")}
          ${input("Score", "score", "85", true, "number", "1", "0", "100")}
        </div>
        ${textarea("Warranty", "warranty", "Warranty and support terms", true)}
        <button type="submit">Record quotation</button>
      </form>
      <div class="panel table-panel">
        <div class="panel-head"><h2>Comparison Matrix</h2><span>Commercial scorecard</span></div>
        ${quotationTable()}
      </div>
    </section>
  `;
}

function approvalsView() {
  return `
    <section class="panel">
      <div class="panel-head"><h2>Approval Queue</h2><span>Role-based workflow</span></div>
      <div class="approval-grid">
        ${state.approvals.map((approval) => approvalCard(approval)).join("") || emptyState("No approval requests yet.")}
      </div>
    </section>
  `;
}

function ordersView() {
  return `
    <section class="panel">
      <div class="panel-head"><h2>Purchase Order Register</h2><span>Committed procurement</span></div>
      ${poTable()}
    </section>
  `;
}

function invoicesView() {
  const invoice = state.invoices.find((item) => item.id === selectedInvoiceId) || state.invoices[0];
  selectedInvoiceId = invoice?.id || "";

  return `
    <section class="invoice-layout">
      <div class="panel table-panel">
        <div class="panel-head"><h2>Invoice Register</h2><span>${state.invoices.length} invoices</span></div>
        ${invoiceTable()}
      </div>
      <div class="panel invoice-panel">
        <div class="panel-head">
          <h2>Invoice Preview</h2>
          <span>${invoice?.id || "No invoice"}</span>
        </div>
        ${invoice ? invoicePreview(invoice) : emptyState("Generate an invoice from a purchase order.")}
      </div>
    </section>
  `;
}

function activityView(compact = false) {
  const items = compact ? state.activities.slice(0, 5) : state.activities;
  return `
    <section class="panel ${compact ? "activity-panel" : ""}">
      <div class="panel-head"><h2>Activity Trail</h2><span>${state.activities.length} events</span></div>
      <div class="timeline">
        ${items.map((activity) => `
          <div class="timeline-item">
            <span class="dot"></span>
            <div>
              <strong>${activity.type}</strong>
              <p>${activity.text}</p>
              <small>${activity.at} by ${activity.actor}</small>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function kpi(label, value, hint) {
  return `
    <div class="kpi">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${hint}</small>
    </div>
  `;
}

function pipelineCard(rfq) {
  const quotations = state.quotations.filter((quotation) => quotation.rfqId === rfq.id);
  const best = [...quotations].sort((a, b) => b.score - a.score)[0];
  return `
    <article class="pipeline-card">
      <div>
        <span class="badge">${rfq.status}</span>
        <h3>${rfq.title}</h3>
        <p>${rfq.department} � ${rfq.category}</p>
      </div>
      <div class="pipeline-meta">
        <span>${formatCurrency(rfq.budget)}</span>
        <span>${quotations.length} quotes</span>
        <span>${best ? `${best.score} best score` : "awaiting quote"}</span>
      </div>
    </article>
  `;
}

function vendorTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Vendor</th><th>Category</th><th>Compliance</th><th>Risk</th><th>Rating</th><th>Spend YTD</th></tr></thead>
        <tbody>
          ${state.vendors.map((vendor) => `
            <tr>
              <td><strong>${vendor.name}</strong><span>${vendor.contact} � ${vendor.email}</span></td>
              <td>${vendor.category}</td>
              <td><span class="badge ${tone(vendor.compliance)}">${vendor.compliance}</span></td>
              <td><span class="badge ${tone(vendor.risk)}">${vendor.risk}</span></td>
              <td>${vendor.rating.toFixed(1)}</td>
              <td>${formatCurrency(vendor.spendYtd)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function quotationTable() {
  if (!state.quotations.length) return emptyState("No quotations have been received.");

  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Quotation</th><th>RFQ</th><th>Vendor</th><th>Total</th><th>Delivery</th><th>Score</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${state.quotations.map((quotation) => {
            const vendor = getVendor(state, quotation.vendorId);
            return `
              <tr>
                <td><strong>${quotation.id}</strong><span>Valid to ${quotation.validity}</span></td>
                <td>${quotation.rfqId}</td>
                <td>${vendor?.name || quotation.vendorId}</td>
                <td>${formatCurrency(quotation.amount + quotation.tax)}</td>
                <td>${quotation.deliveryDays} days</td>
                <td><strong>${quotation.score}</strong></td>
                <td><span class="badge ${tone(quotation.status)}">${quotation.status}</span></td>
                <td><button class="small" data-action="recommend" data-id="${quotation.id}">Recommend</button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function rfqCard(rfq) {
  const vendors = rfq.vendorIds.map((id) => getVendor(state, id)?.name).filter(Boolean);
  return `
    <article class="record-card">
      <div class="record-top">
        <span class="badge">${rfq.status}</span>
        <strong>${rfq.id}</strong>
      </div>
      <h3>${rfq.title}</h3>
      <p>${rfq.notes}</p>
      <div class="record-meta">
        <span>${rfq.department}</span>
        <span>${formatCurrency(rfq.budget)}</span>
        <span>Due ${rfq.dueDate}</span>
      </div>
      <div class="chip-row">${vendors.map((vendor) => `<span>${vendor}</span>`).join("") || "<span>No vendors matched</span>"}</div>
    </article>
  `;
}

function approvalCard(approval) {
  const quotation = getQuotation(state, approval.quotationId);
  const vendor = quotation ? getVendor(state, quotation.vendorId) : null;
  const canGeneratePo = approval.status === "Approved";
  return `
    <article class="approval-card">
      <div class="record-top">
        <span class="badge ${tone(approval.status)}">${approval.status}</span>
        <strong>${approval.id}</strong>
      </div>
      <h3>${approval.rfqId} � ${vendor?.name || "Vendor"}</h3>
      <p>${quotation ? `${quotation.id} for ${formatCurrency(quotation.amount + quotation.tax)}` : "Quotation unavailable"}</p>
      <div class="steps">
        ${approval.steps.map((step) => `
          <div class="step ${step.status.toLowerCase()}">
            <span>${step.role}</span>
            <strong>${step.status}</strong>
            <small>${step.actor}${step.date ? ` � ${step.date}` : ""}</small>
          </div>
        `).join("")}
      </div>
      <div class="button-row">
        <button class="secondary" data-action="approve" data-id="${approval.id}" ${approval.status === "Approved" ? "disabled" : ""}>Approve step</button>
        <button data-action="po" data-id="${approval.id}" ${canGeneratePo ? "" : "disabled"}>Generate PO</button>
      </div>
    </article>
  `;
}

function poTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>PO</th><th>Vendor</th><th>Source</th><th>Delivery</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${state.purchaseOrders.map((po) => {
            const vendor = getVendor(state, po.vendorId);
            return `
              <tr>
                <td><strong>${po.id}</strong><span>Issued ${po.issueDate}</span></td>
                <td>${vendor?.name || po.vendorId}</td>
                <td>${po.rfqId} � ${po.quotationId}</td>
                <td>${po.deliveryDate}</td>
                <td>${formatCurrency(po.amount)}</td>
                <td><span class="badge ${tone(po.status)}">${po.status}</span></td>
                <td><button class="small" data-action="invoice" data-id="${po.id}">Generate invoice</button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function invoiceTable() {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Invoice</th><th>Vendor</th><th>PO</th><th>Due</th><th>Total</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${state.invoices.map((invoice) => {
            const vendor = getVendor(state, invoice.vendorId);
            return `
              <tr class="${invoice.id === selectedInvoiceId ? "selected" : ""}">
                <td><strong>${invoice.id}</strong><span>${invoice.issueDate}</span></td>
                <td>${vendor?.name || invoice.vendorId}</td>
                <td>${invoice.poId}</td>
                <td>${invoice.dueDate}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td><span class="badge ${tone(invoice.status)}">${invoice.status}</span></td>
                <td><button class="small" data-action="select-invoice" data-id="${invoice.id}">Open</button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function invoicePreview(invoice) {
  const vendor = getVendor(state, invoice.vendorId);
  const po = getPo(state, invoice.poId);
  const rfq = po ? getRfq(state, po.rfqId) : null;
  const mailto = buildInvoiceMailto(invoice, vendor);

  return `
    <article class="invoice-document" id="printable-invoice">
      <div class="invoice-head">
        <div>
          <span>Invoice</span>
          <h2>${invoice.id}</h2>
        </div>
        <div>
          <strong>VendorBridge ERP</strong>
          <small>GSTIN 29AAACV0000A1Z5</small>
        </div>
      </div>
      <div class="invoice-parties">
        <div><span>Bill to</span><strong>${invoice.billTo}</strong><small>Procurement Finance Desk</small></div>
        <div><span>Vendor</span><strong>${vendor?.name || invoice.vendorId}</strong><small>${vendor?.address || ""}</small></div>
      </div>
      <div class="invoice-facts">
        <span>PO ${invoice.poId}</span>
        <span>RFQ ${rfq?.id || "N/A"}</span>
        <span>Issue ${invoice.issueDate}</span>
        <span>Due ${invoice.dueDate}</span>
      </div>
      <table class="invoice-lines">
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>${rfq?.title || "Procurement goods and services"}</td><td>${formatCurrency(invoice.subtotal)}</td></tr>
          <tr><td>GST 18%</td><td>${formatCurrency(invoice.tax)}</td></tr>
        </tbody>
        <tfoot><tr><td>Total payable</td><td>${formatCurrency(invoice.total)}</td></tr></tfoot>
      </table>
      <div class="invoice-actions no-print">
        <button class="secondary" data-action="print">Print invoice</button>
        <a class="button-link" href="${mailto}" data-action="email" data-id="${invoice.id}">Send email</a>
      </div>
    </article>
  `;
}

function buildInvoiceMailto(invoice, vendor) {
  const subject = encodeURIComponent(`Invoice ${invoice.id} from VendorBridge ERP`);
  const body = encodeURIComponent(`Hello ${vendor?.contact || "team"},\n\nPlease find invoice ${invoice.id} for PO ${invoice.poId}.\n\nTotal: ${formatCurrency(invoice.total)}\nDue date: ${invoice.dueDate}\n\nRegards,\nVendorBridge Procurement`);
  return `mailto:${vendor?.email || ""}?subject=${subject}&body=${body}`;
}

function input(label, name, placeholder, required = false, type = "text", step = "", min = "", max = "") {
  return `
    <label>
      <span>${label}</span>
      <input name="${name}" type="${type}" placeholder="${placeholder}" ${required ? "required" : ""} ${step ? `step="${step}"` : ""} ${min ? `min="${min}"` : ""} ${max ? `max="${max}"` : ""} />
    </label>
  `;
}

function textarea(label, name, placeholder, required = false) {
  return `
    <label>
      <span>${label}</span>
      <textarea name="${name}" placeholder="${placeholder}" ${required ? "required" : ""}></textarea>
    </label>
  `;
}

function select(label, name, options) {
  return `
    <label>
      <span>${label}</span>
      <select name="${name}">
        ${options.map((option) => `<option value="${option}">${option}</option>`).join("")}
      </select>
    </label>
  `;
}

function tone(value = "") {
  const normalized = value.toLowerCase();
  if (normalized.includes("approved") || normalized.includes("verified") || normalized === "low" || normalized === "sent" || normalized === "issued") return "good";
  if (normalized.includes("pending") || normalized.includes("medium") || normalized.includes("draft") || normalized.includes("received") || normalized.includes("recommended")) return "warn";
  if (normalized.includes("high") || normalized.includes("blocked")) return "bad";
  return "";
}

function emptyState(text) {
  return `<div class="empty-state">${text}</div>`;
}

app.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    activeView = nav.dataset.nav;
    render();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  const { action: actionName, id } = action.dataset;
  if (actionName === "reset") {
    state = resetState();
    selectedInvoiceId = state.invoices[0]?.id || "";
  }
  if (actionName === "recommend") recommendQuotation(state, id);
  if (actionName === "approve") approveCurrentStep(state, id);
  if (actionName === "po") generatePurchaseOrder(state, id);
  if (actionName === "invoice") {
    const invoice = generateInvoice(state, id);
    if (invoice) selectedInvoiceId = invoice.id;
    activeView = "invoices";
  }
  if (actionName === "select-invoice") selectedInvoiceId = id;
  if (actionName === "print") window.print();
  if (actionName === "email") markInvoiceSent(state, id);

  saveState(state);
  render();
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const kind = form.dataset.form;

  if (kind === "vendor") createVendor(state, formData);
  if (kind === "rfq") createRfq(state, formData);
  if (kind === "quotation") receiveQuotation(state, formData);

  form.reset();
  saveState(state);
  render();
});

render();
