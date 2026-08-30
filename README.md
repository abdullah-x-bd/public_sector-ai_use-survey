# Public Sector AI Use Survey

A lightweight, anonymous paired-choice survey on preferences for AI-assisted public-sector decision-making in India.

## What the site does

- Runs the full 5 to 7 minute survey in the browser.
- Presents eight forced-choice comparisons between hypothetical government AI systems.
- Randomizes whether each underlying profile is displayed as System A or System B for every respondent.
- Records the displayed order and the selected underlying profile so position effects can be checked later.
- Collects only broad background categories and survey responses.
- Does not request names, email addresses, phone numbers, IP addresses, or precise location.
- Works as a static site on GitHub Pages.

## Files

- `index.html` survey shell
- `styles.css` responsive interface
- `app.js` survey logic, experimental design, validation, randomization, and submission
- `config.js` submission endpoint configuration
- `backend/Code.gs` Google Apps Script collector for a private Google Sheet

## Publish the site with GitHub Pages

In the repository on GitHub:

1. Open **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/(root)`.
5. Save.

The expected public URL is:

`https://abdullah-x-bd.github.io/public_sector-ai_use-survey/`

## Configure response collection

GitHub Pages is static and cannot safely write survey responses back into the repository. The included Google Apps Script stores submissions in a private Google Sheet.

1. Create a blank Google Sheet for responses.
2. In that Sheet, open **Extensions > Apps Script**.
3. Replace the default script with the contents of `backend/Code.gs`.
4. Click **Deploy > New deployment**.
5. Choose **Web app**.
6. Set **Execute as** to yourself.
7. Set **Who has access** to **Anyone**.
8. Deploy and copy the Web App URL ending in `/exec`.
9. Open `config.js` in this repository and paste that URL into `submissionEndpoint`.

Example:

```js
window.SURVEY_CONFIG = {
  submissionEndpoint: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  surveyVersion: "1.0.0",
  allowLocalPilotWhenEndpointMissing: false
};
```

Before public circulation, set `allowLocalPilotWhenEndpointMissing` to `false` so a missing backend cannot be mistaken for a real submission.

## Pilot mode

Until a submission endpoint is configured, the site runs in pilot mode. A completed response is saved only in that browser's local storage and is not transmitted anywhere. The completion screen explicitly says this.

## Data structure

The Sheet receives one row per respondent, including:

- response ID
- survey version
- timestamps and total completion time
- broad demographic variables
- for each of the eight tasks, which underlying profile appeared as System A and System B
- selected position and selected underlying profile
- stated priority
- AI acceptability ratings
- comprehension confidence
- optional open-text response

The randomization variables must be retained during analysis. Do not treat the displayed letter A or B as a policy attribute.

## Research design note

The survey should be treated as a rapid exploratory paired-choice experiment using a convenience sample unless recruitment is explicitly designed to support broader population inference. Repeated choices from the same participant are not independent observations and should be accounted for during analysis.
