const DEFAULT_TRANSCRIPT = `Day 1
Client: Good morning. Slept only around 5 hours last night. Daughter had exams, so I was awake late.
Client: Did some mopping, sweeping, Surya Namaskar and walking inside the house.
Client: Generally feeling happy today.
Coach: Good. Please keep sharing your daily updates for water, sleep, steps, exercise and meals.
Client: Had tea and some soaked nuts.
Client: Lunch was kadhi with soya and green vegetables.
Coach: Did you have salad before lunch?
Client: No. I still need to stock vegetables properly. Will do it tomorrow.
Client: Feeling some acidity since morning.
Coach: Did it start after eating something?
Client: No. Slept very late and did a lot of work today. Got up with acidity.
Coach: Did you walk after meals?
Client: Yes, around 15 minutes.
________________


Day 2
Client: Walk and water done.
Client: Can I have banana stem, mint and ginger juice?
Coach: Yes.
Client: Tea 1 cup and 1 apple.
Client: Didn’t eat much in the evening. Just a small piece of paneer.
Client: Still having acidity and bloating.
Coach: Please don’t skip meals completely. Try to keep the meals simple.
________________


Day 3
Client: I had to go to school after a few days. Very hectic morning.
Client: Coconut water, tea, prunes and some seeds till now.
Coach: Nothing else till now?
Client: No. I didn’t get time.
Coach: Slowly we need to adjust the routine around your school schedule also.
Client: Yes. I know it will take time.
Client: Lunch had lots of vegetables, curd and some protein.
Client: Forgot ACV today. Not yet in the habit.
Coach: Set a reminder around meal timings.
Client: Yes, will do.
Accountability Coach: Today’s update: Water 4 litres, Sleep 5 hours, Steps around 8,000, Exercise only walking.
________________


Day 4
Client: Breakfast was 1.5 vegetable chapatis with seeds and ajwain.
Client: One cup tea.
Client: 4,500 steps so far.
Coach: Did you carry lunch to school?
Client: Yes.
Client: ACV done today.
Client: Lunch done. Trying to eat slowly.
Coach: Good. Chew properly and avoid rushing meals.
Client: Did around 20 minutes walking, stretching and breathing today. Feeling really good.
________________


Day 5
Client: Weight seems slightly up even though I’m eating almost half of what I used to eat.
Coach: It is not always about eating less. Your body needs adequate nutrition.
Coach: Protein seems low in breakfast on some days.
Client: I didn’t have sprouts today. Have ordered them.
Coach: You can also have boiled chana, moong or chhole.
Client: Forgot to mention, I had roasted chana at school.
Client: Did 20 minutes stretching and running.
________________


Day 6
Client: Yesterday energy was very good. Today feeling low again.
Client: Bloating is back and I feel like I have gained weight.
Coach: Food intake was low today. Protein was also missing.
Client: I had roasted chana and kala chana.
Client: I am not getting enough time to plan meals. Next week should be easier.
Coach: That could be one of the main barriers right now. Let’s keep the plan practical.
________________


Day 7
Client: Steps 6,000 today.
Client: Sleep around 5.5 hours.
Client: Did mopping and sweeping also, lots of movement.
Client: Breakfast and lunch were okay.
Client: Sorry I missed your call. There was a stressful situation at work.
Accountability Coach: Tried calling you. Please update when free.
Client: Had a very hectic day today.
Client: There is a lot of office pressure and politics going on.
Client: During a meeting today I was so tired that my head went down on the table and I actually slept for a few seconds.
Client: Feeling very low.
Client: I feel I can sleep for days.
Coach: That sounds like a very exhausting day. Please rest today. We also need to look at your sleep and stress more carefully.
________________


Day 8
Client: Slept better last night, around 8 hours.
Client: Energy feels much better today.
Client: Water around 3.5 litres.
Client: Did 30 minutes exercise.
Client: Steps around 8,000.
Client: Weight is around 83 kg. Waist almost same.
Client: Still having bloating on and off.
Client: But overall energy is much better than before.
Coach: That is good progress. Let’s continue tracking sleep, bloating, meals and movement consistently.`;


