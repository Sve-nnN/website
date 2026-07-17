# Deferred Items

Out-of-scope discoveries logged during phase 31 execution — NOT fixed, tracked here for future attention.

## 31-10 (Posts batch 9, ids 50-54)

### Post 53 (`tech-seo-guide`, es locale) — duplicated "See Also" related-links section

**Found during:** post-recovery verification of 31-10 (2026-07-16/17)

**What:** The `es` locale content tree for post id 53 ends with a `Ver también` heading followed by a related-links list, then **four additional headings literally reading "See Also"** (English, untranslated) each followed by a single related-link listitem. The `en` locale content for the same post has a single, clean "See Also" heading with no duplication.

**Why deferred, not fixed:** This structure is NOT part of the `content` field text this plan (31-10) rewrites — none of these heading/listitem strings appear in `scripts/humanize-posts-batch-09.ts`'s `REWRITES` arrays, confirming the duplication predates this batch's work (it was already present in the original production content before batch 9 ran, on both the crashed agent's first pass and this recovery pass). Fixing it would mean restructuring the document (removing/merging heading+listitem nodes), which is an architectural content-shape change outside this plan's declared scope (voice-only text-node rewrite, `<threat_model>` T-31-04 explicitly says never touch structure). Flagging per Rule 4 for a human/architectural call rather than auto-fixing.

**Recommendation:** Investigate whether post 53 has duplicate "related posts" widget data (e.g. a bilingual related-posts field that got partially populated in English inside the `es` locale) and clean up in a dedicated content-structure fix, separate from the humanization sweep. Since post 53 = `/en/blog/tech-seo-guide` is the Lighthouse-gate route, the **`en` locale render is unaffected** (clean single "See Also"); the anomaly only affects the `es`-locale version of the same post, so it does not block 31-17's gate.
