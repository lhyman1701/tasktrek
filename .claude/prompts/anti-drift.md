# Anti-Drift Alignment Checklist

**Purpose:** Manual verification that current work aligns with project objectives.
**When to Use:** Before committing major changes, when uncertain about direction, or when requested by hooks.
**How to Use:** Work through each section, answer honestly, adjust course if needed.

---

## 🎯 PRIMARY GOAL ALIGNMENT

### Question 1: Does this work move toward the Primary Goal?

**Primary Goal:**
> {{PRIMARY_GOAL}}

**Ask yourself:**
- [ ] Does this directly support the primary goal?
- [ ] Does this improve core functionality?
- [ ] Does this help users accomplish their tasks?

**If you checked fewer than 2 boxes:** Stop. Reassess the task. Is this actually aligned with our Primary Goal?

---

## ✅ SUCCESS CRITERIA CHECK

### Question 2: Does this satisfy a Success Criterion?

Review the Success Criteria from your project documentation:

- [ ] Advances a technical requirement
- [ ] Improves user experience
- [ ] Supports deployment/scaling
- [ ] Meets a business outcome

**If you checked 0 boxes:** Stop. This work may not contribute to any Success Criterion. Consider if it's necessary.

---

## 🚫 NON-GOAL VERIFICATION

### Question 3: Is this a Non-Goal (out of scope)?

Check against your project's explicit Non-Goals (if documented):

**Is your current work:**
- [ ] Adding features explicitly marked as out of scope?
- [ ] Building for "future needs" that aren't current requirements?
- [ ] Implementing nice-to-haves before must-haves?

**If you checked ANY boxes:** STOP IMMEDIATELY. You are working on an explicit Non-Goal. This is scope creep. Discuss with the user before continuing.

---

## 🔒 CONSTRAINTS VERIFICATION

### Question 4: Does this respect all Constraints?

**Technical Constraints:**
- [ ] Using approved technologies only?
- [ ] Not changing core architecture without approval?
- [ ] Following coding standards?

**If you checked "No" to any:** STOP. You may be violating a Constraint. Get user approval before proceeding.

---

## 📐 ARCHITECTURAL COMPLIANCE

### Question 5: Does this follow approved architectural decisions?

- [ ] Using correct data stores for data types?
- [ ] Following established patterns?
- [ ] Not creating parallel systems?

**If you violated any decision:** STOP. You may be deviating from approved architecture. Discuss with user.

---

## 🎨 SIMPLICITY CHECK

### Question 6: Are you over-engineering?

**Warning signs of over-engineering:**
- [ ] Adding features not requested
- [ ] Creating abstractions for one-time use
- [ ] Adding configurability "for future needs"
- [ ] Implementing error handling for impossible scenarios
- [ ] Adding extensive comments to obvious code
- [ ] Creating helpers/utilities for simple operations

**If you checked 2+ boxes:** You may be over-engineering. Remember: "The right amount of complexity is the minimum needed for the current task."

---

## 🔄 DRIFT RECOVERY PROTOCOL

### If you discover drift (failed any checklist above):

1. **STOP IMMEDIATELY** - Don't continue down the wrong path
2. **DOCUMENT THE DRIFT** - Write down what you were doing and why it doesn't align
3. **REVIEW OBJECTIVES** - Re-read project documentation to understand correct direction
4. **ASK USER** - If uncertain, ask user for clarification before proceeding
5. **ADJUST COURSE** - Modify approach to align with objectives
6. **LOG DECISION** - Use `mcp__session-audit__log_decision()` to record why you adjusted

---

## 📋 COMMON DRIFT PATTERNS

### Pattern 1: "Simpler is Better" Drift

**Symptom:** Choosing technology different from specification because it seems simpler.
**Recovery:** Architecture decisions prioritize long-term benefits over short-term convenience. Use specified technology.

### Pattern 2: "Future-Proofing" Drift

**Symptom:** Adding features/abstractions for hypothetical future requirements.
**Recovery:** Implement only what's needed now. YAGNI (You Aren't Gonna Need It).

### Pattern 3: "Scope Creep" Drift

**Symptom:** Adding features beyond task specification because they "seem useful."
**Recovery:** Check Non-Goals list. If it's a Non-Goal, stop immediately.

### Pattern 4: "Not Invented Here" Drift

**Symptom:** Reimplementing existing solutions instead of using what's already built.
**Recovery:** Review existing codebase first. Reuse over rebuild.

### Pattern 5: "Premature Optimization" Drift

**Symptom:** Optimizing for performance before measuring bottlenecks.
**Recovery:** Make it work, then make it fast. Don't optimize prematurely.

---

## 🚨 EMERGENCY STOP TRIGGERS

**If ANY of these are true, STOP IMMEDIATELY and ask user:**

1. You're changing storage technology without approval
2. You're adding a new service not in the architecture
3. You're modifying database schemas without migration
4. You're adding explicit Non-Goals
5. You're deviating from task specification for "simplicity"
6. You're unsure if this aligns with Primary Goal
7. You're working on something not in the current wave/roadmap

---

## ✅ ALIGNMENT CONFIRMED

**If you made it through ALL checklists with no red flags:**

1. ✅ Your work aligns with Primary Goal
2. ✅ Your work satisfies a Success Criterion
3. ✅ Your work is NOT a Non-Goal
4. ✅ Your work respects all Constraints
5. ✅ Your work follows architectural decisions
6. ✅ Your work is appropriately simple (not over-engineered)

**Proceed with confidence.** Log your decision and continue.

---

## 📝 LOGGING YOUR ALIGNMENT CHECK

After completing this checklist, log the verification:

```python
mcp__session-audit__log_decision(
    decision="Verified alignment with anti-drift checklist",
    rationale="Completed anti-drift checklist. Work aligns with Primary Goal, satisfies Success Criterion, respects Constraints. No drift detected.",
    category="alignment",
    impact="medium"
)
```
