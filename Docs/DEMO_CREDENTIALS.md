# 🔐 Demo Credentials for Invoice-HUB

## User Account

Use these credentials to log in to the application:

### Demo User
```
Email:    demo@invoice-hub.com
Password: DemoPassword123!@#
```

### Login URL
- **User Frontend**: http://localhost:5173
- **Admin Frontend**: http://localhost:5174

---

## Quick Login

1. Open http://localhost:5173 in your browser
2. Enter the email: `demo@invoice-hub.com`
3. Enter the password: `DemoPassword123!@#`
4. The system will automatically detect your company (tenant)
5. Click "Sign In"

---

## Account Details

- **Company Name**: Demo Company
- **User Name**: Demo User
- **Email**: demo@invoice-hub.com
- **Role**: Owner (full access)

---

## Creating Additional Users

You can create new users via:

1. **Registration Page** (when implemented)
2. **API Endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "YourPassword123!@#",
       "firstName": "First",
       "lastName": "Last",
       "tenantName": "Your Company"
     }'
   ```

---

## Password Requirements

- Minimum 12 characters
- Must contain letters, numbers, and special characters
- Example: `DemoPassword123!@#`

---

## Testing Credentials

For automated testing, you can use:

```bash
# Export as environment variables
export DEMO_EMAIL="demo@invoice-hub.com"
export DEMO_PASSWORD="DemoPassword123!@#"

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$DEMO_EMAIL\",
    \"password\": \"$DEMO_PASSWORD\"
  }"
```

---

## Security Note

⚠️ **These are demo credentials for development only!**

Do not use these credentials in production environments. Change passwords and create proper user accounts for production use.
