let hasCelebrated = false;
let celebrating = false;

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
    const inputEl = document.getElementById("taskInput");
    if (!inputEl) return;
    const value = inputEl.value.trim();
    if (!value) return;

    tasks.push({
        text: value,
        done: false
    });

    inputEl.value = "";
    saveTasks();
    renderTasks();
}

// ---------- TOGGLE COMPLETE ----------
function toggleTask(index) {
    if (!tasks[index]) return;
    tasks[index].done = !tasks[index].done;
    if (tasks[index].done) {
        completeToday();
    }
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
    const listEl = document.getElementById("taskList");
    if (!listEl) return;
    listEl.innerHTML = "";

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

        listEl.appendChild(li);
    });

    updateProgress();
}

// ---------- SAVE TASKS ----------
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- PROGRESS BAR & CELEBRATION ----------
function updateProgress() {
    const fill = document.querySelector(".fill");
    const progressText = document.getElementById("progressText");

    if (!fill || !progressText) return;

    if (tasks.length === 0) {
        fill.style.width = "0%";
        progressText.textContent = "🌸 Add your first task!";
        hasCelebrated = false;
        return;
    }

    const completed = tasks.filter(t => t.done).length;
    const percent = Math.round((completed / tasks.length) * 100);

    fill.style.width = percent + "%";

    let message = "";

    if (percent === 100) {
        message = "🏆 All tasks completed!";
        if (!hasCelebrated) {
            celebrateWithNimbus();
            hasCelebrated = true;
        }
    } else if (percent >= 75) {
        message = "🌟 Almost there!";
        hasCelebrated = false;
    } else if (percent >= 50) {
        message = "✨ Great progress!";
        hasCelebrated = false;
    } else if (percent >= 25) {
        message = "🌸 Keep going!";
        hasCelebrated = false;
    } else {
        message = "☁️ You've got this!";
        hasCelebrated = false;
    }

    progressText.textContent =
        `${message} • ${completed}/${tasks.length} tasks • ${percent}%`;
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

    // Hide all pages and strip 'active' class so pages don't stack
    pages.forEach(page => {
        page.style.display = "none";
        page.classList.remove("active");
    });

    buttons.forEach(btn => {
        btn.classList.remove("active");
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = "block";
        targetPage.classList.add("active");
    }

    const activeBtn = document.querySelector(
        `[onclick="showPage('${pageId}')"]`
    );

    if (activeBtn) {
        activeBtn.classList.add("active");
    }

    // Re-render components dynamically when opening a page
    if (pageId === "calendar") {
        renderCalendar();
        renderCalendarTasks();
    } else if (pageId === "dashboard") {
        renderTasks();
        renderReminders();
    } else if (pageId === "notes") {
        renderNotes();
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

// =========================================
// NOTES V2
// =========================================

let notes = JSON.parse(localStorage.getItem("cloudNotes")) || [];
let currentNote = -1;

function saveNotes() {
    localStorage.setItem("cloudNotes", JSON.stringify(notes));
}

function renderNotes() {
    const list = document.getElementById("notesList");
    if (!list) return;

    list.innerHTML = "";

    notes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updated || 0) - (a.updated || 0);
    });

    notes.forEach((note, index) => {
        const card = document.createElement("div");
        card.className = "note-card";

        if (index === currentNote) {
            card.classList.add("active");
        }

        const preview = note.content ? note.content.substring(0, 45) : "Empty note";
        const date = note.updated ? new Date(note.updated).toLocaleDateString() : "";

        card.innerHTML = `
            <div class="note-title">${note.pinned ? "📌 " : ""}${note.title || "Untitled"}</div>
            <div class="note-preview">${preview}</div>
            <div class="note-date">${date}</div>
        `;

        card.onclick = () => openNote(index);
        list.appendChild(card);
    });
}

function createNote() {
    notes.unshift({
        title: "Untitled Note",
        content: "",
        pinned: false,
        updated: Date.now()
    });

    currentNote = 0;
    saveNotes();
    renderNotes();
    openNote(0);
}

