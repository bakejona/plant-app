// src/components/AuthForm.js (Example component)

import { signUp, signIn, signOutUser } from '../authService';
// Assuming you have form fields for email and password...

// Example function to handle a button click
async function handleSignIn(email, password) {
  try {
    const user = await signIn(email, password);
    alert(`Welcome back, ${user.user.email}!`);
  } catch (error) {
    // Handle specific Firebase error codes (e.g., wrong-password, user-not-found)
    alert(`Login failed: ${error.message}`);
  }
}

// Example function to handle sign out
async function handleSignOut() {
  await signOutUser();
  // The onAuthStateChanged listener will handle the UI update
}

// ... your component rendering the forms and buttons
