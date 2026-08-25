# Human Decision Notes

Complete this file yourself after you finish the code and tests.

Do not ask an AI agent to draft this file. Short, plain, imperfect writing is
preferred over polished generic text. We may ask you about any answer here
during review.

## 1. What I changed

### Issue 1:

```
reorder [semantic, global, ...extraLayers] → [globalTokens, semantic, ...extraLayers] at ThemeProvider.tsx:89.
```

### Issue 2:

```
.ev-station-card--selected {
  box-shadow: var(--ev-shadow-3), inset 0 0 0 2px var(--ev-card-selected-boder) -> var(--ev-card-selected-border) ;
} src/components/molecules/molecules.css:66:
```

### Issue 3:
```
In codegen.ts, replaced the single-import-from-first-fixture's-module logic with grouping fixtures by their own module specifier; one import line per module.
```
## 2. Evidence I used

### Issue 1:

```
| File or command | What I learned |
|src/tokens/emit.ts,|mergeEmitted uses Object.assign → later layers overwrite earlier ones|
|src/tokens/global.ts|global layer emits fixed Radix gray.* — the only collision with semantic|
|DevTools computed styles| --ev-gray-11 identical across tints = values clobbered after emission | 
```

### Issue 3:
|src/composer/codegen.ts:170-175|All fixtures imported from first sorted name's module|
|Volt seed (seed.ts:67-101) + emitters|Station detail uses SAMPLE_PRICE_BANDS + SAMPLE_TARIFF_NOTES via PricingTable notes:true|


## 3. A suggestion I rejected or narrowed

### Issue 1:

- deleting gray.* from GLOBAL_TOKENS, or special-casing gray in the merge. Why rejected: the docs define precedence as component → brand → primitive, so the general fix is restoring that order; deleting globals would break alias targets/DTCG export and restructures the token system (forbidden by the task).

### Issue 2:

Nothing because there was simple typo

### Issue 3:
One-import-per-fixture (simplest code). Rejected because it changes output format for every screen and drifts from existing grouped-import expectations; instead kept single-module output byte-identical and only split when sources differ.

## 4. Verification

### Issue 1:
* npm run dev -> playground → brand panel → dark theme -> cycle Gray tints -> backgrounds/text/borders shift per tint; DevTools shows --ev-gray-11 change (e.g. #b4b4b4 → #b4b2be)

### Issue 2:

npm run dev -> Components tab → Molecules → StationListCard

### Issue 3:
npm test (+ new mixed-fixtures test); manual: composer.html → Station detail → Copy JSX → pasted into .tsx, compiles.

## 5. Remaining risk
### Issue 1:
* I'd next test the two Atlas libraries' themes after the layer reorder. My fix changes precedence for every overlapping var name across all three libraries, not just gray in Volt. I verified Volt's grays visually, but atlas-web/tokens/global.ts and atlas-charge/tokens/global.ts define their own token sets — if either library intentionally overrides a semantic-level name at the global layer expecting to win, my reorder flips that behavior. I checked the obvious gray collision but didn't diff every overlapping name across all three libraries

### Issue 2:

None

### Issue 3:
Only Volt's FIXTURES map checked; atlas-web/atlas-charge packs have their own fixtures maps — worth verifying none has a name missing from its map (would now throw where it previously silently mis-imported).


## 6. How I directed the investigation
### Issue 1:
* First I looked where grayTint is handled — ThemePanel and brand.ts. All correct, so I traced where the value gets lost on its way to CSS: the layer array in ThemeProvider and mergeEmitted. global.ts emits fixed gray.* tokens, emit.ts merges last-wins, and the provider put semantic first — so brand grays got clobbered. Only gray existed in both layers, matching 'only gray broke'.

### Issue 2:

* First I used the devtools to find the css variable --ev-card-selected-boder changed it to --ev-card-selected-border 


### Issue 3:
Initial instinct was to suspect the emitter or the import list; redirected to reading how imports are actually assembled at the bottom of puckDataToJsx — found the [fixtureNames[0]] shortcut.

## 7. Test-suite audit

Answer the four questions in Part 2 of `TASK.md`.

**7a. How many of the 278 tests would fail if the thing they test were broken?**
Give a number and the method you used.

**7b. Which tests would you not trust, and why?**

**7c. Would the suite have caught each of the four bugs?** For each: yes or no,
and what specifically let it through.

**7d. One day to make this suite honest — what do you change first?**