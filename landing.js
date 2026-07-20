// Open login popup
function openLogin() {
    document.getElementById("overlay").style.display = "flex";
}

// Close login popup
function closeLogin() {
    document.getElementById("overlay").style.display = "none";
}

// Close popup when clicking outside the login box
document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") {
        closeLogin();
    }
});
