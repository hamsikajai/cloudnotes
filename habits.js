/* =====================================================
   Cloud Notes - habits.js
   ===================================================== */

let habits = JSON.parse(localStorage.getItem("cloudHabits")) || [];
const todayKey = new Date().toISOString().split("T")[0];

let editingHabit = null;

function saveHabitsToStorage() {
    localStorage.setItem("cloudHabits", JSON.stringify(habits));
}

function openHabitModal() {
    editingHabit = null;

    const modal = document.getElementById("habitModal");
    const nameInput = document.getElementById("habitName");
    const emojiInput = document.getElementById("habitEmoji");
    const typeInput = document.getElementById("habitType");
    const goalInput = document.getElementById("habitGoal");

    if (nameInput) nameInput.value = "";
    if (emojiInput) emojiInput.value = "";
    if (goalInput) goalInput.value = 1;
    if (typeInput) typeInput.value = "check";

    if (modal) {
        modal.style.display = "flex";
        modal.classList.add("show");
    }
}

function closeHabitModal() {
    const modal = document.getElementById("habitModal");
    if (modal) {
        modal.style.display = "none";
        modal.classList.remove("show");
    }
}

function submitHabit() {
    const nameInput = document.getElementById("habitName");
    const emojiInput = document.getElementById("habitEmoji");
    const typeInput = document.getElementById("habitType");
    const goalInput = document.getElementById("habitGoal");

    const name = nameInput ? nameInput.value.trim() : "";
    if (!name) {
        alert("Please enter a habit name!");
        return;
    }

    const emoji = (emojiInput && emojiInput.value.trim()) ? emojiInput.value.trim() : "🌸";
    const type = typeInput ? typeInput.value : "check";
    const goal = goalInput ? (Number(goalInput.value) || 1) : 1;

    if (editingHabit !== null) {
        // Edit existing habit
        habits[editingHabit].name = name;
        habits[editingHabit].emoji = emoji;
        habits[editingHabit].type = type;
        habits[editingHabit].goal = goal;
    } else {
        // Create new habit
        const newHabit = {
            id: Date.now(),
            name: name,
            emoji: emoji,
            type: type,
            goal: goal,
            value: 0,
            completed: false,
            streak: 0,
            bestStreak: 0,
            lastCompleted: "",
            created: Date.now()
        };
        habits.push(newHabit);
    }

    saveHabitsToStorage();
    renderHabits();
    closeHabitModal();
}

function renderHabits() {
    const container = document.getElementById("habitsContainer");
    if (!container) return;

    container.innerHTML = "";

    if (habits.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888; margin-top:20px;">No habits added yet! Click <strong>+ New Habit</strong> to create one. 🌸</p>`;
        updateOverallProgress();
        return;
    }

    habits.forEach((habit, index) => {
        const card = document.createElement("div");
        card.className = "habit-card" + (habit.completed ? " completed" : "");

        let actionHTML = "";
        if (habit.type === "check") {
            actionHTML = `<button onclick="completeHabit(${index})" class="habit-check-btn">${habit.completed ? '✅ Done' : '⭕ Mark Done'}</button>`;
        } else {
            actionHTML = `
                <div class="habit-counter">
                    <button onclick="changeCounter(${index}, -1)">-</button>
                    <span>${habit.value} / ${habit.goal}</span>
                    <button onclick="changeCounter(${index}, 1)">+</button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="habit-info">
                <span class="habit-emoji">${habit.emoji}</span>
                <div>
                    <h4>${habit.name}</h4>
                    <span class="habit-streak">🔥 ${habit.streak} day streak</span>
                </div>
            </div>
            <div class="habit-actions">
                ${actionHTML}
                <button onclick="editHabit(${index})" class="icon-btn">✏️</button>
                <button onclick="deleteHabit(${index})" class="icon-btn">🗑️</button>
            </div>
        `;

        container.appendChild(card);
    });

    updateOverallProgress();
}

function completeHabit(index) {
    if (!habits[index]) return;
    habits[index].completed = !habits[index].completed;
    if (habits[index].completed) {
        habits[index].streak += 1;
    } else {
        habits[index].streak = Math.max(0, habits[index].streak - 1);
    }
    saveHabitsToStorage();
    renderHabits();
}

function changeCounter(index, delta) {
    if (!habits[index]) return;
    habits[index].value = Math.max(0, habits[index].value + delta);
    if (habits[index].value >= habits[index].goal) {
        if (!habits[index].completed) {
            habits[index].completed = true;
            habits[index].streak += 1;
        }
    } else {
        if (habits[index].completed) {
            habits[index].completed = false;
            habits[index].streak = Math.max(0, habits[index].streak - 1);
        }
    }
    saveHabitsToStorage();
    renderHabits();
}

function editHabit(index) {
    const habit = habits[index];
    if (!habit) return;

    editingHabit = index;

    const modal = document.getElementById("habitModal");
    const nameInput = document.getElementById("habitName");
    const emojiInput = document.getElementById("habitEmoji");
    const typeInput = document.getElementById("habitType");
    const goalInput = document.getElementById("habitGoal");

    if (nameInput) nameInput.value = habit.name;
    if (emojiInput) emojiInput.value = habit.emoji;
    if (typeInput) typeInput.value = habit.type;
    if (goalInput) goalInput.value = habit.goal;

    if (modal) {
        modal.style.display = "flex";
        modal.classList.add("show");
    }
}

function deleteHabit(index) {
    if (!confirm("Are you sure you want to delete this habit?")) return;
    habits.splice(index, 1);
    saveHabitsToStorage();
    renderHabits();
}

function updateOverallProgress() {
    const fill = document.getElementById("overallProgressFill");
    const text = document.getElementById("overallProgressText");
    const streakEl = document.getElementById("overallStreak");

    const total = habits.length;
    const completed = habits.filter(h => h.completed).length;

    if (fill) fill.style.width = total > 0 ? `${(completed / total) * 100}%` : "0%";
    if (text) text.innerText = `${completed} / ${total} Habits`;
    if (streakEl) {
        const minStreak = total > 0 ? Math.min(...habits.map(h => h.streak)) : 0;
        streakEl.innerText = `${minStreak} Day Streak`;
    }
}

// Expose functions globally for onclick attributes
window.openHabitModal = openHabitModal;
window.closeHabitModal = closeHabitModal;
window.submitHabit = submitHabit;
window.completeHabit = completeHabit;
window.changeCounter = changeCounter;
window.editHabit = editHabit;
window.deleteHabit = deleteHabit;

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    renderHabits();

    const saveBtn = document.getElementById("saveHabit");
    const cancelBtn = document.getElementById("cancelHabit");

    if (saveBtn) saveBtn.addEventListener("click", submitHabit);
    if (cancelBtn) cancelBtn.addEventListener("click", closeHabitModal);
});
