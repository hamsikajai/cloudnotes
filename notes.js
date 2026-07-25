/* =====================================================
   Cloud Notes - notes.js
   ===================================================== */

let notes = JSON.parse(localStorage.getItem("cloudNotes")) || [
    {
        id: Date.now(),
        title: "Welcome to Notes 🌸",
        content: "Start typing here! You can format your text, pin important notes, and search through them.",
        pinned: false,
        updatedAt: new Date().toISOString()
    }
];

let activeNoteId = notes.length > 0 ? notes[0].id : null;

function saveNotes() {
    localStorage.setItem("cloudNotes", JSON.stringify(notes));
}

function renderNotesList(filterText = "") {
    const listEl = document.getElementById("notesList");
    if (!listEl) return;

    listEl.innerHTML = "";

    const query = filterText.toLowerCase();
    const filtered = notes.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.content.toLowerCase().includes(query)
    );

    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt));

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#999; margin-top:20px; font-size:13px;">No Notes Found</div>`;
        return;
    }

    filtered.forEach(note => {
        const item = document.createElement("div");
        item.className = `note-item ${note.id === activeNoteId ? "active" : ""}`;
        item.onclick = () => selectNote(note.id);

        const dateStr = formatDate(note.updatedAt);
        const snippet = getSnippet(note.content);

        item.innerHTML = `
            <div class="note-item-header">
                <span class="note-item-title">${note.title || "Untitled Note"}</span>
                ${note.pinned ? '📌' : ''}
            </div>
            <div class="note-item-meta">
                <span class="note-item-date">${dateStr}</span>
                <span class="note-item-snippet">${snippet}</span>
            </div>
        `;

        listEl.appendChild(item);
    });
}

function selectNote(id) {
    activeNoteId = id;
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = document.getElementById("notesBox");
    const pinBtn = document.getElementById("pinBtn");

    if (titleEl) titleEl.value = note.title;
    if (boxEl) boxEl.innerHTML = note.content;
    if (pinBtn) pinBtn.innerText = note.pinned ? "📌 Pinned" : "📌 Pin";

    updateCharCount();
    updateLastEditedTime(note.updatedAt);
    renderNotesList(document.getElementById("noteSearch")?.value || "");
}

function createNote() {
    const newNote = {
        id: Date.now(),
        title: "",
        content: "",
        pinned: false,
        updatedAt: new Date().toISOString()
    };

    notes.unshift(newNote);
    saveNotes();
    selectNote(newNote.id);
    
    const titleEl = document.getElementById("noteTitle");
    if (titleEl) titleEl.focus();
}

function autoSaveNote() {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    const titleEl = document.getElementById("noteTitle");
    const boxEl = document.getElementById("notesBox");
    const statusEl = document.getElementById("saveStatus");

    note.title = titleEl ? titleEl.value.trim() : "";
    note.content = boxEl ? boxEl.innerHTML : "";
    note.updatedAt = new Date().toISOString();

    saveNotes();
    updateCharCount();
    updateLastEditedTime(note.updatedAt);

    if (statusEl) {
        statusEl.innerText = "Saved";
    }

    renderNotesList(document.getElementById("noteSearch")?.value || "");
}

function deleteCurrentNote() {
    if (!activeNoteId) return;
    if (!confirm("Are you sure you want to delete this note?")) return;

    notes = notes.filter(n => n.id !== activeNoteId);
    saveNotes();

    if (notes.length > 0) {
        selectNote(notes[0].id);
    } else {
        activeNoteId = null;
        document.getElementById("noteTitle").value = "";
        document.getElementById("notesBox").innerHTML = "";
        renderNotesList();
    }
}

function togglePin() {
    if (!activeNoteId) return;

    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    note.pinned = !note.pinned;
    saveNotes();

    const pinBtn = document.getElementById("pinBtn");
    if (pinBtn) pinBtn.innerText = note.pinned ? "📌 Pinned" : "📌 Pin";

    renderNotesList(document.getElementById("noteSearch")?.value || "");
}

function searchNotes() {
    const searchVal = document.getElementById("noteSearch")?.value || "";
    renderNotesList(searchVal);
}

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    autoSaveNote();
}

function formatFontFamily(font) {
    document.execCommand("fontName", false, font);
    autoSaveNote();
}

function formatTextColor(color) {
    document.execCommand("foreColor", false, color);
    autoSaveNote();
}

function formatHighlightColor(color) {
    document.execCommand("hiliteColor", false, color);
    autoSaveNote();
}

function updateCharCount() {
    const boxEl = document.getElementById("notesBox");
    const countEl = document.getElementById("charCount");
    if (!boxEl || !countEl) return;

    const text = boxEl.innerText || "";
    countEl.innerText = `${text.length} characters`;
}

function updateLastEditedTime(dateIsoStr) {
    const lastEditedEl = document.getElementById("lastEdited");
    if (!lastEditedEl) return;
    lastEditedEl.innerText = `Edited: ${formatDate(dateIsoStr)}`;
}

function formatDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    const now = new Date();

    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getSnippet(htmlContent) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = htmlContent;
    const text = tmp.textContent || tmp.innerText || "";
    return text.trim().substring(0, 30) || "No additional text";
}

// Expose globals
window.createNote = createNote;
window.deleteCurrentNote = deleteCurrentNote;
window.togglePin = togglePin;
window.searchNotes = searchNotes;
window.autoSaveNote = autoSaveNote;
window.formatText = formatText;
window.formatFontFamily = formatFontFamily;
window.formatTextColor = formatTextColor;
window.formatHighlightColor = formatHighlightColor;

document.addEventListener("DOMContentLoaded", () => {
    renderNotesList();
    if (activeNoteId) {
        selectNote(activeNoteId);
    }
});