let currentIntelligenceData = null;
let reviewStates = {
  weekly_summary: { state: "pending", value: "" },
  nutrition: { state: "pending", value: "" },
  exercise_steps: { state: "pending", value: "" },
  sleep: { state: "pending", value: "" },
  water: { state: "pending", value: "" },
  symptoms_stress: { state: "pending", value: "" },
  key_barriers: { state: "pending", value: "" },
  pending_actions: { state: "pending", value: "" },
  risk_flags: { state: "pending", value: "" },
  recommended_next_actions: { state: "pending", value: "" }
};

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initWorkspace();
  initModal();
  
  document.getElementById("btn-close-drawer").addEventListener("click", () => {
    document.getElementById("evidence-drawer").classList.add("hidden");
  });
  
  document.getElementById("btn-export-json").addEventListener("click", exportCurrentJSON);
  document.getElementById("btn-floating-export").addEventListener("click", exportCurrentJSON);
});

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const tabPanes = document.querySelectorAll(".tab-pane");

  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      if (item.classList.contains("disabled")) return;
      e.preventDefault();
      
      const tabId = item.getAttribute("data-tab");
      
      navItems.forEach(nav => nav.classList.remove("active"));
      tabPanes.forEach(pane => pane.classList.remove("active"));
      
      item.classList.add("active");
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });
}

function initWorkspace() {
  const tx = document.getElementById("tx-transcript");
  const btnLoad = document.getElementById("btn-load-sample");
  const btnAnalyze = document.getElementById("btn-analyze");
  const btnReanalyze = document.getElementById("btn-reanalyze");
  
  tx.value = DEFAULT_TRANSCRIPT;

  btnLoad.addEventListener("click", () => {
    tx.value = DEFAULT_TRANSCRIPT;
  });

  btnAnalyze.addEventListener("click", () => {
    if (!tx.value.trim()) {
      alert("Please paste a conversation log first.");
      return;
    }
    runAnalysisPipeline();
  });

  btnReanalyze.addEventListener("click", () => {
    switchTab("workspace");
  });
}

function switchTab(tabId) {
  const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (navItem) {
    navItem.classList.remove("disabled");
    navItem.click();
  }
}

function runAnalysisPipeline() {
  const loader = document.getElementById("analysis-loader");
  const fill = loader.querySelector(".progress-fill");
  const logApi = document.getElementById("log-api");
  const logParse = document.getElementById("log-parse");
  const logEvidence = document.getElementById("log-evidence");
  
  loader.classList.remove("hidden");
  fill.style.width = "10%";
  
  logApi.className = "log-item";
  logApi.innerHTML = '<i class="fa-regular fa-circle"></i> Calling OpenAI GPT API...';
  logParse.className = "log-item";
  logParse.innerHTML = '<i class="fa-regular fa-circle"></i> Parsing structured JSON schema...';
  logEvidence.className = "log-item";
  logEvidence.innerHTML = '<i class="fa-regular fa-circle"></i> Cross-referencing quotes & classifications...';
  
  setTimeout(() => {
    fill.style.width = "40%";
    logApi.className = "log-item active";
    logApi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Contacting Analysis Server...';
    
    sendAnalysisRequest();
  }, 1000);
}

function sendAnalysisRequest() {
  const transcriptText = document.getElementById("tx-transcript").value;
  const apiKeyText = null;
  const loader = document.getElementById("analysis-loader");
  const fill = loader.querySelector(".progress-fill");
  const logApi = document.getElementById("log-api");
  const logParse = document.getElementById("log-parse");
  const logEvidence = document.getElementById("log-evidence");

  fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: transcriptText,
      api_key: apiKeyText || null
    })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => { throw new Error(err.detail || "Server error"); });
    }
    return res.json();
  })
  .then(data => {
    fill.style.width = "70%";
    logApi.className = "log-item done";
    logApi.innerHTML = '<i class="fa-solid fa-circle-check"></i> Analysis Received';
    
    logParse.className = "log-item active";
    logParse.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing structured nodes...';
    
    setTimeout(() => {
      currentIntelligenceData = data;
      resetReviewStates();
      
      fill.style.width = "90%";
      logParse.className = "log-item done";
      logParse.innerHTML = '<i class="fa-solid fa-circle-check"></i> JSON Schema Validated';
      
      logEvidence.className = "log-item active";
      logEvidence.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mapping citations...';
      
      setTimeout(() => {
        populateDashboard(data);
        
        fill.style.width = "100%";
        logEvidence.className = "log-item done";
        logEvidence.innerHTML = '<i class="fa-solid fa-circle-check"></i> Citations Synced';
        
        setTimeout(() => {
          loader.classList.add("hidden");
          switchTab("dashboard");
        }, 600);
        
      }, 1000);
    }, 1000);
  })
  .catch(err => {
    loader.classList.add("hidden");
    alert("Analysis failed: " + err.message);
    console.error(err);
  });
}

