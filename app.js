let hasCelebrated = false;
let celebrating = false;

import { auth, database } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    ref,
    set,
    get,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

const USER_DATA_DEFAULTS = {
    tasks: [],
    reminders: [],
    notes: [],
    streak: { count: 0, lastCompletedDate: null },
    calendarEvents: {}
};
let currentUid = null;
let firebaseUnsubscribe = null;
let isLoadingUserData = false;
let firebaseReady = false;

function getUserPath(path = "") {
    return currentUid ? `users/${currentUid}${path ? `/${path}` : ""}` : null;
}

function parseStoredJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.warn(`Could not parse ${key} from localStorage`, error);
        return fallback;
    }
}

function saveUserData(path, value, successMessage = null) {
    if (isLoadingUserData || !currentUid) return Promise.resolve();

    const firebasePath = getUserPath(path);
    if (!firebasePath) return Promise.resolve();

    return set(ref(database, firebasePath), value)
        .then(() => {
            firebaseReady = true;
            if (successMessage) notifyNimbus(successMessage);
        })
        .catch((error) => {
            console.error(`Firebase save failed for ${path}`, error);
            notifyNimbus("☁️ Nimbus: I couldn't save that. Please try again.", "error");
        });
}

function applyUserData(data = {}) {
    isLoadingUserData = true;
    tasks = Array.isArray(data.tasks) ? data.tasks : [];
    reminders = Array.isArray(data.reminders) ? data.reminders : [];
    notes = Array.isArray(data.notes) ? data.notes : [];
    const streakData = data.streak || {};
    streak = Number(streakData.count || 0);
    lastCompleted = streakData.lastCompletedDate || null;
    calendarTasks = data.calendarEvents || {};

    if (window.loadHabitsFromFirebase) window.loadHabitsFromFirebase(Array.isArray(data.habits) ? data.habits : []);
    if (window.loadGoalsFromFirebase) window.loadGoalsFromFirebase(Array.isArray(data.goals) ? data.goals : []);

    currentNote = notes.length ? Math.min(Math.max(currentNote, 0), notes.length - 1) : -1;
    renderTasks();
    renderReminders();
    renderNotes();
    updateStreakDisplay();
    renderCalendar();
    renderCalendarTasks();
    if (currentNote !== -1) openNote(currentNote);
    isLoadingUserData = false;
}

async function migrateLocalStorageIfNeeded(user) {
    const migrationRef = ref(database, `users/${user.uid}/migration/localStorageV1`);
    const snapshot = await get(migrationRef);
    if (snapshot.exists()) return;

    const payload = {
        tasks: parseStoredJSON("tasks", []),
        reminders: parseStoredJSON("reminders", []),
        notes: parseStoredJSON("cloudNotes", []),
        habits: parseStoredJSON("cloudHabits", []),
        goals: parseStoredJSON("goals", []),
        calendarEvents: parseStoredJSON("calendarTasks", {}),
        streak: {
            count: Number(localStorage.getItem("streak")) || 0,
            lastCompletedDate: localStorage.getItem("lastCompletedDate") || null
        }
    };

    const hasLocalData = payload.tasks.length || payload.reminders.length || payload.notes.length ||
        payload.habits.length || payload.goals.length || Object.keys(payload.calendarEvents).length ||
        payload.streak.count || payload.streak.lastCompletedDate;

    if (hasLocalData) {
        const userSnap = await get(ref(database, `users/${user.uid}`));
        const existing = userSnap.val() || {};
        await set(ref(database, `users/${user.uid}`), {
            ...existing,
            tasks: existing.tasks || payload.tasks,
            reminders: existing.reminders || payload.reminders,
            notes: existing.notes || payload.notes,
            habits: existing.habits || payload.habits,
            goals: existing.goals || payload.goals,
            calendarEvents: existing.calendarEvents || payload.calendarEvents,
            streak: existing.streak || payload.streak,
            migration: { ...(existing.migration || {}), localStorageV1: Date.now() }
        });
    } else {
        await set(migrationRef, Date.now());
    }
}

