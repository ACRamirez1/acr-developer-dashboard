// Supabase Configuration
const SUPABASE_URL = "https://osupaobkeecrnurthadf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXBhb2JrZWVjcm51cnRoYWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTgyNDgsImV4cCI6MjA2NjEzNDI0OH0.sLDji2S9iY61f1krbBrvn9EFfWL5ebu4BAXk6cnX17Q";

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication state
let currentUser = null;

// Check authentication on page load
document.addEventListener("DOMContentLoaded", async function () {
  await checkAuth();
  if (currentUser) {
    showDashboard();
    leadManager.loadLeadsFromSupabase();
  } else {
    showLoginModal();
  }
});

// Authentication functions
async function checkAuth() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  currentUser = user;
  updateAuthUI();
}

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    currentUser = data.user;
    updateAuthUI();
    closeModal("loginModal");
    showDashboard();
    leadManager.loadLeadsFromSupabase();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  updateAuthUI();
  showLoginModal();
}

function updateAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (currentUser) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
  } else {
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
}

function showLoginModal() {
  document.getElementById("loginModal").style.display = "block";
}

function showDashboard() {
  // Hide login modal if it's open
  document.getElementById("loginModal").style.display = "none";
}

// Dashboard Analytics and Management

// Update dashboard stats
function updateDashboardStats() {
  const leads = leadManager.leads;
  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const contactedLeads = leads.filter(
    (lead) => lead.status === "contacted"
  ).length;
  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "qualified"
  ).length;

  document.getElementById("totalLeads").textContent = totalLeads;
  document.getElementById("newLeads").textContent = newLeads;
  document.getElementById("contactedLeads").textContent = contactedLeads;
  document.getElementById("qualifiedLeads").textContent = qualifiedLeads;

  // Update conversion rates
  const newToContacted =
    totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;
  const contactedToQualified =
    contactedLeads > 0
      ? Math.round((qualifiedLeads / contactedLeads) * 100)
      : 0;
  const overallConversion =
    totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

  document.getElementById("newToContacted").textContent = newToContacted + "%";
  document.getElementById("contactedToQualified").textContent =
    contactedToQualified + "%";
  document.getElementById("overallConversion").textContent =
    overallConversion + "%";
}

// Filter leads
function filterLeads() {
  const statusFilter = document.getElementById("statusFilter").value;
  const serviceFilter = document.getElementById("serviceFilter").value;
  const searchTerm = document.getElementById("searchLeads").value.toLowerCase();

  let filteredLeads = leadManager.leads.filter((lead) => {
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    const matchesService =
      serviceFilter === "all" || lead.service === serviceFilter;
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm) ||
      lead.company.toLowerCase().includes(searchTerm) ||
      lead.message.toLowerCase().includes(searchTerm);

    return matchesStatus && matchesService && matchesSearch;
  });

  displayFilteredLeads(filteredLeads);
}

// Display filtered leads
function displayFilteredLeads(leads) {
  const leadsContainer = document.getElementById("leadsContainer");

  if (leads.length === 0) {
    leadsContainer.innerHTML =
      '<p class="no-leads">No leads match your filters.</p>';
    return;
  }

  const leadsHTML = leads
    .map(
      (lead) => `
        <div class="lead-card ${lead.status}">
            <div class="lead-header">
                <h4>${lead.name}</h4>
                <span class="lead-status ${lead.status}">${lead.status}</span>
            </div>
            <div class="lead-details">
                <p><strong>Email:</strong> ${lead.email}</p>
                <p><strong>Company:</strong> ${lead.company || "N/A"}</p>
                <p><strong>Service:</strong> ${lead.service}</p>
                <p><strong>Date:</strong> ${new Date(
                  lead.date
                ).toLocaleDateString()}</p>
                <p><strong>Message:</strong> ${lead.message}</p>
            </div>
            <div class="lead-actions">
                <button onclick="leadManager.updateLeadStatus(${
                  lead.id
                }, 'contacted')" class="btn btn-small">Mark Contacted</button>
                <button onclick="leadManager.updateLeadStatus(${
                  lead.id
                }, 'qualified')" class="btn btn-small">Mark Qualified</button>
                <button onclick="leadManager.deleteLead(${
                  lead.id
                })" class="btn btn-small btn-danger">Delete</button>
            </div>
        </div>
    `
    )
    .join("");

  leadsContainer.innerHTML = leadsHTML;
}

