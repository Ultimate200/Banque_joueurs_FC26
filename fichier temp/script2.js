let players = [];

let sortState = {
    key: null,
    order: 1 // 1 = asc, -1 = desc
};

document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTS
    document.body.classList.add("dark");
    const playersGrid = document.getElementById("playersGrid");
    const searchInput = document.getElementById("searchInput");
    const footFilter = document.getElementById("footFilter");
    const clubFilter = document.getElementById("clubFilter");
    const themeToggle = document.getElementById("themeToggle");
    const nationalityFilter = document.getElementById("nationalityFilter");
    const positionFilter = document.getElementById("positionFilter");

    // LOAD PLAYERS
    fetch("players.json")
    .then(res => res.json())
    .then(data => {
        players = data;
        populateFilters(players);
        render(players);
    })
    .catch(err => console.error("Erreur chargement JSON", err));

    // EVENTS
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (footFilter) footFilter.addEventListener("change", applyFilters);
    if (clubFilter) clubFilter.addEventListener("change", applyFilters);
    if (nationalityFilter) nationalityFilter.addEventListener("change", applyFilters);
    if (positionFilter) positionFilter.addEventListener("change", applyFilters);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            themeToggle.textContent =
                document.body.classList.contains("dark")
                    ? "☀️ Mode clair"
                    : "🌙 Mode sombre";
        });
    }

    // ------------------
    // FILTER + SORT
    // ------------------

    function applyFilters() {
        let filtered = [...players];

        // Recherche
        if (searchInput && searchInput.value.trim() !== "") {
            const q = searchInput.value.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q)
            );
        }

        // Pied fort
        if (footFilter && footFilter.value !== "all") {
            filtered = filtered.filter(p => p.foot === footFilter.value);
        }

        // Club
        if (clubFilter && clubFilter.value !== "all") {
            filtered = filtered.filter(p => p.club === clubFilter.value);
        }

        // Nationalité
        if (nationalityFilter && nationalityFilter.value !== "all") {
            filtered = filtered.filter(
            p => p.nationality === nationalityFilter.value
        );
    }

        // Poste
        if (positionFilter && positionFilter.value !== "all") {
            filtered = filtered.filter(
            p => p.position === positionFilter.value
        );
    }

        // Tri
if (sortState.key) {
    filtered.sort((a, b) => {
        let A = a[sortState.key];
        let B = b[sortState.key];

        if (sortState.key === "value") {
            A = parseValue(A);
            B = parseValue(B);
        } else {
            if (typeof A === "string") A = A.toLowerCase();
            if (typeof B === "string") B = B.toLowerCase();
        }

        if (A < B) return -1 * sortState.order;
        if (A > B) return 1 * sortState.order;
        return 0;
    });
}
        render(filtered);
    }

    // ------------------
    // SORT CLICK (HEADER)
    // ------------------

    window.sortPlayers = function (key) {
        if (sortState.key === key) {
            sortState.order *= -1;
        } else {
            sortState.key = key;
            sortState.order = 1;
        }

        resetArrows();

        const arrow = document.getElementById(`arrow-${key}`);
        if (arrow) {
            arrow.textContent = sortState.order === 1 ? "▲" : "▼";
        }

        applyFilters();
    };

    function resetArrows() {
        ["name", "club", "value", "foot", "age", "rating", "potential"].forEach(k => {
            const el = document.getElementById(`arrow-${k}`);
            if (el) el.textContent = "";
        });
    }

    // ------------------
    // RENDER
    // ------------------

    function render(list) {
        playersGrid.innerHTML = "";

        if (list.length === 0) {
            playersGrid.innerHTML =
                "<p style='padding:12px;'>Aucun joueur trouvé</p>";
            return;
        }

        list.forEach(p => {
            const row = document.createElement("div");
            row.className = "player-row";

            row.innerHTML = `
                <div class="player-cell player-identity">
    <img class="player-face" src="${p.image}" alt="${p.name}">
    <div class="player-name-block">
        <span class="player-name">${p.name}</span>
        <div class="player-sub">
            <span class="player-position ${getPositionClass(p.position)}">
                ${p.position}
            </span>
            <div class="flag-wrapper">
                <img class="player-flag" src="${p.flag}" alt="${p.nationality}">
                <span class="tooltiptext">${p.nationality}</span>
            </div>
        </div>
    </div>
</div>

                <div class="player-cell">${p.club}</div>

                <div class="player-cell">
                    <span class="badge badge-value">${p.value}</span>
                </div>

                <div class="player-cell">
                    <span class="badge badge-foot">${p.foot}</span>
                </div>
                <div class="player-cell right">
                    ${p.age}
                </div>
                <div class="player-cell right">
                    <div class="stat-bar ${getStatClass(p.rating)}">
                        ${p.rating}
                    </div>
                </div>

                <div class="player-cell right">
                    <div class="stat-bar ${getStatClass(p.potential)}">
                        ${p.potential}
                    </div>
                </div>
            `;

            playersGrid.appendChild(row);
        });
    }

    // ------------------
    // POPULATE FILTERS
    // ------------------

    function populateFilters(data) {
        const clubs = [...new Set(data.map(p => p.club))].sort();
        const nationalities = [...new Set(data.map(p => p.nationality))].sort();
        const positions = [...new Set(data.map(p => p.position))].sort();

        clubs.forEach(club => {
            const opt = document.createElement("option");
            opt.value = club;
            opt.textContent = club;
            clubFilter.appendChild(opt);
        });

        nationalities.forEach(nat => {
            const opt = document.createElement("option");
            opt.value = nat;
            opt.textContent = nat;
            nationalityFilter.appendChild(opt);
        });

        positions.forEach(pos => {
            const opt = document.createElement("option");
            opt.value = pos;
            opt.textContent = pos;
            positionFilter.appendChild(opt);
        });
    }

    // ------------------
    // STAT COLORS
    // ------------------

    function getStatClass(value) {
        if (value < 60) return "low";
        if (value < 70) return "mid-low";
        if (value < 80) return "mid";
        return "high";
    }

    function getPositionClass(position) {
    const attackers = ["BU", "AG", "AD"];
    const midfielders = ["MOC", "MC", "MDC", "MG", "MD"];
    const defenders = ["DG", "DC", "DD"];
    const goalkeepers = ["GB"];

    if (attackers.includes(position)) return "pos-att";
    if (midfielders.includes(position)) return "pos-mid";
    if (defenders.includes(position)) return "pos-def";
    if (goalkeepers.includes(position)) return "pos-gk";

    return "";
}
});