window.cloudNotesSave = saveUserData;
window.getCloudNotesContext = () => ({ tasks, reminders, notes, habits: window.getHabitsData?.() || [], goals: window.getGoalsData?.() || [], calendarEvents: calendarTasks });
// ===========================
// TASKS & BOARD LOGIC
// ===========================

let tasks = [];

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
        text: taskInput.value,
        done: false
    });

    inputEl.value = "";
    saveTasks("☁️ Nimbus: Task added!");
    renderTasks();
}

// ---------- TOGGLE COMPLETE ----------
function toggleTask(index) {
    if (!tasks[index]) return;
    tasks[index].done = !tasks[index].done;
    if (tasks[index].done) {
        completeToday();
    }
    saveTasks(tasks[index]?.done ? "☁️ Nimbus: Nice! Task completed." : null);
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

        if (task.done) {
            text.style.textDecoration = "line-through";
            text.style.opacity = "0.6";
}

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
function saveTasks(message = null) {
    saveUserData("tasks", tasks, message);
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

    const activeBtn = document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
    if (activeBtn) {
        activeBtn.classList.add("active");
    }

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

let reminders = [];

function saveReminders() {
    saveUserData("reminders", reminders);
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
        btn.textContent = "✕";
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

// =========================================
// NOTES V2 (WITH RICH TEXT & METADATA)
// =========================================

let notes = [];
let currentNote = -1;
let saveTimeout;

function getFontSelect() {
    return document.getElementById("fontFamilySelect");
}

function getNotesBox() {
    return document.getElementById("notesBox");
}

function focusNotesBox() {
    const boxEl = getNotesBox();
    if (boxEl) boxEl.focus();
}

function saveNotes(message = null) {
    saveUserData("notes", notes, message);
}

function getNotePlainText(note) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = note.content || "";
    return tempDiv.textContent || tempDiv.innerText || "";
}

function noteMatchesSearch(note, search) {
    return `${note.title || ""} ${getNotePlainText(note)}`.toLowerCase().includes(search);
}

function renderNotes() {
    const list = document.getElementById("notesList");
    if (!list) return;

    const search = (document.getElementById("noteSearch")?.value || "").trim().toLowerCase();
    list.innerHTML = "";

    notes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updated || 0) - (a.updated || 0);
    });

    notes.forEach((note, index) => {
        if (search && !noteMatchesSearch(note, search)) return;

        const card = document.createElement("button");
        card.type = "button";
        card.className = "note-card";
        if (index === currentNote) card.classList.add("active");

        const cleanText = getNotePlainText(note) || "Empty note";
        const preview = cleanText.substring(0, 52);
        const date = note.updated ? new Date(note.updated).toLocaleDateString() : "";

        card.innerHTML = `
            <span class="note-title">${note.pinned ? "📌 " : ""}${note.title || "Untitled Note"}</span>
            <span class="note-preview">${preview}${cleanText.length > 52 ? "..." : ""}</span>
            <span class="note-date">${date}</span>
        `;

        card.onclick = () => openNote(index);
        list.appendChild(card);
    });
}

function toggleNotesSidebar(forceOpen = null) {
    const shouldOpen = forceOpen === null ? !document.body.classList.contains("notes-sidebar-open") : forceOpen;
    document.body.classList.toggle("notes-sidebar-open", shouldOpen);
    document.getElementById("notesSidebarToggle")?.setAttribute("aria-expanded", String(shouldOpen));
}

function closeNotesSidebar() {
    toggleNotesSidebar(false);
}

function createNote() {
    notes.unshift({
        title: "Untitled Note",
        content: "",
        pinned: false,
        font: "Nunito",
        updated: Date.now()
    });

    currentNote = 0;
    saveNotes("☁️ Nimbus: New note ready!");
    renderNotes();
    openNote(0);
    focusNotesBox();
}

function updatePinButton() {
    const pinBtn = document.getElementById("pinBtn");
    if (!pinBtn || currentNote === -1 || !notes[currentNote]) return;

    pinBtn.classList.toggle("is-pinned", !!notes[currentNote].pinned);
    pinBtn.textContent = notes[currentNote].pinned ? "📌 Pinned" : "📌 Pin";
}

