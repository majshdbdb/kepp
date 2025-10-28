// Authentication functions
class AuthManager {
    constructor() {
        this.supabase = window.supabase;
    }

    // Register new user
    async register(userData) {
        try {
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name
                    }
                }
            });

            if (authError) throw authError;

            // Create user profile
            if (authData.user) {
                const { error: profileError } = await this.supabase
                    .from('profiles')
                    .insert([
                        {
                            id: authData.user.id,
                            email: userData.email,
                            full_name: userData.name,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                }
            }

            return { success: true, user: authData.user };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Login user
    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    // Get user profile
    async getUserProfile(userId) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    }
}

// Initialize auth manager
window.authManager = new AuthManager();

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const messageDiv = document.getElementById('message');
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showMessage('Harap isi semua field', 'error', messageDiv);
                return;
            }
            
            // Show loading
            submitBtn.textContent = 'Masuk...';
            submitBtn.disabled = true;
            
            // Login user
            const result = await window.authManager.login(email, password);
            
            if (result.success) {
                showMessage('✅ Login berhasil! Mengalihkan...', 'success', messageDiv);
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                let errorMessage = result.error;
                if (result.error.includes('Invalid login credentials')) {
                    errorMessage = 'Email atau password salah';
                }
                showMessage('❌ ' + errorMessage, 'error', messageDiv);
            }
            
            // Reset button
            submitBtn.textContent = 'Masuk';
            submitBtn.disabled = false;
        });
    }
    
    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const messageDiv = document.getElementById('message');
            
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            
            if (!name || !email || !password) {
                showMessage('Harap isi semua field', 'error', messageDiv);
                return;
            }
            
            if (password.length < 6) {
                showMessage('Password harus minimal 6 karakter', 'error', messageDiv);
                return;
            }
            
            // Show loading
            submitBtn.textContent = 'Mendaftarkan...';
            submitBtn.disabled = true;
            
            // Register user
            const result = await window.authManager.register({
                name: name,
                email: email,
                password: password
            });
            
            if (result.success) {
                showMessage('✅ Registrasi berhasil! Silakan login.', 'success', messageDiv);
                registerForm.reset();
                
                // Switch to login form
                setTimeout(() => {
                    document.getElementById('registerForm').classList.add('hidden');
                    document.getElementById('loginForm').classList.remove('hidden');
                }, 2000);
            } else {
                let errorMessage = result.error;
                if (result.error.includes('already registered')) {
                    errorMessage = 'Email sudah terdaftar';
                }
                showMessage('❌ ' + errorMessage, 'error', messageDiv);
            }
            
            // Reset button
            submitBtn.textContent = 'Daftar';
            submitBtn.disabled = false;
        });
    }
});

// Utility function to show messages
function showMessage(message, type, container) {
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    if (type === 'success') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}
