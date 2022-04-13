// client data
let clientUsername = "";
let clientProfileType = "";

// get the username of the current session from the server
async function getUsername() {
    console.log("getting client username from webserver.")
    // get the current username
    const response = await fetch("http://localhost:3000/getUsername", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })

        // handle the DOM based on the server's response
        .then(response => response.json()).then(data => {
            if (data.username == undefined) {
                window.location.replace("http://localhost:3000/mentoidLogin.html");
            }
            clientUsername = data.username;
            clientProfileType = data.profileType;

        })
}