function openNote(index) {
    if (!notes[index]) return;
    currentNote = index;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = getNotesBox();
    const fontSelect = getFontSelect();
    const noteFont = notes[index].font || "Nunito";

    if (titleEl) titleEl.value = notes[index].title || "";
    if (boxEl) {
        boxEl.innerHTML = notes[index].content || "";
        boxEl.style.fontFamily = noteFont;
    }
    if (fontSelect) {
        fontSelect.value = noteFont;
        fontSelect.style.fontFamily = noteFont;
    }

    updatePinButton();
    updateLastEditedTime(notes[index].updated);
    updateCharacterCount();
    renderNotes();

    if (window.matchMedia("(max-width: 1024px)").matches) {
        closeNotesSidebar();
    }
}

function togglePin() {
    if (currentNote === -1 || !notes[currentNote]) return;

    notes[currentNote].pinned = !notes[currentNote].pinned;
    autoSaveNote();
    updatePinButton();
}

function autoSaveNote(shouldNotify = false) {
    if (currentNote === -1 || !notes[currentNote]) return;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = getNotesBox();
    const fontSelect = getFontSelect();

    notes[currentNote].title = titleEl ? (titleEl.value || "Untitled Note") : "Untitled Note";
    notes[currentNote].content = boxEl ? boxEl.innerHTML : "";
    notes[currentNote].font = fontSelect ? fontSelect.value : (notes[currentNote].font || "Nunito");
    notes[currentNote].updated = Date.now();

    saveNotes(shouldNotify ? "☁️ Nimbus: Note saved!" : null);
    renderNotes();
    updateCharacterCount();
    updateLastEditedTime(notes[currentNote].updated);
    showSavingStatus();
}

function showSavingStatus() {
    const statusEl = document.getElementById("saveStatus");
    if (!statusEl) return;

    statusEl.textContent = "Saving...";
    statusEl.style.color = "#c99035";

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        statusEl.textContent = "Saved";
        statusEl.style.color = "#6bc26b";
    }, 450);
}

function updateLastEditedTime(timestamp) {
    const lastEditedEl = document.getElementById("lastEdited");
    if (!lastEditedEl) return;
    if (!timestamp) {
        lastEditedEl.textContent = "Last edited: Never";
        return;
    }

    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateString = date.toLocaleDateString();
    lastEditedEl.textContent = `Last edited: ${dateString} at ${timeString}`;
}

function deleteCurrentNote() {
    if (currentNote === -1) return;
    if (!confirm("Delete this note?")) return;

    notes.splice(currentNote, 1);
    saveNotes("☁️ Nimbus: Note deleted.");
    currentNote = -1;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = getNotesBox();
    if (titleEl) titleEl.value = "";
    if (boxEl) boxEl.innerHTML = "";

    renderNotes();
    updateCharacterCount();
    updateLastEditedTime(null);
    updatePinButton();
}

function searchNotes() {
    renderNotes();
}

function updateCharacterCount() {
    const boxEl = getNotesBox();
    const countEl = document.getElementById("charCount");
    if (boxEl && countEl) countEl.textContent = `${boxEl.innerText.trim().length} characters`;
}

function runEditorCommand(command, value = null) {
    focusNotesBox();
    document.execCommand(command, false, value);
    autoSaveNote();
}

function formatText(command) {
    runEditorCommand(command);
}

function formatFontFamily(fontName) {
    if (!fontName) return;

    const boxEl = getNotesBox();
    const fontSelect = getFontSelect();
    if (boxEl) boxEl.style.fontFamily = fontName;
    if (fontSelect) fontSelect.style.fontFamily = fontName;

    if (currentNote !== -1 && notes[currentNote]) {
        notes[currentNote].font = fontName;
    }

    focusNotesBox();
    document.execCommand("fontName", false, fontName);
    autoSaveNote();
}

function formatTextColor(color) {
    runEditorCommand("foreColor", color);
}

