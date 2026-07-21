
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
  import { getDatabase } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCPfMdZb3lgZNR-o9wC_lN5yoQPRhKBK_4",
    authDomain: "cloud-notes-13.firebaseapp.com",
    databaseURL: "https://cloud-notes-13-default-rtdb.firebaseio.com",
    projectId: "cloud-notes-13",
    storageBucket: "cloud-notes-13.firebasestorage.app",
    messagingSenderId: "518033264508",
    appId: "1:518033264508:web:21c6d91830812664259ef9",
    measurementId: "G-WEGMTL96BK"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

let analytics;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
