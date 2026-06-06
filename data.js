export const ERP_STORAGE_KEY = "vendorbridge.procurement.erp.v1";

export const departments = ["Operations", "IT", "Facilities", "Finance"];
export const categories = ["Raw Materials", "IT Services", "Logistics", "Office Supplies", "Facilities"];
export const approvalRoles = ["Requester", "Procurement Manager", "Finance Controller", "CFO"];

export const seedData = {
  user: {
    name: "Aarav Mehta",
    role: "Procurement Manager",
    email: "aarav@acme.example"
  },
  vendors: [
    {
      id: "VEN-1001",
      name: "Northstar Industrial Supplies",
      category: "Raw Materials",
      contact: "Riya Shah",
      email: "riya@northstar.example",
      phone: "+91 98765 11223",
      rating: 4.8,
      risk: "Low",
      compliance: "Verified",
      paymentTerms: "Net 30",
      address: "Plot 18, MIDC Industrial Area, Pune",
      spendYtd: 4820000
    },
    {
      id: "VEN-1002",
      name: "BlueGrid Technologies",
      category: "IT Services",
      contact: "Kabir Sinha",
      email: "kabir@bluegrid.example",
      phone: "+91 98111 67421",
      rating: 4.5,
      risk: "Medium",
      compliance: "Verified",
      paymentTerms: "Net 45",
      address: "7th Floor, Sigma Tech Park, Bengaluru",
      spendYtd: 2650000
    },
    {
      id: "VEN-1003",
      name: "SwiftHaul Logistics",
      category: "Logistics",
      contact: "Naina Rao",
      email: "naina@swifthaul.example",
      phone: "+91 90044 87654",
      rating: 4.2,
      risk: "Low",
      compliance: "Verified",
      paymentTerms: "Net 15",
      address: "Dock 4, Nhava Sheva Logistics Hub, Navi Mumbai",
      spendYtd: 1900000
    },
    {
      id: "VEN-1004",
      name: "UrbanDesk Office Mart",
      category: "Office Supplies",
      contact: "Devika Menon",
      email: "devika@urbandesk.example",
      phone: "+91 99880 22334",
      rating: 3.9,
      risk: "Medium",
      compliance: "Pending",
      paymentTerms: "Net 30",
      address: "Unit B-12, Okhla Phase II, New Delhi",
      spendYtd: 730000
    }
  ],
  rfqs: [
    {
      id: "RFQ-2406-014",
      title: "Quarterly packaging material supply",
      category: "Raw Materials",
      department: "Operations",
      requester: "Meera Iyer",
      status: "Quotations Received",
      dueDate: "2026-06-15",
      budget: 1850000,
      items: [
        { name: "Corrugated cartons", qty: 50000, unit: "pcs", targetPrice: 22 },
        { name: "Protective inserts", qty: 50000, unit: "pcs", targetPrice: 8 }
      ],
      vendorIds: ["VEN-1001", "VEN-1004"],
      notes: "Vendors must include GST, delivery lead time, and quality certificate."
    },
    {
      id: "RFQ-2406-015",
      title: "Cloud migration support retainer",
      category: "IT Services",
      department: "IT",
      requester: "Rohan Kulkarni",
      status: "Open",
      dueDate: "2026-06-20",
      budget: 2400000,
      items: [
        { name: "Migration architect", qty: 120, unit: "hours", targetPrice: 7500 },
        { name: "DevOps engineer", qty: 240, unit: "hours", targetPrice: 4200 }
      ],
      vendorIds: ["VEN-1002"],
      notes: "Include service credits and escalation matrix."
    }
  ],
  quotations: [
    {
      id: "QTN-7741",
      rfqId: "RFQ-2406-014",
      vendorId: "VEN-1001",
      amount: 1685000,
      tax: 303300,
      deliveryDays: 9,
      validity: "2026-07-05",
      warranty: "12 months quality replacement",
      status: "Recommended",
      score: 94,
      submittedAt: "2026-06-03"
    },
    {
      id: "QTN-7742",
      rfqId: "RFQ-2406-014",
      vendorId: "VEN-1004",
      amount: 1740000,
      tax: 313200,
      deliveryDays: 13,
      validity: "2026-07-01",
      warranty: "6 months replacement",
      status: "Received",
      score: 82,
      submittedAt: "2026-06-04"
    }
  ],
  approvals: [
    {
      id: "APR-9004",
      rfqId: "RFQ-2406-014",
      quotationId: "QTN-7741",
      status: "Pending Finance",
      requestedBy: "Meera Iyer",
      currentStep: "Finance Controller",
      steps: [
        { role: "Requester", actor: "Meera Iyer", status: "Approved", date: "2026-06-04", note: "Meets operational requirement." },
        { role: "Procurement Manager", actor: "Aarav Mehta", status: "Approved", date: "2026-06-05", note: "Best commercial score." },
        { role: "Finance Controller", actor: "Pending", status: "Pending", date: "", note: "" },
        { role: "CFO", actor: "Pending", status: "Waiting", date: "", note: "" }
      ]
    }
  ],
  purchaseOrders: [
    {
      id: "PO-2606-008",
      rfqId: "RFQ-2406-014",
      quotationId: "QTN-7741",
      vendorId: "VEN-1001",
      status: "Draft",
      issueDate: "2026-06-06",
      deliveryDate: "2026-06-18",
      amount: 1988300,
      owner: "Aarav Mehta"
    }
  ],
  invoices: [
    {
      id: "INV-2026-102",
      poId: "PO-2606-008",
      vendorId: "VEN-1001",
      status: "Draft",
      issueDate: "2026-06-06",
      dueDate: "2026-07-06",
      subtotal: 1685000,
      tax: 303300,
      total: 1988300,
      billTo: "Acme Manufacturing Pvt Ltd",
      sentAt: ""
    }
  ],
  activities: [
    { id: "ACT-1", at: "2026-06-06 09:45", type: "Invoice", text: "Draft invoice INV-2026-102 generated from PO-2606-008.", actor: "Aarav Mehta" },
    { id: "ACT-2", at: "2026-06-05 16:20", type: "Approval", text: "Procurement Manager approved QTN-7741 for RFQ-2406-014.", actor: "Aarav Mehta" },
    { id: "ACT-3", at: "2026-06-04 11:10", type: "Quotation", text: "UrbanDesk submitted QTN-7742.", actor: "Devika Menon" },
    { id: "ACT-4", at: "2026-06-03 14:05", type: "Quotation", text: "Northstar submitted QTN-7741.", actor: "Riya Shah" }
  ]
};

export function cloneSeedData() {
  return JSON.parse(JSON.stringify(seedData));
}
