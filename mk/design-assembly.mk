CHECK_TARGETS += design-assembly

.PHONY: design-assembly design-rate
design-assembly: ## Check the generated design tokens, and show each check failing on a changed copy
	@node tools/design-assembly/check.mjs

design-rate: ## Print the determinism rate: decisions held by a check that can fail
	@node tools/design-assembly/check.mjs --rate
