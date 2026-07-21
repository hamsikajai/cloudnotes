
import { auth } from "./firebase.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

window.addEventListener("DOMContentLoaded", () => {

    const googleBtn = document.getElementById("googleSignIn");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");

    const provider = new GoogleAuthProvider();

    googleBtn.addEventListener("click", async () => {

        try {

            await signInWithPopup(auth, provider);

            window.location.href = "dashboard.html";

        } catch (error) {

            alert(error.message);

        }

    });

    loginBtn.addEventListener("click", async () => {

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

    await signInWithEmailAndPassword(auth, email, password);

    window.location.href = "dashboard.html";

catch (error) {

    switch (error.code) {

        case "auth/invalid-credential":
            alert("Incorrect email or password.");
            break;

        case "auth/invalid-email":
            alert("Please enter a valid email address.");
            break;

        default:
            alert("Unable to sign in. Please try again.");
    }

}

    });

  signupBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    

    try {

    await createUserWithEmailAndPassword(auth, email, password);

    window.location.href = "dashboard.html";

catch (error) {

    switch (error.code) {

        case "auth/email-already-in-use":
            alert("An account with this email already exists. Please log in instead.");
            break;

        case "auth/invalid-email":
            alert("Please enter a valid email address.");
            break;

        case "auth/weak-password":
            alert("Your password must be at least 6 characters long.");
            break;

        default:
            alert("Something went wrong. Please try again.");
    }

}

});

});
