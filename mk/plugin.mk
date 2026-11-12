CHECK_TARGETS += plugin-test

# A repository on this machine that already keeps a design ledger and its own checker. When it is
# there, the plugin's reader is tested against the real file; when it is not, that test is skipped
# and the count below says so.
REFERENCE_LEDGER ?= ../onehub-inventory
# A checkout of the acceptance kit on this machine. When it is there, the design tokens file the
# plugin writes is given to the kit's own reader; when it is not, that test is skipped too.
ACCEPTANCE_KIT ?= ../delivery-loop

.PHONY: plugin-test design-specimen design-book design-apply design-plan design-audit design-adopt design-adopt-plan design-adopt-reference

design-audit: ## Audit this repository: each standard decision's state, and the tier it has reached
	@node plugins/design-assembly/scripts/inventory.mjs --target .

plugin-test: ## Run the plugin's own tests: the colour maths, the ledger, and the whole guide on a throwaway repository
	@mkdir -p coverage
	@DESIGN_ASSEMBLY_REFERENCE_LEDGER=$(REFERENCE_LEDGER) DESIGN_ASSEMBLY_KIT=$(ACCEPTANCE_KIT) node --test "plugins/design-assembly/tests/*.mjs" > coverage/plugin-test.log 2>&1 || (cat coverage/plugin-test.log; exit 1)
	@echo "plugin tests: $$(grep -c '^✔' coverage/plugin-test.log) passed, $$(grep -c '^﹣' coverage/plugin-test.log) skipped"

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
