let hasCelebrated = false;
import { auth } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// ===========================
// TASKS & BOARD LOGIC
// ===========================

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");

// ---------- LOAD THEME ----------
const savedTheme = localStorage.getItem("theme") || "pastel";
document.body.setAttribute("data-theme", savedTheme);

// ---------- ADD TASK ----------
function addTask() {
    if (!input) return;
    const value = input.value.trim();
    if (!value) return;

    tasks.push({
        text: value,
        done: false
    });

    input.value = "";
    saveTasks();
    renderTasks();
}

// ---------- TOGGLE COMPLETE ----------
function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    saveTasks();
    renderTasks();
}

// ---------- DELETE TASK ----------
function deleteTask(index) {
    const item = document.getElementById(`task-${index}`);

    if (item) {
        item.classList.add("fade-out");
    }

    setTimeout(() => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }, 200);
}

// ---------- RENDER TASKS ----------
function renderTasks() {
    if (!list) return;
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.id = `task-${index}`;

        if (task.done) {
            li.classList.add("done");
        }

        li.onclick = function (e) {
            if (e.target.classList.contains("delete-btn")) return;
            toggleTask(index);
        };

        const text = document.createElement("span");
        text.textContent = task.text;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.className = "delete-btn";

        deleteBtn.onclick = function (e) {
            e.stopPropagation();
            deleteTask(index);
        };

        li.appendChild(text);
        li.appendChild(deleteBtn);

        list.appendChild(li);
    });

    updateProgress();
}

// ---------- SAVE TASKS ----------
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- PROGRESS BAR ----------
function updateProgress() {
    const fill = document.querySelector(".fill");
    const progressText = document.getElementById("progressText");

    if (!fill || !progressText) return;

    if (tasks.length === 0) {
        fill.style.width = "0%";
        progressText.textContent = "🌸 Add your first task!";
        return;
    }

    const completed = tasks.filter(t => t.done).length;
    const percent = Math.round((completed / tasks.length) * 100);

    fill.style.width = percent + "%";

    let message = "";

    if (percent === 100) {

    message = "🏆 All tasks completed!";

    if (speech) {
        speech.textContent = "YOU DID IT!! 🎉🌸";
    }

    if (cloud) {
        cloud.textContent = "🥳";

        setTimeout(() => {
            cloud.textContent = "☁️";
        }, 3000);
    }

} else if (percent >= 75) {

    message = "🌟 Almost there!";

} else if (percent >= 50) {

    message = "✨ Great progress!";

} else if (percent >= 25) {

    message = "🌸 Keep going!";

} else {

    message = "☁️ You've got this!";

}

    progressText.textContent =
        `${message} • ${completed}/${tasks.length} tasks • ${percent}%`;
}
if (percent === 100 && !hasCelebrated) {

    celebrateWithNimbus();

    hasCelebrated = true;

}

if (percent < 100) {

    hasCelebrated = false;

}
// ===========================
// THEME SWITCHER & NAVIGATION
// ===========================

function toggleTheme() {
    const current = document.body.getAttribute("data-theme");

    if (current === "dark") {
        document.body.setAttribute("data-theme", "pastel");
        localStorage.setItem("theme", "pastel");
    } else if (current === "pastel") {
        document.body.setAttribute("data-theme", "lavender");
        localStorage.setItem("theme", "lavender");
    } else {
        document.body.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    }
}

function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    const buttons = document.querySelectorAll(".nav-btn");

    pages.forEach(page => {
        page.style.display = "none";
    });

    buttons.forEach(btn => {
        btn.classList.remove("active");
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = "block";
    }

    const activeBtn = document.querySelector(
        `[onclick="showPage('${pageId}')"]`
    );

    if (activeBtn) {
        activeBtn.classList.add("active");
    }
}

// ===========================
// REMINDERS
// ===========================

let reminders = JSON.parse(localStorage.getItem("reminders")) || [];

function saveReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders));
}

function addReminder() {
    const input = document.getElementById("reminderInput");
    if (!input) return;
    const value = input.value.trim();

    if (!value) return;

    reminders.push(value);
    input.value = "";

    saveReminders();
    renderReminders();
}

function deleteReminder(index) {
    reminders.splice(index, 1);
    saveReminders();
    renderReminders();
}

function renderReminders() {
    const list = document.getElementById("reminderList");
    if (!list) return;

    list.innerHTML = "";

    reminders.forEach((reminder, index) => {
        const li = document.createElement("li");

        const text = document.createElement("span");
        text.textContent = reminder;

        const btn = document.createElement("button");
        btn.textContent = "×";
        btn.className = "rem-delete";

        btn.onclick = () => deleteReminder(index);

        li.appendChild(text);
        li.appendChild(btn);

        list.appendChild(li);
    });
}

