// Minimal navigation bootstrap.
// Keep this free of module imports so page switching still works if an optional
// feature script fails to load.
(function () {
    function getTheme() {
        return localStorage.getItem("theme") || "pastel";
    }

    function setTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }

    window.toggleTheme = function toggleTheme() {
        const current = document.body.getAttribute("data-theme") || getTheme();

        if (current === "dark") {
            setTheme("pastel");
        } else if (current === "pastel") {
            setTheme("lavender");
        } else {
            setTheme("dark");
        }
    };

    window.showPage = function showPage(pageId) {
        const pages = document.querySelectorAll(".page");
        const buttons = document.querySelectorAll(".nav-btn");

        pages.forEach(page => {
            page.style.display = "none";
            page.classList.remove("active");
        });

        buttons.forEach(btn => {
            btn.classList.remove("active");
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.style.display = "block";
            targetPage.classList.add("active");
        }

        const activeBtn = document.querySelector(`.nav-btn[onclick*="${pageId}"]`);
        if (activeBtn) {
            activeBtn.classList.add("active");
        }

        if (pageId === "calendar") {
            window.renderCalendar?.();
            window.renderCalendarTasks?.();
        } else if (pageId === "dashboard") {
            window.renderTasks?.();
            window.renderReminders?.();
        } else if (pageId === "notes") {
            window.renderNotes?.();
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        setTheme(getTheme());
        window.showPage("dashboard");
    });
}());
