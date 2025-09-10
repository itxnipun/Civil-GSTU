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
const authError = document.getElementById('auth-error');
const authMessage = document.getElementById('auth-message'); // For success messages

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

// --- TWO-STEP REGISTER LOGIC ---
if (registerForm) {
    const verifyBtn = document.getElementById('verify-btn');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    // Logic for the "Verify" button (Step 1)
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const name = registerForm['register-name'].value;
            const studentId = registerForm['register-id'].value.toUpperCase();
            const session = registerForm['register-session'].value;
            
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

                authError.textContent = '';
                step1.style.display = 'none';
                step2.style.display = 'block';

            } catch (error) {
                authError.textContent = error.message;
            }
        });
    }

    // Logic for the final "Create Account" button (Step 2)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerForm['register-name'].value;
        const studentId = registerForm['register-id'].value.toUpperCase();
        const email = registerForm['register-email'].value;
        const password = registerForm['register-password'].value;
        const confirmPassword = registerForm['confirm-password'].value;
        const phoneNumber = registerForm['register-number'].value;
        const photo = registerForm['register-photo'].files[0];

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

            const filePath = `${user.id}/${photo.name}`;
            const { error: uploadError } = await supabaseClient.storage.from('profile_pictures').upload(filePath, photo);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabaseClient.storage.from('profile_pictures').getPublicUrl(filePath);
            
            const { error: profileError } = await supabaseClient.from('profiles').update({
                id: user.id,
                avatar_url: urlData.publicUrl,
                phone_number: phoneNumber,
                email: email
            }).eq('student_id', studentId);

            if (profileError) throw profileError;
            
            window.location.href = 'verify-email.html';

        } catch (error) {
            authError.textContent = error.message;
        }
    });
}

// --- FORGOT PASSWORD LOGIC ---
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = forgotPasswordForm['forgot-email'].value;
        
        authError.textContent = '';
        if (authMessage) authMessage.textContent = 'Processing...';

        const resetUrl = window.location.origin + '/login.html';

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: resetUrl,
        });

        if (error) {
            if (authMessage) authMessage.textContent = '';
            authError.textContent = error.message;
        } else {
            if (authMessage) authMessage.textContent = 'Password reset link sent. Please check your email inbox.';
        }
    });
}