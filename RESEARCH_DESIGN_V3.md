# Research Design V3

## Research question

How do accuracy and institutional safeguards affect preferences for AI-assisted government decision-making?

The experiment estimates the relative importance of four attributes of a hypothetical public-sector AI system:

1. Accuracy
2. Human review before the initial decision
3. Dedicated human review after a decision
4. Independent external audit with a public summary

## Scenario

Respondents consider a government agency using AI to assist with public education scholarship eligibility decisions. All systems are described as applying the same eligibility rules, using the same categories of applicant information, complying with applicable law, and having the same cost and processing time.

Only the four experimental attributes vary.

## Factorial profile universe

Each attribute has two levels:

| Attribute | Low level | High level |
| --- | --- | --- |
| Accuracy | 90% | 98% |
| Decision process | AI recommendation becomes the initial decision automatically | Human officer reviews AI recommendation before the initial decision |
| Review after decision | Normal grievance process, no guaranteed dedicated human re-review | Dedicated human review available on request |
| Audit | Internal government audit | Independent external audit plus public summary |

Four binary attributes create `2^4 = 16` possible profiles. Every participant sees every profile exactly once.

Profile IDs encode the four levels in this order: accuracy, decision process, post-decision review, audit. `0` means the low level and `1` means the high level. For example, `P1010` means 98% accuracy, automatic initial decision, dedicated human review after the decision, and internal audit.

## Choice architecture

Each participant completes eight paired choices.

Seven pairs are substantive trade-offs. Within these pairs, neither profile dominates the other. Each substantive pair differs on two or three of the four attributes so that respondents are not simply choosing an option that is better on every dimension.

The eighth pair compares `P0000` with `P1111`. It is intentionally dominated: `P1111` has the high level on all four attributes. This final pair is not used to estimate the primary preference coefficients. It is reported separately as a descriptive comprehension or choice-consistency measure.

## Pairing blocks

The 14 non-extreme profiles can be paired in many valid ways. The survey therefore uses four pre-specified balanced blocks rather than one fixed pairing arrangement.

Within every block:

- all 14 non-extreme profiles appear exactly once across seven substantive pairs;
- no substantive pair is dominated;
- each substantive pair differs on two or three attributes;
- `P0000` and `P1111` appear only in the eighth pair.

Across the four blocks, each attribute differs within a substantive pair 18 times in total. This balances the amount of identifying variation across accuracy, decision process, post-decision review, and audit.

The browser assigns one block uniformly at random when the survey session starts.

The exact pairings are stored in `design.csv`.

## Additional randomization

For every participant:

- the seven substantive pair order is randomized;
- the dominated pair remains eighth;
- within every pair, the two profiles are independently randomized to System A and System B.

The dataset stores block ID, task ID, presentation order, displayed profile IDs, selected position, selected underlying profile, and whether the pair was the dominated final task.

## Main estimand

The main estimands are the average contributions of the four attributes to the probability that a system is selected within a paired choice.

A utility representation is:

`U = beta_accuracy * Accuracy + beta_human_initial * HumanInitial + beta_human_review * HumanReview + beta_external_audit * ExternalAudit + error`

The primary model should exclude the eighth dominated pair.

A conditional logit is a natural specification. An equivalent alternative-level logistic model can also be used if the paired structure and repeated observations are handled correctly. Uncertainty should account for repeated choices from the same response ID.

For an exploratory brief, report both model-based estimates and transparent descriptive quantities, such as the marginal change in selection probability associated with each attribute.

## Accuracy-equivalent trade-offs

If the model is stable enough, governance coefficients can be expressed relative to the 8 percentage point accuracy change. For example, the estimated utility contribution of guaranteed human review can be compared with the coefficient associated with moving from 90% to 98% accuracy.

This interpretation should be presented cautiously and only when confidence intervals are reasonably informative.

## Secondary outcomes

After the choice experiment, the survey records:

- the factor the respondent says mattered most;
- overall acceptability of AI-assisted scholarship decisions;
- acceptability when a human officer remains responsible for the decision;
- confidence in understanding the choice tasks;
- an optional open-text condition or requirement.

The stated-priority question is secondary. Revealed choices in the paired experiment are the main evidence.

## Sample description

Country or territory, age group, gender, and education are optional descriptive fields. Generative-AI use frequency and prior experience with public benefits are required background questions.

The survey is geographically open and does not use India residency as an eligibility condition.

## Automated submissions

The survey infrastructure intentionally does not identify or classify the origin of a submission as human or automated. There is no CAPTCHA, sign-in, device fingerprint, IP collection, rate limit, honeypot, or respondent-type variable.

Accordingly, the dataset itself cannot establish that a response came from a human participant. If the recruitment channel permits uncontrolled automated submissions, the resulting sample cannot validly be described as representative human public opinion. Claims must be limited to the population or response-generating process actually recruited.

## Data separation

Version 3 writes to `responses_v3`. Earlier pilot responses and prior designs must not be pooled into the V3 analysis.

## Minimum reporting standards

A policy brief using these data should report:

- number of completed V3 responses;
- recruitment method;
- country composition where available;
- block counts;
- number and percentage selecting the all-high option in the final dominated pair;
- primary four attribute estimates with uncertainty;
- at least one transparent descriptive chart;
- limitations arising from convenience sampling and the inability of the site itself to verify respondent identity.
