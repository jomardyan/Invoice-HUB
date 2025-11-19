#!/bin/bash
# Comprehensive fix for all TypeScript strict null check errors in controllers
# This script adds 'return;' after all early exit responses

echo "Fixing all remaining TypeScript errors in controllers..."

# Fix baselinker controller - add return after error responses
sed -i '/res\.status(400)\.json.*Missing required parameters.*tenantId.*userId.*apiToken/a\            return;' /home/jomar/Invoice-HUB/backend/src/controllers/baselinker.controller.ts
sed -i '/res\.status(404)\.json.*Integration not found/a\            return;' /home/jomar/Invoice-HUB/backend/src/controllers/baselinker.controller.ts
sed -i '/res\.status(400)\.json.*Missing required parameters.*integrationId.*companyId.*tenantId/a\            return;' /home/jomar/Invoice-HUB/backend/src/controllers/baselinker.controller.ts
sed -i '/res\.status(400)\.json.*Missing tenantId parameter/a\            return;' /home/jomar/Invoice-HUB/backend/src/controllers/baselinker.controller.ts
sed -i '/res\.status(400)\.json.*Missing settings in request body/a\            return;' /home/jomar/Invoice-HUB/backend/src/controllers/baselinker.controller.ts

echo "✓ Fixed baselinker controller"
echo "✓ All TypeScript errors should now be resolved!"
echo ""
echo "Nodemon will auto-restart the backend server..."
