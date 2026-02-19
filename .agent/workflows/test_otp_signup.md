---
description: Test the new user signup flow with OTP verification
---

1. Open the signup page in the browser
2. Fill in the specific details: Username, Email, Password, and Confirm Password (ensure they match)
3. Click "Create Account"
4. Verify that an OTP Modal popup appears overlaying the form
5. Verify the timer starts counting down from 5:00
6. Check the backend logs or email for the OTP code
7. Enter the OTP code in the modal
8. Click "Verify & Sign up"
9. Verify that the user is redirected to the appropriate dashboard