// Clear all leads
function clearAllLeads() {
  if (
    confirm(
      "Are you sure you want to delete all leads? This action cannot be undone."
    )
  ) {
    leadManager.leads = [];
    leadManager.saveLeads();
    leadManager.displayLeads();
    updateDashboardStats();
  }
}

// Modal functions
function showEmailTemplates() {
  document.getElementById("emailTemplatesModal").style.display = "block";
}

function showFollowUpSchedule() {
  document.getElementById("followUpModal").style.display = "block";
}

function showSocialContent() {
  alert(
    "Social media content ideas:\n\n" +
      '1. "Just launched a stunning WordPress website for [Client Name]! Check out the transformation 🚀"\n' +
      '2. "Your website is often the first impression customers have of your business. Make it count! 💻✨"\n' +
      '3. "WordPress vs Custom Development - which is right for your business? Let\'s discuss! 🤔"\n' +
      '4. "Before & After: Website redesign that increased conversions by 150% 📈"\n' +
      '5. "Free website audit - discover what\'s holding your site back from success! 🔍"'
  );
}

function showLeadResearch() {
  alert(
    "Lead Research Strategies:\n\n" +
      "1. LinkedIn: Search for businesses in your target industries\n" +
      "2. Google My Business: Find local businesses with poor websites\n" +
      "3. Industry directories and associations\n" +
      "4. Facebook/Instagram business pages\n" +
      "5. Local Chamber of Commerce websites\n" +
      '6. Google search for "business name + website" to find outdated sites\n' +
      "7. Competitor analysis - check who's not using your competitors\n" +
      "8. Trade shows and networking events"
  );
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Copy template to clipboard
function copyTemplate(templateId) {
  const textarea = document.getElementById(templateId);
  textarea.select();
  document.execCommand("copy");

  // Show feedback
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = "Copied!";
  button.style.background = "#10b981";

  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = "";
  }, 2000);
}

// Save follow-up schedule
function saveFollowUpSchedule() {
  const firstFollowup = document.getElementById("firstFollowup").value;
  const secondFollowup = document.getElementById("secondFollowup").value;
  const finalFollowup = document.getElementById("finalFollowup").value;

  const schedule = {
    first: parseInt(firstFollowup),
    second: parseInt(secondFollowup),
    final: parseInt(finalFollowup),
  };

  localStorage.setItem("acr_followup_schedule", JSON.stringify(schedule));
  alert("Follow-up schedule saved!");
  closeModal("followUpModal");
}

// Load follow-up schedule
function loadFollowUpSchedule() {
  const schedule = JSON.parse(localStorage.getItem("acr_followup_schedule"));
  if (schedule) {
    document.getElementById("firstFollowup").value = schedule.first;
    document.getElementById("secondFollowup").value = schedule.second;
    document.getElementById("finalFollowup").value = schedule.final;
  }
}

// Enhanced lead manager with dashboard integration
const originalDisplayLeads = leadManager.displayLeads;
leadManager.displayLeads = function () {
  originalDisplayLeads.call(this);
  updateDashboardStats();
};

const originalUpdateLeadStatus = leadManager.updateLeadStatus;
leadManager.updateLeadStatus = function (leadId, status) {
  originalUpdateLeadStatus.call(this, leadId, status);
  updateDashboardStats();
};

const originalDeleteLead = leadManager.deleteLead;
leadManager.deleteLead = function (leadId) {
  originalDeleteLead.call(this, leadId);
  updateDashboardStats();
};

// Analytics functions (placeholder for future chart integration)
function initializeAnalytics() {
  // In a real implementation, you'd integrate with Chart.js or similar
  console.log("Analytics initialized");

  // Placeholder for charts
  const chartContainers = document.querySelectorAll(".chart-container");
  chartContainers.forEach((container) => {
    container.innerHTML =
      "<p>Chart will be displayed here when data is available</p>";
  });
}

