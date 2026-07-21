```javascript
import { auth } from "./firebase.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// ---------------- POPUP ----------------

window.openLogin = function () {
    document.getElementById("overlay").style.display = "flex";
}

window.closeLogin = function () {
    document.getElementById("overlay").style.display = "none";
}

document.getElementById("overlay").addEventListener("click",(e)=>{
    if(e.target.id==="overlay"){
        closeLogin();
    }
});

// ---------------- GOOGLE ----------------

const provider = new GoogleAuthProvider();

document.getElementById("googleSignIn").addEventListener("click", async ()=>{

    try{

        await signInWithPopup(auth,provider);

        window.location.href="dashboard.html";

    }catch(error){

        alert(error.message);

    }

});

// ---------------- CREATE ACCOUNT ----------------

document.getElementById("signupBtn").addEventListener("click",async()=>{

    const email=document.getElementById("email").value;
    const password=document.getElementById("password").value;

    try{

        await createUserWithEmailAndPassword(auth,email,password);

        window.location.href="dashboard.html";

    }catch(error){

        alert(error.message);

    }

});

// ---------------- LOGIN ----------------

document.getElementById("loginBtn").addEventListener("click",async()=>{

    const email=document.getElementById("email").value;
    const password=document.getElementById("password").value;

    try{

        await signInWithEmailAndPassword(auth,email,password);

        window.location.href="dashboard.html";

    }catch(error){

        alert(error.message);

    }

});
```
