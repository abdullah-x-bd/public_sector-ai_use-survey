# Public Sector AI Use Survey

An anonymous paired-choice survey on preferences for AI-assisted government decision-making.

## Current design

Survey version `3.0.0` studies four attributes:

- accuracy: 90% vs 98%
- decision process: automatic initial decision vs human review before the initial decision
- post-decision review: normal grievance process vs dedicated human review on request
- audit: internal audit vs independent external audit with a public summary

These four binary attributes produce all `2^4 = 16` possible system profiles.

Each completed survey shows all 16 profiles exactly once across eight paired choices:

- seven substantive non-dominated trade-off pairs
- one final all-low versus all-high dominated pair, retained as a comprehension/choice-consistency check rather than part of the primary preference model

The site randomly assigns one of four balanced pairing blocks. Across the four blocks, each attribute is balanced in how often it differs within a pair. The order of the seven substantive tasks is randomized, the dominated pair remains last, and System A/System B position is randomized independently for every pair.

See `RESEARCH_DESIGN_V3.md` for the rationale and analysis plan and `design.csv` for every profile and pairing in every block.

## Scope

The study is not restricted to India. The scenario concerns a generic government agency considering AI to assist with public education scholarship eligibility decisions.

The site does not ask or attempt to determine whether a submission was produced by a human or an automated system. It contains no CAPTCHA, sign-in requirement, fingerprinting, rate limit, honeypot, or respondent-type field.

## Files

- `index.html` site shell
- `styles.css` responsive interface
- `app.js` survey logic, factorial profiles, block assignment, and randomization
- `config.js` collector endpoint and survey version
- `design.csv` exact experimental design for all four blocks
- `RESEARCH_DESIGN_V3.md` research design and analysis plan
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

Version 3 responses are written to a separate Google Sheet tab named `responses_v3`, preventing pilot and earlier-design responses from mixing with the final dataset.

Whenever `backend/Code.gs` changes, update the Apps Script project and deploy a **new version** of the existing Web App before collecting responses.

## Analysis

The primary analysis uses only the first seven substantive choices. Reshape responses to the alternative level and estimate the contribution of accuracy, human review before the initial decision, dedicated human review after a decision, and independent external audit using a conditional logit or equivalent discrete-choice model. Account for repeated choices from the same respondent.

The eighth choice is not included in the primary coefficient estimates. Report it separately as a descriptive consistency measure.

Because the site intentionally does not distinguish human from automated submissions, a dataset collected without controlled recruitment cannot be described as a representative estimate of human public opinion. Any inference must match the actual recruitment process used.
