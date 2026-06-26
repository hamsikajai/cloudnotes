function addTask() {
  const input = document.getElementById("taskInput");
  const list = document.getElementById("taskList");

  const value = input.value.trim();
  if (!value) return;

  // Create list item
  const item = document.createElement("li");

  // Create text
  const text = document.createElement("span");
  text.textContent = value;

  // Create delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.className = "delete-btn";

  // Delete when clicked
  deleteBtn.onclick = function() {
    item.remove();
  };

  // Put them together
  item.appendChild(text);
  item.appendChild(deleteBtn);

  // Add to list
  list.appendChild(item);

  // Clear input
  input.value = "";
}