// ===========================
// GREETING & QUOTES
// ===========================

function updateGreeting() {
    const greeting = document.getElementById("greeting");
    if (!greeting) return;

    const hour = new Date().getHours();

    if (hour < 12) {
        greeting.textContent = "Good Morning 🌷";
    } else if (hour < 17) {
        greeting.textContent = "Good Afternoon ☀️";
    } else {
        greeting.textContent = "Good Evening 🌙";
    }
}

const quotes = [
    "Small progress every day adds up.",
    "You are capable of amazing things.",
    "Progress, not perfection.",
    "Every day is a fresh start.",
    "Believe in yourself and keep going.",
    "Little by little, a little becomes a lot.",
    "Dream big. Start small.",
    "Your future self will thank you."
];

function updateQuote() {
    const quote = document.getElementById("quoteText");
    if (!quote) return;

    const random = Math.floor(Math.random() * quotes.length);
    quote.textContent = `"${quotes[random]}"`;
}

// ===========================
// FOCUS TIMER
// ===========================

let timerInterval;
let timeLeft = 25 * 60;
let timerRunning = false;

function updateTimerDisplay() {
    const timer = document.getElementById("timer");
    if (!timer) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function toggleTimer() {
    const button = document.querySelector(".focus-btn");

    if (!timerRunning) {
        timerRunning = true;
        if (button) button.textContent = "⏸ Pause Focus";

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerRunning = false;
                if (button) button.textContent = "✨ Start Focus ✨";
                alert("🌸 Great job! Time for a break!");
            }
        }, 1000);
    } else {
        clearInterval(timerInterval);
        timerRunning = false;
        if (button) button.textContent = "▶ Resume Focus";
    }
}

// ===========================
// NOTES
// ===========================

const notesBox = document.getElementById("notesBox");
if (notesBox) {
    notesBox.value = localStorage.getItem("notes") || "";
    notesBox.addEventListener("input", () => {
        localStorage.setItem("notes", notesBox.value);
    });
}

// EXPOSE GLOBAL FUNCTIONS FOR INLINE HTML ATTRIBUTES
window.showPage = showPage;
window.addTask = addTask;
window.addReminder = addReminder;
window.toggleTheme = toggleTheme;
window.toggleTimer = toggleTimer;

// ===========================
// AUTHENTICATION & SETTINGS
// ===========================

// ---------- SHOW USER INFO ----------
onAuthStateChanged(auth, (user) => {
    const emailElement = document.getElementById("userEmail");
    const nameElement = document.getElementById("userName");

    if (user) {
        if (emailElement) emailElement.textContent = user.email || "No email provided";
        if (nameElement) {
            const displayName = user.displayName || user.email.split("@")[0];
            nameElement.textContent = displayName;
        }
    } else {
        if (emailElement) emailElement.textContent = "Not signed in";
        if (nameElement) nameElement.textContent = "Guest";
    }
});

// ---------- LOG OUT ----------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            alert("Couldn't log out.");
        }
    });
}

// ---------- OPTION 1: DIRECT PASSWORD CHANGE ----------
// ---------- TOGGLE PASSWORD INPUT FIELDS ----------
const togglePasswordFormBtn = document.getElementById("togglePasswordFormBtn");
const passwordFormContainer = document.getElementById("passwordFormContainer");
const toggleArrow = document.getElementById("toggleArrow");

