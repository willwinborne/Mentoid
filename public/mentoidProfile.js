// PROJECT 2 JS: PROFILE CREATION PAGE
// written by William Winborne (wwinborn)
const submitButton = document.getElementById("submitButton");
const password = document.getElementById("password");

const form = document.querySelector("createProfileForm");

// a function that dynamically (on-page) check to see if a username is available
// the server will send back a JSON object with usernameTaken as 'true' or 'false
async function checkUsername() {

    var usernameElement = document.getElementById('username');
    usernameElement.value = usernameElement.value.replace(/[^a-zA-Z0-9@]+/, '');

    // don't allow any weird symbols (not my regex)

    var role = "";
    var mentor = document.getElementById('mentor');
    var mentee = document.getElementById('mentee');

    if (mentor.checked == true) {
        role = "mentor"
    } else {
        role = "mentee"
    }

    // package the username as JSON data
    const data = { username: `${usernameElement.value}`, role: role }

    // check if the username entered exists
    const response = await fetch("http://localhost:3000/checkUsername", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
        // handle the DOM based on the server's response
        .then(response => response.json()).then(data => {
            console.log(data.usernameTaken);
            if (data.usernameTaken == 'false') {
                console.log("turning check green");
                document.getElementById("usernameCheck").innerHTML = '&#10003;'
                document.getElementById("usernameCheck").style.color = "green";
                submitButton.enabled = true;
            }
            if (data.usernameTaken == 'true') {
                document.getElementById("usernameCheck").innerHTML = '&#10008;'
                document.getElementById("usernameCheck").style.color = "red";
                submitButton.enabled = false;
            }
        })
}

function radioChanged() {
    checkUsername();
}

