# Research Design v2.0.0

## Core question

When governments use AI to assist with consequential public-benefit eligibility decisions, how do four system features shape public preferences?

The four attributes are:

1. Accuracy
2. Human review before the initial decision
3. Human review after a decision
4. Audit structure

The primary goal is not simply to ask whether respondents like each safeguard. It is to estimate how strongly each feature affects the probability that a system is preferred when respondents face trade-offs.

## Scope

The study is not restricted to India. Any consenting adult aged 18 or above can participate. The scenario refers generically to a government agency and a public benefit.

## Attributes and levels

| Attribute | Level 0 | Level 1 |
| --- | --- | --- |
| Accuracy | 90% | 98% |
| Decision process | AI recommendation becomes the initial decision automatically | Human government officer reviews the AI recommendation before the initial decision |
| Review after decision | Normal grievance process, no guaranteed dedicated human re-review | Applicant can request a dedicated human review |
| Audit | Internal government audit | Independent external audit plus a public summary |

Four binary attributes imply 2^4 = 16 possible profiles.

Comparing every profile against every other profile would require 16 choose 2 = 120 unique pairs. That is unnecessary and would make the survey unusable.

## Choice design

Each respondent sees eight paired choices.

The design uses eight pre-specified, non-dominated choice sets. A system is never paired against another system that is unambiguously better on all four attributes.

Within every pair:

- exactly three attributes differ;
- exactly one attribute is held constant;
- each option has at least one advantage over the other.

Across all eight tasks:

- each of the four attributes is held constant exactly twice;
- each level of every attribute appears exactly eight times across the 16 profile appearances;
- no respondent sees an option that is simply superior on every dimension;
- task order is randomized for every respondent;
- left/right A/B position is randomized independently within each task.

The actual choice sets are stored in `design.csv`.

## Scenario

Respondents are asked to imagine that a government agency is considering using AI to assist with decisions about whether applicants qualify for a public benefit.

All systems are stated to:

- apply the same eligibility rules;
- use the same categories of applicant information;
- comply with applicable law;
- have the same cost and processing time.

Only the four experimental attributes vary.

## Primary outcome

For each task, the outcome is which profile the respondent chooses.

The main estimands are the effects of:

- 98% rather than 90% accuracy;
- human review before the initial decision rather than automatic initial decision;
- guaranteed dedicated human review after a decision rather than only the normal grievance process;
- independent external auditing with a public summary rather than internal auditing only.

The principal substantive result should be the relative size of these effects, not merely whether each coefficient has the expected sign.

## Primary analysis

Reshape the data to one row per displayed profile per respondent-task, with `selected = 1` for the chosen profile and `selected = 0` for the alternative.

Estimate a main-effects choice model using the four attributes. Suitable approaches include:

- a conditional logit choice model; or
- a linear probability model for profile selection with standard errors clustered by respondent.

The analysis should also include a left/right position indicator as a diagnostic for residual presentation bias.

Because each respondent makes eight decisions, the 8N profile choices are repeated observations from N people and must not be treated as independent respondents.

## Secondary analysis

The survey also records:

- the factor respondents say mattered most;
- overall acceptability of AI-assisted public-benefit decisions;
- acceptability when a human remains responsible for the initial decision;
- self-reported comprehension confidence;
- optional qualitative comments.

A useful comparison is stated priority versus revealed choice behaviour.

## Interpretation

This is a rapid exploratory choice experiment unless recruitment is designed to produce a representative sample. Results should therefore be described as evidence about the surveyed sample rather than population estimates for a country or the world.

The strongest policy output is a ranked estimate of which institutional features most influence willingness to accept government AI, and how the effect of stronger procedural protections compares with the effect of a substantial increase in system accuracy.
