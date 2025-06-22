// Supabase Configuration
// Force new build on Vercel to clear cache
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

  // Set the 'Overview' tab as active by default
  switchTab("overview");

  // Form Submissions
  document
    .getElementById("addLeadForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      const leadData = {
        name: formData.get("lead-name"),
        company: formData.get("lead-company"),
        email: formData.get("lead-email"),
        phone: formData.get("lead-phone"),
        website_url: formData.get("lead-website"),
        service: formData.get("lead-service"),
        status: formData.get("lead-status"),
        lead_source: formData.get("lead-source"),
        priority_level: formData.get("priority-level"),
        notes: formData.get("lead-notes"),
        contact_status: "not_contacted",
        lead_stage: "new",
      };
      leadManager.addLead(leadData);
      this.reset();
    });

  document
    .getElementById("quickAddForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      const prospectData = {
        company: formData.get("prospect-company"),
        website_url: formData.get("prospect-website"),
        lead_source: "prospecting_hub",
        priority_level: "medium",
        contact_status: "not_contacted",
        lead_stage: "new",
        status: "new",
      };
      leadManager.quickAddProspect(prospectData);
      this.reset();
    });
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

// =================================================================================
// NEW LEAD MANAGEMENT UI FUNCTIONS
// =================================================================================

function switchTab(tabName) {
  // Hide all tab content
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content) => {
    content.style.display = "none";
  });

  // Deactivate all tab buttons
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Show the selected tab content
  document.getElementById(tabName + "-tab").style.display = "block";

  // Activate the selected tab button
  const activeButton = document.querySelector(
    `.tab-button[onclick="switchTab('${tabName}')"]`
  );
  activeButton.classList.add("active");

  // Load data for the specific tab
  if (tabName === "prospecting") {
    leadManager.renderProspectingTable();
  } else if (tabName === "contacted") {
    leadManager.renderContactedTable();
  } else {
    leadManager.displayLeads(); // The original card view
  }
}

function showAddLeadModal() {
  document.getElementById("addLeadModal").style.display = "block";
}

function showLeadResearchHub() {
  document.getElementById("leadResearchHubModal").style.display = "block";
}

function openResearchTool(tool) {
  let url = "";
  switch (tool) {
    case "google-outdated":
      url =
        "https://www.google.com/search?q=intext:%22copyright+2019..2021%22+law+firm+in+new+york";
      break;
    case "linkedin-prospects":
      url = "https://www.linkedin.com/sales/search/people";
      break;
    case "local-directory":
      url = "https://www.google.com/search?q=local+chamber+of+commerce";
      break;
    case "competitor-analysis":
      url = "https://www.google.com/search?q=similarweb+competitor+analysis";
      break;
  }
  if (url) {
    window.open(url, "_blank");
  }
}

// Dashboard Analytics and Management

