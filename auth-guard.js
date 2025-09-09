// This script assumes the 'supabaseClient' was created in auth.js
// and runs after it to protect private pages.

(async () => {
    // Check if the supabaseClient exists
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized. Make sure auth.js is loaded first.');
        return;
    }

    // Get the current session using the initialized client
    const { data: { session } } = await supabaseClient.auth.getSession();

    // If no session exists (user is not logged in), redirect to the login page
    if (!session) {
        if (window.location.pathname.indexOf('login.html') === -1 && window.location.pathname.indexOf('register.html') === -1) {
            console.log("No user session found, redirecting to login.");
            window.location.href = 'login.html';
        }
    }
})();