function formatHighlightColor(color) {
    runEditorCommand("hiliteColor", color);
}

// ===========================
// AUTHENTICATION & SETTINGS
// ===========================

onAuthStateChanged(auth, (user) => {
    const emailElement = document.getElementById("userEmail");
    const nameElement = document.getElementById("userName");

    if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
        firebaseUnsubscribe = null;
    }

    if (user) {
        currentUid = user.uid;
        notifyNimbus("☁️ Nimbus: Loading your Cloud Notes…");
        if (emailElement) emailElement.textContent = user.email || "No email provided";
        if (nameElement) {
            const displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Cloud Notes user");
            nameElement.textContent = displayName;
        }

        migrateLocalStorageIfNeeded(user).catch((error) => {
            console.error("Local data migration failed", error);
            notifyNimbus("☁️ Nimbus: I couldn't save that. Please try again.", "error");
        });

        const userRef = ref(database, `users/${user.uid}`);
        const unsubscribeValue = onValue(userRef, (snapshot) => {
            firebaseReady = true;
            applyUserData(snapshot.val() || USER_DATA_DEFAULTS);
        }, (error) => {
            console.error("Firebase load failed", error);
            notifyNimbus("☁️ Nimbus: I couldn't load your Cloud Notes. Please try again.", "error");
        });
        firebaseUnsubscribe = unsubscribeValue;
    } else {
        currentUid = null;
        firebaseReady = false;
        applyUserData(USER_DATA_DEFAULTS);
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
            await remove(ref(database, `users/${user.uid}`));
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
                    await remove(ref(database, `users/${user.uid}`));
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

function notifyNimbus(message, type = "info") {
    if (!message) return;
    if (speech) {
        speech.textContent = message;
        speech.dataset.type = type;
    }

    const toast = document.createElement("div");
    toast.className = `nimbus-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, 2600);
}

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
    if (speech) speech.textContent = "🎉 YOU DID IT!! All tasks completed!🌸";

    setTimeout(() => {
        if (cloud) cloud.classList.remove("happy");
        if (speech) speech.textContent = "You're doing amazing!🌸";
        celebrating = false;
    }, 3500);
}

// ==========================
// DAILY STREAK
// ==========================

let streak = 0;
let lastCompleted = null;

function updateStreakDisplay() {
    const streakText = document.getElementById("streakCount");
    if (streakText) {
        streakText.textContent = streak;
    }
}

function completeToday() {

    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];

    if (lastCompleted === todayKey) return;

    if (lastCompleted) {

        const previous = new Date(lastCompleted);
        const diffDays = Math.floor((today - previous) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
        } else {
            streak = 1;
        }

    } else {
        streak = 1;
    }

    lastCompleted = todayKey;

    saveUserData("streak", { count: streak, lastCompletedDate: lastCompleted });

    updateStreakDisplay();
}

updateStreakDisplay();

// =========================
// CALENDAR (ROBUST RENDER)
// =========================

let currentDate = new Date();
let selectedCalendarDate = null;
let calendarTasks = {};

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

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day empty";
        grid.appendChild(empty);
    }

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
        const categoryClass = typeof task === "object" ? (task.category || "work") : "work";

        li.innerHTML = `
            <span class="calendar-event-text"><span class="calendar-label-dot ${categoryClass}"></span>${taskText}</span>
            <button class="calendar-delete" onclick="deleteCalendarTask(${index})">✕</button>
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

    saveUserData("calendarEvents", calendarTasks, "☁️ Nimbus: Calendar event saved!");

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

    saveUserData("calendarEvents", calendarTasks);

    renderCalendar();
    renderCalendarTasks();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

function toggleNimbusChat(forceOpen = null) {
    const panel = document.getElementById("nimbusChatPanel");
    if (!panel) return;
    const shouldOpen = forceOpen === null ? panel.hidden : forceOpen;
    panel.hidden = !shouldOpen;
    if (shouldOpen) document.getElementById("nimbusChatInput")?.focus();
}

function addNimbusChatMessage(text, sender = "nimbus") {
    const messages = document.getElementById("nimbusChatMessages");
    if (!messages) return;
    const bubble = document.createElement("div");
    bubble.className = `nimbus-message ${sender}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
}

function getRelevantNimbusContext(prompt) {
    const lower = prompt.toLowerCase();
    const context = {};
    if (/task|today|plan|todo/.test(lower)) context.tasks = tasks.slice(0, 20);
    if (/habit|routine|streak/.test(lower)) context.habits = (window.getHabitsData?.() || []).slice(0, 20);
    if (/goal|milestone|priority/.test(lower)) context.goals = (window.getGoalsData?.() || []).slice(0, 10);
    if (/calendar|event|schedule/.test(lower)) context.calendarEvents = calendarTasks;
    if (/note|summarize|rewrite|organize/.test(lower)) {
        const current = currentNote !== -1 ? notes[currentNote] : null;
        context.currentNote = current ? { title: current.title, content: getNotePlainText(current).slice(0, 4000) } : null;
    }
    return context;
}

async function sendNimbusChat() {
    const input = document.getElementById("nimbusChatInput");
    const sendBtn = document.getElementById("nimbusSendBtn");
    const typing = document.getElementById("nimbusTyping");
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    input.value = "";
    addNimbusChatMessage(message, "user");
    if (typing) typing.hidden = false;
    if (sendBtn) sendBtn.disabled = true;

    try {
        const response = await fetch("/api/nimbus-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, context: getRelevantNimbusContext(message) })
        });

        if (!response.ok) throw new Error(`Nimbus endpoint returned ${response.status}`);
        const data = await response.json();
        addNimbusChatMessage(data.reply || "I'm here to help. ☁️");
    } catch (error) {
        console.warn("Nimbus AI backend is not configured", error);
        addNimbusChatMessage("I’m ready to help, but my secure AI backend isn’t configured yet. Please deploy /api/nimbus-chat with a server-side AI key.");
    } finally {
        if (typing) typing.hidden = true;
        if (sendBtn) sendBtn.disabled = false;
    }
}


// EXPOSE GLOBAL FUNCTIONS FOR INLINE HTML ATTRIBUTES
window.showPage = showPage;
window.addTask = addTask;
window.addReminder = addReminder;
window.toggleTheme = toggleTheme;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.addCalendarTask = addCalendarTask;
window.deleteCalendarTask = deleteCalendarTask;
window.createNote = createNote;
window.deleteCurrentNote = deleteCurrentNote;
window.togglePin = togglePin;
window.searchNotes = searchNotes;
window.toggleNotesSidebar = toggleNotesSidebar;
window.closeNotesSidebar = closeNotesSidebar;
window.goToToday = goToToday;
window.toggleNimbusChat = toggleNimbusChat;
window.sendNimbusChat = sendNimbusChat;
window.createNote = createNote;
window.openNote = openNote;
window.autoSaveNote = autoSaveNote;
window.formatText = formatText;
window.formatFontFamily = formatFontFamily;
window.formatTextColor = formatTextColor;
window.formatHighlightColor = formatHighlightColor;

// ---------- INITIALIZATION ----------
window.addEventListener("DOMContentLoaded", () => {
    showPage("dashboard");

    renderTasks();
    renderReminders();
    updateGreeting();
    updateQuote();
    renderNotes();
    updateStreakDisplay();
    renderCalendar();

    const noteTitleInput = document.getElementById("noteTitle");
    const notesBoxInput = document.getElementById("notesBox");

    if (noteTitleInput) {
        noteTitleInput.addEventListener("input", autoSaveNote);
    }

    if (notesBoxInput) {
        notesBoxInput.addEventListener("input", () => {
            autoSaveNote();
            updateCharacterCount();
        });
    }

    const fontFamilySelect = document.getElementById("fontFamilySelect");
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener("change", () => {
            fontFamilySelect.style.fontFamily = fontFamilySelect.value;
        });
    }

    document.getElementById("nimbusChatForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        sendNimbusChat();
    });

    if (notes.length > 0) {
        openNote(0);
    }
});
