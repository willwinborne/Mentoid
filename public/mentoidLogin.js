const mentor = document.getElementById("mentor");
const mentee = document.getElementById("mentee");
const loginButton = document.getElementById("login");
const username = document.getElementById("username");
const password = document.getElementById("password");
const passwordRemind = document.getElementById("passwordRemind");
const togglePassword = document.getElementById("togglePassword");

function check(position) {

    if (position == mentor) {
        mentee.checked = false;
    } else {
        mentor.checked = false;
    }

    if (mentor.checked == false && mentee.checked == false) {
        loginButton.disabled = true;
        loginButton.style.color = "gray";
    } else {
        loginButton.disabled = false;
        loginButton.style.color = "white";
    }

}

function passwordReminder() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    // todo: trycatch
    const password = urlParams.get('passwordIncorrect');
    const usernameAttempt = urlParams.get('attemptedLogin');
    if (password != undefined) {
        username.value = usernameAttempt;
        passwordRemind.style.visibility = "visible"
    }

}

togglePassword.addEventListener('click', function() {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
});
