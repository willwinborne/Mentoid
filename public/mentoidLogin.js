const mentor = document.getElementById("mentor");
const mentee = document.getElementById("mentee");
const loginButton = document.getElementById("login");
const username = document.getElementById("username");
const password = document.getElementById("password");
const passwordRemind = document.getElementById("passwordRemind");
const usernameRemind = document.getElementById("usernameRemind");
const togglePassword = document.getElementById("togglePassword");

// show relevant reminders on a login error
// URL parameters are added by the server upon login error
function passwordReminder() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const password = urlParams.get('passwordIncorrect');
    const usernameNotFound = urlParams.get('noUsername');
    const usernameAttempt = urlParams.get('attemptedLogin');

    if (password != undefined) {
        username.value = usernameAttempt;
        passwordRemind.style.display = "block";
    }

    if (usernameNotFound != undefined) {
        username.value = usernameAttempt;
        usernameRemind.style.display = "block";
    }
}

// show or hide password
togglePassword.addEventListener('click', function() {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
});
