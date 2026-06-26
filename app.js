let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

const input = document.getElementById("taskInput");
const list = document.getElementById("taskList");

renderTasks();

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

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function deleteTask(index) {
  const item = document.getElementById(`task-${index}`);
  item.classList.add("fade-out");

  setTimeout(() => {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }, 200);
}

function renderTasks() {
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.id = `task-${index}`;

    if (task.done) {
      li.classList.add("done");
    }

    // click to toggle complete
    li.onclick = function (e) {
      // prevent clicking delete button triggering toggle
      if (e.target.classList.contains("delete-btn")) return;
      toggleTask(index);
    };

    const text = document.createElement("span");
    text.textContent = task.text;

    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.className = "delete-btn";

    btn.onclick = function (e) {
      e.stopPropagation();
      deleteTask(index);
    };

    li.appendChild(text);
    li.appendChild(btn);

    list.appendChild(li);
  });
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
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

// load saved theme
const savedTheme = localStorage.getItem("theme") || "pastel";
document.body.setAttribute("data-theme", savedTheme);
