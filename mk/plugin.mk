CHECK_TARGETS += plugin-test

# A repository on this machine that already keeps a design ledger and its own checker. When it is
# there, the plugin's reader is tested against the real file; when it is not, that test is skipped
# and the count below says so.
REFERENCE_LEDGER ?= ../onehub-inventory

.PHONY: plugin-test design-apply design-plan design-audit

design-audit: ## Audit this repository: each standard decision's state, and the tier it has reached
	@node plugins/design-assembly/scripts/inventory.mjs --target .

plugin-test: ## Run the plugin's own tests: the colour maths, the ledger, and the whole guide on a throwaway repository
	@mkdir -p coverage
	@DESIGN_ASSEMBLY_REFERENCE_LEDGER=$(REFERENCE_LEDGER) node --test "plugins/design-assembly/tests/*.mjs" > coverage/plugin-test.log 2>&1 || (cat coverage/plugin-test.log; exit 1)
	@echo "plugin tests: $$(grep -c '^✔' coverage/plugin-test.log) passed, $$(grep -c '^﹣' coverage/plugin-test.log) skipped"

design-plan: ## Show what the guide would write into this repository, the reference implementation
	@node plugins/design-assembly/scripts/apply.mjs --target . --dry-run

design-apply: ## Write what design/blueprint.json decides into this repository
	@node plugins/design-assembly/scripts/apply.mjs --target .
