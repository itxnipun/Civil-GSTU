// This is a standard JavaScript file (.js)

// --- Configuration ---
const SUPABASE_URL = 'https://cwubbhcuormtrvyczgpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJiaGN1b3JtdHJ2eWN6Z3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MDQ2MDIsImV4cCI6MjA3Mjk4MDYwMn0.EC-lF_wgrTZxvBpHb_z___45JGHHwX3hKGgQ3juRy5I';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentProfileData = null; // Holds data for the currently viewed profile

// Get all necessary HTML elements
const loadingMessage = document.getElementById('loading-message');
const profileContent = document.getElementById('profile-content');
const studentImage = document.getElementById('student-image');
const studentName = document.getElementById('student-name');
const studentIdEl = document.getElementById('student-id');
const studentEmail = document.getElementById('student-email');
const studentNumber = document.getElementById('student-number');
const editButton = document.getElementById('edit-button');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditButton = document.getElementById('cancel-edit');

/** Updates the profile information on the page */
function populateProfileData(profile) {
    studentImage.src = profile.avatar_url || 'https://placehold.co/150';
    studentName.textContent = profile.full_name;
    studentIdEl.textContent = `Student ID: ${profile.student_id}`;
    studentEmail.textContent = `Email: ${profile.email || 'N/A'}`;
    studentNumber.textContent = `Number: ${profile.phone_number || 'N/A'}`;
    document.title = `${profile.full_name} | Profile`;
}

/** Checks if the logged-in user owns this profile and shows the edit button */
async function checkOwnership(profileUserId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user && session.user.id === profileUserId) {
        editButton.style.display = 'block';
    }
}

/** Fetches and displays a student's profile from the URL ID */
async function loadStudentProfile(studentId) {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('student_id', studentId).single();
        if (error) throw error;
        
        currentProfileData = data;
        populateProfileData(data);
        await checkOwnership(data.user_id);

        loadingMessage.style.display = 'none';
        profileContent.style.display = 'block';
    } catch (error) {
        // ... (error handling)
    }
}

// Event Listeners for the Edit Modal
editButton.addEventListener('click', () => {
    document.getElementById('edit-name').value = currentProfileData.full_name;
    document.getElementById('edit-email').value = currentProfileData.email;
    document.getElementById('edit-phone').value = currentProfileData.phone_number;
    document.getElementById('edit-image-url').value = currentProfileData.avatar_url;
    editModal.style.display = 'block';
});

cancelEditButton.addEventListener('click', () => {
    editModal.style.display = 'none';
});

editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const updatedInfo = {
        full_name: document.getElementById('edit-name').value,
        email: document.getElementById('edit-email').value,
        phone_number: document.getElementById('edit-phone').value,
        avatar_url: document.getElementById('edit-image-url').value
    };

    const { data, error } = await supabase
        .from('profiles')
        .update(updatedInfo)
        .eq('student_id', currentProfileData.student_id)
        .select()
        .single();

    if (error) {
        alert('Error updating profile: ' + error.message);
    } else {
        alert('Profile updated successfully!');
        currentProfileData = data;
        populateProfileData(data);
        editModal.style.display = 'none';
    }
});

/** Main function to run when the page loads */
function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdFromUrl = urlParams.get('id');
    console.log('ID from URL:', studentIdFromUrl); // <--- Add this line
    if (studentIdFromUrl) {
        loadStudentProfile(studentIdFromUrl);
        /** Fetches and displays a student's profile from the URL ID */
async function loadStudentProfile(studentId) {
    try {
        console.log('Attempting to fetch data for ID:', studentId); // <--- Add this line
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('student_id', studentId).single();
        if (error) {
            throw error;
        }
               console.log('Data successfully fetched:', data); // <--- Add this line
        currentProfileData = data;
        populateProfileData(data);
        await checkOwnership(data.user_id);
        loadingMessage.style.display = 'none';
        profileContent.style.display = 'block';
    } catch (error) {
        // ... (error handling)
    }
}
    } else {
        // ...
    }
}


initializePage();

