
window.openLogin = function () {
    document.getElementById("overlay").style.display = "flex";
};

window.closeLogin = function () {
    document.getElementById("overlay").style.display = "none";
};

document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") {
        closeLogin();
    }
});
