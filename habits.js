/* =====================================================
   Cloud Notes - habits.js
   Part 1/3
   ===================================================== */

let habits = JSON.parse(localStorage.getItem("cloudHabits")) || [];

const todayKey = new Date().toISOString().split("T")[0];

const habitsContainer = document.getElementById("habitsContainer");
const modal = document.getElementById("habitModal");

const addBtn = document.getElementById("addHabitBtn");
const saveBtn = document.getElementById("saveHabit");
const cancelBtn = document.getElementById("cancelHabit");

const nameInput = document.getElementById("habitName");
const emojiInput = document.getElementById("habitEmoji");
const typeInput = document.getElementById("habitType");
const goalInput = document.getElementById("habitGoal");

let editingHabit = null;

/* ---------------------------- */

function saveHabits(){

    localStorage.setItem(
        "cloudHabits",
        JSON.stringify(habits)
    );

}

/* ---------------------------- */

function createHabitObject(){

    return{

        id:Date.now(),

        name:nameInput.value.trim(),

        emoji:emojiInput.value.trim() || "🌸",

        type:typeInput.value,

        goal:Number(goalInput.value)||1,

        value:0,

        completed:false,

        streak:0,

        bestStreak:0,

        lastCompleted:"",

        created:Date.now()

    };

}

/* ---------------------------- */

function openHabitModal(){

    editingHabit=null;

    nameInput.value="";
    emojiInput.value="";
    goalInput.value=1;
    typeInput.value="check";

    modal.classList.add("show");

}

/* ---------------------------- */

function closeHabitModal(){

    modal.classList.remove("show");

}

/* ---------------------------- */

addBtn.onclick=openHabitModal;

cancelBtn.onclick=closeHabitModal;

/* ---------------------------- */

saveBtn.onclick=function(){

    if(nameInput.value.trim()===""){

        alert("Give your habit a name 🌸");

        return;

    }

    if(editingHabit===null){

        habits.push(
            createHabitObject()
        );

    }else{

        habits[editingHabit].name=nameInput.value.trim();

        habits[editingHabit].emoji=emojiInput.value.trim();

        habits[editingHabit].goal=
        Number(goalInput.value);

        habits[editingHabit].type=
        typeInput.value;

    }

    saveHabits();

    closeHabitModal();

    renderHabits();

};

/* ================================================= */

function renderHabits(){

    if(!habitsContainer)return;

    habitsContainer.innerHTML="";

    resetIfNeeded();

    habits.forEach((habit,index)=>{

        const card=document.createElement("div");

        card.className="habit-card";

        card.innerHTML=`

        <div class="habit-header">

            <div>

                <div class="habit-title">

                ${habit.emoji}
                ${habit.name}

                </div>

                <small>

                Best 🔥 ${habit.bestStreak}

                </small>

            </div>

            <div class="habit-streak">

                🔥 ${habit.streak}

            </div>

        </div>

        <div id="habitContent${habit.id}">

        </div>

        <div class="habit-controls">

            <button
                class="habit-btn complete-btn"
                onclick="completeHabit(${index})">

                Complete

            </button>

            <button
                class="habit-btn"
                onclick="editHabit(${index})">

                ✏ Edit

            </button>

            <button
                class="habit-btn delete-btn"
                onclick="deleteHabit(${index})">

                🗑 Delete

            </button>

        </div>

        `;

        habitsContainer.appendChild(card);

        renderHabitType(habit);

    });

    updateOverallProgress();

}
/* =====================================================
   Part 2/3
   ===================================================== */

function renderHabitType(habit){

    const container =
    document.getElementById(`habitContent${habit.id}`);

    if(!container) return;

    container.innerHTML = "";

    /* ---------- CHECKBOX ---------- */

    if(habit.type==="check"){

        container.innerHTML=`

        <div class="habit-progress">

            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="width:${habit.completed?100:0}%">

                </div>

            </div>

        </div>

        `;

    }

    /* ---------- COUNTER ---------- */

    else if(habit.type==="counter"){

        const percent=
        Math.min(
            habit.value/habit.goal*100,
            100
        );

        container.innerHTML=`

        <div class="counter">

            <button
            onclick="changeCounter(${habit.id},-1)">
            −
            </button>

            <strong>

            ${habit.value} / ${habit.goal}

            </strong>

            <button
            onclick="changeCounter(${habit.id},1)">
            +
            </button>

        </div>

        <div class="habit-progress">

            <div class="progress-bar">

                <div
                class="progress-fill"
                style="width:${percent}%">

                </div>

            </div>

        </div>

        `;

    }

    /* ---------- TIMER ---------- */

    else if(habit.type==="timer"){

        const percent=
        Math.min(
            habit.value/habit.goal*100,
            100
        );

        container.innerHTML=`

        <strong>

        ${habit.value} / ${habit.goal} min

        </strong>

        <div class="counter">

            <button
            onclick="changeCounter(${habit.id},-5)">
            -5
            </button>

            <button
            onclick="changeCounter(${habit.id},5)">
            +5
            </button>

        </div>

        <div class="habit-progress">

            <div class="progress-bar">

                <div
                class="progress-fill"
                style="width:${percent}%">

                </div>

            </div>

        </div>

        `;

    }

    /* ---------- NUMBER ---------- */

    else{

        const percent=
        Math.min(
            habit.value/habit.goal*100,
            100
        );

        container.innerHTML=`

        <strong>

        ${habit.value} / ${habit.goal}

        </strong>

        <div class="counter">

            <button
            onclick="changeCounter(${habit.id},-1)">
            −
            </button>

            <button
            onclick="changeCounter(${habit.id},1)">
            +
            </button>

        </div>

        <div class="habit-progress">

            <div class="progress-bar">

                <div
                class="progress-fill"
                style="width:${percent}%">

                </div>

            </div>

        </div>

        `;

    }

}