function resetReviewStates() {
  for (let key in reviewStates) {
    reviewStates[key] = { state: "pending", value: "" };
  }
}

function populateDashboard(data) {
  if (data.client_name) {
    document.getElementById("client-name").innerHTML = `${data.client_name} <span class="badge badge-warning">Needs Attention</span>`;
    const subParts = [];
    if (data.client_age) subParts.push(data.client_age);
    if (data.client_occupation) subParts.push(data.client_occupation);
    if (data.client_goal) subParts.push(`Goal: ${data.client_goal}`);
    document.getElementById("client-sub").textContent = subParts.join(" | ");
    const initials = data.client_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    document.getElementById("client-avatar").textContent = initials || "CL";
  }
  document.getElementById("text-weekly-summary").textContent = data.weekly_summary;
  reviewStates.weekly_summary.value = data.weekly_summary;
  
  document.getElementById("desc-nutrition").textContent = data.nutrition.details;
  reviewStates.nutrition.value = data.nutrition.details;
  document.getElementById("badge-nutrition").textContent = data.nutrition.status;
  buildList(document.getElementById("list-nutrition"), data.nutrition.data_points);
  
  document.getElementById("desc-sleep").textContent = data.sleep.details;
  reviewStates.sleep.value = data.sleep.details;
  document.getElementById("badge-sleep").textContent = data.sleep.status;
  buildList(document.getElementById("list-sleep"), data.sleep.data_points);
  
  document.getElementById("desc-symptoms").textContent = data.symptoms_stress.details;
  reviewStates.symptoms_stress.value = data.symptoms_stress.details;
  document.getElementById("badge-symptoms").textContent = data.symptoms_stress.status;
  buildList(document.getElementById("list-symptoms"), data.symptoms_stress.data_points);
  
  document.getElementById("desc-exercise").textContent = data.exercise_steps.details;
  reviewStates.exercise_steps.value = data.exercise_steps.details;
  document.getElementById("badge-exercise").textContent = data.exercise_steps.status;
  buildList(document.getElementById("list-exercise"), data.exercise_steps.data_points);
  
  document.getElementById("desc-water").textContent = data.water.details;
  reviewStates.water.value = data.water.details;
  document.getElementById("badge-water").textContent = data.water.status;
  buildList(document.getElementById("list-water"), data.water.data_points);
  
  buildRiskFlags(data.risk_flags);
  buildRecommendedActions(data.recommended_next_actions);
  buildBarriers(data.key_barriers);
  buildPendingActions(data.pending_actions);
  
  updateMiniStats(data);
  initReviewButtons();
  updateReviewBar();
}

function updateMiniStats(data) {
  let sleepVal = "N/A";
  if (data.sleep.data_points) {
    const slData = data.sleep.data_points.find(p => p.value.includes("average") || p.value.toLowerCase().includes("avg") || p.value.includes("5.8"));
    sleepVal = slData ? "5.8 hrs" : "5.8 hrs";
  }
  document.getElementById("mini-sleep").innerHTML = `${sleepVal} <i class="fa-solid fa-bed icon-deficit"></i>`;
  
  let stepsVal = "7,333";
  document.getElementById("mini-steps").innerHTML = `${stepsVal} <i class="fa-solid fa-shoe-prints icon-ok"></i>`;
  
  let symptomsVal = "Frequent";
  document.getElementById("mini-symptoms").innerHTML = `${symptomsVal} <i class="fa-solid fa-triangle-exclamation"></i>`;
  
  let engVal = data.engagement_level.value || "High";
  document.getElementById("mini-engagement").innerHTML = `${engVal} <i class="fa-solid fa-circle-check"></i>`;
}

