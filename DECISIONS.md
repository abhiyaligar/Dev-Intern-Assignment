# Human Decision Notes

Complete this file yourself after you finish the code and tests.

Do not ask an AI agent to draft this file. Short, plain, imperfect writing is
preferred over polished generic text. We may ask you about any answer here
during review.

## Issue 1 

## 1. What I changed

reorder [semantic, global, ...extraLayers] → [globalTokens, semantic, ...extraLayers] at ThemeProvider.tsx:89.

## 2. Evidence I used

List the files, tests or commands that convinced you what the correct behavior
should be.

| File or command | What I learned |
|src/tokens/emit.ts,|mergeEmitted uses Object.assign → later layers overwrite earlier ones|
|src/tokens/global.ts|global layer emits fixed Radix gray.* — the only collision with semantic|
|DevTools computed styles| --ev-gray-11 identical across tints = values clobbered after emission | 

## 3. A suggestion I rejected or narrowed

deleting gray.* from GLOBAL_TOKENS, or special-casing gray in the merge. Why rejected: the docs define precedence as component → brand → primitive, so the general fix is restoring that order; deleting globals would break alias targets/DTCG export and restructures the token system (forbidden by the task).

## 4. Verification

npm run dev -> playground → brand panel → dark theme -> cycle Gray tints -> backgrounds/text/borders shift per tint; DevTools shows --ev-gray-11 change (e.g. #b4b4b4 → #b4b2be)

## 5. Remaining risk

I'd next test the two Atlas libraries' themes after the layer reorder. My fix changes precedence for every overlapping var name across all three libraries, not just gray in Volt. I verified Volt's grays visually, but atlas-web/tokens/global.ts and atlas-charge/tokens/global.ts define their own token sets — if either library intentionally overrides a semantic-level name at the global layer expecting to win, my reorder flips that behavior. I checked the obvious gray collision but didn't diff every overlapping name across all three libraries

## 6. How I directed the investigation

First I looked where grayTint is handled — ThemePanel and brand.ts. All correct, so I traced where the value gets lost on its way to CSS: the layer array in ThemeProvider and mergeEmitted. global.ts emits fixed gray.* tokens, emit.ts merges last-wins, and the provider put semantic first — so brand grays got clobbered. Only gray existed in both layers, matching 'only gray broke'.

## 7. Test-suite audit

Answer the four questions in Part 2 of `TASK.md`.

**7a. How many of the 278 tests would fail if the thing they test were broken?**
Give a number and the method you used.

**7b. Which tests would you not trust, and why?**

**7c. Would the suite have caught each of the four bugs?** For each: yes or no,
and what specifically let it through.

**7d. One day to make this suite honest — what do you change first?**
