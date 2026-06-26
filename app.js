function addTask() {
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");

  const value = input.value.trim();
  if (!value) return;

  const item = document.createElement("li");
  item.textContent = value;

  list.appendChild(item);

  input.value = "";
}