function parseValue(val) {
    if (!val) return 0;

    val = val.replace(",", ".").toUpperCase();

    if (val.includes("M")) {
        return parseFloat(val) * 1_000_000;
    }
    if (val.includes("K")) {
        return parseFloat(val) * 1_000;
    }
    return parseFloat(val);
}







let players = [];

let sortState = {
    key: null,
    order: 1 // 1 = asc, -1 = desc
};

document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTS
    document.body.classList.add("dark");
    const playersGrid = document.getElementById("playersGrid");
    const searchInput = document.getElementById("searchInput");
    const footFilter = document.getElementById("footFilter");
    const clubFilter = document.getElementById("clubFilter");
    const themeToggle = document.getElementById("themeToggle");
    const nationalityFilter = document.getElementById("nationalityFilter");
    const positionFilter = document.getElementById("positionFilter");

    // LOAD PLAYERS
    fetch("players.json")
    .then(res => res.json())
    .then(data => {
        players = data;
        populateFilters(players);
        render(players);
    })
    .catch(err => console.error("Erreur chargement JSON", err));

    // EVENTS
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (footFilter) footFilter.addEventListener("change", applyFilters);
    if (clubFilter) clubFilter.addEventListener("change", applyFilters);
    if (nationalityFilter) nationalityFilter.addEventListener("change", applyFilters);
    if (positionFilter) positionFilter.addEventListener("change", applyFilters);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            themeToggle.textContent =
                document.body.classList.contains("dark")
                    ? "☀️ Mode clair"
                    : "🌙 Mode sombre";
        });
    }

    // ------------------
    // FILTER + SORT
    // ------------------

    function applyFilters() {
        let filtered = [...players];

        // Recherche
        if (searchInput && searchInput.value.trim() !== "") {
            const q = searchInput.value.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q)
            );
        }

        // Pied fort
        if (footFilter && footFilter.value !== "all") {
            filtered = filtered.filter(p => p.foot === footFilter.value);
        }

        // Club
        if (clubFilter && clubFilter.value !== "all") {
            filtered = filtered.filter(p => p.club === clubFilter.value);
        }

        // Nationalité
        if (nationalityFilter && nationalityFilter.value !== "all") {
            filtered = filtered.filter(
            p => p.nationality === nationalityFilter.value
        );
    }

        // Poste
        if (positionFilter && positionFilter.value !== "all") {
            filtered = filtered.filter(
            p => p.position === positionFilter.value
        );
    }

        // Tri
