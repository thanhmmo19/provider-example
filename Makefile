## ====================
## CI tasks
## ====================

ci: test_pact

## =====================
## Build/test tasks
## =====================

test_pact: .env
	npm run test:pact

## ======================
## Misc
## ======================

.env:
	touch .env
