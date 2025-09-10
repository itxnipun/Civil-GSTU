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
const authError = document.getElementById('auth-error');
// ... (other DOM elements for other pages)

// --- Navigation & Login Logic (No changes here) ---
// ... (The code for nav links and the loginForm listener remains the same)

// --- NEW TWO-STEP REGISTER LOGIC ---
if (registerForm) {
    const verifyBtn = document.getElementById('verify-btn');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    // Logic for the "Verify" button (Step 1)
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const name = registerForm['register-name'].value;
            const studentId = registerForm['register-id'].value.toUpperCase();
            
            if (!name || !studentId) {
                authError.textContent = 'Please enter your Name and Student ID.';
                return;
            }

            authError.textContent = 'Verifying...';

            try {
                const { data: approvedStudent, error } = await supabaseClient
                    .from('approved_students')
                    .select()
                    .eq('id', studentId)
                    .single();

                if (error || !approvedStudent || approvedStudent.name.toLowerCase() !== name.toLowerCase()) {
                    throw new Error("Student ID or Name not found in university records.");
                }

                // Verification successful!
                authError.textContent = '';
                step1.style.display = 'none'; // Hide step 1
                step2.style.display = 'block'; // Show step 2

            } catch (error) {
                authError.textContent = error.message;
            }
        });
    }

    // Logic for the final "Create Account" button (Step 2)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get data from both steps
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