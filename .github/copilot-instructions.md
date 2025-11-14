# Copilot Instructions - ToolBox Project

## 🚫 DO NOT Generate These Files

Copilot should **NEVER** generate or create the following types of files as they waste compute resources and clutter the workspace:

### Prohibited Summary Files
- ❌ `*_SUMMARY.md`
- ❌ `*_SUMMARY.txt`
- ❌ `SESSION_SUMMARY.md`
- ❌ `PROJECT_SUMMARY.md`
- ❌ `COMPLETION_SUMMARY.md`
- ❌ `IMPLEMENTATION_SUMMARY.md`

### Prohibited Progress Files
- ❌ `SESSION_PROGRESS.md`
- ❌ `PROJECT_PROGRESS.md`
- ❌ `PROGRESS_REPORT.md`
- ❌ `PROGRESS_TRACKING.md`
- ❌ `*_PROGRESS.md`

### Prohibited Completion Files
- ❌ `COMPLETION_CHECKLIST.md`
- ❌ `COMPLETION_REPORT.txt`
- ❌ `COMPLETION_STATUS.md`
- ❌ `*_CHECKLIST.md` (unless specifically requested)

### Prohibited Status Files
- ❌ `STATUS.md`
- ❌ `UPDATE_STATUS.md`
- ❌ `IMPLEMENTATION_STATUS_*.md`
- ❌ `*_STATUS.md` (unless specifically requested)

### Prohibited Report Files
- ❌ `REPORT.md`
- ❌ `PROJECT_REPORT.md`
- ❌ `SESSION_REPORT.md`
- ❌ `*_REPORT.md` (unless specifically requested)

### Other Prohibited Files
- ❌ `CODEBASE_SCAN_REPORT_*.md`
- ❌ `*_LOG.md`
- ❌ `TODO_LIST.md`
- ❌ `NOTES.md`
- ❌ `RANDOM_NOTES.md`

---

## ✅ When Summary Files ARE Allowed

Summary files **ONLY** when explicitly requested by the user:
- User says: "Create a summary"
- User says: "Document the progress"
- User says: "Create a checklist"
- User explicitly names the file

Even then, create **ONE** comprehensive file, not multiple variations.

---

## 💡 Why These Restrictions

1. **Performance:** Reduces disk I/O and file system operations
2. **Compute:** Saves token generation for actual code changes
3. **Clutter:** Keeps workspace clean and organized
4. **Focus:** Prevents redundant documentation
5. **Efficiency:** Allocates resources to productive tasks

---

## 🎯 What TO Do Instead

### When Task is Complete
1. ✅ Update existing documentation if needed
2. ✅ Make actual code changes
3. ✅ Don't generate progress files
4. ✅ Use `manage_todo_list` tool for tracking only
5. ✅ Communicate status directly in chat

### When Documentation is Needed
1. ✅ Create ONE comprehensive guide (if explicitly requested)
2. ✅ Use consistent naming (USER should specify the name)
3. ✅ Include ALL relevant information
4. ✅ Link to related documentation
5. ✅ Don't create multiple variations

### For Progress Tracking
1. ✅ Use the `manage_todo_list` tool
2. ✅ Update todo items as tasks progress
3. ✅ Don't create progress markdown files
4. ✅ Report status in chat messages

---

## 📋 Existing Files to AVOID RECREATING

These files already exist. DO NOT recreate or update them unless specifically requested:

```
- SESSION_SUMMARY.md (delete if created)
- SESSION_COMPLETION_SUMMARY.md (delete if created)
- SESSION_PROGRESS.md (delete if created)
- PROJECT_COMPLETION_REPORT.md (delete if created)
- IMPLEMENTATION_REPORT.md (delete if created)
- IMPLEMENTATION_STATUS_NOV4.md (delete if created)
- COMPLETION_REPORT.txt (delete if created)
- COMPLETION_CHECKLIST.md (delete if created)
```

---

## 🔍 Enforcement Rules

**For every task/feature implementation:**

Before generating ANY documentation:
1. Ask yourself: "Did the user request this?"
2. If NO → Don't create it
3. If YES → Create ONE file with a meaningful name
4. Never create: `*_SUMMARY.md`, `*_PROGRESS.md`, `*_REPORT.md`

**Example - WRONG:**
```
❌ SESSION_PROGRESS.md
❌ IMPLEMENTATION_SUMMARY.md
❌ PROJECT_COMPLETION_REPORT.md
```

**Example - RIGHT:**
```
✅ FEATURE_AUTH_SETUP.md (specific feature guide)
✅ API_INTEGRATION_GUIDE.md (specific integration guide)
✅ DEPLOYMENT_STEPS.md (specific process guide)
```

---

## 🛑 Zero Tolerance Policy

If you accidentally generate a prohibited file:
1. Delete it immediately
2. Don't include it in any recommendations
3. Report in chat that it won't be created

---

## 🎯 Focus Areas (What Copilot SHOULD Create)

✅ Code files (`.ts`, `.tsx`, `.js`, `.py`, etc.)
✅ Configuration files (`.json`, `.yml`, `.env`, etc.)
✅ Specific guides (requested by user)
✅ Integration documents (requested by user)
✅ Architecture diagrams (requested by user)
✅ API documentation (requested by user)

---

## 📞 Communication Strategy

Instead of creating summary files, communicate progress like:

```
✅ Task Complete: [Feature Name]
- Changed: file1.ts, file2.tsx
- Status: Ready for testing
- Next: [what comes next]
```

---

## 🔐 Exception Handling

If user requests summary but says "don't create" afterward:
1. Respect the later instruction
2. Provide summary verbally in chat
3. Don't create the file

---

**Effective Date:** November 4, 2025  
**Status:** Active and Enforced  
**Violations:** Will be corrected immediately