function openNote(index) {
    if (!notes[index]) return;
    currentNote = index;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = document.getElementById("notesBox");

    if (titleEl) titleEl.value = notes[index].title || "";
    if (boxEl) boxEl.value = notes[index].content || "";

    updateCharacterCount();
    renderNotes();
}

function autoSaveNote() {
    if (currentNote === -1 || !notes[currentNote]) return;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = document.getElementById("notesBox");

    notes[currentNote].title = titleEl ? (titleEl.value || "Untitled Note") : "Untitled Note";
    notes[currentNote].content = boxEl ? boxEl.value : "";
    notes[currentNote].updated = Date.now();

    saveNotes();
    renderNotes();
    updateCharacterCount();
}

function deleteCurrentNote() {
    if (currentNote === -1) return;
    if (!confirm("Delete this note?")) return;

    notes.splice(currentNote, 1);
    saveNotes();
    currentNote = -1;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = document.getElementById("notesBox");

    if (titleEl) titleEl.value = "";
    if (boxEl) boxEl.value = "";

    renderNotes();
    updateCharacterCount();
}

function togglePin() {
    if (currentNote === -1 || !notes[currentNote]) return;

    notes[currentNote].pinned = !notes[currentNote].pinned;
    saveNotes();
    renderNotes();
}

function searchNotes() {
    const searchEl = document.getElementById("noteSearch");
    if (!searchEl) return;

    const search = searchEl.value.toLowerCase();
    const cards = document.querySelectorAll(".note-card");

    cards.forEach((card, index) => {
        const note = notes[index];
        if (!note) return;

        const visible =
            (note.title && note.title.toLowerCase().includes(search)) ||
            (note.content && note.content.toLowerCase().includes(search));

        card.style.display = visible ? "block" : "none";
    });
}

function updateCharacterCount() {
    const boxEl = document.getElementById("notesBox");
    const countEl = document.getElementById("charCount");

    if (boxEl && countEl) {
        countEl.textContent = `${boxEl.value.length} characters`;
    }
}

// Safe Notes Event Listeners
const noteTitleInput = document.getElementById("noteTitle");
const notesBoxInput = document.getElementById("notesBox");

if (noteTitleInput) {
    noteTitleInput.addEventListener("input", autoSaveNote);
}

if (notesBoxInput) {
    notesBoxInput.addEventListener("input", autoSaveNote);
    notesBoxInput.addEventListener("input", updateCharacterCount);
}

// ===========================
// AUTHENTICATION & SETTINGS
// ===========================

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

// LOG OUT
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

// TOGGLE PASSWORD INPUT FIELDS
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

// PASSWORD RESET EMAIL
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

// DELETE ACCOUNT FOREVER
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!user) {
            alert("Please sign in first.");
            return;
        }

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

function celebrateWithNimbus() {
    if (celebrating) return;
    celebrating = true;

    if (cloud) cloud.classList.add("happy");
    if (speech) speech.textContent = "🎉 YOU DID IT!! All tasks completed! 🌸";

    setTimeout(() => {
        if (cloud) cloud.classList.remove("happy");
        if (speech) speech.textContent = "You're doing amazing! 🌸";
        celebrating = false;
    }, 3500);
}

// ==========================
// DAILY STREAK
// ==========================

let streak = Number(localStorage.getItem("streak")) || 0;
let lastCompleted = localStorage.getItem("lastCompletedDate");

function updateStreakDisplay() {
    const streakText = document.getElementById("streakCount");
    if (streakText) {
        streakText.textContent = streak;
    }
}

function completeToday() {
    const today = new Date().toDateString();

    if (lastCompleted === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastCompleted === yesterday.toDateString()) {
        streak++;
    } else {
        streak = 1;
    }

    lastCompleted = today;

    localStorage.setItem("streak", streak);
    localStorage.setItem("lastCompletedDate", today);

    updateStreakDisplay();
}

// =========================
// CALENDAR (ROBUST RENDER)
// =========================

let currentDate = new Date();
let selectedCalendarDate = null;
let calendarTasks = JSON.parse(localStorage.getItem("calendarTasks")) || {};

