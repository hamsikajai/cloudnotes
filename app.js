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
        item.style.transform = "translateX(50px)";
        item.style.opacity = "0";
        setTimeout(() => {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }, 200);
    } else {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }
}

// ---------- SAVE TASKS ----------
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ---------- RENDER TASKS ----------
function renderTasks() {
    const list = document.getElementById("taskList");
    if (!list) return;

    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const div = document.createElement("div");
        div.id = `task-${index}`;
        div.className = `task-item ${task.done ? "done" : ""}`;

        div.innerHTML = `
            <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleTask(${index})">
            <span>${task.text}</span>
            <button onclick="deleteTask(${index})">✕</button>
        `;

        list.appendChild(div);
    });

    checkTasksCompletion();
}

// ---------- CHECK ALL TASKS COMPLETE ----------
function checkTasksCompletion() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;

    if (total > 0 && completed === total) {
        if (!hasCelebrated && !celebrating) {
            celebrationEffect();
            hasCelebrated = true;
        }
    } else {
        hasCelebrated = false;
    }
}

// ---------- REMINDERS LOGIC ----------
let reminders = JSON.parse(localStorage.getItem("reminders")) || [];

function addReminder() {
    const textEl = document.getElementById("reminderText");
    const timeEl = document.getElementById("reminderTime");

    if (!textEl || !timeEl) return;

    const text = textEl.value.trim();
    const time = timeEl.value;

    if (!text || !time) return;

    reminders.push({ text, time });
    saveReminders();
    renderReminders();

    textEl.value = "";
    timeEl.value = "";
}

function deleteReminder(index) {
    reminders.splice(index, 1);
    saveReminders();
    renderReminders();
}

function saveReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders));
}

function renderReminders() {
    const list = document.getElementById("reminderList");
    if (!list) return;

    list.innerHTML = "";

    reminders.forEach((r, i) => {
        const div = document.createElement("div");
        div.className = "task-item";
        div.innerHTML = `
            <span>⏰ ${r.text} (${r.time})</span>
            <button onclick="deleteReminder(${i})">✕</button>
        `;
        list.appendChild(div);
    });
}

// ---------- PAGE SWITCHING ----------
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

    const target = document.getElementById(pageId);
    if (target) target.classList.add("active");

    // Update active state on sidebar button
    const activeBtn = Array.from(document.querySelectorAll(".nav-btn")).find(b => 
        b.getAttribute("onclick") && b.getAttribute("onclick").includes(pageId)
    );
    if (activeBtn) activeBtn.classList.add("active");

    if (pageId === "calendar") {
        renderCalendar();
    }
    if (pageId === "notes" && typeof window.renderNotesList === "function") {
        window.renderNotesList();
    }
    if (pageId === "habits" && typeof window.renderHabits === "function") {
        window.renderHabits();
    }
    if (pageId === "goals" && typeof window.renderGoals === "function") {
        window.renderGoals();
    }
}

// ---------- THEME TOGGLE ----------
function toggleTheme(themeName) {
    document.body.setAttribute("data-theme", themeName);
    localStorage.setItem("theme", themeName);
}

// ---------- CELEBRATION EFFECT ----------
function celebrationEffect() {
    celebrating = true;
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.animationDuration = Math.random() * 2 + 1 + "s";
        confetti.style.backgroundColor = ["#ffb7b2", "#ffdac1", "#e2f0cb", "#b5ead7", "#c7ceea"][Math.floor(Math.random() * 5)];
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 3000);
    }
    setTimeout(() => { celebrating = false; }, 3000);
}

// ---------- DYNAMIC GREETING & QUOTE ----------
function updateGreeting() {
    const greetingEl = document.getElementById("greetingText");
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let message = "Welcome back! 🌸";

    if (hour < 12) message = "Good morning! ☀️";
    else if (hour < 18) message = "Good afternoon! 🌸";
    else message = "Good evening! 🌙";

    greetingEl.innerText = message;
}

