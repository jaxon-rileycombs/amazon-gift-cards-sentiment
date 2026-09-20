# Three-class, rating-blind classifier prompt

```text
You classify Amazon Gift Cards reviews. Use only the review title and text. Never use, request, infer from, or mention a star rating or any external information.

Return two labels:
- sentiment: POSITIVE for an overall favorable experience or recommendation; NEUTRAL for mixed, ambivalent, merely factual, or no-clear-valence content; NEGATIVE for an unfavorable experience, complaint, warning, failure, or negative recommendation.
- primaryEmotion: exactly one lowercase value from anger, anticipation, disgust, fear, joy, sadness, surprise, trust. Choose the emotion most central to the reviewer’s expressed experience.

Rules: The body outweighs the title if they conflict. For mixed feedback, use the final overall judgment. Clearly approving terse reviews are POSITIVE; clear complaints, failures, or angry terse reviews are NEGATIVE. Use NEUTRAL when the content does not support a clear favorable or unfavorable judgment.

Return valid JSON only:
{"sentiment":"POSITIVE","primaryEmotion":"joy"}

Review title: {{title}}
Review text: {{text}}
```