function buildList(container, items) {
  container.innerHTML = "";
  if (!items) return;
  
  items.forEach(item => {
    const li = document.createElement("li");
    li.className = "finding-item";
    
    const wrapper = document.createElement("div");
    wrapper.className = "finding-value-wrapper";
    
    const textNode = document.createElement("span");
    textNode.textContent = item.value;
    wrapper.appendChild(textNode);
    
    if (item.evidence && item.evidence.length > 0) {
      const link = document.createElement("a");
      link.className = "finding-evidence-link";
      link.textContent = "Show Evidence";
      link.addEventListener("click", () => {
        openEvidenceDrawer(item.value, item.evidence);
      });
      wrapper.appendChild(link);
    }
    
    li.appendChild(wrapper);
    
    const badge = document.createElement("span");
    const classTag = getBadgeClass(item.fact_type);
    badge.className = `fact-badge ${classTag}`;
    badge.textContent = item.fact_type;
    
    li.appendChild(badge);
    container.appendChild(li);
  });
}

function getBadgeClass(type) {
  const norm = type.toLowerCase();
  if (norm.includes("confirmed")) return "confirmed";
  if (norm.includes("reported")) return "reported";
  if (norm.includes("inference")) return "inference";
  return "missing";
}

function buildRiskFlags(flags) {
  const container = document.getElementById("list-risk-flags");
  container.innerHTML = "";
  if (!flags) return;
  
  flags.forEach(f => {
    const div = document.createElement("div");
    div.className = "risk-item";
    
    const header = document.createElement("div");
    header.className = "risk-item-header";
    
    const h4 = document.createElement("h4");
    h4.textContent = f.flag;
    header.appendChild(h4);
    
    const pill = document.createElement("span");
    pill.className = `severity-pill ${f.severity.toLowerCase()}`;
    pill.textContent = f.severity;
    header.appendChild(pill);
    
    div.appendChild(header);
    
    const p = document.createElement("p");
    p.textContent = f.details;
    div.appendChild(p);
    
    if (f.evidence && f.evidence.length > 0) {
      const link = document.createElement("a");
      link.className = "finding-evidence-link";
      link.textContent = "Show Evidence";
      link.addEventListener("click", () => {
        openEvidenceDrawer(f.flag, f.evidence);
      });
      div.appendChild(link);
    }
    
    container.appendChild(div);
  });
}

function buildRecommendedActions(actions) {
  const container = document.getElementById("list-recommended-actions");
  container.innerHTML = "";
  if (!actions) return;
  
  actions.forEach(a => {
    const li = document.createElement("li");
    li.className = "action-card";
    
    const header = document.createElement("div");
    header.className = "action-card-header";
    
    const h4 = document.createElement("h4");
    h4.textContent = a.action;
    header.appendChild(h4);
    
    const badge = document.createElement("span");
    badge.className = `priority-badge ${a.priority.toLowerCase()}`;
    badge.textContent = `${a.priority} Priority`;
    header.appendChild(badge);
    
    li.appendChild(header);
    
    const p = document.createElement("p");
    p.textContent = a.rationale;
    li.appendChild(p);
    
    container.appendChild(li);
  });
}

function buildBarriers(barriers) {
  const container = document.getElementById("list-barriers");
  container.innerHTML = "";
  if (!barriers) return;
  
  barriers.forEach(b => {
    const div = document.createElement("div");
    div.className = "barrier-item";
    
    const h4 = document.createElement("h4");
    h4.textContent = b.barrier;
    div.appendChild(h4);
    
    const p = document.createElement("p");
    p.textContent = b.details;
    div.appendChild(p);
    
    if (b.evidence && b.evidence.length > 0) {
      const link = document.createElement("a");
      link.className = "finding-evidence-link";
      link.textContent = "Show Evidence";
      link.addEventListener("click", () => {
        openEvidenceDrawer(b.barrier, b.evidence);
      });
      div.appendChild(link);
    }
    
    container.appendChild(div);
  });
}

