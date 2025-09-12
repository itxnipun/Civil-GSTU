// profile.js

// Assumes window.supabaseClient already exists from auth.js
if (typeof supabaseClient === 'undefined') {
  console.error('supabaseClient is not initialized. Ensure auth.js runs before profile.js');
}

// DOM elements
const loadingMessage = document.getElementById('loading-message');
const profileContent = document.getElementById('profile-content');
const errorMessage = document.getElementById('error-message');

const imgEl = document.getElementById('student-image');
const nameEl = document.getElementById('student-name');
const idEl = document.getElementById('student-id');
const emailEl = document.getElementById('student-email');
const phoneEl = document.getElementById('student-number');

const editButton = document.getElementById('edit-button');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editName = document.getElementById('edit-name');
const editEmail = document.getElementById('edit-email');
const editPhone = document.getElementById('edit-phone');
const editAvatar = document.getElementById('edit-avatar');
const cancelEdit = document.getElementById('cancel-edit');

// State
let currentProfileData = null;
let currentUser = null;

// Utils
function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function showError(text) {
  if (loadingMessage) loadingMessage.style.display = 'none';
  errorMessage.style.display = 'block';
  errorMessage.textContent = text;
}

function showProfile() {
  if (loadingMessage) loadingMessage.style.display = 'none';
  profileContent.style.display = 'block';
}

function placeholderFor(id) {
  // neutral placeholder with student id text
  return `https://placehold.co/400x400/cccccc/333333/png?text=${encodeURIComponent(id || 'No+Image')}`;
}

// Wait for initial session if needed (removes "minutes" delay)
async function getReadySession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) return session;

  return new Promise((resolve) => {
    const { data: subscription } = supabaseClient.auth.onAuthStateChange((event, newSession) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        subscription.subscription.unsubscribe();
        resolve(newSession || null);
      }
    });
  });
}

// Ownership check supports three ways:
// - profiles.id equals auth.uid()  (recommended schema)
// - profiles.user_id equals auth.uid() (if you have user_id column)
// - student_id equals user_metadata.student_id (fallback)
async function checkOwnership(profile, session) {
  try {
    const uid = session?.user?.id;
    const metaStudentId = session?.user?.user_metadata?.student_id;

    const matchesById = Boolean(uid && profile?.id && uid === profile.id);
    const matchesByUserId = Boolean(uid && profile?.user_id && uid === profile.user_id);
    const matchesByStudentId = Boolean(metaStudentId && profile?.student_id && metaStudentId === profile.student_id);

    if (matchesById || matchesByUserId || matchesByStudentId) {
      editButton.style.display = 'block';
      currentUser = session.user;
      console.log('Ownership OK:', { matchesById, matchesByUserId, matchesByStudentId });
    } else {
      editButton.style.display = 'none';
      console.log('Ownership failed for this profile.', {
        uid, profile_id: profile?.id, profile_user_id: profile?.user_id,
        profile_student_id: profile?.student_id, metaStudentId
      });
    }
  } catch (err) {
    console.error('checkOwnership error:', err);
    editButton.style.display = 'none';
  }
}

// Load profile by student_id from URL
async function loadStudentProfile() {
  try {
    const studentId = (getQueryParam('id') || '').toUpperCase().trim();
    if (!studentId) {
      showError('No student ID provided in the URL.');
      return;
    }

    // Fetch the profile row
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error || !data) {
      console.error('Error loading profile:', error);
      showError('Profile not found.');
      return;
    }

    currentProfileData = data;

    // Fill UI
    imgEl.src = data.avatar_url || placeholderFor(data.student_id);
    imgEl.alt = `Photo of ${data.full_name || data.student_id}`;

    nameEl.textContent = data.full_name || 'Unnamed Student';
    idEl.textContent = `Student ID: ${data.student_id}`;
    emailEl.textContent = `Email: ${data.email || 'N/A'}`;
    phoneEl.textContent = `Number: ${data.phone_number || 'N/A'}`;

    // Get ready session and check ownership (no delay)
    const session = await getReadySession();
    await checkOwnership(currentProfileData, session);

    showProfile();
  } catch (err) {
    console.error(err);
    showError('An unexpected error occurred loading the profile.');
  }
}

// Open/close modal
function openEditModal() {
  if (!currentProfileData) return;
  editName.value = currentProfileData.full_name || '';
  editEmail.value = currentProfileData.email || '';
  editPhone.value = currentProfileData.phone_number || '';
  editAvatar.value = '';
  editModal.style.display = 'block';
}

function closeEditModal() {
  editModal.style.display = 'none';
}

// Upload avatar with two-path strategy (folder or root) for policy compatibility
async function uploadAvatarIfProvided(userId) {
  const file = editAvatar.files?.[0];
  if (!file) return null; // no change

  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload a valid image file.');
  }
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Image must be 5MB or less.');
  }

  const bucket = 'profile_pictures'; // your existing bucket
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const base = `avatar_${Date.now()}.${ext}`;
  const pathWithFolder = `${userId}/${base}`;
  const pathRoot = `${userId}_avatar_${Date.now()}.${ext}`;

  // Try folder-first (secure setups), then fall back to root if RLS allows only root
  let usedPath = pathWithFolder;

  let { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(usedPath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.warn('Folder upload failed, trying root path...', uploadError?.message);
    usedPath = pathRoot;
    const retry = await supabaseClient.storage
      .from(bucket)
      .upload(usedPath, file, { upsert: true, contentType: file.type });
    uploadError = retry.error;
  }

  if (uploadError) {
    throw uploadError;
  }

  const { data: pub } = supabaseClient.storage.from(bucket).getPublicUrl(usedPath);
  return pub?.publicUrl || null;
}

// Handle form submit
async function submitEditForm(e) {
  e.preventDefault();
  try {
    if (!currentUser || !currentProfileData) {
      throw new Error('Not authorized to edit this profile.');
    }

    const updatedInfo = {
      full_name: editName.value.trim(),
      email: editEmail.value.trim(),
      phone_number: editPhone.value.trim(),
      updated_at: new Date().toISOString()
    };

    // Upload avatar if provided
    const avatarUrl = await uploadAvatarIfProvided(currentUser.id);
    if (avatarUrl) {
      updatedInfo.avatar_url = avatarUrl;
    }

    // Update the profile row where profiles.id = auth.uid()
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(updatedInfo)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Update failed:', error);
      throw new Error(error.message || 'Failed to update profile.');
    }

    // Update UI with new values
    currentProfileData = data;
    imgEl.src = data.avatar_url || imgEl.src;
    nameEl.textContent = data.full_name || nameEl.textContent;
    emailEl.textContent = `Email: ${data.email || 'N/A'}`;
    phoneEl.textContent = `Number: ${data.phone_number || 'N/A'}`;

    closeEditModal();
    alert('Profile updated successfully!');
  } catch (err) {
    console.error(err);
    alert(err.message || 'Could not update profile.');
  }
}

// Event wiring
document.addEventListener('DOMContentLoaded', loadStudentProfile);
editButton.addEventListener('click', openEditModal);
cancelEdit.addEventListener('click', closeEditModal);

// Close modal when clicking outside content
window.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// Re-check ownership on auth events to handle session refresh/initialization
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state:', event, session?.user?.id);
  if (currentProfileData && ['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED'].includes(event)) {
    checkOwnership(currentProfileData, session);
  }
});
