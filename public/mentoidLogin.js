const mentor = document.getElementById("mentor");
const mentee = document.getElementById("mentee");
const loginButton = document.getElementById("login")

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