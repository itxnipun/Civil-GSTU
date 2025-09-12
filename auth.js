// ===================== auth.js (complete) =====================

// --- Supabase Initialization ---
const { createClient } = supabase;

// PASTE YOUR SUPABASE URL AND ANON KEY HERE!
const supabaseUrl = 'https://cwubbhcuormtrvyczgpf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJiaGN1b3JtdHJ2eWN6Z3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MDQ2MDIsImV4cCI6MjA3Mjk4MDYwMn0.EC-lF_wgrTZxvBpHb_z___45JGHHwX3hKGgQ3juRy5Ie';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

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

// --- Helper: ensure a profile row exists for the signed-in user ---
async function ensureProfile(user) {
  try {
    if (!user) return;
    // 1) Check if a profile already exists (profiles.id stores auth.uid())
    const { data: existing, error: fetchErr } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchErr) {
      console.warn('ensureProfile fetch error:', fetchErr.message);
      return;
    }
    if (existing) return; // already present

    // 2) Build data from user metadata set at signUp
    const meta = user.user_metadata || {};
    const profileRow = {
      id: user.id, // IMPORTANT: using profiles.id = auth.uid()
      student_id: meta.student_id || null,
      full_name: meta.full_name || null,
      email: user.email || null,
      phone_number: meta.phone_number || null,
      session: meta.session || null,
      batch: meta.session || null
    };

    // 3) Insert
    const { error: insertErr } = await supabaseClient.from('profiles').insert(profileRow);
    if (insertErr) {
      console.warn('ensureProfile insert error:', insertErr.message);
    }
  } catch (e) {
    console.error('ensureProfile unexpected error:', e);
  }
}

// --- Authentication State Listener ---
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  // Build nav
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

  // Ensure profile exists on initial or fresh sign-in
  if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
    await ensureProfile(session.user);
  }
});

// --- Login Logic ---
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      if (authError) authError.textContent = error.message;
    } else {
      const user = data?.user;
      if (user && !user.email_confirmed_at) {
        await supabaseClient.auth.signOut();
        if (authError) authError.textContent = 'Please verify your email before logging in.';
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
  const authErrorEl = document.getElementById('auth-error');

  // STEP 1: Verify against approved_students
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      const name = document.getElementById('register-name').value;
      const studentId = document.getElementById('register-id').value.toUpperCase();
      const sessionVal = document.getElementById('register-session').value;

      if (!name || !studentId || !sessionVal) {
        authErrorEl.textContent = 'Please fill in your Name, Student ID, and Session.';
        return;
      }
      authErrorEl.textContent = 'Verifying...';

      try {
        const { data: approvedStudent, error } = await supabaseClient
          .from('approved_students')
          .select()
          .eq('id', studentId)
          .eq('name', name)
          .eq('session', sessionVal)
          .single();

        if (error || !approvedStudent) throw new Error('Details do not match our records for the selected session.');

        // Success: move to step 2
        authErrorEl.textContent = '';
        step1.style.display = 'none';
        step2.style.display = 'block';
      } catch (error) {
        authErrorEl.textContent = error.message;
      }
    });
  }

  // STEP 2: Create Account
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentId = document.getElementById('register-id').value.toUpperCase();
    const fullName = document.getElementById('register-name').value;       // from step 1
    const sessionVal = document.getElementById('register-session').value;  // from step 1
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
      // Pass important fields into user metadata so we can build a profile later if needed
      const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            student_id: studentId,
            full_name: fullName,
            session: sessionVal,
            phone_number: phoneNumber
          },
          // Optionally send them back to your site after confirmation
          // emailRedirectTo: window.location.origin + '/login.html'
        }
      });
      if (signUpError) throw signUpError;
      const user = authData?.user;
      if (!user) throw new Error('Could not create user account.');

      // Try to create profile now (may fail if email confirmation required and no session yet)
      try {
        const { error: profileError } = await supabaseClient.from('profiles').insert({
          id: user.id,                // profiles.id = auth.uid()
          student_id: studentId,
          full_name: fullName,
          email,
          phone_number: phoneNumber,
          session: sessionVal,
          batch: sessionVal
        });
        if (profileError) {
          // Often 401/permission if no session yet; safe to continue
          console.warn('Profile creation (immediate) failed:', profileError.message);
        }
      } catch (inner) {
        console.warn('Profile creation exception:', inner?.message || inner);
      }

      // Redirect to verify page
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
    if (authError) authError.textContent = '';
    if (authMessage) authMessage.textContent = 'Processing...';

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

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

    if (error) {
      if (authError) authError.textContent = 'Error updating password: ' + error.message;
    } else {
      if (authError) authError.textContent = '';
      if (authMessage) authMessage.textContent = 'Password updated successfully! Redirecting to login...';
      setTimeout(() => { window.location.href = 'login.html'; }, 3000);
    }
  });
}
