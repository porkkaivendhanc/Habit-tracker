let habits = JSON.parse(localStorage.getItem("habits")) || [];

const habitList = document.getElementById("habitList");
const totalHabits = document.getElementById("totalHabits");
const activeStreaks = document.getElementById("activeStreaks");
const longestStreak = document.getElementById("longestStreak");

const popupBg = document.getElementById("popupBg");
const addHabitBtn = document.getElementById("addHabitBtn");
const cancelPopup = document.getElementById("cancelPopup");
const saveHabit = document.getElementById("saveHabit");
const habitInput = document.getElementById("habitInput");

// OPEN POPUP
addHabitBtn.onclick = () => {
    popupBg.style.display = "flex";
};

// CLOSE POPUP
cancelPopup.onclick = () => {
    popupBg.style.display = "none";
};

// SAVE HABIT
saveHabit.onclick = () => {
    const name = habitInput.value.trim();
    if (name === "") return;

    habits.push({
        name,
        streak: 0,
        lastDate: null,
        completions: 0
    });

    habitInput.value = "";
    popupBg.style.display = "none";
    saveData();
    render();
};

// COMPLETE HABIT
function completeHabit(i) {
    const today = new Date().toDateString();
    let h = habits[i];

    if (h.lastDate !== today) {
        h.streak += 1;
        h.lastDate = today;
        h.completions += 1;
    }

    saveData();
    render();
}

// SAVE
function saveData() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

// RENDER UI
function render() {
    habitList.innerHTML = "";
    habits.forEach((h, i) => {
        habitList.innerHTML += `
            <div class="habit-item">
                <div>
                    <strong>${h.name}</strong><br>
                    Streak: ${h.streak} days
                </div>
                <button class="complete-btn" onclick="completeHabit(${i})">Done</button>
            </div>
        `;
    });

    totalHabits.textContent = habits.length;
    activeStreaks.textContent = habits.filter(h => h.streak > 0).length;
    longestStreak.textContent = habits.length
        ? Math.max(...habits.map(h => h.streak)) + " days"
        : "0 days";
}

render();

// SCROLL TO TRACKER
function scrollToTracker() {
    document.getElementById("tracker").scrollIntoView({ behavior: "smooth" });
}