/* ========================================== */

function completeHabit(index){

    const habit=habits[index];

    if(habit.type==="check"){

        habit.completed=!habit.completed;

    }

    if(habit.completed){

        if(habit.lastCompleted!==todayKey){

            habit.streak++;

            habit.bestStreak=
            Math.max(
                habit.bestStreak,
                habit.streak
            );

            habit.lastCompleted=todayKey;

        }

    }

    saveHabits();

    renderHabits();

}

/* ========================================== */

function changeCounter(id,amount){

    const habit=
    habits.find(h=>h.id===id);

    if(!habit)return;

    habit.value+=amount;

    if(habit.value<0)
        habit.value=0;

    if(habit.value>=habit.goal){

        habit.value=habit.goal;

        if(habit.lastCompleted!==todayKey){

            habit.completed=true;

            habit.lastCompleted=todayKey;

            habit.streak++;

            habit.bestStreak=
            Math.max(
                habit.bestStreak,
                habit.streak
            );

        }

    }else{

        habit.completed=false;

    }

    saveHabits();

    renderHabits();

}

/* ========================================== */

function editHabit(index){

    editingHabit=index;

    const habit=habits[index];

    nameInput.value=habit.name;

    emojiInput.value=habit.emoji;

    goalInput.value=habit.goal;

    typeInput.value=habit.type;

    openHabitModal();

}

/* ========================================== */

function deleteHabit(index){

    if(!confirm("Delete this habit?"))
        return;

    habits.splice(index,1);

    saveHabits();

    renderHabits();

}
/* =====================================================
   Part 3/3
   ===================================================== */

/* ---------- Overall Progress ---------- */

function updateOverallProgress(){

    const fill =
    document.getElementById("overallProgressFill");

    const text =
    document.getElementById("overallProgressText");

    const streak =
    document.getElementById("overallStreak");

    if(!fill || !text || !streak) return;

    const total = habits.length;

    let completed = 0;

    habits.forEach(h=>{

        if(h.completed)
            completed++;

    });

    const percent =
    total===0
    ? 0
    : Math.round((completed/total)*100);

    fill.style.width = percent + "%";

    text.textContent =
    `${completed} / ${total} Habits`;

    streak.textContent =
    `${calculateOverallStreak()} Day Streak`;

}

/* ---------- Overall Streak ---------- */

function calculateOverallStreak(){

    if(habits.length===0)
        return 0;

    return Math.min(
        ...habits.map(h=>h.streak)
    );

}

/* ---------- Daily Reset ---------- */

function resetIfNeeded(){

    const lastReset =
    localStorage.getItem("habitResetDate");

    if(lastReset===todayKey)
        return;

    habits.forEach(h=>{

        h.completed=false;

        if(h.type!=="check")
            h.value=0;

    });

    localStorage.setItem(
        "habitResetDate",
        todayKey
    );

    saveHabits();

}

/* ---------- Celebration ---------- */

function celebrate(){

    const total = habits.length;

    const done =
    habits.filter(h=>h.completed).length;

    if(total===0) return;

    if(done===total){

        alert("🎉 Amazing!\nYou completed every habit today!");

    }

}

/* ---------- Auto Celebration ---------- */

const oldUpdateOverallProgress =
updateOverallProgress;

updateOverallProgress=function(){

    oldUpdateOverallProgress();

    celebrate();

}

/* ---------- Make Buttons Work ---------- */

window.completeHabit =
completeHabit;

window.changeCounter =
changeCounter;

window.editHabit =
editHabit;

window.deleteHabit =
deleteHabit;

/* ---------- Initialize ---------- */

document.addEventListener("DOMContentLoaded",()=>{

    renderHabits();

});
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("addHabitBtn");

    if (btn) {
        btn.addEventListener("click", openHabitModal);
    }
});