function renderCalendar() {
    const monthYear = document.getElementById("monthYear");
    const grid = document.getElementById("calendarGrid");

    if (!monthYear || !grid) return;

    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYear.textContent = currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty cells before first day of month
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day empty";
        grid.appendChild(empty);
    }

    // Numbered days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "day";
        cell.textContent = day;

        const key = `${year}-${month}-${day}`;

        cell.onclick = () => {
            selectedCalendarDate = key;

            const selectedDateEl = document.getElementById("selectedDate");
            if (selectedDateEl) {
                selectedDateEl.textContent = `${currentDate.toLocaleString("default", { month: "long" })} ${day}`;
            }

            renderCalendar();
            renderCalendarTasks();
        };

        if (selectedCalendarDate === key) {
            cell.classList.add("calendar-selected");
        }

        const today = new Date();
        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            cell.classList.add("today");
        }

        // Render Category Dots if task exists
        if (calendarTasks[key] && calendarTasks[key].length > 0) {
            const dotsContainer = document.createElement("div");
            dotsContainer.className = "day-dots";

            calendarTasks[key].forEach(t => {
                const categoryClass = typeof t === "object" ? (t.category || "work") : "work";
                const dot = document.createElement("span");
                dot.className = `dot ${categoryClass}`;
                dotsContainer.appendChild(dot);
            });

            cell.appendChild(dotsContainer);
        }

        grid.appendChild(cell);
    }
}

function renderCalendarTasks() {
    const list = document.getElementById("calendarTaskList");
    if (!list) return;

    list.innerHTML = "";

    const tasksForDate = calendarTasks[selectedCalendarDate] || [];

    tasksForDate.forEach((task, index) => {
        const li = document.createElement("li");
        li.className = "calendar-event";

        const taskText = typeof task === "object" ? task.text : task;

        li.innerHTML = `
            <span>${taskText}</span>
            <button onclick="deleteCalendarTask(${index})">❌</button>
        `;
        list.appendChild(li);
    });
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function addCalendarTask() {
    if (!selectedCalendarDate) {
        alert("Select a date first!");
        return;
    }

    const input = document.getElementById("calendarTaskInput");
    const category = document.getElementById("eventCategory");

    if (!input) return;

    const value = input.value.trim();
    if (!value) return;

    if (!calendarTasks[selectedCalendarDate]) {
        calendarTasks[selectedCalendarDate] = [];
    }

    calendarTasks[selectedCalendarDate].push({
        text: value,
        category: category ? category.value : "work"
    });

    localStorage.setItem("calendarTasks", JSON.stringify(calendarTasks));

    input.value = "";
    renderCalendar();
    renderCalendarTasks();
}

function deleteCalendarTask(index) {
    if (!selectedCalendarDate || !calendarTasks[selectedCalendarDate]) return;

    calendarTasks[selectedCalendarDate].splice(index, 1);

    if (calendarTasks[selectedCalendarDate].length === 0) {
        delete calendarTasks[selectedCalendarDate];
    }

    localStorage.setItem("calendarTasks", JSON.stringify(calendarTasks));

    renderCalendar();
    renderCalendarTasks();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

// EXPOSE GLOBAL FUNCTIONS FOR INLINE HTML ATTRIBUTES
window.showPage = showPage;
window.addTask = addTask;
window.addReminder = addReminder;
window.toggleTheme = toggleTheme;
window.toggleTimer = toggleTimer;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.addCalendarTask = addCalendarTask;
window.deleteCalendarTask = deleteCalendarTask;
window.createNote = createNote;
window.deleteCurrentNote = deleteCurrentNote;
window.togglePin = togglePin;
window.searchNotes = searchNotes;
window.goToToday = goToToday;

// ---------- INITIALIZATION ----------
window.addEventListener("DOMContentLoaded", () => {
    showPage("dashboard");

    renderTasks();
    renderReminders();
    updateGreeting();
    updateQuote();
    updateTimerDisplay();
    renderNotes();
    updateStreakDisplay();
    renderCalendar();
});
// ---------- FONT FAMILY SELECTION ----------
function formatFontFamily(fontName) {
    if (!fontName) return;
    document.execCommand("fontName", false, fontName);
    autoSaveNote();
}

// Ensure it's exposed to window for inline HTML onchange events
window.formatFontFamily = formatFontFamily;
