// ---------- TASK STORAGE ----------

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");

// ---------- INITIAL LOAD ----------

const savedTheme = localStorage.getItem("theme") || "pastel";
document.body.setAttribute("data-theme", savedTheme);

renderTasks();

// ---------- ADD TASK ----------

function addTask() {
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

// ---------- COMPLETE TASK ----------

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;

    saveTasks();
    renderTasks();
}

// ---------- DELETE TASK ----------

function deleteTask(index) {
    const item = document.getElementById(`task-${index}`);

    item.classList.add("fade-out");

    setTimeout(() => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }, 200);
}

// ---------- RENDER TASKS ----------

function renderTasks() {

    list.innerHTML = "";

    tasks.forEach((task, index) => {

        const li = document.createElement("li");
        li.id = `task-${index}`;

        if (task.done) {
            li.classList.add("done");
        }

        // click task to complete
        li.onclick = function(e) {
            if (e.target.classList.contains("delete-btn")) return;

            toggleTask(index);
        };

        const text = document.createElement("span");
        text.textContent = task.text;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "❌";
        deleteBtn.className = "delete-btn";

        deleteBtn.onclick = function(e) {
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
    localStorage.setItem(
        "tasks",
        JSON.stringify(tasks)
    );
}

// ---------- PROGRESS BAR ----------

function updateProgress() {

    const fill = document.querySelector(".fill");
    const progressText =
        document.getElementById("progressText");

    if (!fill || !progressText) return;

    if (tasks.length === 0) {
        fill.style.width = "0%";
        progressText.textContent =
            "🌸 No tasks yet";
        return;
    }

    const completed =
        tasks.filter(task => task.done).length;

    const percent =
        Math.round(
            (completed / tasks.length) * 100
        );

    fill.style.width = percent + "%";

    progressText.textContent =
        `✨ ${completed}/${tasks.length} tasks completed`;
}

// ---------- THEME SWITCHER ----------

function toggleTheme() {

    const current =
        document.body.getAttribute("data-theme");

    if (current === "dark") {

        document.body.setAttribute(
            "data-theme",
            "pastel"
        );

        localStorage.setItem(
            "theme",
            "pastel"
        );

    } else if (current === "pastel") {

        document.body.setAttribute(
            "data-theme",
            "lavender"
        );

        localStorage.setItem(
            "theme",
            "lavender"
        );

    } else {

        document.body.setAttribute(
            "data-theme",
            "dark"
        );

        localStorage.setItem(
            "theme",
            "dark"
        );
    }
}
