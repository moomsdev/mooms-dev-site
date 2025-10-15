/**
 * Custom Login Page JavaScript
 * Xử lý đăng nhập Google trên trang wp-login.php
 */

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('user_login').setAttribute('placeholder', 'Username or Email Address');
    document.getElementById('user_pass').setAttribute('placeholder', 'Password');

    // create div class welcome
    var welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome';
    welcomeDiv.textContent = 'Welcome administrators';

    // insert after logo
    var loginForm = document.getElementById('login');
    var logo = document.querySelector('#login h1');
    if (logo) {
        logo.insertAdjacentElement('afterend', welcomeDiv);
    }

    const googleLoginBtn = document.getElementById('google-login-btn');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
});

/**
 * Xử lý đăng nhập Google
 */
async function handleGoogleLogin(e) {
    e.preventDefault();
    
    const btn = e.target;
    const originalText = btn.innerHTML;
    
    // Set loading state
    btn.disabled = true;
    btn.innerHTML = '<span>Đang chuyển hướng...</span>';
    
    try {
        // Lấy redirect URL từ query string hoặc mặc định
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect_to') || window.location.origin;
        
        // Gọi API để lấy Google OAuth URL
        const ajaxUrl = (typeof ajax_object !== 'undefined' && ajax_object.ajax_url) ? ajax_object.ajax_url : '/wp-admin/admin-ajax.php';
        const response = await fetch(ajaxUrl + '?action=google_login&redirect_to=' + encodeURIComponent(redirectTo), {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.redirect_url) {
            // Chuyển hướng đến Google OAuth
            window.location.href = data.data.redirect_url;
        } else {
            // Hiển thị lỗi
            showLoginError(data.data?.message || 'Có lỗi xảy ra khi đăng nhập Google');
            resetButton(btn, originalText);
        }
    } catch (error) {
        console.error('Google login error:', error);
        showLoginError('Có lỗi xảy ra, vui lòng thử lại');
        resetButton(btn, originalText);
    }
}

/**
 * Hiển thị thông báo lỗi
 */
function showLoginError(message) {
    // Tìm hoặc tạo container thông báo lỗi
    let errorContainer = document.querySelector('.google-login-error');
    
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'google-login-error';
        errorContainer.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 12px;
            margin: 10px 0;
            font-size: 14px;
            text-align: center;
        `;
        
        // Thêm vào sau nút Google login
        const googleContainer = document.querySelector('.google-login-container');
        if (googleContainer) {
            googleContainer.appendChild(errorContainer);
        }
    }
    
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }, 5000);
}

/**
 * Reset button về trạng thái ban đầu
 */
function resetButton(btn, originalText) {
    btn.disabled = false;
    btn.innerHTML = originalText;
}

/**
 * Xử lý callback từ popup (nếu sử dụng popup)
 */
function handleGoogleCallback(data) {
    if (data.success) {
        // Hiển thị thông báo thành công
        showLoginSuccess(data.data.notification);
        
        // Redirect sau 1 giây
        setTimeout(() => {
            window.location.href = data.data.redirect;
        }, 1000);
    } else {
        showLoginError(data.data?.message || 'Đăng nhập thất bại');
    }
}

/**
 * Hiển thị thông báo thành công
 */
function showLoginSuccess(notification) {
    const successContainer = document.createElement('div');
    successContainer.className = 'google-login-success';
    successContainer.style.cssText = `
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        padding: 12px;
        margin: 10px 0;
        font-size: 14px;
        text-align: center;
    `;
    
    successContainer.innerHTML = `
        <strong>${notification.title}</strong><br>
        ${notification.message}
    `;
    
    // Thêm vào sau nút Google login
    const googleContainer = document.querySelector('.google-login-container');
    if (googleContainer) {
        googleContainer.appendChild(successContainer);
    }
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        if (successContainer.parentNode) {
            successContainer.parentNode.removeChild(successContainer);
        }
    }, 3000);
}

// Export cho sử dụng global
window.handleGoogleCallback = handleGoogleCallback;