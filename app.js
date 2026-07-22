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
// NAVIGATION (FIXED)
// ===========================
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach(page => {
        page.classList.remove("active");
        page.style.display = ""; // Remove inline style overrides
    });

    const buttons = document.querySelectorAll(".nav-btn");
    buttons.forEach(btn => btn.classList.remove("active"));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add("active");
    }

    const activeBtn = document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
    if (activeBtn) {
        activeBtn.classList.add("active");
    }

    if (pageId === "dashboard") {
        renderTasks();
        renderReminders();
    } else if (pageId === "notes") {
        renderNotes();
    }
}

// ===========================
// TASKS & BOARD LOGIC
// ===========================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const savedTheme = localStorage.getItem("theme") || "pastel";
document.body.setAttribute("data-theme", savedTheme);

function addTask() {
    const inputEl = document.getElementById("taskInput");
    if (!inputEl) return;
    const value = inputEl.value.trim();
    if (!value) return;

    tasks.push({ text: value, done: false });
    inputEl.value = "";
    saveTasks();
    renderTasks();
}

function toggleTask(index) {
    if (!tasks[index]) return;
    tasks[index].done = !tasks[index].done;
    saveTasks();
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

function renderTasks() {
    const listEl = document.getElementById("taskList");
    if (!listEl) return;
    listEl.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.id = `task-${index}`;
        if (task.done) li.classList.add("done");

        li.onclick = (e) => {
            if (e.target.classList.contains("delete-btn")) return;
            toggleTask(index);
        };

        const text = document.createElement("span");
        text.textContent = task.text;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTask(index);
        };

        li.appendChild(text);
        li.appendChild(deleteBtn);
        listEl.appendChild(li);
    });

    updateProgress();
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

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
    progressText.textContent = `${completed}/${tasks.length} tasks • ${percent}%`;
}

function toggleTheme() {
    const current = document.body.getAttribute("data-theme");
    let nextTheme = "dark";
    if (current === "dark") nextTheme = "pastel";
    else if (current === "pastel") nextTheme = "lavender";

    document.body.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
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

function updateGreeting() {
    const greeting = document.getElementById("greeting");
    if (!greeting) return;

    const hour = new Date().getHours();
    if (hour < 12) greeting.textContent = "Good Morning 🌷";
    else if (hour < 17) greeting.textContent = "Good Afternoon ☀️";
    else greeting.textContent = "Good Evening 🌙";
}

function updateQuote() {
    const quote = document.getElementById("quoteText");
    if (!quote) return;
    const quotes = [
        "Small progress every day adds up.",
        "You are capable of amazing things.",
        "Progress, not perfection.",
        "Every day is a fresh start."
    ];
    quote.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
}

// ===========================
// NOTES SECTION
// ===========================
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
        if (index === currentNote) card.classList.add("active");

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = note.content || "";
        const cleanText = tempDiv.textContent || tempDiv.innerText || "Empty note";
        const preview = cleanText.substring(0, 40);
        const date = note.updated ? new Date(note.updated).toLocaleDateString() : "";

        card.innerHTML = `
            <div class="note-title">${note.pinned ? "📌 " : ""}${note.title || "Untitled Note"}</div>
            <div class="note-preview">${preview}...</div>
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
    const pinBtn = document.getElementById("pinBtn");

    if (titleEl) titleEl.value = notes[index].title || "";
    if (boxEl) boxEl.innerHTML = notes[index].content || "";

    if (pinBtn) {
        if (notes[index].pinned) {
            pinBtn.style.background = "#ffd56b";
            pinBtn.style.borderColor = "#f7c038";
            pinBtn.textContent = "📌 Pinned";
        } else {
            pinBtn.style.background = "#fff";
            pinBtn.style.borderColor = "#ddd";
            pinBtn.textContent = "📌 Pin";
        }
    }

    updateLastEditedTime(notes[index].updated);
    updateCharacterCount();
    renderNotes();
}

function togglePin() {
    if (currentNote === -1 || !notes[currentNote]) return;

    notes[currentNote].pinned = !notes[currentNote].pinned;
    saveNotes();
    renderNotes();

    const pinBtn = document.getElementById("pinBtn");
    if (pinBtn) {
        if (notes[currentNote].pinned) {
            pinBtn.style.background = "#ffd56b";
            pinBtn.style.borderColor = "#f7c038";
            pinBtn.textContent = "📌 Pinned";
        } else {
            pinBtn.style.background = "#fff";
            pinBtn.style.borderColor = "#ddd";
            pinBtn.textContent = "📌 Pin";
        }
    }
}

function autoSaveNote() {
    if (currentNote === -1 || !notes[currentNote]) return;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = document.getElementById("notesBox");

    notes[currentNote].title = titleEl ? (titleEl.value || "Untitled Note") : "Untitled Note";
    notes[currentNote].content = boxEl ? boxEl.innerHTML : "";
    notes[currentNote].updated = Date.now();

    saveNotes();
    renderNotes();
    updateCharacterCount();
    updateLastEditedTime(notes[currentNote].updated);
    showSavingStatus();
}

let saveTimeout;
function showSavingStatus() {
    const statusEl = document.getElementById("saveStatus");
    if (!statusEl) return;

    statusEl.textContent = "Saving...";
    statusEl.style.color = "#ffa500";

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        statusEl.textContent = "Saved";
        statusEl.style.color = "#6bc26b";
    }, 500);
}

function updateLastEditedTime(timestamp) {
    const lastEditedEl = document.getElementById("lastEdited");
    if (!lastEditedEl || !timestamp) return;

    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString();

    lastEditedEl.textContent = `Last edited: ${dateString} at ${timeString}`;
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
    if (boxEl) boxEl.innerHTML = "";

    renderNotes();
    updateCharacterCount();
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
        countEl.textContent = `${boxEl.innerText.trim().length} characters`;
    }
}

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    autoSaveNote();
}

function formatFontFamily(fontName) {
    if (!fontName) return;
    document.execCommand("fontName", false, fontName);
    autoSaveNote();
}

function formatTextColor(color) {
    document.execCommand("foreColor", false, color);
    autoSaveNote();
}

function formatHighlightColor(color) {
    document.execCommand("hiliteColor", false, color);
    autoSaveNote();
}

// ===========================
// EXPOSE GLOBALS FOR INLINE HTML
// ===========================
window.showPage = showPage;
window.toggleTheme = toggleTheme;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.addReminder = addReminder;
window.deleteReminder = deleteReminder;
window.createNote = createNote;
window.deleteCurrentNote = deleteCurrentNote;
window.togglePin = togglePin;
window.searchNotes = searchNotes;
window.autoSaveNote = autoSaveNote;
window.formatText = formatText;
window.formatFontFamily = formatFontFamily;
window.formatTextColor = formatTextColor;
window.formatHighlightColor = formatHighlightColor;

// ===========================
// INITIALIZATION
// ===========================
window.addEventListener("DOMContentLoaded", () => {
    showPage("dashboard");

    renderTasks();
    renderReminders();
    updateGreeting();
    updateQuote();
    renderNotes();

    const noteTitleInput = document.getElementById("noteTitle");
    const notesBoxInput = document.getElementById("notesBox");

    if (noteTitleInput) noteTitleInput.addEventListener("input", autoSaveNote);
    if (notesBoxInput) {
        notesBoxInput.addEventListener("input", () => {
            autoSaveNote();
            updateCharacterCount();
        });
    }

    if (notes.length > 0) openNote(0);
});
