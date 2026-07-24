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
