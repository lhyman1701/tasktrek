# Session Pre-Flight Checklist

**Purpose:** This checklist MUST be completed before ending ANY session. It exists to prevent session continuity failures where action items are lost between sessions.

**Rule:** ALL items must be checked or explicitly marked as N/A with reason before `/end-session` can complete.

---

## 1. Action Item Extraction

- [ ] Searched all files modified this session for "Next Steps", "Recommendations", "TODO", "MUST"
- [ ] For each action item found: completed it OR created wave/task OR marked incomplete
- [ ] Logged "ACTION ITEM EXTRACTION COMPLETE" via session-audit

**Files checked:** _____________________________________________

**Action items found:** ________________________________________

**Disposition:** _______________________________________________

---

## 2. Report/Plan Action Item Gate

- [ ] If I created any report, plan, or audit document this session:
  - [ ] Extracted all action items immediately after writing
  - [ ] Created waves/tasks for each OR marked incomplete
  - [ ] Added "Action Items Captured" section to document

**Reports/plans created this session:** _________________________

**Action items from reports:** __________________________________

---

## 3. Wave System Integrity

- [ ] .wave-config.json `ready_waves` is accurate (no missing waves)
- [ ] .wave-config.json `completed_waves` is accurate
- [ ] All completed waves have progress files showing 100%
- [ ] No orphaned recommendations in progress files

**Waves modified this session:** ________________________________

---

## 4. Session Audit Completeness

- [ ] All significant decisions logged via `log_decision()`
- [ ] All file modifications logged via `log_action()`
- [ ] All task state changes logged via `log_task_change()`
- [ ] All incomplete work logged via `mark_incomplete()`

---

## 5. Documentation Sync

- [ ] SESSION_START.md accurately reflects current state
- [ ] SESSION_START.md lists ALL incomplete work with priorities
- [ ] SESSION_START.md "Next Session Should" section is actionable
- [ ] No "Next Steps" in any file without corresponding wave/task

---

## 6. Explicit Verification

I have verified that:

- [ ] There are NO unactioned recommendations in any file I modified
- [ ] There are NO "Create Wave" mentions without corresponding waves existing
- [ ] There are NO "Create Task" mentions without corresponding tasks existing
- [ ] There are NO "TODO" items that should be tracked but aren't

---

## Sign-off

**Session Number:** ____________

**Date:** ____________

**Action Items Found This Session:** ____________

**Action Items Captured:** ____________

**Action Items Marked Incomplete:** ____________

**Verification:** I confirm all action items from this session have been either completed, converted to waves/tasks, or explicitly marked as incomplete work.

---

## Why This Exists

Session handoff failures cost hours of rework and user frustration. This checklist prevents:
- Lost recommendations from audit documents
- Missing waves that were "planned" but never created
- Action items that fall through the cracks
- Session state that doesn't reflect reality
