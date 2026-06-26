function addTask() {
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");

  const value = input.value.trim();
  if (!value) return;

  const item = document.createElement("li");

  item.innerHTML = `
    <span>${value}</span>
    <button class="delete-btn">❌</button>
  `;

  item.querySelector(".delete-btn").onclick = function() {
    item.remove();
  };

  list.appendChild(item);
  input.value = "";
}
