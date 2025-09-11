// --- Supabase Initialization (Corrected) ---
// This assumes the global 'supabase' object exists from the SDK script tag
const { createClient } = supabase;

// PASTE YOUR SUPABASE URL AND ANON KEY HERE!
const supabaseUrl = 'https://cwubbhcuormtrvyczgpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJiaGN1b3JtdHJ2eWN6Z3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MDQ2MDIsImV4cCI6MjA3Mjk4MDYwMn0.EC-lF_wgrTZxvBpHb_z___45JGHHwX3hKGgQ3juRy5I';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// --- DOM Elements ---
const navLinks = document.getElementById('main-nav-links');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const updatePasswordForm = document.getElementById('update-password-form');
const authError = document.getElementById('auth-error');
const authMessage = document.getElementById('auth-message');

// --- Navigation Links ---
const loggedOutLinks = `
    <li><a href="index.html">Home</a></li>
    <li><a href="faculty.html">Faculty</a></li>
    <li><a href="students.html">Students</a></li>
    <li><a href="class-representatives.html">Class Reps</a></li>
    <li><a href="question-bank.html">Question Bank</a></li>
    <li><a href="results.html">Results</a></li>
    <li><a href="notice.html">Notice Board</a></li>
    <li class="login-button"><a href="login.html">Login</a></li>
`;
const loggedInLinks = `
    <li><a href="index.html">Home</a></li>
    <li><a href="faculty.html">Faculty</a></li>
    <li><a href="students.html">Students</a></li>
    <li><a href="class-representatives.html">Class Reps</a></li>
    <li><a href="question-bank.html">Question Bank</a></li>
    <li><a href="results.html">Results</a></li>
    <li><a href="notice.html">Notice Board</a></li>
    <li class="login-button"><a href="#" id="logout-btn">Logout</a></li>
`;

// --- Authentication State Listener ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (navLinks) {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (session) {
            navLinks.innerHTML = loggedInLinks;
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await supabaseClient.auth.signOut();
                    window.location.href = 'index.html';
                });
            }
        } else {
            navLinks.innerHTML = loggedOutLinks;
        }
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }
});

// --- Login Logic ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            authError.textContent = error.message;
        } else {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user && !user.email_confirmed_at) {
                await supabaseClient.auth.signOut(); // Log them out immediately
                authError.textContent = 'Please verify your email before logging in.';
            } else {
                window.location.href = 'index.html';
            }
        }
    });
}

// --- FINAL TWO-STEP REGISTER LOGIC ---
if (registerForm) {
    const verifyBtn = document.getElementById('verify-btn');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const authError = document.getElementById('auth-error');

    // --- LOGIC FOR STEP 1 (VERIFY BUTTON) ---
    // This is the original code for the "Verify Identity" button.
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const name = document.getElementById('register-name').value;
            const studentId = document.getElementById('register-id').value.toUpperCase();
            const session = document.getElementById('register-session').value;
            
            if (!name || !studentId || !session) {
                authError.textContent = 'Please fill in your Name, Student ID, and Session.';
                return;
            }
            authError.textContent = 'Verifying...';

            try {
                const { data: approvedStudent, error } = await supabaseClient
                    .from('approved_students')
                    .select()
                    .eq('id', studentId)
                    .eq('name', name)
                    .eq('session', session)
                    .single();

                if (error || !approvedStudent) {
                    throw new Error("Details do not match our records for the selected session.");
                }

                // Verification successful!
                authError.textContent = '';
                step1.style.display = 'none';
                step2.style.display = 'block';

            } catch (error) {
                authError.textContent = error.message;
            }
        });
    }

    // --- LOGIC FOR STEP 2 (CREATE ACCOUNT BUTTON) ---
    // This is the corrected code for the final form submission.
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // FIXED: Using getElementById to correctly get values
        const studentId = document.getElementById('register-id').value.toUpperCase();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const phoneNumber = document.getElementById('register-number').value;

        if (password !== confirmPassword) {
            authError.textContent = 'Passwords do not match.';
            return;
        }

        authError.textContent = 'Processing... Please wait.';

        try {
            const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({ email, password });
            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error("Could not create user account.");
            const user = authData.user;

            const profileData = {
                id: user.id,
                phone_number: phoneNumber,
                email: email
            };


            
            window.location.href = 'verify-email.html';

        } catch (error) {
            authError.textContent = error.message;
        }
    });
}

// ✅ ADD THIS "IF" CHECK AROUND YOUR CODE
if (registerForm) {
  // Logic for the final "Create Account" button (Step 2)
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // FIXED: Using getElementById to correctly get values
    const name = document.getElementById('register-name').value;
    const studentId = document.getElementById('register-id').value.toUpperCase();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const phoneNumber = document.getElementById('register-number').value;

    if (password !== confirmPassword) {
        authError.textContent = 'Passwords do not match.';
        return;
    }

    authError.textContent = 'Processing... Please wait.';

    try {
        const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Could not create user account.");
        const user = authData.user;

        // --- FIXED: Logic to handle optional photo upload ---
        const profileData = {
            id: user.id,
            phone_number: phoneNumber,
            email: email
        };
        
        // Update the user's profile with all the data
        const { error: profileError } = await supabaseClient.from('profiles').update(profileData).eq('student_id', studentId);
        if (profileError) throw profileError;
        
        window.location.href = 'verify-email.html';

    } catch (error) {
        authError.textContent = error.message;
    }
});

// --- FORGOT PASSWORD LOGIC ---
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = forgotPasswordForm['forgot-email'].value;
        if (authError) authError.textContent = '';
        if (authMessage) authMessage.textContent = 'Processing...';

        // This creates a link that will bring the user back to your site
        const resetUrl = window.location.origin + '/update-password.html';

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: resetUrl,
        });

        if (error) {
            if (authMessage) authMessage.textContent = '';
            if (authError) authError.textContent = error.message;
        } else {
            if (authMessage) authMessage.textContent = 'Password reset link sent. Please check your email inbox.';
        }
    });
}

// --- UPDATE PASSWORD LOGIC ---
if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            if (authError) authError.textContent = 'Passwords do not match.';
            return;
        }

        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            if (authError) authError.textContent = 'Error updating password: ' + error.message;
        } else {
            if (authError) authError.textContent = '';
            if (authMessage) authMessage.textContent = 'Password updated successfully! Redirecting to login...';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        }
    });
}

