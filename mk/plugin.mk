CHECK_TARGETS += plugin-test

# A repository on this machine that already keeps a design ledger and its own checker. When it is
# there, the plugin's reader is tested against the real file; when it is not, that test is skipped
# and the count below says so.
REFERENCE_LEDGER ?= ../onehub-inventory
# A checkout of the acceptance kit on this machine. When it is there, the design tokens file the
# plugin writes is given to the kit's own reader; when it is not, that test is skipped too.
ACCEPTANCE_KIT ?= ../delivery-loop
# How the reference repository spells the keys of its ledger of screens that join it with its model.
REFERENCE_SCREEN_KEYS ?= entry=vao,actions=nut,frame=khung

.PHONY: design-status design-ladder design-screen-actions-reference plugin-test design-specimen design-book design-apply design-plan design-audit design-adopt design-adopt-plan design-adopt-reference

design-audit: ## Audit this repository: each standard decision's state, and the tier it has reached
	@node plugins/design-assembly/scripts/inventory.mjs --target .

design-status: ## Say what waits on the owner here, the tier reached, and the command to run next. Ends with 1 when something waits
	@node plugins/design-assembly/scripts/status.mjs --target .

plugin-test: ## Run the plugin's own tests: the colour maths, the ledger, and the whole guide on a throwaway repository
	@mkdir -p coverage
	@DESIGN_ASSEMBLY_REFERENCE_LEDGER=$(REFERENCE_LEDGER) DESIGN_ASSEMBLY_KIT=$(ACCEPTANCE_KIT) node --test --test-reporter=spec "plugins/design-assembly/tests/*.mjs" > coverage/plugin-test.log 2>&1 || (cat coverage/plugin-test.log; exit 1)
	@echo "plugin tests: $$(grep -c '^✔' coverage/plugin-test.log) passed, $$(grep -c '^﹣' coverage/plugin-test.log) skipped"
	@# The reporter is named, so the count reads the same on every version of the runtime. A run
	@# that counts no passing test proves nothing, and fails.
	@grep -q '^✔' coverage/plugin-test.log || (echo "plugin tests: no passing test was counted, so this run proves nothing"; exit 1)

# Extra flags for the sheet, such as SPECIMEN_ARGS="--section color --color #aa3300".
SPECIMEN_ARGS ?=

design-specimen: ## Draw the choices of foundations on this repository's own screen, to pick by eye
	@node plugins/design-assembly/scripts/specimen.mjs --target . $(SPECIMEN_ARGS)

# Extra flags for the book, such as BOOK_ARGS="--audience builder --format pdf".
BOOK_ARGS ?=

design-book: ## Draw this repository's design system as a book to hand to a person
	@node plugins/design-assembly/scripts/book.mjs --target . $(BOOK_ARGS)

design-plan: ## Show what the guide would write into this repository, the reference implementation
	@node plugins/design-assembly/scripts/apply.mjs --target . --dry-run

design-apply: ## Write what design/blueprint.json decides into this repository
	@node plugins/design-assembly/scripts/apply.mjs --target .

# Extra flags for adopting, such as ADOPT_ARGS="--conformance-level AA".
ADOPT_ARGS ?=

design-adopt-plan: ## Show what adopting would add here: rows and checks around what the repository already has
	@node plugins/design-assembly/scripts/adopt.mjs --target . --dry-run $(ADOPT_ARGS)

design-adopt: ## Add those rows and checks. Changes no stylesheet, lint rule, test or existing row
	@node plugins/design-assembly/scripts/adopt.mjs --target . $(ADOPT_ARGS)

design-adopt-reference: ## Preview adopting on the reference repository. Never writes there
	@node plugins/design-assembly/scripts/adopt.mjs --target $(REFERENCE_LEDGER) --dry-run $(ADOPT_ARGS)

design-screen-actions-reference: ## Join the reference repository's ledger of screens with its domain model, as it is and with what each screen shows. Never writes there
	@echo "--- as the repository declares it"
	-@node plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs --target $(REFERENCE_LEDGER) --keys $(REFERENCE_SCREEN_KEYS)
	@echo "--- with what each screen shows, written by the machine in docs/trials/inventory-shows.json"
	-@node plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs --target $(REFERENCE_LEDGER) --keys $(REFERENCE_SCREEN_KEYS),shows=hien --overlay docs/trials/inventory-shows.json

design-ladder: ## Measure the four-rung ladder on a throwaway copy of the reference repository. Never writes there
	@node docs/trials/ladder.mjs --reference $(REFERENCE_LEDGER) --kit $(ACCEPTANCE_KIT)
