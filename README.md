# Public Sector AI Use Survey

An anonymous paired-choice survey on public preferences for AI-assisted government decision-making.

## Current design

Survey version `2.0.0` studies four attributes:

- accuracy: 90% vs 98%
- decision process: automatic initial decision vs human review before the initial decision
- post-decision review: normal grievance process vs dedicated human review on request
- audit: internal audit vs independent external audit with a public summary

Four binary attributes imply 16 possible profiles. The live survey uses eight balanced, non-dominated paired choices rather than all 120 possible profile pairings. Each pair differs on exactly three attributes and holds one constant. Across the eight tasks, every attribute is held constant exactly twice and both levels of every attribute appear equally often.

Task order and A/B position are randomized separately for each respondent.

See `RESEARCH_DESIGN_V2.md` for the full rationale and analysis plan and `design.csv` for the exact choice sets.

## Scope

The study is not restricted to India. Any consenting adult aged 18 or above may participate. The scenario concerns a generic government agency considering AI to assist with public-benefit eligibility decisions.

## Files

- `index.html` site shell
- `styles.css` responsive interface
- `app.js` survey logic and experimental randomization
- `config.js` collector endpoint and survey version
- `design.csv` exact experimental choice sets
- `RESEARCH_DESIGN_V2.md` research design and analysis plan
- `backend/Code.gs` Google Apps Script response collector

## GitHub Pages

Publish from branch `main`, folder `/(root)` under **Settings > Pages**.

Expected URL:

`https://abdullah-x-bd.github.io/public_sector-ai_use-survey/`

## Response collection

The frontend submits to the Google Apps Script Web App configured in `config.js`.

The Apps Script must use the current `backend/Code.gs` and be deployed as:

- Execute as: Me
- Who has access: Anyone

Version 2 responses are written to a separate Google Sheet tab named `responses_v2` so the earlier pilot design cannot be mixed with the final design.

When `backend/Code.gs` changes, update the Apps Script project and deploy a **new version** of the existing Web App before collecting responses.

## Analysis

Each respondent makes eight choices. These repeated choices are not independent respondents. Reshape to one row per displayed profile per respondent-task and estimate the effect of the four attributes using a conditional logit or an equivalent main-effects model with respondent-clustered uncertainty.

Treat results as exploratory unless recruitment supports population-level inference.
