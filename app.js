(() => {
  "use strict";

  const app = document.getElementById("app");
  const progressBar = document.getElementById("progressBar");
  const progressLabel = document.getElementById("progressLabel");
  const config = window.SURVEY_CONFIG || {};

  const PROFILE_TEXT = {
    auto: "The AI recommendation is applied automatically as the initial decision.",
    human: "A human government officer reviews the AI recommendation before the initial decision is made.",
    normal_review: "The normal administrative grievance process applies, with no guaranteed dedicated human re-review of the AI recommendation.",
    dedicated_review: "The applicant can request a dedicated review of the decision by a human government officer.",
    internal_audit: "The responsible government body audits the system internally.",
    external_audit: "An independent external auditor also audits the system, with a summary of findings made public."
  };

  // Complete 2 x 2 x 2 x 2 factorial: 16 possible systems.
  // Bits represent accuracy, decision process, review after decision, audit.
  function makeProfile(bits) {
    const [accuracy, decision, review, audit] = bits.split("").map(Number);
    return {
      id: `P${bits}`,
      bits,
      accuracy: accuracy ? 98 : 90,
      decision: decision ? "human" : "auto",
      review: review ? "dedicated_review" : "normal_review",
      audit: audit ? "external_audit" : "internal_audit"
    };
  }

  const PROFILES = {};
  for (let n = 0; n < 16; n++) {
    const bits = n.toString(2).padStart(4, "0");
    PROFILES[bits] = makeProfile(bits);
  }

  // Complementary pairing uses all 16 profiles exactly once.
  // T1-T7 are non-dominated trade-offs. T8 is the all-low versus all-high pair.
  const TASKS = [
    { id: "T1", profiles: [PROFILES["0001"], PROFILES["1110"]], dominatedCheck: false },
    { id: "T2", profiles: [PROFILES["0010"], PROFILES["1101"]], dominatedCheck: false },
    { id: "T3", profiles: [PROFILES["0011"], PROFILES["1100"]], dominatedCheck: false },
    { id: "T4", profiles: [PROFILES["0100"], PROFILES["1011"]], dominatedCheck: false },
    { id: "T5", profiles: [PROFILES["0101"], PROFILES["1010"]], dominatedCheck: false },
    { id: "T6", profiles: [PROFILES["0110"], PROFILES["1001"]], dominatedCheck: false },
    { id: "T7", profiles: [PROFILES["0111"], PROFILES["1000"]], dominatedCheck: false },
    { id: "T8", profiles: [PROFILES["0000"], PROFILES["1111"]], dominatedCheck: true }
  ];

  function shuffle(items) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function randomizedTasks() {
    const substantive = shuffle(TASKS.filter(t => !t.dominatedCheck));
    const finalCheck = TASKS.find(t => t.dominatedCheck);
    return [...substantive, finalCheck].map((task, index) => {
      const swapped = Math.random() < 0.5;
      return {
        ...task,
        presentationOrder: index + 1,
        displayed: swapped ? [task.profiles[1], task.profiles[0]] : [task.profiles[0], task.profiles[1]],
        swapped
      };
    });
  }

  const state = {
    startedAt: null,
    responseId: crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    demographics: {},
    randomizedTasks: randomizedTasks(),
    choices: {},
    taskIndex: 0,
    post: {},
    submitted: false
  };

  const totalProgressSteps = 12;

  function setProgress(step, label) {
    const pct = Math.max(0, Math.min(100, (step / totalProgressSteps) * 100));
    progressBar.style.width = `${pct}%`;
    progressLabel.textContent = label;
  }

  function focusApp() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => app.focus({ preventScroll: true }), 60);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function selectField(id, label, options, selected, required = true, full = false) {
    return `
      <div class="field ${full ? "full" : ""}">
        <label for="${id}" class="${required ? "required" : ""}">${escapeHtml(label)}</label>
        <select id="${id}">
          <option value="">Select an option</option>
          ${options.map(o => `<option value="${escapeHtml(o)}" ${selected === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
        </select>
      </div>`;
  }

  function textField(id, label, selected, required = true, full = false) {
    return `
      <div class="field ${full ? "full" : ""}">
        <label for="${id}" class="${required ? "required" : ""}">${escapeHtml(label)}</label>
        <input id="${id}" type="text" maxlength="100" value="${escapeHtml(selected || "")}" autocomplete="country-name">
      </div>`;
  }

  function scaleField(name, label, value, left, right) {
    return `
      <div class="field full">
        <label class="required">${escapeHtml(label)}</label>
        <div class="scale">
          ${[1,2,3,4,5].map(n => `<label><input type="radio" name="${name}" value="${n}" ${String(value) === String(n) ? "checked" : ""}>${n}</label>`).join("")}
        </div>
        <div class="scale-anchors"><span>${escapeHtml(left)}</span><span>${escapeHtml(right)}</span></div>
      </div>`;
  }

  function renderIntro() {
    setProgress(0, "Introduction");
    app.innerHTML = `
      <div class="eyebrow">Research survey</div>
      <h1>Preferences on AI-Assisted Government Decisions</h1>
      <p class="lead">This short survey studies preferences about the use of artificial intelligence in government decision-making.</p>
      <p>You will be shown pairs of hypothetical AI-assisted systems and asked which one you would prefer a government agency to use. The systems involve different trade-offs. There are no right or wrong answers.</p>
      <div class="info-box">
        <strong>Before you begin</strong>
        <ul class="clean-list">
          <li>The survey takes about 5 to 7 minutes.</li>
          <li>Participation is voluntary.</li>
          <li>The survey is intended for adults aged 18 or above.</li>
          <li>No direct personal identifiers are requested.</li>
          <li>Responses may be reported in aggregate in a policy brief or related research.</li>
          <li>Because responses are anonymous, individual responses cannot be withdrawn after submission.</li>
        </ul>
      </div>
      <div class="field full">
        <label class="required">Do you voluntarily agree to participate in this anonymous survey?</label>
        <div class="radio-stack">
          <label class="radio-option"><input type="radio" name="consent" value="yes"> Yes</label>
          <label class="radio-option"><input type="radio" name="consent" value="no"> No</label>
        </div>
      </div>
      <div id="introError" class="error" aria-live="polite"></div>
      <div class="actions right"><button id="beginBtn" class="btn btn-primary">Begin survey</button></div>`;

    document.getElementById("beginBtn").onclick = () => {
      const consent = document.querySelector('input[name="consent"]:checked')?.value;
      if (!consent) {
        document.getElementById("introError").textContent = "Please select an option before continuing.";
        return;
      }
      if (consent === "no") {
        renderTermination();
        return;
      }
      if (!state.startedAt) state.startedAt = new Date().toISOString();
      renderDemographics();
    };
  }

  function renderTermination() {
    setProgress(0, "Survey ended");
    app.innerHTML = `
      <div class="termination">
        <h2>Thank you for your interest</h2>
        <p class="muted">The survey has ended without recording a response.</p>
      </div>`;
    focusApp();
  }

  function renderDemographics() {
    setProgress(1, "Background questions");
    const d = state.demographics;
    app.innerHTML = `
      <div class="eyebrow">Section 1</div>
      <h2>Background</h2>
      <p class="muted">These broad categories help describe the sample and explore variation in responses.</p>
      <div class="form-grid">
        ${textField("country", "Country or territory of current residence", d.country, false)}
        ${selectField("age", "Age group", ["18 to 24","25 to 34","35 to 44","45 to 54","55 to 64","65 or above","Prefer not to say"], d.age, false)}
        ${selectField("gender", "Gender", ["Woman","Man","Non-binary or another identity","Prefer not to say"], d.gender, false)}
        ${selectField("education", "Current or most recent level of education", ["Secondary school or below","Undergraduate","Postgraduate","Doctoral","Other","Prefer not to say"], d.education, false)}
        ${selectField("genai", "How often do you use generative AI tools such as ChatGPT, Gemini, Claude, or similar systems?", ["Never","Less than once a month","A few times a month","A few times a week","Daily or almost daily"], d.genai, true, true)}
        ${selectField("benefit", "Have you ever applied for or received a government scholarship, welfare benefit, subsidy, or similar public benefit?", ["Yes","No","Not sure","Prefer not to say"], d.benefit, true, true)}
      </div>
      <div id="demoError" class="error" aria-live="polite"></div>
      <div class="actions">
        <button id="backBtn" class="btn btn-secondary">Back</button>
        <button id="demoNext" class="btn btn-primary">Continue</button>
      </div>`;

    document.getElementById("backBtn").onclick = renderIntro;
    document.getElementById("demoNext").onclick = () => {
      const next = {};
      ["country","age","gender","education","genai","benefit"].forEach(k => next[k] = document.getElementById(k).value.trim());
      if (!next.genai || !next.benefit) {
        document.getElementById("demoError").textContent = "Please answer the two required questions before continuing.";
        return;
      }
      state.demographics = next;
      renderScenario();
    };
    focusApp();
  }

  function renderScenario() {
    setProgress(2, "Scenario and definitions");
    app.innerHTML = `
      <div class="eyebrow">Section 2</div>
      <h2>Public education scholarship scenario</h2>
      <p class="lead">Imagine that a government agency is considering using an AI system to assist with decisions about eligibility for a public education scholarship.</p>
      <div class="info-box">
        <p><strong>All systems you will see:</strong></p>
        <ul class="clean-list">
          <li>apply the same scholarship eligibility rules;</li>
          <li>use the same categories of applicant information;</li>
          <li>are required to comply with applicable law;</li>
          <li>have the same cost and processing time.</li>
        </ul>
        <p>They differ only in the four features below.</p>
      </div>
      <h3>What the four features mean</h3>
      <div class="feature-definitions">
        <div class="definition"><strong>Accuracy</strong>The percentage of cases in which the AI recommendation reaches the same eligibility outcome as a full review by qualified human officials applying the program rules.</div>
        <div class="definition"><strong>Decision process</strong>Either the AI recommendation becomes the initial decision automatically, or a human government officer reviews it before the initial decision is made.</div>
        <div class="definition"><strong>Review after a decision</strong>Either the normal grievance process applies, or an applicant can request a dedicated human review of the decision.</div>
        <div class="definition"><strong>Audit</strong>Either the responsible government body audits the system internally, or an independent external auditor also audits it and a summary of findings is made public.</div>
      </div>
      <div class="actions">
        <button id="scenarioBack" class="btn btn-secondary">Back</button>
        <button id="startChoices" class="btn btn-primary">Start choices</button>
      </div>`;

    document.getElementById("scenarioBack").onclick = renderDemographics;
    document.getElementById("startChoices").onclick = () => {
      state.taskIndex = 0;
      renderTask();
    };
    focusApp();
  }

  function attribute(name, value) {
    return `<div class="attribute-row"><div class="attribute-name">${escapeHtml(name)}</div><div class="attribute-value">${escapeHtml(value)}</div></div>`;
  }

  function profileCard(p, label, selected) {
    return `
      <div class="choice-card ${selected ? "selected" : ""}">
        <label>
          <input type="radio" name="choice" value="${label}" ${selected ? "checked" : ""}>
          <div class="choice-title"><span>System ${label}</span><span class="choose-pill">Select</span></div>
          <div class="attribute-table">
            ${attribute("Accuracy", `${p.accuracy}%`)}
            ${attribute("Decision process", PROFILE_TEXT[p.decision])}
            ${attribute("Review after decision", PROFILE_TEXT[p.review])}
            ${attribute("Audit", PROFILE_TEXT[p.audit])}
          </div>
        </label>
      </div>`;
  }

  function renderTask() {
    const i = state.taskIndex;
    const task = state.randomizedTasks[i];
    setProgress(3 + i, `Choice ${i + 1} of ${state.randomizedTasks.length}`);
    const existing = state.choices[task.id];

    app.innerHTML = `
      <div class="eyebrow">Section 3 · Choice ${i + 1} of ${state.randomizedTasks.length}</div>
      <h2>Which system would you prefer the government to use?</h2>
      <p class="muted">Choose the system you prefer based only on the four features shown.</p>
      <div class="choice-grid">
        ${profileCard(task.displayed[0], "A", existing?.selectedPosition === "A")}
        ${profileCard(task.displayed[1], "B", existing?.selectedPosition === "B")}
      </div>
      <div id="taskError" class="error" aria-live="polite"></div>
      <div class="actions">
        <button id="taskBack" class="btn btn-secondary">Back</button>
        <button id="taskNext" class="btn btn-primary">${i === state.randomizedTasks.length - 1 ? "Continue" : "Next choice"}</button>
      </div>`;

    document.querySelectorAll('input[name="choice"]').forEach(input => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
        input.closest(".choice-card").classList.add("selected");
      });
    });

    document.getElementById("taskBack").onclick = () => {
      if (i === 0) renderScenario();
      else {
        state.taskIndex -= 1;
        renderTask();
      }
    };

    document.getElementById("taskNext").onclick = () => {
      const selected = document.querySelector('input[name="choice"]:checked');
      if (!selected) {
        document.getElementById("taskError").textContent = "Please select one system before continuing.";
        return;
      }
      const pos = selected.value;
      const idx = pos === "A" ? 0 : 1;
      state.choices[task.id] = {
        taskId: task.id,
        presentationOrder: task.presentationOrder,
        dominatedCheck: task.dominatedCheck,
        displayedA: task.displayed[0].id,
        displayedB: task.displayed[1].id,
        selectedPosition: pos,
        selectedProfileId: task.displayed[idx].id,
        swapped: task.swapped
      };

      if (i < state.randomizedTasks.length - 1) {
        state.taskIndex += 1;
        renderTask();
      } else {
        renderPost();
      }
    };
    focusApp();
  }

  function renderPost() {
    setProgress(11, "Overall view");
    const p = state.post;
    app.innerHTML = `
      <div class="eyebrow">Section 4</div>
      <h2>Your overall view</h2>
      <div class="form-grid">
        ${selectField("priority", "Looking back at your choices, which one factor mattered most?", ["Accuracy of the AI system","Human review before the initial decision","Ability to request a human review after a decision","Independent external auditing","I did not have one main factor"], p.priority, true, true)}
        ${scaleField("accept_ai", "Overall, how acceptable is it for a government to use AI to assist with scholarship eligibility decisions?", p.accept_ai, "Completely unacceptable", "Completely acceptable")}
        ${scaleField("accept_human", "Suppose the AI only makes a recommendation and a human government officer remains responsible for the actual decision. How acceptable would that use of AI be?", p.accept_human, "Completely unacceptable", "Completely acceptable")}
        ${scaleField("confidence", "How confident are you that you understood the differences between the systems shown in this survey?", p.confidence, "Not at all confident", "Very confident")}
        <div class="field full">
          <label for="open_text">Is there any other condition or requirement that you think should apply when government uses AI for decisions affecting individuals? <span class="muted small">Optional</span></label>
          <textarea id="open_text" maxlength="1000" placeholder="Optional response">${escapeHtml(p.open_text || "")}</textarea>
        </div>
      </div>
      <div id="postError" class="error" aria-live="polite"></div>
      <div class="actions">
        <button id="postBack" class="btn btn-secondary">Back</button>
        <button id="reviewBtn" class="btn btn-primary">Review and submit</button>
      </div>`;

    document.getElementById("postBack").onclick = () => {
      state.taskIndex = state.randomizedTasks.length - 1;
      renderTask();
    };

    document.getElementById("reviewBtn").onclick = () => {
      const next = {
        priority: document.getElementById("priority").value,
        accept_ai: document.querySelector('input[name="accept_ai"]:checked')?.value || "",
        accept_human: document.querySelector('input[name="accept_human"]:checked')?.value || "",
        confidence: document.querySelector('input[name="confidence"]:checked')?.value || "",
        open_text: document.getElementById("open_text").value.trim()
      };
      if (!next.priority || !next.accept_ai || !next.accept_human || !next.confidence) {
        document.getElementById("postError").textContent = "Please answer all required questions before continuing.";
        return;
      }
      state.post = next;
      renderReview();
    };
    focusApp();
  }

  function renderReview() {
    setProgress(11.5, "Review and submit");
    app.innerHTML = `
      <div class="eyebrow">Final step</div>
      <h2>Ready to submit</h2>
      <p class="lead">Please confirm that you want to submit this anonymous response.</p>
      <div class="info-box">
        <p>The response contains the background answers provided, eight paired choices, overall ratings, and any optional written comment.</p>
        <p>It does not request a name, email address, phone number, IP address, or precise location.</p>
      </div>
      <div id="submitStatus" aria-live="polite"></div>
      <div class="actions">
        <button id="reviewBack" class="btn btn-secondary">Back</button>
        <button id="submitBtn" class="btn btn-primary">Submit response</button>
      </div>`;
    document.getElementById("reviewBack").onclick = renderPost;
    document.getElementById("submitBtn").onclick = submitSurvey;
    focusApp();
  }

  function buildPayload() {
    const submittedAt = new Date();
    const startedAt = state.startedAt ? new Date(state.startedAt) : submittedAt;
    return {
      schema_version: "3",
      survey_version: config.surveyVersion || "3.0.0",
      response_id: state.responseId,
      started_at: state.startedAt,
      submitted_at: submittedAt.toISOString(),
      duration_seconds: Math.max(0, Math.round((submittedAt - startedAt) / 1000)),
      demographics: state.demographics,
      choices: state.randomizedTasks.map(t => state.choices[t.id]),
      post: state.post
    };
  }

  async function submitSurvey() {
    if (state.submitted) return;
    const btn = document.getElementById("submitBtn");
    const status = document.getElementById("submitStatus");
    btn.disabled = true;
    status.className = "status info";
    status.textContent = "Submitting your response...";
    const payload = buildPayload();

    try {
      if (!config.submissionEndpoint) throw new Error("Submission endpoint is not configured.");
      const body = new URLSearchParams();
      body.set("payload", JSON.stringify(payload));
      await fetch(config.submissionEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: body.toString(),
        keepalive: true
      });
      state.submitted = true;
      renderThanks();
    } catch (err) {
      btn.disabled = false;
      status.className = "status error";
      status.textContent = "The response could not be submitted. Please try again.";
      console.error(err);
    }
  }

  function renderThanks() {
    setProgress(12, "Complete");
    app.innerHTML = `
      <div class="thanks">
        <div class="check">✓</div>
        <h2>Thank you</h2>
        <p class="muted">Your response has been sent.</p>
        <p class="small">Response ID: ${escapeHtml(state.responseId)}</p>
      </div>`;
    focusApp();
  }

  renderIntro();
})();