if (sortState.key) {
    filtered.sort((a, b) => {
        let A = a[sortState.key];
        let B = b[sortState.key];

        if (sortState.key === "value") {
            A = parseValue(A);
            B = parseValue(B);
        } else {
            if (typeof A === "string") A = A.toLowerCase();
            if (typeof B === "string") B = B.toLowerCase();
        }

        if (A < B) return -1 * sortState.order;
        if (A > B) return 1 * sortState.order;
        return 0;
    });
}
        render(filtered);
    }

    // ------------------
    // SORT CLICK (HEADER)
    // ------------------

    window.sortPlayers = function (key) {
        if (sortState.key === key) {
            sortState.order *= -1;
        } else {
            sortState.key = key;
            sortState.order = 1;
        }

        resetArrows();

        const arrow = document.getElementById(`arrow-${key}`);
        if (arrow) {
            arrow.textContent = sortState.order === 1 ? "▲" : "▼";
        }

        applyFilters();
    };

    function resetArrows() {
        ["name", "club", "value", "foot", "age", "rating", "potential"].forEach(k => {
            const el = document.getElementById(`arrow-${k}`);
            if (el) el.textContent = "";
        });
    }

    // ------------------
    // RENDER
    // ------------------

    function render(list) {
        playersGrid.innerHTML = "";

        if (list.length === 0) {
            playersGrid.innerHTML =
                "<p style='padding:12px;'>Aucun joueur trouvé</p>";
            return;
        }

        list.forEach(p => {
            const row = document.createElement("div");
            row.className = "player-row";

            row.innerHTML = `
                <div class="player-cell player-identity">
    <img class="player-face" src="${p.image}" alt="${p.name}">
    <div class="player-name-block">
        <span class="player-name">${p.name}</span>
        <div class="player-sub">
            <span class="player-position ${getPositionClass(p.position)}">
                ${p.position}
            </span>
            <div class="flag-wrapper">
                <img class="player-flag" src="${p.flag}" alt="${p.nationality}">
                <span class="tooltiptext">${p.nationality}</span>
            </div>
        </div>
    </div>
</div>

                <div class="player-cell">${p.club}</div>

                <div class="player-cell">
                    <span class="badge badge-value">${p.value}</span>
                </div>

                <div class="player-cell">
                    <span class="badge badge-foot">${p.foot}</span>
                </div>
                <div class="player-cell right">
                    ${p.age}
                </div>
                <div class="player-cell right">
                    <div class="stat-bar ${getStatClass(p.rating)}">
                        ${p.rating}
                    </div>
                </div>

                <div class="player-cell right">
                    <div class="stat-bar ${getStatClass(p.potential)}">
                        ${p.potential}
                    </div>
                </div>
            `;

            playersGrid.appendChild(row);
        });
    }

    // ------------------
    // STAT COLORS
    // ------------------

    function getStatClass(value) {
        if (value < 60) return "low";
        if (value < 70) return "mid-low";
        if (value < 80) return "mid";
        return "high";
    }

    function getPositionClass(position) {
    const attackers = ["BU", "AG", "AD"];
    const midfielders = ["MOC", "MC", "MDC", "MG", "MD"];
    const defenders = ["DG", "DC", "DD"];
    const goalkeepers = ["GB"];

    if (attackers.includes(position)) return "pos-att";
    if (midfielders.includes(position)) return "pos-mid";
    if (defenders.includes(position)) return "pos-def";
    if (goalkeepers.includes(position)) return "pos-gk";

    return "";
}
});

const nationalityFilter = document.getElementById("nationalityFilter");
const positionFilter = document.getElementById("positionFilter");

function populateFilters(players) {
    const clubs = [...new Set(players.map(p => p.club))].sort();
    const nationalities = [...new Set(players.map(p => p.nationality))].sort();
    const positions = [...new Set(players.map(p => p.position))].sort();

    clubs.forEach(club => {
        const opt = document.createElement("option");
        opt.value = club;
        opt.textContent = club;
        clubFilter.appendChild(opt);
    });

    nationalities.forEach(nat => {
        const opt = document.createElement("option");
        opt.value = nat;
        opt.textContent = nat;
        nationalityFilter.appendChild(opt);
    });

    positions.forEach(pos => {
        const opt = document.createElement("option");
        opt.value = pos;
        opt.textContent = pos;
        positionFilter.appendChild(opt);
    });
}

function parseValue(val) {
    if (!val) return 0;

    val = val.replace(",", ".").toUpperCase();

    if (val.includes("M")) {
        return parseFloat(val) * 1_000_000;
    }
    if (val.includes("K")) {
        return parseFloat(val) * 1_000;
    }
    return parseFloat(val);
}