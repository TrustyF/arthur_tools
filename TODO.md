# TODO

- [ ] **Unhide the "Download all" bundle.** Try `/download` in Houdini first: extract into the Houdini folder, restart, add the "Arthur tools" shelf. Check that:
  - custom icons show (they use `$ARTHUR_TOOLS/icons/<slug>.png`; unsure Houdini expands variables in shelf icon paths)
  - VEX buttons get their spare parameters (`vexpressionmenu.createSpareParmsFromChCalls`)

  Then set `SHOW_BUNDLE = true` in `src/lib/bundle.ts` (shows the home page button and the `/help#bundle` section).
