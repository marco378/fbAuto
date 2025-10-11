export const LoginSelectors = {
  email: 'input#email, input[name="email"], input[type="email"], input[placeholder*="email" i], input[placeholder*="phone" i]',
  password: 'input#pass, input[name="pass"], input[type="password"], input[placeholder*="password" i]',
  loginButton: 'button[name="login"], button[type="submit"], button:has-text("Log in"), button:has-text("Log In"), button:has-text("Sign in"), input[type="submit"][value*="Log"], [data-testid="royal_login_button"]',
  approvalsCode: 'input[name="approvals_code"], input[placeholder*="code" i], input[type="text"][maxlength="8"]',
  continueBtn: 'button[name="__CONFIRM__"], #checkpointSubmitButton, button:has-text("Continue"), button:has-text("Skip"), button:has-text("Not now")',
};