// Update dashboard stats
function updateDashboardStats() {
  const totalLeads = leadManager.leads.length;
  const newLeads = leadManager.leads.filter(
    (lead) => lead.status === "new" || lead.status === null
  ).length;
  const contactedLeads = leadManager.leads.filter(
    (lead) => lead.status === "contacted"
  ).length;
  const qualifiedLeads = leadManager.leads.filter(
    (lead) => lead.status === "qualified"
  ).length;
  const closedLeads = leadManager.leads.filter(
    (lead) => lead.status === "closed_won"
  ).length;

  document.getElementById("total-leads-stat").textContent = totalLeads;
  document.getElementById("new-leads-stat").textContent = newLeads;
  document.getElementById("contacted-leads-stat").textContent = contactedLeads;
  document.getElementById("qualified-leads-stat").textContent = qualifiedLeads;
  document.getElementById("closed-leads-stat").textContent = closedLeads;

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
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
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

  // Load ALL leads from Supabase and categorize them
  async loadLeadsFromSupabase() {
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      this.leads = data || [];

      // Initial render based on the active tab
      this.updateActiveTabView();
      updateDashboardStats();
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  },

  updateActiveTabView() {
    const activeTab = document.querySelector(".tab-button.active");
    if (activeTab) {
      const tabName = activeTab
        .getAttribute("onclick")
        .replace("switchTab('", "")
        .replace("')", "");
      switchTab(tabName);
    } else {
      this.displayLeads(); // Default to overview
    }
  },

  // Add new lead from the main modal
  async addLead(leadData) {
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .insert([leadData])
        .select();

      if (error) throw error;

      this.leads.unshift(data[0]);
      this.updateActiveTabView();
      updateDashboardStats();
      closeModal("addLeadModal");
    } catch (error) {
      console.error("Error adding lead:", error);
      alert("Failed to add lead. Check console for details.");
    }
  },

  // Quick add a prospect from the research hub
  async quickAddProspect(prospectData) {
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .insert([prospectData])
        .select();

      if (error) throw error;

      this.leads.unshift(data[0]);
      if (
        document.getElementById("prospecting-tab").style.display === "block"
      ) {
        this.renderProspectingTable();
      }
      updateDashboardStats();
      document.getElementById("quickAddForm").reset();
    } catch (error) {
      console.error("Error adding prospect:", error);
      alert("Failed to add prospect. Check console for details.");
    }
  },

  // Update lead status and other fields
  async updateLead(leadId, updatedFields) {
    try {
      const { data, error } = await supabaseClient
        .from("leads")
        .update(updatedFields)
        .eq("id", leadId)
        .select();

      if (error) throw error;

      // Update the local cache
      const index = this.leads.findIndex((l) => l.id === leadId);
      if (index !== -1) {
        this.leads[index] = { ...this.leads[index], ...data[0] };
      }

      this.updateActiveTabView();
      updateDashboardStats();
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  },

  // RENDER PROSPECTING TABLE
  renderProspectingTable() {
    const container = document.getElementById("prospectingTable");
    const prospects = this.leads.filter(
      (lead) =>
        lead.contact_status === "not_contacted" || lead.contact_status === null
    );

    if (prospects.length === 0) {
      container.innerHTML = `<p class="no-leads">No new prospects. Use the Research Hub to find some!</p>`;
      return;
    }

    const tableHTML = `
      <table class="prospect-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Contact</th>
            <th>Website</th>
            <th>Industry</th>
            <th>Priority</th>
            <th>Contact Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${prospects
            .map(
              (lead) => `
            <tr>
              <td>${lead.company || "N/A"}</td>
              <td>${lead.name || "N/A"}</td>
              <td><a href="${lead.website_url}" target="_blank">${
                lead.website_url || "N/A"
              }</a></td>
              <td>${lead.industry || "N/A"}</td>
              <td><span class="priority-badge priority-${
                lead.priority_level
              }">${lead.priority_level}</span></td>
              <td>
                <select class="contact-status-select" onchange="leadManager.updateLead(${
                  lead.id
                }, { contact_status: this.value })">
                  <option value="not_contacted" ${
                    lead.contact_status === "not_contacted" ? "selected" : ""
                  }>Not Contacted</option>
                  <option value="contacted" ${
                    lead.contact_status === "contacted" ? "selected" : ""
                  }>Contacted</option>
                </select>
              </td>
              <td><button class="btn btn-small" onclick="leadManager.deleteLead(${
                lead.id
              })">Delete</button></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
    container.innerHTML = tableHTML;
  },

  // RENDER CONTACTED LEADS TABLE
  renderContactedTable() {
    const container = document.getElementById("contactedTable");
    const contactedLeads = this.leads.filter(
      (lead) =>
        lead.contact_status === "contacted" || lead.first_contact_date !== null
    );

    if (contactedLeads.length === 0) {
      container.innerHTML = `<p class="no-leads">No contacted leads yet. Update a prospect's status to see them here.</p>`;
      return;
    }

    const tableHTML = `
      <table class="prospect-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Contact</th>
            <th>First Contact</th>
            <th>Last Contact</th>
            <th>Contact Count</th>
            <th>Status</th>
            <th>Next Follow-up</th>
          </tr>
        </thead>
        <tbody>
          ${contactedLeads
            .map(
              (lead) => `
            <tr>
              <td>${lead.company || "N/A"}</td>
              <td>${lead.name || "N/A"}</td>
              <td>${
                lead.first_contact_date
                  ? new Date(lead.first_contact_date).toLocaleDateString()
                  : "N/A"
              }</td>
              <td>${
                lead.last_contact_date
                  ? new Date(lead.last_contact_date).toLocaleDateString()
                  : "N/A"
              }</td>
              <td>${lead.contact_count || 0}</td>
              <td><span class="contact-status ${lead.status}">${
                lead.status
              }</span></td>
              <td>${
                lead.next_follow_up_date
                  ? new Date(lead.next_follow_up_date).toLocaleDateString()
                  : "Not Set"
              }</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
    container.innerHTML = tableHTML;
  },

  // ORIGINAL DISPLAYLEADS - can be kept for the overview tab
  displayLeads() {
    const leadsContainer = document.getElementById("leadsContainer");
    if (!leadsContainer) return;

    // You might want to filter what this view shows, e.g., only 'active' leads
    const activeLeads = this.leads.filter((l) => l.lead_stage !== "archived");

    if (activeLeads.length === 0) {
      leadsContainer.innerHTML =
        '<p class="no-leads">No active leads found.</p>';
      return;
    }

    const leadsHTML = activeLeads
      .map(
        (lead) => `
      <div class="lead-card ${lead.status}">
        <div class="priority-indicator ${lead.priority_level}"></div>
        <div class="lead-header">
          <h4>${lead.name}</h4>
          <span class="lead-status ${lead.status}">${lead.status}</span>
        </div>
        <div class="lead-details">
          <p><strong>Company:</strong> ${lead.company || "N/A"}</p>
          <p><strong>Service:</strong> ${lead.service}</p>
          <p class="contact-date">Added: ${new Date(
            lead.created_at
          ).toLocaleDateString()}</p>
        </div>
        <div class="lead-actions">
          <button onclick="leadManager.updateLead(${
            lead.id
          }, { status: 'contacted' })" class="btn btn-small">Mark Contacted</button>
          <button onclick="leadManager.updateLead(${
            lead.id
          }, { status: 'qualified' })" class="btn btn-small">Mark Qualified</button>
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

  // Delete lead function (can be refactored to use the new updateLead method for archival)
  async deleteLead(leadId) {
    if (
      confirm(
        "Are you sure you want to permanently delete this lead? This action cannot be undone."
      )
    ) {
      try {
        const { error } = await supabaseClient
          .from("leads")
          .delete()
          .eq("id", leadId);

        if (error) throw error;

        this.leads = this.leads.filter((l) => l.id !== leadId);
        this.updateActiveTabView();
        updateDashboardStats();
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  },

  // ... other functions like exportLeads, convertToCSV can remain
};

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const user = supabaseClient.auth.user();
  if (user) {
    showDashboard();
    leadManager.loadLeadsFromSupabase();
  }

  // Set the 'Overview' tab as active by default
  switchTab("overview");
});

// Form Submissions
document.getElementById("addLeadForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const leadData = {
    name: formData.get("lead-name"),
    company: formData.get("lead-company"),
    email: formData.get("lead-email"),
    phone: formData.get("lead-phone"),
    website_url: formData.get("lead-website"),
    service: formData.get("lead-service"),
    status: formData.get("lead-status"),
    lead_source: formData.get("lead-source"),
    priority_level: formData.get("priority-level"),
    notes: formData.get("lead-notes"),
    contact_status: "not_contacted",
    lead_stage: "new",
  };
  leadManager.addLead(leadData);
});

document
  .getElementById("quickAddForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const prospectData = {
      company: formData.get("prospect-company"),
      website_url: formData.get("prospect-website"),
      lead_source: "prospecting_hub",
      priority_level: "medium",
      contact_status: "not_contacted",
      lead_stage: "new",
      status: "new",
    };
    leadManager.quickAddProspect(prospectData);
  });

// Modal closing logic
window.onclick = function (event) {
  const loginModal = document.getElementById("loginModal");
  const addLeadModal = document.getElementById("addLeadModal");
  const researchHubModal = document.getElementById("leadResearchHubModal");

  if (event.target == loginModal) {
    closeModal("loginModal");
  }
  if (event.target == addLeadModal) {
    closeModal("addLeadModal");
  }
  if (event.target == researchHubModal) {
    closeModal("leadResearchHubModal");
  }
};

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}