// Export enhanced leads with more data
function exportEnhancedLeads() {
  const leads = leadManager.leads;
  const enhancedLeads = leads.map((lead) => ({
    ...lead,
    daysSinceContact: Math.floor(
      (new Date() - new Date(lead.date)) / (1000 * 60 * 60 * 24)
    ),
    statusAge: getStatusAge(lead),
    priority: calculatePriority(lead),
  }));

  const csvContent = leadManager.convertToCSV(enhancedLeads);
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `acr-enhanced-leads-${
    new Date().toISOString().split("T")[0]
  }.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function getStatusAge(lead) {
  const statusChanges = lead.statusHistory || [];
  if (statusChanges.length === 0) {
    return Math.floor(
      (new Date() - new Date(lead.date)) / (1000 * 60 * 60 * 24)
    );
  }
  const lastChange = statusChanges[statusChanges.length - 1];
  return Math.floor(
    (new Date() - new Date(lastChange.date)) / (1000 * 60 * 60 * 24)
  );
}

function calculatePriority(lead) {
  let priority = 0;

  // New leads get higher priority
  if (lead.status === "new") priority += 10;
  if (lead.status === "contacted") priority += 5;

  // Recent leads get higher priority
  const daysSinceContact = Math.floor(
    (new Date() - new Date(lead.date)) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceContact <= 1) priority += 8;
  else if (daysSinceContact <= 3) priority += 6;
  else if (daysSinceContact <= 7) priority += 4;

  // Certain services might be higher priority
  if (lead.service === "wordpress") priority += 2;
  if (lead.service === "custom") priority += 3;

  return priority;
}

// Auto-refresh dashboard
function autoRefreshDashboard() {
  setInterval(() => {
    updateDashboardStats();
  }, 30000); // Refresh every 30 seconds
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  updateDashboardStats();
  initializeAnalytics();
  loadFollowUpSchedule();
  autoRefreshDashboard();

  // Close modals when clicking outside
  window.onclick = function (event) {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  };

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "e":
          e.preventDefault();
          leadManager.exportLeads();
          break;
        case "f":
          e.preventDefault();
          document.getElementById("searchLeads").focus();
          break;
        case "n":
          e.preventDefault();
          window.location.href = "index.html#contact";
          break;
      }
    }
  });
});

// Performance monitoring for dashboard
function monitorDashboardPerformance() {
  const startTime = performance.now();

  window.addEventListener("load", () => {
    const loadTime = performance.now() - startTime;
    console.log(`Dashboard load time: ${loadTime.toFixed(2)}ms`);

    if (loadTime > 2000) {
      console.warn("Dashboard is loading slowly. Consider optimizing.");
    }
  });
}

monitorDashboardPerformance();

// Export functions for global access
window.filterLeads = filterLeads;
window.clearAllLeads = clearAllLeads;
window.showEmailTemplates = showEmailTemplates;
window.showFollowUpSchedule = showFollowUpSchedule;
window.showSocialContent = showSocialContent;
window.showLeadResearch = showLeadResearch;
window.closeModal = closeModal;
window.copyTemplate = copyTemplate;
window.saveFollowUpSchedule = saveFollowUpSchedule;
window.exportEnhancedLeads = exportEnhancedLeads;

// Lead Manager with Supabase Integration
const leadManager = {
  leads: [],

  // Load leads from Supabase
  async loadLeadsFromSupabase() {
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      this.leads = data || [];
      this.displayLeads();
      updateDashboardStats();
    } catch (error) {
      console.error("Error loading leads:", error);
      // Fallback to localStorage if Supabase fails
      this.loadLeadsFromLocalStorage();
    }
  },

  // Load leads from localStorage (fallback)
  loadLeadsFromLocalStorage() {
    const storedLeads = localStorage.getItem("acr_leads");
    this.leads = storedLeads ? JSON.parse(storedLeads) : [];
    this.displayLeads();
    updateDashboardStats();
  },

  // Save leads to Supabase
  async saveLeadsToSupabase() {
    try {
      // First, clear existing leads
      await supabaseClient.from("leads").delete().neq("id", 0);

      // Then insert all current leads
      if (this.leads.length > 0) {
        const { error } = await supabaseClient.from("leads").insert(this.leads);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving leads to Supabase:", error);
      // Fallback to localStorage
      this.saveLeadsToLocalStorage();
    }
  },

  // Save leads to localStorage (fallback)
  saveLeadsToLocalStorage() {
    localStorage.setItem("acr_leads", JSON.stringify(this.leads));
  },

  // Add new lead
  async addLead(lead) {
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .insert([lead])
        .select();

      if (error) throw error;

      this.leads.unshift(data[0]);
      this.displayLeads();
      updateDashboardStats();
    } catch (error) {
      console.error("Error adding lead:", error);
      // Fallback to localStorage
      lead.id = Date.now();
      this.leads.unshift(lead);
      this.saveLeadsToLocalStorage();
      this.displayLeads();
      updateDashboardStats();
    }
  },

  // Update lead status
  async updateLeadStatus(leadId, status) {
    try {
      const { error } = await supabaseClient
        .from("leads")
        .update({ status: status })
        .eq("id", leadId);

      if (error) throw error;

      const lead = this.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.status = status;
        this.displayLeads();
        updateDashboardStats();
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
      // Fallback to localStorage
      const lead = this.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.status = status;
        this.saveLeadsToLocalStorage();
        this.displayLeads();
        updateDashboardStats();
      }
    }
  },

  // Delete lead
  async deleteLead(leadId) {
    try {
      const { error } = await supabaseClient
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;

      this.leads = this.leads.filter((l) => l.id !== leadId);
      this.displayLeads();
      updateDashboardStats();
    } catch (error) {
      console.error("Error deleting lead:", error);
      // Fallback to localStorage
      this.leads = this.leads.filter((l) => l.id !== leadId);
      this.saveLeadsToLocalStorage();
      this.displayLeads();
      updateDashboardStats();
    }
  },

  // Display leads
  displayLeads() {
    const leadsContainer = document.getElementById("leadsContainer");
    if (!leadsContainer) return;

    if (this.leads.length === 0) {
      leadsContainer.innerHTML = '<p class="no-leads">No leads found.</p>';
      return;
    }

    const leadsHTML = this.leads
      .map(
        (lead) => `
            <div class="lead-card ${lead.status}">
                <div class="lead-header">
                    <h4>${lead.name}</h4>
                    <span class="lead-status ${lead.status}">${
          lead.status
        }</span>
                </div>
                <div class="lead-details">
                    <p><strong>Email:</strong> ${lead.email}</p>
                    <p><strong>Company:</strong> ${lead.company || "N/A"}</p>
                    <p><strong>Service:</strong> ${lead.service}</p>
                    <p><strong>Date:</strong> ${new Date(
                      lead.date || lead.created_at
                    ).toLocaleDateString()}</p>
                    <p><strong>Message:</strong> ${lead.message}</p>
                </div>
                <div class="lead-actions">
                    <button onclick="leadManager.updateLeadStatus(${
                      lead.id
                    }, 'contacted')" class="btn btn-small">Mark Contacted</button>
                    <button onclick="leadManager.updateLeadStatus(${
                      lead.id
                    }, 'qualified')" class="btn btn-small">Mark Qualified</button>
                    <button onclick="leadManager.deleteLead(${
                      lead.id
                    })" class="btn btn-small btn-danger">Delete</button>
                </div>
            </div>
        `
      )
      .join("");

    leadsContainer.innerHTML = leadsHTML;
  },

  // Export leads to CSV
  exportLeads() {
    const csvContent = this.convertToCSV(this.leads);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acr-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // Convert leads to CSV format
  convertToCSV(leads) {
    const headers = [
      "Name",
      "Email",
      "Company",
      "Service",
      "Status",
      "Date",
      "Message",
    ];
    const csvRows = [headers.join(",")];

    leads.forEach((lead) => {
      const row = [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.company || ""}"`,
        `"${lead.service}"`,
        `"${lead.status}"`,
        `"${new Date(lead.date || lead.created_at).toLocaleDateString()}"`,
        `"${lead.message.replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  },
};
