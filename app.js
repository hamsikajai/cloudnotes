function addTask() {
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");

  const value = input.value.trim();
  if (!value) return;

  const item = document.createElement("li");

  const text = document.createElement("span");
  text.textContent = value;

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";

  deleteBtn.onclick = function () {
    item.remove();
  };

  item.appendChild(text);
  item.appendChild(deleteBtn);

  list.appendChild(item);
  input.value = "";
}
