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

// =========================================
// AUTHENTICATION & ACCOUNT SETTINGS
// =========================================

onAuthStateChanged(auth, (user) => {
    const emailEl = document.getElementById("userEmail");
    if (user) {
        if (emailEl) emailEl.textContent = user.email;
    } else {
        if (window.location.pathname.includes("dashboard.html")) {
            window.location.href = "index.html";
        }
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const resetPasswordBtn = document.getElementById("resetPasswordBtn");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "index.html";
        });
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener("click", async () => {
            const user = auth.currentUser;
            if (user && user.email) {
                try {
                    await sendPasswordResetEmail(auth, user.email);
                    alert("Password reset email sent!");
                } catch (err) {
                    alert("Error sending password reset email: " + err.message);
                }
            }
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", async () => {
            const currentPw = document.getElementById("currentPassword")?.value;
            const newPw = document.getElementById("newPassword")?.value;

            if (!currentPw || !newPw) {
                alert("Please fill in both password fields.");
                return;
            }

            const user = auth.currentUser;
            if (!user) return;

            const credential = EmailAuthProvider.credential(user.email, currentPw);
            try {
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPw);
                alert("Password updated successfully!");
                document.getElementById("currentPassword").value = "";
                document.getElementById("newPassword").value = "";
            } catch (err) {
                alert("Failed to update password: " + err.message);
            }
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to permanently delete your account?")) return;
            const user = auth.currentUser;
            if (user) {
                try {
                    await deleteUser(user);
                    alert("Account deleted.");
                    window.location.href = "index.html";
                } catch (err) {
                    alert("Failed to delete account: " + err.message);
                }
            }
        });
    }
});

// =========================================
// NAVIGATION (FIXED FOR ALL PAGES)
// =========================================

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
    } else if (pageId === "calendar") {
        renderCalendar();
    }
}

// =========================================
// TASKS & BOARD LOGIC
// =========================================

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const savedTheme = localStorage.getItem("theme") || "pastel";
document.body.setAttribute("data-theme", savedTheme);

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
    if (tasks[index].done) {
        completeToday();
    }
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
        hasCelebrated = false;
        return;
    }

    const completed = tasks.filter(t => t.done).length;
    const percent = Math.round((completed / tasks.length) * 100);

    fill.style.width = percent + "%";

    let message = "";
    if (percent === 100) {
        message = "🏆 All tasks completed!";
    } else if (percent >= 75) {
        message = "🌟 Almost there!";
    } else if (percent >= 50) {
        message = "✨ Great progress!";
    } else if (percent >= 25) {
        message = "🌸 Keep going!";
    } else {
        message = "☁️ You've got this!";
    }

    progressText.textContent = `${message} • ${completed}/${tasks.length} tasks • ${percent}%`;
}

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

// =========================================
// REMINDERS
// =========================================

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

// =========================================
// GREETING & QUOTES
// =========================================

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
// FOCUS TIMER
// =========================================

let timerInterval = null;
let timerSeconds = 25 * 60;
let isTimerRunning = false;

function updateTimerDisplay() {
    const display = document.getElementById("timerDisplay");
    if (!display) return;

    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;

    display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function toggleTimer() {
    const btn = document.getElementById("startTimerBtn");

    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (btn) btn.textContent = "▶ Start";
    } else {
        isTimerRunning = true;
        if (btn) btn.textContent = "⏸ Pause";

        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                if (btn) btn.textContent = "▶ Start";
                alert("🎉 Focus session complete!");
                timerSeconds = 25 * 60;
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSeconds = 25 * 60;
    const btn = document.getElementById("startTimerBtn");
    if (btn) btn.textContent = "▶ Start";
    updateTimerDisplay();
}

// =========================================
// STREAK TRACKER
// =========================================

let streakData = JSON.parse(localStorage.getItem("streakData")) || {
    count: 0,
    lastDate: null
};

function updateStreakDisplay() {
    const el = document.getElementById("streakCount");
    if (el) {
        el.textContent = `${streakData.count} 🔥`;
    }
}

function completeToday() {
    const today = new Date().toDateString();

    if (streakData.lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (streakData.lastDate === yesterday.toDateString()) {
        streakData.count++;
    } else {
        streakData.count = 1;
    }

    streakData.lastDate = today;
    localStorage.setItem("streakData", JSON.stringify(streakData));
    updateStreakDisplay();
}

// =========================================
// NOTES SECTION
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

// =========================================
// CALENDAR
// =========================================

let currentDate = new Date();
let selectedCalendarDate = null;
let calendarTasks = JSON.parse(localStorage.getItem("calendarTasks")) || {};

function renderCalendar() {
    const monthYear = document.getElementById("calendarMonthYear");
    const grid = document.getElementById("calendarDays");

    if (!monthYear || !grid) return;

    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    monthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        grid.appendChild(emptyCell);
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day";

        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            cell.classList.add("today");
        }

        if (selectedCalendarDate === dateKey) {
            cell.classList.add("selected");
        }

        cell.innerHTML = `<span class="day-number">${day}</span>`;

        if (calendarTasks[dateKey] && calendarTasks[dateKey].length > 0) {
            const dot = document.createElement("div");
            dot.className = "task-dot";
            cell.appendChild(dot);
        }

        cell.onclick = () => selectCalendarDate(dateKey);
        grid.appendChild(cell);
    }
}

function selectCalendarDate(dateKey) {
    selectedCalendarDate = dateKey;

    const display = document.getElementById("selectedDateDisplay");
    if (display) {
        display.textContent = `Tasks for ${dateKey}`;
    }

    renderCalendar();
    renderCalendarTasks();
}

function renderCalendarTasks() {
    const list = document.getElementById("calendarTaskList");
    if (!list) return;

    list.innerHTML = "";

    if (!selectedCalendarDate || !calendarTasks[selectedCalendarDate]) {
        list.innerHTML = `<p style="color: #888; font-size: 14px;">No tasks for this day.</p>`;
        return;
    }

    calendarTasks[selectedCalendarDate].forEach((taskText, index) => {
        const item = document.createElement("div");
        item.className = "calendar-task-item";
        item.innerHTML = `
            <span>${taskText}</span>
            <button onclick="deleteCalendarTask(${index})">❌</button>
        `;
        list.appendChild(item);
    });
}

function addCalendarTask() {
    const input = document.getElementById("calendarTaskInput");
    if (!input || !selectedCalendarDate) {
        alert("Please select a date on the calendar first!");
        return;
    }

    const value = input.value.trim();
    if (!value) return;

    if (!calendarTasks[selectedCalendarDate]) {
        calendarTasks[selectedCalendarDate] = [];
    }

    calendarTasks[selectedCalendarDate].push(value);
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

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

// =========================================
// EXPOSE GLOBALS FOR INLINE HTML ATTRIBUTES
// =========================================
window.showPage = showPage;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.addReminder = addReminder;
window.deleteReminder = deleteReminder;
window.toggleTheme = toggleTheme;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.addCalendarTask = addCalendarTask;
window.deleteCalendarTask = deleteCalendarTask;
window.createNote = createNote;
window.deleteCurrentNote = deleteCurrentNote;
window.togglePin = togglePin;
window.searchNotes = searchNotes;
window.autoSaveNote = autoSaveNote;
window.formatText = formatText;
window.formatFontFamily = formatFontFamily;
window.formatTextColor = formatTextColor;
window.formatHighlightColor = formatHighlightColor;
window.goToToday = goToToday;

// =========================================
// INITIALIZATION
// =========================================
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