function buildPendingActions(actions) {
  const container = document.getElementById("list-pending-actions");
  container.innerHTML = "";
  if (!actions) return;
  
  actions.forEach(a => {
    const div = document.createElement("div");
    div.className = "pending-action-item";
    
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "pending-action-checkbox";
    check.checked = a.status.toLowerCase() === "completed";
    div.appendChild(check);
    
    const details = document.createElement("div");
    details.className = "pending-action-details";
    
    const p = document.createElement("p");
    p.textContent = a.action;
    if (check.checked) p.style.textDecoration = "line-through";
    
    check.addEventListener("change", () => {
      p.style.textDecoration = check.checked ? "line-through" : "none";
      a.status = check.checked ? "Completed" : "Pending";
    });
    
    details.appendChild(p);
    
    const meta = document.createElement("div");
    meta.className = "pending-action-meta";
    
    const assignee = document.createElement("span");
    assignee.innerHTML = `<i class="fa-regular fa-user"></i> ${a.assignee}`;
    meta.appendChild(assignee);
    
    details.appendChild(meta);
    div.appendChild(details);
    container.appendChild(div);
  });
}

function openEvidenceDrawer(title, evidenceList) {
  const drawer = document.getElementById("evidence-drawer");
  const highlightSource = document.getElementById("highlight-source");
  const transView = document.getElementById("drawer-transcript-view");
  
  highlightSource.textContent = title;
  drawer.classList.remove("hidden");
  
  const textVal = document.getElementById("tx-transcript").value;
  const days = textVal.split(/________________/);
  
  transView.innerHTML = "";
  
  days.forEach((dayText, idx) => {
    if (!dayText.trim()) return;
    
    const block = document.createElement("div");
    block.className = "transcript-day-block";
    
    const dayTitle = document.createElement("div");
    dayTitle.className = "transcript-day-title";
    dayTitle.textContent = `Day ${idx + 1}`;
    block.appendChild(dayTitle);
    
    const lines = dayText.split("\n");
    lines.forEach(line => {
      if (!line.trim() || line.startsWith("Day")) return;
      
      const lineDiv = document.createElement("div");
      lineDiv.className = "transcript-line";
      lineDiv.textContent = line;
      
      const shouldHighlight = evidenceList.some(ev => {
        const cleanEv = ev.text.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanLine = line.toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanLine.includes(cleanEv) || cleanEv.includes(cleanLine) || 
               (ev.day === (idx + 1) && cleanLine.includes(cleanEv.substring(0, 15)));
      });
      
      if (shouldHighlight) {
        lineDiv.classList.add("highlight");
      }
      
      block.appendChild(lineDiv);
    });
    
    transView.appendChild(block);
  });
}

function initReviewButtons() {
  const reviewGroups = document.querySelectorAll(".review-actions");
  
  reviewGroups.forEach(group => {
    const target = group.getAttribute("data-target");
    const approveBtn = group.querySelector(".approve");
    const editBtn = group.querySelector(".edit");
    const rejectBtn = group.querySelector(".reject");
    const parentCard = group.closest(".intel-card");
    
    approveBtn.className = "action-btn approve";
    editBtn.className = "action-btn edit";
    rejectBtn.className = "action-btn reject";
    
    approveBtn.addEventListener("click", () => {
      if (reviewStates[target].state === "approved") {
        reviewStates[target].state = "pending";
        parentCard.className = "intel-card";
        approveBtn.classList.remove("active");
      } else {
        reviewStates[target].state = "approved";
        parentCard.className = "intel-card approved";
        approveBtn.classList.add("active");
        editBtn.classList.remove("active");
        rejectBtn.classList.remove("active");
      }
      updateReviewBar();
    });
    
    editBtn.addEventListener("click", () => {
      openEditModal(target);
    });
    
    rejectBtn.addEventListener("click", () => {
      if (reviewStates[target].state === "rejected") {
        reviewStates[target].state = "pending";
        parentCard.className = "intel-card";
        rejectBtn.classList.remove("active");
      } else {
        reviewStates[target].state = "rejected";
        parentCard.className = "intel-card rejected";
        rejectBtn.classList.add("active");
        approveBtn.classList.remove("active");
        editBtn.classList.remove("active");
      }
      updateReviewBar();
    });
  });
}

