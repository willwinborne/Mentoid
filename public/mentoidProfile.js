// PROJECT 2 JS: PROFILE CREATION PAGE
// written by William Winborne (wwinborn)
const submitButton = document.getElementById("submitButton");
const password = document.getElementById("password");
let date = "";
const form = document.querySelector("createProfileForm");
const usernameElement = document.getElementById('username');
const hourglass = document.getElementById("lds-hourglass");

// a function that dynamically (on-page) check to see if a username is available
// the server will send back a JSON object with usernameTaken as 'true' or 'false
async function checkUsername() {
    console.log(usernameElement.value.length < 1)
    if (!usernameElement.value.length < 1) {
        document.getElementById("usernameCheck").style.display = 'none';
        hourglass.style.display = 'inline-block';
        
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


                if (data.usernameTaken == 'false') {
                    document.getElementById("usernameCheck").style.display = 'inline-block';
                    hourglass.style.display = "none";
                    document.getElementById("usernameCheck").innerHTML = '&#10003;'
                    document.getElementById("usernameCheck").style.color = "green";
                    submitButton.disabled = false;
                }
                if (data.usernameTaken == 'true') {
                    document.getElementById("usernameCheck").style.display = 'inline-block';
                    hourglass.style.display = "none";
                    document.getElementById("usernameCheck").innerHTML = '&#10008;'
                    document.getElementById("usernameCheck").style.color = "red";
                    submitButton.disabled = true;
                }
            })
    }
}