function updateQuote() {
    const quoteEl = document.getElementById("dailyQuote");
    if (!quoteEl) return;

    const quotes = [
        "Believe you can and you're halfway there. ✨",
        "Small steps every day. 🌿",
        "Your focus determines your reality. 💫",
        "Make today amazing! 🌸",
        "Progress over perfection. 🌷"
    ];

    const today = new Date().getDate();
    quoteEl.innerText = quotes[today % quotes.length];
}

// ---------- STREAK SYSTEM ----------
function getStreakData() {
    const saved = localStorage.getItem("streakData");
    if (!saved) return { count: 0, lastDate: null };
    return JSON.parse(saved);
}

function saveStreakData(data) {
    localStorage.setItem("streakData", JSON.stringify(data));
}

function updateStreakDisplay() {
    const streakEl = document.getElementById("streakCount");
    if (!streakEl) return;

    const data = getStreakData();
    const today = new Date().toISOString().split("T")[0];

    if (data.lastDate) {
        const last = new Date(data.lastDate);
        const now = new Date(today);
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            data.count = 0;
            saveStreakData(data);
        }
    }

    streakEl.innerText = `${data.count} Day Streak 🔥`;
}

function completeToday() {
    const data = getStreakData();
    const today = new Date().toISOString().split("T")[0];

    if (data.lastDate === today) return;

    if (data.lastDate) {
        const last = new Date(data.lastDate);
        const now = new Date(today);
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            data.count += 1;
        } else {
            data.count = 1;
        }
    } else {
        data.count = 1;
    }

    data.lastDate = today;
    saveStreakData(data);
    updateStreakDisplay();
}

// ===========================
// CALENDAR LOGIC
// ===========================

let calendarDate = new Date();
let calendarTasks = JSON.parse(localStorage.getItem("calendarTasks")) || {};
let selectedCalendarDateKey = null;

function renderCalendar() {
    const monthEl = document.getElementById("calendarMonth");
    const gridEl = document.getElementById("calendarDays");
    if (!monthEl || !gridEl) return;

    gridEl.innerHTML = "";

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    monthEl.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        gridEl.appendChild(empty);
    }

    const todayStr = new Date().toISOString().split("T")[0];

    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";

        const formattedDay = String(day).padStart(2, "0");
        const formattedMonth = String(month + 1).padStart(2, "0");
        const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

        if (dateKey === todayStr) {
            dayDiv.classList.add("today");
        }

        if (selectedCalendarDateKey === dateKey) {
            dayDiv.classList.add("selected");
        }

        let taskBadge = "";
        if (calendarTasks[dateKey] && calendarTasks[dateKey].length > 0) {
            taskBadge = `<span class="day-badge">${calendarTasks[dateKey].length}</span>`;
        }

        dayDiv.innerHTML = `
            <span class="day-num">${day}</span>
            ${taskBadge}
        `;

        dayDiv.onclick = () => selectCalendarDate(dateKey);

        gridEl.appendChild(dayDiv);
    }
}

function selectCalendarDate(dateKey) {
    selectedCalendarDateKey = dateKey;
    renderCalendar();
    renderCalendarTasks();
}

function previousMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    calendarDate = new Date();
    selectedCalendarDateKey = calendarDate.toISOString().split("T")[0];
    renderCalendar();
    renderCalendarTasks();
}

function addCalendarTask() {
    const inputEl = document.getElementById("calendarTaskInput");
    if (!inputEl || !selectedCalendarDateKey) return;

    const val = inputEl.value.trim();
    if (!val) return;

    if (!calendarTasks[selectedCalendarDateKey]) {
        calendarTasks[selectedCalendarDateKey] = [];
    }

    calendarTasks[selectedCalendarDateKey].push(val);
    localStorage.setItem("calendarTasks", JSON.stringify(calendarTasks));

    inputEl.value = "";
    renderCalendar();
    renderCalendarTasks();
}

