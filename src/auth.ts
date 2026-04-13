import { supabase } from './config';

// Wire Google sign-in button
const googleBtn = document.getElementById('google-login-btn');
if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('[GLOBCART] Initiating Google OAuth...');
        
        (googleBtn as HTMLButtonElement).disabled = true;
        (googleBtn as HTMLButtonElement).textContent = 'Redirecting to Google...';

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('[GLOBCART] Google Auth error:', error.message);
            alert('Sign in failed: ' + error.message);
            (googleBtn as HTMLButtonElement).disabled = false;
            (googleBtn as HTMLButtonElement).innerHTML =
                '<img src="https://www.svgrepo.com/show/475656/google-color.svg" style="width:16px; margin-right:8px;"/> Sign in with Google';
        }
    });
}

// Wire email/password sign in
const signInBtn = document.getElementById('email-signin-btn');
const emailInput = document.getElementById('email-input') as HTMLInputElement;
const passwordInput = document.getElementById('password-input') as HTMLInputElement;
const authMessage = document.getElementById('auth-message');

if (signInBtn) {
    signInBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        if (!email || !password) {
            if (authMessage) authMessage.textContent = 'Please enter email and password.';
            return;
        }
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (authMessage) authMessage.textContent = error.message;
        } else {
            window.location.href = '/';
        }
    });
}

// Wire email/password sign up
const signUpBtn = document.getElementById('email-signup-btn');
if (signUpBtn) {
    signUpBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        if (!email || !password) {
            if (authMessage) authMessage.textContent = 'Please enter email and password.';
            return;
        }
        
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            if (authMessage) authMessage.textContent = error.message;
        } else {
            if (authMessage) authMessage.textContent = 'Check your email to confirm your account!';
        }
    });
}
