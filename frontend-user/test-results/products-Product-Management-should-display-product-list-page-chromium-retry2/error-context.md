# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e9]:
    - heading "Welcome back" [level=1] [ref=e10]
    - paragraph [ref=e11]: Sign in to continue to Invoice-HUB
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Email
        - generic [ref=e15]:
          - textbox "Email" [ref=e16]: test@example.com
          - group:
            - generic: Email
      - generic [ref=e17]:
        - generic [ref=e18]: Password
        - generic [ref=e19]:
          - textbox "Password" [ref=e20]: password123
          - group:
            - generic: Password
      - button "Sign In" [ref=e21] [cursor=pointer]: Sign In
      - paragraph [ref=e23]:
        - text: Don't have an account?
        - link "Sign up" [ref=e24] [cursor=pointer]:
          - /url: /register
  - region "Notifications Alt+T"
```