function deleteCalendarTask(index) {
    if (!selectedCalendarDateKey || !calendarTasks[selectedCalendarDateKey]) return;

    calendarTasks[selectedCalendarDateKey].splice(index, 1);
    if (calendarTasks[selectedCalendarDateKey].length === 0) {
        delete calendarTasks[selectedCalendarDateKey];
    }

    localStorage.setItem("calendarTasks", JSON.stringify(calendarTasks));
    renderCalendar();
    renderCalendarTasks();
}

function renderCalendarTasks() {
    const container = document.getElementById("selectedDateTasks");
    const title = document.getElementById("selectedDateTitle");

    if (!container || !title) return;

    if (!selectedCalendarDateKey) {
        title.innerText = "Select a date to view tasks";
        container.innerHTML = "";
        return;
    }

    title.innerText = `Tasks for ${selectedCalendarDateKey}`;
    container.innerHTML = "";

    const dayTasks = calendarTasks[selectedCalendarDateKey] || [];

    if (dayTasks.length === 0) {
        container.innerHTML = "<p style='color:#888; font-size:14px;'>No tasks for this date.</p>";
        return;
    }

    dayTasks.forEach((t, i) => {
        const div = document.createElement("div");
        div.className = "task-item";
        div.innerHTML = `
            <span>• ${t}</span>
            <button onclick="deleteCalendarTask(${i})">✕</button>
        `;
        container.appendChild(div);
    });
}

// ===========================
// FIREBASE AUTH & SETTINGS
// ===========================

onAuthStateChanged(auth, (user) => {
    const userEmailDisplay = document.getElementById("userEmailDisplay");
    if (userEmailDisplay) {
        if (user) {
            userEmailDisplay.innerText = user.email || "Signed In";
        } else {
            userEmailDisplay.innerText = "Not Signed In";
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const resetPasswordBtn = document.getElementById("resetPasswordBtn");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                window.location.href = "index.html";
            } catch (err) {
                alert("Error logging out: " + err.message);
            }
        });
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener("click", async () => {
            const user = auth.currentUser;
            if (!user || !user.email) {
                alert("No logged in user found.");
                return;
            }
            try {
                await sendPasswordResetEmail(auth, user.email);
                alert(`Password reset email sent to ${user.email}!`);
            } catch (err) {
                alert("Error sending reset email: " + err.message);
            }
        });
    }

    if (changePasswordBtn) {
        changePasswordBtn.addEventListener("click", async () => {
            const user = auth.currentUser;
            if (!user) {
                alert("No user signed in.");
                return;
            }

            const currentPassword = document.getElementById("currentPassword")?.value;
            const newPassword = document.getElementById("newPassword")?.value;

            if (!currentPassword || !newPassword) {
                alert("Please fill in both current and new password fields.");
                return;
            }

            try {
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);

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
            const user = auth.currentUser;
            if (!user) {
                alert("No user signed in.");
                return;
            }

            const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
            if (!confirmDelete) return;

            try {
                await deleteUser(user);
                alert("Account deleted successfully.");
                window.location.href = "index.html";
            } catch (err) {
                alert("Please re-authenticate and try again: " + err.message);
            }
        });
    }
});

// EXPOSE GLOBAL FUNCTIONS FOR INLINE HTML ATTRIBUTES
window.showPage = showPage;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.addReminder = addReminder;
window.deleteReminder = deleteReminder;
window.toggleTheme = toggleTheme;
window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.addCalendarTask = addCalendarTask;
window.deleteCalendarTask = deleteCalendarTask;
window.goToToday = goToToday;

// ---------- INITIALIZATION ----------
window.addEventListener("DOMContentLoaded", () => {
    showPage("dashboard");

    renderTasks();
    renderReminders();
    updateGreeting();
    updateQuote();
    updateStreakDisplay();
    renderCalendar();
});
