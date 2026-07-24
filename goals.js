// ===============================
// CLOUD NOTES GOALS
// ===============================

let goals = JSON.parse(localStorage.getItem("goals")) || [];

let editingGoal = null;

let currentFilter = "all";

function openGoalModal() {

    document.getElementById("goalModal").style.display = "flex";

}

function closeGoalModal() {

    document.getElementById("goalModal").style.display = "none";

    document.getElementById("goalTitle").value = "";

    document.getElementById("goalCategory").selectedIndex = 0;

    document.getElementById("goalPriority").selectedIndex = 1;

    document.getElementById("goalDate").value = "";

    document.getElementById("goalMilestones").value = "";

    document.getElementById("goalNotes").value = "";

    editingGoal = null;

}

function saveGoal() {

    const title =
        document.getElementById("goalTitle").value.trim();

    if (!title) return;

    const category =
        document.getElementById("goalCategory").value;

    const priority =
        document.getElementById("goalPriority").value;

    const dueDate =
        document.getElementById("goalDate").value;

    const notes =
        document.getElementById("goalNotes").value;

    const milestoneText =
        document.getElementById("goalMilestones").value;

    const milestones =
        milestoneText
        .split("\n")
        .filter(m => m.trim() !== "")
        .map(m => ({
            text: m,
            complete: false
        }));

    const goal = {

        title,

        category,

        priority,

        dueDate,

        notes,

        milestones,

        completed:false

    };

    if(editingGoal===null){

        goals.push(goal);

    }else{

        goals[editingGoal]=goal;

    }

    localStorage.setItem(
        "goals",
        JSON.stringify(goals)
    );

    closeGoalModal();

    renderGoals();

}
// ===============================
// RENDER GOALS
// ===============================

function renderGoals() {

    const container =
        document.getElementById("goalContainer");

    if (!container) return;

    container.innerHTML = "";

    let total = goals.length;
    let active = 0;
    let completed = 0;
    let overdue = 0;

    goals.forEach((goal,index)=>{

        let finished =
            goal.milestones.filter(m=>m.complete).length;

        let percent =
            goal.milestones.length===0
            ? 0
            : Math.round(
                finished /
                goal.milestones.length
                *100
            );

        if(percent===100){

            goal.completed=true;

            completed++;

        }else{

            goal.completed=false;

            active++;

        }

        let countdown="";

        if(goal.dueDate){

            const today=new Date();

            const due=new Date(goal.dueDate);

            const diff=Math.ceil(
                (due-today)/(1000*60*60*24)
            );

            if(diff<0){

                overdue++;

                countdown=`Overdue by ${Math.abs(diff)} days`;

            }else{

                countdown=`${diff} days left`;

            }

        }

        if(currentFilter==="completed" && !goal.completed)
            return;

        if(currentFilter==="active" && goal.completed)
            return;

        if(currentFilter==="high" &&
           goal.priority!=="High")
            return;

        container.innerHTML+=`

<div class="goal-card">

<h2>${goal.title}</h2>

<div class="goal-tags">

<span class="goal-category">
${goal.category}
</span>

<span class="goal-priority ${goal.priority.toLowerCase()}">
${goal.priority}
</span>

</div>

<p>${countdown}</p>

<div class="goal-progress">

<div
class="goal-progress-fill"
style="width:${percent}%;">
</div>

</div>

<p>${percent}% Complete</p>

<div class="goal-milestones">

${goal.milestones.map((m,i)=>`

<label>

<input
type="checkbox"

${m.complete?"checked":""}

onclick="
toggleMilestone(${index},${i})
">

${m.text}

</label>

`).join("")}

</div>

<div class="goal-buttons">

<button onclick="editGoal(${index})">
✏️ Edit
</button>

<button onclick="deleteGoal(${index})">
🗑 Delete
</button>

</div>

</div>

`;

    });

    document.getElementById("goalTotal").textContent=total;
    document.getElementById("goalActive").textContent=active;
    document.getElementById("goalCompleted").textContent=completed;
    document.getElementById("goalOverdue").textContent=overdue;

    localStorage.setItem(
        "goals",
        JSON.stringify(goals)
    );

}
// ===============================
// GOAL ACTIONS
// ===============================

function toggleMilestone(goalIndex, milestoneIndex) {

    goals[goalIndex].milestones[milestoneIndex].complete =
        !goals[goalIndex].milestones[milestoneIndex].complete;

    localStorage.setItem(
        "goals",
        JSON.stringify(goals)
    );

    renderGoals();

}

function deleteGoal(index) {

    if (!confirm("Delete this goal?")) return;

    goals.splice(index, 1);

    localStorage.setItem(
        "goals",
        JSON.stringify(goals)
    );

    renderGoals();

}

function editGoal(index) {

    const goal = goals[index];

    editingGoal = index;

    document.getElementById("goalTitle").value =
        goal.title;

    document.getElementById("goalCategory").value =
        goal.category;

    document.getElementById("goalPriority").value =
        goal.priority;

    document.getElementById("goalDate").value =
        goal.dueDate;

    document.getElementById("goalNotes").value =
        goal.notes;

    document.getElementById("goalMilestones").value =
        goal.milestones
            .map(m => m.text)
            .join("\n");

    document.getElementById("goalModal").style.display =
        "flex";

}

function filterGoals(filter) {

    currentFilter = filter;

    renderGoals();

}

renderGoals();

window.openGoalModal = openGoalModal;
window.closeGoalModal = closeGoalModal;
window.saveGoal = saveGoal;
window.toggleMilestone = toggleMilestone;
window.deleteGoal = deleteGoal;
window.editGoal = editGoal;
window.filterGoals = filterGoals;
