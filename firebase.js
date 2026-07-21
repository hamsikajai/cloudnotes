import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPfMdZb3lgZNR-o9wC_lN5yoQPRhKBK_4",
  authDomain: "cloud-notes-13.firebaseapp.com",
  databaseURL: "https://cloud-notes-13-default-rtdb.firebaseio.com",
  projectId: "cloud-notes-13",
  storageBucket: "cloud-notes-13.firebasestorage.app",
  messagingSenderId: "518033264508",
  appId: "1:518033264508:web:21c6d91830812664259ef9"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
