// PROJECT 2 JS: PROFILE CREATION PAGE
// written by William Winborne (wwinborn)

// a function that dynamically (on-page) check to see if a username is available
// the server will send back a JSON object with usernameTaken as 'true' or 'false
async function checkUsername() {

    // don't allow any weird symbols (not my regex)
    var usernameElement = document.getElementById('username');
    usernameElement.value = usernameElement.value.replace(/[^a-zA-Z0-9@]+/, '');

    // package the username as JSON data
    const data = { username: `${usernameElement.value}` }

    // check if the username entered exists
    const response = await fetch("http://localhost:3000/checkUsername", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
        // handle the DOM based on the server's response
        .then(response => response.json()).then(data => {
            console.log(data.usernameTaken);
            if (data.usernameTaken == 'false' && document.getElementById("username").value.length > 0) {
                document.getElementById("usernameCheck").innerHTML = '&#10003;'
                document.getElementById("usernameCheck").style.color = "green";
                document.getElementById("submitButton").disabled = false;
            } else {
                document.getElementById("usernameCheck").innerHTML = '&#10008;'
                document.getElementById("usernameCheck").style.color = "red";
                document.getElementById("submitButton").disabled = true;
            }
        })
}
