CHECK_TARGETS += plugin-test

.PHONY: plugin-test design-apply design-plan
plugin-test: ## Run the plugin's own tests: the colour maths, and the whole guide on a throwaway repository
	@mkdir -p coverage
	@node --test "plugins/design-assembly/tests/*.mjs" > coverage/plugin-test.log 2>&1 || (cat coverage/plugin-test.log; exit 1)
	@echo "plugin tests: $$(grep -c '^✔' coverage/plugin-test.log) passed"

design-plan: ## Show what the guide would write into this repository, the reference implementation
	@node plugins/design-assembly/scripts/apply.mjs --target . --dry-run

design-apply: ## Write what design/blueprint.json decides into this repository
	@node plugins/design-assembly/scripts/apply.mjs --target .
