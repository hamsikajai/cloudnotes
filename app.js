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
// NAVIGATION / PAGE SWITCHING
// ===========================
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => {
        page.classList.remove("active");
    });

    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add("active");
    }

    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach((btn) => {
        btn.classList.remove("active");
    });

    // Match navigation button
    const targetBtn = Array.from(navButtons).find((btn) =>
        btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(pageId)
    );
    if (targetBtn) {
        targetBtn.classList.add("active");
    }
}

// ===========================
// TASKS & BOARD LOGIC
// ===========================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    const list = document.getElementById("taskList");
    if (!list) return;

    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const item = document.createElement("li");
        item.id = `task-${index}`;
        item.className = task.done ? "done" : "";

        item.innerHTML = `
            <span onclick="toggleTask(${index})">${task.text}</span>
            <button onclick="deleteTask(${index})">🗑</button>
        `;

        list.appendChild(item);
    });
}

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

// ===========================
// REMINDERS
// ===========================
let reminders = JSON.parse(localStorage.getItem("reminders")) || [];

function saveReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders));
}

function renderReminders() {
    const list = document.getElementById("reminderList");
    if (!list) return;

    list.innerHTML = "";

    reminders.forEach((reminder, index) => {
        const item = document.createElement("li");
        item.innerHTML = `
            <span>${reminder}</span>
            <button onclick="deleteReminder(${index})">🗑</button>
        `;
        list.appendChild(item);
    });
}

function addReminder() {
    const inputEl = document.getElementById("reminderInput");
    if (!inputEl) return;
    const value = inputEl.value.trim();
    if (!value) return;

    reminders.push(value);
    inputEl.value = "";
    saveReminders();
    renderReminders();
}

function deleteReminder(index) {
    reminders.splice(index, 1);
    saveReminders();
    renderReminders();
}

// ===========================
// NOTES SECTION (RICH TEXT)
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

function searchNotes() {
    const search = document.getElementById("noteSearch").value.toLowerCase();
    const cards = document.querySelectorAll(".note-card");

    cards.forEach((card, index) => {
        const note = notes[index];
        if (!note) return;

        const visible =
            note.title.toLowerCase().includes(search) ||
            note.content.toLowerCase().includes(search);

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
// EXPOSE GLOBAL FUNCTIONS
// ===========================
window.showPage = showPage;
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
