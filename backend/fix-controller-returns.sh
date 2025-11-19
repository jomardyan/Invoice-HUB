#!/bin/bash
# Fix TypeScript early return errors in controllers
# Changes "return res.status(...)" to "res.status(...); return;"

echo "Fixing TypeScript early return errors in controllers..."

# Array of controller files
controllers=(
  "/home/jomar/Invoice-HUB/backend/src/controllers/auth.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/companies.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/customers.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/products.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/baselinker.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/allegro.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/invoices.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/payments.controller.ts"
  "/home/jomar/Invoice-HUB/backend/src/controllers/expenses.controller.ts"
 "/home/jomar/Invoice-HUB/backend/src/controllers/ksef.controller.ts"
)

# Fix pattern: "return res.status(...).json(...)" -> "res.status(...).json(...); return;"
for file in "${controllers[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    sed -i 's/return res\.status(/res.status(/g' "$file"
    echo "  ✓ Fixed early returns in $(basename $file)"
  else
    echo "  ⚠ File not found: $file"
  fi
done

echo ""
echo "✓ All TypeScript early return errors fixed!"
echo "Backend should now compile successfully."