if (togglePasswordFormBtn && passwordFormContainer) {
    togglePasswordFormBtn.addEventListener("click", () => {
        const isHidden = passwordFormContainer.style.display === "none";
        passwordFormContainer.style.display = isHidden ? "block" : "none";
        if (toggleArrow) {
            toggleArrow.textContent = isHidden ? "⌄" : "›";
        }
    });
}
const changePasswordBtn = document.getElementById("changePasswordBtn");
if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", async () => {
        const user = auth.currentUser;
        const newPasswordInput = document.getElementById("newPasswordInput");
        const confirmPasswordInput = document.getElementById("confirmPasswordInput");

        const newPassword = newPasswordInput ? newPasswordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

        if (!user) {
            alert("Please sign in first.");
            return;
        }

        // 1. Password Strength Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            alert(
                "🔒 Password is too weak!\n\nYour password must include:\n" +
                "• At least 8 characters\n" +
                "• At least one uppercase letter (A-Z)\n" +
                "• At least one lowercase letter (a-z)\n" +
                "• At least one number (0-9)\n" +
                "• At least one special character (@, $, !, %, *, ?, &)"
            );
            return;
        }

        // 2. Passwords Match Validation
        if (newPassword !== confirmPassword) {
            alert("⚠️ Passwords do not match. Please try typing them again.");
            return;
        }

        try {
            await updatePassword(user, newPassword);
            alert("🎉 Password updated successfully!");
            newPasswordInput.value = "";
            confirmPasswordInput.value = "";
        } catch (error) {
            console.error(error);

            if (error.code === "auth/requires-recent-login") {
                const currentPassword = prompt("For security reasons, please enter your CURRENT password to confirm:");

                if (!currentPassword) return;

                try {
                    const credential = EmailAuthProvider.credential(user.email, currentPassword);
                    await reauthenticateWithCredential(user, credential);
                    await updatePassword(user, newPassword);
                    alert("🎉 Password updated successfully!");
                    newPasswordInput.value = "";
                    confirmPasswordInput.value = "";
                } catch (reauthError) {
                    alert("Incorrect current password or re-authentication failed.");
                    console.error(reauthError);
                }
            } else {
                alert("Failed to update password: " + error.message);
            }
        }
    });
}

// ---------- OPTION 2: PASSWORD RESET EMAIL ----------
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!user || !user.email) {
            alert("Please sign in first.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, user.email);
            alert("📧 Password reset email sent!\n\nCheck your inbox (and spam folder if needed).");
        } catch (error) {
            alert("Couldn't send the password reset email. Please try again.");
            console.error(error);
        }
    });
}

// ---------- DELETE ACCOUNT FOREVER ----------
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!user) {
            alert("Please sign in first.");
            return;
        }

        // 1. Confirm deletion popup
        const confirmDelete = confirm(
            "⚠️ ARE YOU SURE?\n\nThis will permanently delete your Cloud Notes account. This action cannot be undone!"
        );

        if (!confirmDelete) return;

        try {
            await deleteUser(user);
            alert("Your account has been permanently deleted.");
            window.location.href = "index.html";
        } catch (error) {
            console.error(error);

            if (error.code === "auth/requires-recent-login") {
                const currentPassword = prompt(
                    "For security reasons, please enter your CURRENT password to finalize account deletion:"
                );

                if (!currentPassword) return;

                try {
                    const credential = EmailAuthProvider.credential(user.email, currentPassword);
                    await reauthenticateWithCredential(user, credential);
                    await deleteUser(user);

                    alert("Your account has been permanently deleted.");
                    window.location.href = "index.html";
                } catch (reauthError) {
                    alert("Incorrect password. Account was not deleted.");
                    console.error(reauthError);
                }
            } else {
                alert("Failed to delete account: " + error.message);
            }
        }
    });
}

// =========================
// ☁️ NIMBUS CLOUD BUDDY
// =========================

const cloudMessages = [
    "You're doing amazing! 🌸",
    "One task at a time! ☁️",
    "Keep going, you've got this! 💖",
    "Don't forget to drink water! 💙",
    "I'm cheering for you! 🎉",
    "Take a deep breath 🌿",
    "Progress > Perfection ✨",
    "Let's finish today's goals! 🌷"
];

const cloud = document.getElementById("cloudFace");
const speech = document.getElementById("cloudSpeech");

function randomCloudMessage() {

    if (!speech) return;

    const random = Math.floor(Math.random() * cloudMessages.length);

    speech.textContent = cloudMessages[random];

}

if (cloud) {

    cloud.addEventListener("click", randomCloudMessage);

}

// Call this when ALL tasks are completed
let celebrating = false;

function celebrateWithNimbus() {

    if (celebrating) return;

    celebrating = true;

    cloud.classList.add("happy");

    speech.textContent = "🎉 You did it! All tasks complete!";

    setTimeout(() => {

        cloud.classList.remove("happy");

        speech.textContent = "You're doing amazing! 🌸";

        celebrating = false;

    }, 2500);

}

    setTimeout(() => {

        cloud.textContent = "☁️";

        speech.textContent = "You're amazing! 💖";

        speech.style.opacity = "0";

    }, 3000);

}
// Ensure the Dashboard page loads as soon as the page is ready
window.addEventListener("DOMContentLoaded", () => {
    // Show dashboard on load
    showPage("dashboard");

    // Initial renders
    if (typeof renderTasks === "function") renderTasks();
    if (typeof renderReminders === "function") renderReminders();
    if (typeof updateGreeting === "function") updateGreeting();
    if (typeof updateQuote === "function") updateQuote();
    if (typeof updateTimerDisplay === "function") updateTimerDisplay();
});