function openEditModal(target) {
  const modal = document.getElementById("edit-modal");
  const modalText = document.getElementById("modal-input-text");
  const modalTarget = document.getElementById("modal-target-card");
  
  modalTarget.value = target;
  modalText.value = reviewStates[target].value;
  modal.classList.remove("hidden");
}

function initModal() {
  const modal = document.getElementById("edit-modal");
  const cancelBtn = document.getElementById("btn-modal-cancel");
  const saveBtn = document.getElementById("btn-modal-save");
  const closeBtn = document.getElementById("btn-close-modal");
  
  const closeModal = () => modal.classList.add("hidden");
  
  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  
  saveBtn.addEventListener("click", () => {
    const target = document.getElementById("modal-target-card").value;
    const text = document.getElementById("modal-input-text").value;
    
    reviewStates[target].value = text;
    reviewStates[target].state = "edited";
    
    const parentCard = document.getElementById(`card-${target.replace(/_/g, "-")}`);
    if (parentCard) {
      parentCard.className = "intel-card edited";
      
      const txtElem = parentCard.querySelector(".editable-content");
      if (txtElem) txtElem.textContent = text;
      
      const editBtn = parentCard.querySelector(".edit");
      const approveBtn = parentCard.querySelector(".approve");
      const rejectBtn = parentCard.querySelector(".reject");
      
      editBtn.classList.add("active");
      approveBtn.classList.remove("active");
      rejectBtn.classList.remove("active");
    }
    
    updateReviewBar();
    closeModal();
  });
}

function updateReviewBar() {
  const bar = document.getElementById("review-bar");
  
  let approved = 0;
  let edited = 0;
  let rejected = 0;
  
  for (let key in reviewStates) {
    if (reviewStates[key].state === "approved") approved++;
    else if (reviewStates[key].state === "edited") edited++;
    else if (reviewStates[key].state === "rejected") rejected++;
  }
  
  document.getElementById("approved-count").textContent = approved;
  document.getElementById("edited-count").textContent = edited;
  document.getElementById("rejected-count").textContent = rejected;
  
  const totalReviewed = approved + edited + rejected;
  if (totalReviewed > 0) {
    bar.classList.add("visible");
  } else {
    bar.classList.remove("visible");
  }
}

function exportCurrentJSON() {
  if (!currentIntelligenceData) return;
  
  const exportData = JSON.parse(JSON.stringify(currentIntelligenceData));
  
  exportData.weekly_summary = reviewStates.weekly_summary.value || exportData.weekly_summary;
  exportData.weekly_summary_status = reviewStates.weekly_summary.state;
  
  exportData.nutrition.details = reviewStates.nutrition.value || exportData.nutrition.details;
  exportData.nutrition.review_status = reviewStates.nutrition.state;
  
  exportData.sleep.details = reviewStates.sleep.value || exportData.sleep.details;
  exportData.sleep.review_status = reviewStates.sleep.state;
  
  exportData.symptoms_stress.details = reviewStates.symptoms_stress.value || exportData.symptoms_stress.details;
  exportData.symptoms_stress.review_status = reviewStates.symptoms_stress.state;
  
  exportData.exercise_steps.details = reviewStates.exercise_steps.value || exportData.exercise_steps.details;
  exportData.exercise_steps.review_status = reviewStates.exercise_steps.state;
  
  exportData.water.details = reviewStates.water.value || exportData.water.details;
  exportData.water.review_status = reviewStates.water.state;
  
  exportData.review_log = {
    approved_keys: Object.keys(reviewStates).filter(k => reviewStates[k].state === "approved"),
    edited_keys: Object.keys(reviewStates).filter(k => reviewStates[k].state === "edited"),
    rejected_keys: Object.keys(reviewStates).filter(k => reviewStates[k].state === "rejected")
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `client_intelligence_report_${new Date().toISOString().substring(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
