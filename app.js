const dateEl = document.getElementById("date");
const greetingEl = document.getElementById("greeting");

// Date
const now = new Date();
dateEl.textContent = now.toDateString();

// Greeting
const hour = now.getHours();

if (hour < 12) {
  greetingEl.textContent = "Good Morning ☁️";
} else if (hour < 18) {
  greetingEl.textContent = "Good Afternoon 🌤️";
} else {
  greetingEl.textContent = "Good Evening 🌙";
}

/* ---------------- TASK SYSTEM ---------------- */

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");

    li.textContent = task.text;

    if (task.done) {
      li.classList.add("done");
    }

    li.onclick = () => toggleTask(index);

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteTask(index);
    };

    li.appendChild(delBtn);
    taskList.appendChild(li);
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({ text, done: false });
  taskInput.value = "";

  renderTasks();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

// initial load
renderTasks();
