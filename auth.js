
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

        } catch (error) {

            alert(error.message);

        }

    });

  signupBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    alert("Email = [" + email + "]");

    try {

        await createUserWithEmailAndPassword(auth, email, password);

        window.location.href = "dashboard.html";

        } catch (error) {

        alert(error.code + "\n" + error.message);

    }

});

});
