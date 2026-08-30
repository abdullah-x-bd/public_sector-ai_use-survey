(() => {
  "use strict";

  const app = document.getElementById("app");
  const progressBar = document.getElementById("progressBar");
  const progressLabel = document.getElementById("progressLabel");
  const config = window.SURVEY_CONFIG || {};

  const PROFILE_TEXT = {
    auto: "The AI recommendation is applied automatically as the initial decision.",
    human: "A human government officer reviews the AI recommendation before the initial decision.",
    normal_review: "Normal administrative grievance process. No guaranteed dedicated human re-review of the AI recommendation.",
    dedicated_review: "Applicant can request a dedicated review by a human government officer.",
    internal_audit: "Internal government audit.",
    external_audit: "Independent external audit, with a summary of findings made public.",
    international: "Approved providers may process relevant data in India or abroad.",
    india_only: "Relevant personal data must be processed only on servers located in India."
  };

  const tasks = [
    {
      id: "T1",
      profiles: [
        { id: "T1P1", accuracy: 90, decision: "human", review: "normal_review", audit: "external_audit", data: "international" },
        { id: "T1P2", accuracy: 98, decision: "auto", review: "dedicated_review", audit: "internal_audit", data: "india_only" }
      ]
    },
    {
      id: "T2",
      profiles: [
        { id: "T2P1", accuracy: 94, decision: "auto", review: "dedicated_review", audit: "internal_audit", data: "international" },
        { id: "T2P2", accuracy: 90, decision: "human", review: "normal_review", audit: "internal_audit", data: "india_only" }
      ]
    },
    {
      id: "T3",
      profiles: [
        { id: "T3P1", accuracy: 90, decision: "auto", review: "dedicated_review", audit: "internal_audit", data: "india_only" },
        { id: "T3P2", accuracy: 98, decision: "human", review: "normal_review", audit: "external_audit", data: "india_only" }
      ]
    },
    {
      id: "T4",
      profiles: [
        { id: "T4P1", accuracy: 94, decision: "auto", review: "normal_review", audit: "external_audit", data: "india_only" },
        { id: "T4P2", accuracy: 90, decision: "human", review: "dedicated_review", audit: "external_audit", data: "international" }
      ]
    },
    {
      id: "T5",
      profiles: [
        { id: "T5P1", accuracy: 94, decision: "human", review: "dedicated_review", audit: "external_audit", data: "india_only" },
        { id: "T5P2", accuracy: 98, decision: "auto", review: "normal_review", audit: "internal_audit", data: "international" }
      ]
    },
    {
      id: "T6",
      profiles: [
        { id: "T6P1", accuracy: 94, decision: "human", review: "normal_review", audit: "internal_audit", data: "international" },
        { id: "T6P2", accuracy: 94, decision: "auto", review: "dedicated_review", audit: "external_audit", data: "india_only" }
      ]
    },
    {
      id: "T7",
      profiles: [
        { id: "T7P1", accuracy: 98, decision: "auto", review: "dedicated_review", audit: "external_audit", data: "india_only" },
        { id: "T7P2", accuracy: 98, decision: "human", review: "dedicated_review", audit: "internal_audit", data: "international" }
      ]
    },
    {
      id: "T8",
      profiles: [
        { id: "T8P1", accuracy: 98, decision: "human", review: "normal_review", audit: "internal_audit", data: "india_only" },
        { id: "T8P2", accuracy: 90, decision: "auto", review: "normal_review", audit: "external_audit", data: "india_only" }
      ]
    }
  ];

  const state = {
    page: "intro",
    startedAt: null,
    responseId: crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    demographics: {},
    randomizedTasks: tasks.map(t => {
      const swapped = Math.random() < 0.5;
      return {
        ...t,
        displayed: swapped ? [t.profiles[1], t.profiles[0]] : [t.profiles[0], t.profiles[1]],
        swapped
      };
    }),
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
    setTimeout(() => app.focus({ preventScroll: true }), 80);
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderIntro() {
    setProgress(0, "Introduction");
    app.innerHTML = `
      <div class="eyebrow">Research survey</div>
      <h1>Preferences on AI-Assisted Government Services</h1>
      <p class="lead">This short survey asks about preferences concerning the use of artificial intelligence in government services in India.</p>
      <p>You will be shown pairs of hypothetical AI-assisted systems and asked which one you would prefer the government to use. The systems involve different trade-offs. There are no right or wrong answers.</p>
      <div class="info-box">
        <strong>Before you begin</strong>
        <ul class="clean-list">
          <li>The survey takes about 5 to 7 minutes.</li>
          <li>Participation is voluntary.</li>
          <li>No direct personal identifiers are requested.</li>
          <li>Responses may be reported only in aggregate in a policy brief or related research.</li>
          <li>Because responses are anonymous, individual responses cannot be withdrawn after submission.</li>
        </ul>
      </div>
      <div class="field full">
        <label class="required">Are you 18 years of age or older and do you voluntarily agree to participate?</label>
        <div class="radio-stack">
          <label class="radio-option"><input type="radio" name="consent" value="yes"> Yes, I am 18 or older and I agree to participate</label>
          <label class="radio-option"><input type="radio" name="consent" value="no"> No</label>
        </div>
      </div>
      <div class="field full" style="margin-top:18px">
        <label class="required">Do you currently live in India?</label>
        <div class="radio-stack">
          <label class="radio-option"><input type="radio" name="india" value="yes"> Yes</label>
          <label class="radio-option"><input type="radio" name="india" value="no"> No</label>
        </div>
      </div>
      <div id="introError" class="error" aria-live="polite"></div>
      <div class="actions right"><button id="beginBtn" class="btn btn-primary">Begin survey</button></div>
    `;

    document.getElementById("beginBtn").addEventListener("click", () => {
      const consent = document.querySelector('input[name="consent"]:checked')?.value;
      const india = document.querySelector('input[name="india"]:checked')?.value;
      const error = document.getElementById("introError");
      if (!consent || !india) {
        error.textContent = "Please answer both questions before continuing.";
        return;
      }
      if (consent !== "yes" || india !== "yes") {
        renderTermination();
        return;
      }
      state.startedAt = new Date().toISOString();
      renderDemographics();
    });
  }

  function renderTermination() {
    setProgress(0, "Survey ended");
    app.innerHTML = `
      <div class="termination">
        <h2>Thank you for your interest</h2>
        <p class="muted">This survey is currently limited to consenting adults who live in India.</p>
      </div>
    `;
    focusApp();
  }

  function renderDemographics() {
    setProgress(1, "Background questions");
    const d = state.demographics;
    app.innerHTML = `
      <div class="eyebrow">Section 1</div>
      <h2>About you</h2>
      <p class="muted">These broad categories help us understand whether preferences differ across groups.</p>
      <div class="form-grid">
        ${selectField("age", "Age group", ["18 to 24","25 to 34","35 to 44","45 to 54","55 to 64","65 or above","Prefer not to say"], d.age, true)}
        ${selectField("gender", "Gender", ["Woman","Man","Non-binary or another identity","Prefer not to say"], d.gender, false)}
        ${selectField("education", "Current or most recent level of education", ["Secondary school or below","Undergraduate","Postgraduate","Doctoral","Other"], d.education, true)}
        ${selectField("field", "Field of study or work", ["Humanities or social sciences","Law, public policy, or government","Business, economics, or management","Science, technology, engineering, or mathematics","Medicine or health","Other"], d.field, true)}
        ${selectField("genai", "How often do you use generative AI tools such as ChatGPT, Gemini, Claude, or similar systems?", ["Never","Less than once a month","A few times a month","A few times a week","Daily or almost daily"], d.genai, true, true)}
        ${selectField("benefit", "Have you ever applied for or received a government scholarship, welfare benefit, subsidy, or similar public benefit?", ["Yes","No","Not sure","Prefer not to say"], d.benefit, true, true)}
      </div>
      <div id="demoError" class="error" aria-live="polite"></div>
      <div class="actions">
        <button id="backBtn" class="btn btn-secondary">Back</button>
        <button id="demoNext" class="btn btn-primary">Continue</button>
      </div>
    `;
    document.getElementById("backBtn").onclick = renderIntro;
    document.getElementById("demoNext").onclick = () => {
      const required = ["age","education","field","genai","benefit"];
      const next = {};
      ["age","gender","education","field","genai","benefit"].forEach(k => next[k] = document.getElementById(k).value);
      if (required.some(k => !next[k])) {
        document.getElementById("demoError").textContent = "Please answer all required questions before continuing.";
        return;
      }
      state.demographics = next;
      renderScenario();
    };
    focusApp();
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

  function renderScenario() {
    setProgress(2, "Scenario and definitions");
    app.innerHTML = `
      <div class="eyebrow">Section 2</div>
      <h2>Government scholarship scenario</h2>
      <p class="lead">Imagine that the Government of India is considering using an AI system to assist with decisions about eligibility for a national education scholarship.</p>
      <div class="info-box">
        <p><strong>All systems you will see:</strong></p>
        <ul class="clean-list">
          <li>use the same scholarship eligibility rules;</li>
          <li>use the same categories of applicant information;</li>
          <li>are required to comply with applicable law;</li>
          <li>have the same cost and processing time unless stated otherwise.</li>
        </ul>
        <p>They differ only in the features shown to you.</p>
      </div>
      <h3>What the five features mean</h3>
      <div class="feature-definitions">
        <div class="definition"><strong>Accuracy</strong>The percentage of cases in which the AI recommendation matches the correct eligibility outcome after a full expert review.</div>
        <div class="definition"><strong>Decision process</strong>Either the AI recommendation becomes the initial decision automatically, or a human officer reviews it before the initial decision.</div>
        <div class="definition"><strong>Review after a decision</strong>Either the normal grievance process applies, or an applicant is guaranteed a dedicated human review on request.</div>
        <div class="definition"><strong>Audit</strong>Either the system is audited internally, or it is also independently audited and a summary is made public.</div>
        <div class="definition"><strong>Data processing location</strong>Either approved providers may process relevant data in India or abroad, or relevant personal data must be processed only in India.</div>
      </div>
      <p class="small muted">Assume that both data-processing arrangements are subject to the same applicable privacy and security requirements.</p>
      <div class="actions">
        <button id="scenarioBack" class="btn btn-secondary">Back</button>
        <button id="startChoices" class="btn btn-primary">Start choices</button>
      </div>
    `;
    document.getElementById("scenarioBack").onclick = renderDemographics;
    document.getElementById("startChoices").onclick = () => {
      state.taskIndex = 0;
      renderTask();
    };
    focusApp();
  }

  function renderTask() {
    const i = state.taskIndex;
    const task = state.randomizedTasks[i];
    setProgress(3 + i, `Choice ${i + 1} of ${state.randomizedTasks.length}`);
    const existing = state.choices[task.id];
    app.innerHTML = `
      <div class="eyebrow">Section 3 · Choice ${i + 1} of ${state.randomizedTasks.length}</div>
      <h2>Which system would you prefer the government to use?</h2>
      <p class="muted">Choose one system. There is no neutral option because we are interested in how people make trade-offs when they must choose.</p>
      <div class="choice-grid">
        ${profileCard(task.displayed[0], "A", existing?.selectedPosition === "A")}
        ${profileCard(task.displayed[1], "B", existing?.selectedPosition === "B")}
      </div>
      <div id="taskError" class="error" aria-live="polite"></div>
      <div class="actions">
        <button id="taskBack" class="btn btn-secondary">Back</button>
        <button id="taskNext" class="btn btn-primary">${i === state.randomizedTasks.length - 1 ? "Continue" : "Next choice"}</button>
      </div>
    `;

    document.querySelectorAll('input[name="choice"]').forEach(input => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
        input.closest(".choice-card").classList.add("selected");
      });
    });

    document.getElementById("taskBack").onclick = () => {
      if (i === 0) renderScenario();
      else { state.taskIndex -= 1; renderTask(); }
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

  function profileCard(p, label, selected) {
    return `
      <div class="choice-card ${selected ? "selected" : ""}">
        <label>
          <input type="radio" name="choice" value="${label}" ${selected ? "checked" : ""}>
          <div class="choice-title"><span>System ${label}</span><span class="choose-pill">Select</span></div>
          <div class="attribute-table">
            ${attribute("Accuracy", `${p.accuracy}%`)}
            ${attribute("Decision process", PROFILE_TEXT[p.decision])}
            ${attribute("Review", PROFILE_TEXT[p.review])}
            ${attribute("Audit", PROFILE_TEXT[p.audit])}
            ${attribute("Data processing", PROFILE_TEXT[p.data])}
          </div>
        </label>
      </div>`;
  }

  function attribute(name, value) {
    return `<div class="attribute-row"><div class="attribute-name">${escapeHtml(name)}</div><div class="attribute-value">${escapeHtml(value)}</div></div>`;
  }

  function renderPost() {
    setProgress(11, "Overall view");
    const p = state.post;
    app.innerHTML = `
      <div class="eyebrow">Section 4</div>
      <h2>Your overall view</h2>
      <div class="form-grid">
        ${selectField("priority", "Looking back at your choices, which one factor do you think mattered most to you?", ["Accuracy of the AI system","Human review before the initial decision","Ability to request a human review after a decision","Independent external auditing","Keeping personal data processing within India","I did not have one main factor"], p.priority, true, true)}
        ${scaleField("accept_ai", "Overall, how acceptable is it for the government to use AI to assist with scholarship eligibility decisions?", p.accept_ai, "Completely unacceptable", "Completely acceptable")}
        ${scaleField("accept_human", "Suppose an AI system only makes a recommendation and a human government officer remains responsible for the actual decision. How acceptable would that use of AI be?", p.accept_human, "Completely unacceptable", "Completely acceptable")}
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
      </div>
    `;
    document.getElementById("postBack").onclick = () => { state.taskIndex = 7; renderTask(); };
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

  function renderReview() {
    setProgress(11.5, "Review and submit");
    const d = state.demographics;
    app.innerHTML = `
      <div class="eyebrow">Final step</div>
      <h2>Ready to submit</h2>
      <p class="lead">Please confirm that you want to submit this anonymous response.</p>
      <div class="info-box">
        <p><strong>Your response includes:</strong></p>
        <ul class="clean-list">
          <li>Broad background categories such as age group and education.</li>
          <li>Your eight system choices.</li>
          <li>Your overall views and any optional written comment.</li>
        </ul>
        <p><strong>It does not ask for:</strong> your name, email address, phone number, IP address, or precise location.</p>
      </div>
      <p class="small muted">Age group selected: ${escapeHtml(d.age)} · Education: ${escapeHtml(d.education)}</p>
      <div id="submitStatus" aria-live="polite"></div>
      <div class="actions">
        <button id="reviewBack" class="btn btn-secondary">Back</button>
        <button id="submitBtn" class="btn btn-primary">Submit response</button>
      </div>
    `;
    document.getElementById("reviewBack").onclick = renderPost;
    document.getElementById("submitBtn").onclick = submitSurvey;
    focusApp();
  }

  function buildPayload() {
    const submittedAt = new Date();
    const startedAt = state.startedAt ? new Date(state.startedAt) : submittedAt;
    return {
      schema_version: "1",
      survey_version: config.surveyVersion || "1.0.0",
      response_id: state.responseId,
      started_at: state.startedAt,
      submitted_at: submittedAt.toISOString(),
      duration_seconds: Math.max(0, Math.round((submittedAt - startedAt) / 1000)),
      demographics: state.demographics,
      choices: state.randomizedTasks.map(t => state.choices[t.id]),
      post: state.post,
      honeypot: ""
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
      if (!config.submissionEndpoint) {
        if (!config.allowLocalPilotWhenEndpointMissing) throw new Error("Submission endpoint is not configured.");
        localStorage.setItem(`survey-pilot-${payload.response_id}`, JSON.stringify(payload));
        state.submitted = true;
        renderThanks(true);
        return;
      }

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
      localStorage.setItem("public-sector-ai-survey-submitted", payload.response_id);
      renderThanks(false);
    } catch (err) {
      btn.disabled = false;
      status.className = "status error";
      status.textContent = "Your response was not submitted. Please check your connection and try again.";
      console.error(err);
    }
  }

  function renderThanks(pilotMode) {
    setProgress(12, "Complete");
    app.innerHTML = `
      <div class="thanks">
        <div class="check">✓</div>
        <h2>${pilotMode ? "Pilot response saved on this device" : "Thank you"}</h2>
        <p class="muted">${pilotMode ? "The live response collector has not yet been configured. This response has not been transmitted." : "Your anonymous response has been submitted."}</p>
        ${pilotMode ? `<p class="small">Response ID: ${escapeHtml(state.responseId)}</p>` : ""}
      </div>
    `;
    focusApp();
  }

  renderIntro();
})();
