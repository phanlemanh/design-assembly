CHECK_TARGETS += plan-check

.PHONY: plan plan-check

plan: ## Where the work stands against the plan of record: the open stage, its items, what comes after
	@node tools/plan.mjs

plan-check: ## Check the plan of record is in order, and that this branch names the item of the plan it serves
	@node --test tools/plan_test.mjs > /dev/null 2>&1 || (node --test tools/plan_test.mjs; exit 1)
	@node tools/plan.mjs --check
