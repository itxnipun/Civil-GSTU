// This is a standard JavaScript file (.js)

// Enhanced profile.js with better error handling and user experience

// --- Configuration ---
const SUPABASE_URL = 'https://cwubbhcuormtrvyczgpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWJiaGN1b3JtdHJ2eWN6Z3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MDQ2MDIsImV4cCI6MjA3Mjk4MDYwMn0.EC-lF_wgrTZxvBpHb_z___45JGHHwX3hKGgQ3juRy5I';

// --- Initialize Supabase Client ---
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentProfileData = null;
let currentUser = null;

// --- Get All HTML Elements ---
const loadingMessage = document.getElementById('loading-message');
const profileContent = document.getElementById('profile-content');
const errorMessage = document.getElementById('error-message');
const studentImage = document.getElementById('student-image');
const studentName = document.getElementById('student-name');
const studentIdEl = document.getElementById('student-id');
const studentEmail = document.getElementById('student-email');
const studentNumber = document.getElementById('student-number');
const editButton = document.getElementById('edit-button');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditButton = document.getElementById('cancel-edit');
const editAvatarInput = document.getElementById('edit-avatar');

/** Updates the profile information on the page */
function populateProfileData(profile) {
    const defaultImage = `https://placehold.co/150x150/cccccc/333333/png?text=${profile.student_id}`;
    studentImage.src = profile.avatar_url || defaultImage;
    studentImage.onerror = function() {
        this.src = defaultImage;
    };
    
    studentName.textContent = profile.full_name || 'Name not available';
    studentIdEl.textContent = `Student ID: ${profile.student_id}`;
    studentEmail.textContent = `Email: ${profile.email || 'Not provided'}`;
    studentNumber.textContent = `Number: ${profile.phone_number || 'Not provided'}`;
    document.title = `${profile.full_name || profile.student_id} | Profile`;
}

/** Checks if the logged-in user owns this profile and shows the edit button */
async function checkOwnership(profileUserId) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user && session.user.id === profileUserId) {
            editButton.style.display = 'block';
            currentUser = session.user;
        } else {
            editButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking ownership:', error);
        editButton.style.display = 'none';
    }
}

/** Fetches and displays a student's profile from the URL ID */
async function loadStudentProfile(studentId) {
    try {
        loadingMessage.style.display = 'block';
        profileContent.style.display = 'none';
        errorMessage.style.display = 'none';

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*, user_id')
            .eq('student_id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error(`Student with ID "${studentId}" not found.`);
            }
            throw error;
        }
        
        currentProfileData = data;
        populateProfileData(data);
        await checkOwnership(data.user_id);

        loadingMessage.style.display = 'none';
        profileContent.style.display = 'block';
        
    } catch (error) {
        console.error('Error in loadStudentProfile:', error);
        loadingMessage.style.display = 'none';
        errorMessage.textContent = error.message || 'Failed to load profile. Please try again.';
        errorMessage.style.display = 'block';
    }
}

/** Show success/error messages */
function showMessage(message, type = 'info') {
    // Create message element if it doesn't exist
    let messageEl = document.getElementById('profile-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'profile-message';
        messageEl.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            padding: 15px 20px; border-radius: 6px; font-weight: bold;
            max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(messageEl);
    }
    
    // Set message style based on type
    const styles = {
        success: 'background: #d4edda; color: #155724; border-left: 4px solid #28a745;',
        error: 'background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545;',
        info: 'background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8;'
    };
    
    messageEl.style.cssText += styles[type] || styles.info;
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// Event Listeners for the Edit Modal
editButton.addEventListener('click', () => {
    if (!currentProfileData) return;
    
    document.getElementById('edit-name').value = currentProfileData.full_name || '';
    document.getElementById('edit-email').value = currentProfileData.email || '';
    document.getElementById('edit-phone').value = currentProfileData.phone_number || '';
    editModal.style.display = 'block';
});

cancelEditButton.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
});

editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!currentUser || !currentProfileData) {
        showMessage('Authentication error. Please refresh and try again.', 'error');
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Saving...';
    submitButton.disabled = true;

    try {
        // Get the file from the input
        const avatarFile = editAvatarInput.files[0];
        let avatarUrl = currentProfileData.avatar_url;
        
        // If a new file was selected, upload it first
        if (avatarFile) {
            // Validate file type
            if (!avatarFile.type.startsWith('image/')) {
                throw new Error('Please select a valid image file.');
            }
            
            // Validate file size (max 5MB)
            if (avatarFile.size > 5 * 1024 * 1024) {
                throw new Error('Image file must be less than 5MB.');
            }

            const filePath = `${currentUser.id}/avatar-${Date.now()}.jpg`;
            
            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('avatars')
                .upload(filePath, avatarFile, { upsert: true });

            if (uploadError) {
                throw new Error('Failed to upload image: ' + uploadError.message);
            }

            const { data: publicUrlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
            avatarUrl = publicUrlData.publicUrl;
        }
        
        const updatedInfo = {
            full_name: document.getElementById('edit-name').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            phone_number: document.getElementById('edit-phone').value.trim(),
            avatar_url: avatarUrl
        };

        // Validate required fields
        if (!updatedInfo.full_name) {
            throw new Error('Name is required.');
        }
        
        if (!updatedInfo.email) {
            throw new Error('Email is required.');
        }
        
        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(updatedInfo.email)) {
            throw new Error('Please enter a valid email address.');
        }

        const { data, error } = await supabaseClient
            .from('profiles')
            .update(updatedInfo)
            .eq('student_id', currentProfileData.student_id)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update profile: ' + error.message);
        }

        currentProfileData = data;
        populateProfileData(data);
        editModal.style.display = 'none';
        showMessage('Profile updated successfully!', 'success');
        
        // Reset file input
        editAvatarInput.value = '';
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage(error.message, 'error');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

/** Main function to run when the page loads */
function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdFromUrl = urlParams.get('id');
    
    if (studentIdFromUrl) {
        loadStudentProfile(studentIdFromUrl);
    } else {
        loadingMessage.style.display = 'none';
        errorMessage.textContent = 'No student ID provided in URL.';
        errorMessage.style.display = 'block';
    }
}

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (currentProfileData) {
        checkOwnership(currentProfileData.user_id);
    }
});

// Initialize the page
initializePage();



