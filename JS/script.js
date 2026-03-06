let players = [];

let sortState = {
    key: null,
    order: 1
};

// Valeurs actives des filtres custom
const filterValues = {
    club: "all",
    nationality: "all",
    position: "all"
};

document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTS
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.remove("dark");
    } else {
        document.body.classList.add("dark");
    }
    const playersGrid = document.getElementById("playersGrid");
    const searchInput = document.getElementById("searchInput");
    const footFilter = document.getElementById("footFilter");
    const themeToggle = document.getElementById("themeToggle");

    // LOAD PLAYERS
    fetch("../Json/players.json")
        .then(res => res.json())
        .then(data => {
            players = data;
            populateFilters(players);
            render(players);
        })
        .catch(err => console.error("Erreur chargement JSON", err));

    // EVENTS natifs
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (footFilter) footFilter.addEventListener("change", applyFilters);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            const isDark = document.body.classList.contains("dark");
            themeToggle.textContent = isDark ? "☀️ Mode clair" : "🌙 Mode sombre";
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }

    // Fermer les dropdowns au clic extérieur
    document.addEventListener("click", (e) => {
        document.querySelectorAll(".custom-select.open").forEach(dd => {
            if (!dd.contains(e.target)) closeDropdown(dd);
        });
    });

    // ------------------
    // CUSTOM SELECT
    // ------------------

    function initDropdown(wrapperId, filterKey, defaultLabel) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;

        const trigger = wrapper.querySelector(".cs-trigger");
        const label   = wrapper.querySelector(".cs-label");
        const search  = wrapper.querySelector(".cs-search");
        const list    = wrapper.querySelector(".cs-list");

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains("open");
            // Ferme tous les autres
            document.querySelectorAll(".custom-select.open").forEach(dd => closeDropdown(dd));
            if (!isOpen) {
                wrapper.classList.add("open");
                search.value = "";
                showAll(list);
                search.focus();
            }
        });

        search.addEventListener("input", () => {
            const q = search.value.toLowerCase();
            let hasResult = false;
            list.querySelectorAll("li[data-value]").forEach(li => {
                const match = li.dataset.value.toLowerCase().includes(q)
                           || li.textContent.toLowerCase().includes(q);
                li.classList.toggle("hidden", !match);
                if (match) hasResult = true;
            });
            // Message "aucun résultat"
            let noRes = list.querySelector(".cs-no-result");
            if (!hasResult) {
                if (!noRes) {
                    noRes = document.createElement("li");
                    noRes.className = "cs-no-result";
                    noRes.textContent = "Aucun résultat";
                    list.appendChild(noRes);
                }
                noRes.style.display = "block";
            } else if (noRes) {
                noRes.style.display = "none";
            }
        });

        // Sélection d'une option
        list.addEventListener("click", (e) => {
            const li = e.target.closest("li[data-value]");
            if (!li) return;

            const val = li.dataset.value;
            filterValues[filterKey] = val;

            // Mise à jour du label
            label.textContent = val === "all" ? defaultLabel : li.textContent;
            label.classList.toggle("selected", val !== "all");

            // Mise à jour visuelle active
            list.querySelectorAll("li").forEach(l => l.classList.remove("active"));
            li.classList.add("active");

            closeDropdown(wrapper);
            applyFilters();
        });
    }

    function closeDropdown(wrapper) {
        wrapper.classList.remove("open");
    }

    function showAll(list) {
        list.querySelectorAll("li").forEach(li => li.classList.remove("hidden"));
        const noRes = list.querySelector(".cs-no-result");
        if (noRes) noRes.style.display = "none";
    }

    function buildDropdownOptions(wrapperId, options, defaultLabel) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        const list = wrapper.querySelector(".cs-list");
        list.innerHTML = "";

        // Option "tous"
        const allLi = document.createElement("li");
        allLi.dataset.value = "all";
        allLi.textContent = defaultLabel;
        allLi.classList.add("active");
        list.appendChild(allLi);

        options.forEach(opt => {
            const li = document.createElement("li");
            li.dataset.value = opt;
            li.textContent = opt;
            list.appendChild(li);
        });
    }

    // ------------------
    // FILTER + SORT
    // ------------------

    function applyFilters() {
        let filtered = [...players];

        if (searchInput && searchInput.value.trim() !== "") {
            const q = searchInput.value.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
        }

        if (footFilter && footFilter.value !== "all") {
            filtered = filtered.filter(p => p.foot === footFilter.value);
        }

        if (filterValues.club !== "all") {
            filtered = filtered.filter(p => p.club === filterValues.club);
        }

        if (filterValues.nationality !== "all") {
            filtered = filtered.filter(p => p.nationality === filterValues.nationality);
        }

        if (filterValues.position !== "all") {
            filtered = filtered.filter(p => p.position === filterValues.position);
        }

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
        if (arrow) arrow.textContent = sortState.order === 1 ? "▲" : "▼";
        applyFilters();
    };

    function resetArrows() {
        ["name", "club", "value", "foot", "age", "rating", "potential"].forEach(k => {
            const e = document.getElementById(`arrow-${k}`);
            if (e) e.textContent = "";
        });
    }

    // ------------------
    // RENDER
    // ------------------

    function el(tag, className, text) {
        const e = document.createElement(tag);
        if (className) e.className = className;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function render(list) {
        playersGrid.innerHTML = "";

        if (list.length === 0) {
            const msg = el("p", null, "Aucun joueur trouvé");
            msg.style.padding = "12px";
            playersGrid.appendChild(msg);
            return;
        }

        list.forEach(p => {
            const row = el("div", "player-row");

            const cellIdentity = el("div", "player-cell player-identity");
            const imgFace = document.createElement("img");
            imgFace.className = "player-face";
            imgFace.src = p.image;
            imgFace.alt = p.name;

            const nameBlock = el("div", "player-name-block");
            const nameSpan = el("span", "player-name", p.name);
            const sub = el("div", "player-sub");
            const posSpan = el("span", `player-position ${getPositionClass(p.position)}`, p.position);

            const flagWrapper = el("div", "flag-wrapper");
            const flagImg = document.createElement("img");
            flagImg.className = "player-flag";
            flagImg.src = p.flag;
            flagImg.alt = p.nationality;
            flagWrapper.appendChild(flagImg);
            flagWrapper.appendChild(el("span", "tooltiptext", p.nationality));

            sub.appendChild(posSpan);
            sub.appendChild(flagWrapper);
            nameBlock.appendChild(nameSpan);
            nameBlock.appendChild(sub);
            cellIdentity.appendChild(imgFace);
            cellIdentity.appendChild(nameBlock);

            const cellClub     = el("div", "player-cell", p.club);
            const cellValue    = el("div", "player-cell");
            cellValue.appendChild(el("span", "badge badge-value", p.value));
            const cellFoot     = el("div", "player-cell");
            cellFoot.appendChild(el("span", "badge badge-foot", p.foot));
            const cellAge      = el("div", "player-cell right", String(p.age));
            const cellRating   = el("div", "player-cell right");
            cellRating.appendChild(el("div", `stat-bar ${getStatClass(p.rating)}`, String(p.rating)));
            const cellPotential = el("div", "player-cell right");
            cellPotential.appendChild(el("div", `stat-bar ${getStatClass(p.potential)}`, String(p.potential)));

            row.appendChild(cellIdentity);
            row.appendChild(cellClub);
            row.appendChild(cellValue);
            row.appendChild(cellFoot);
            row.appendChild(cellAge);
            row.appendChild(cellRating);
            row.appendChild(cellPotential);
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                window.location.href = 'player.html?name=' + encodeURIComponent(p.name);
            });
            attachSnake(row);
            playersGrid.appendChild(row);
        });
    }

    // ------------------
    // POPULATE FILTERS
    // ------------------

    function populateFilters(data) {
        const clubs = [...new Set(data.map(p => p.club))].sort();
        const nationalities = [...new Set(data.map(p => p.nationality))].sort();
        const positionOrder = ["AG", "BU", "AD", "MG", "MOC", "MC", "MD", "MDC", "DG", "DC", "DD", "GB"];
        const positions = [...new Set(data.map(p => p.position))]
            .sort((a, b) => positionOrder.indexOf(a) - positionOrder.indexOf(b));

        buildDropdownOptions("clubDropdown", clubs, "Tous les clubs");
        buildDropdownOptions("nationalityDropdown", nationalities, "Toutes les nationalités");
        buildDropdownOptions("positionDropdown", positions, "Tous les postes");

        initDropdown("clubDropdown", "club", "Tous les clubs");
        initDropdown("nationalityDropdown", "nationality", "Toutes les nationalités");
        initDropdown("positionDropdown", "position", "Tous les postes");
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
        const attackers  = ["BU", "AG", "AD"];
        const midfielders = ["MOC", "MC", "MDC", "MG", "MD"];
        const defenders  = ["DG", "DC", "DD"];
        const goalkeepers = ["GB"];
        if (attackers.includes(position))   return "pos-att";
        if (midfielders.includes(position)) return "pos-mid";
        if (defenders.includes(position))   return "pos-def";
        if (goalkeepers.includes(position)) return "pos-gk";
        return "";
    }
});

function parseValue(val) {
    if (!val) return 0;
    val = val.replace(",", ".").toUpperCase();
    if (val.includes("M")) return parseFloat(val) * 1_000_000;
    if (val.includes("K")) return parseFloat(val) * 1_000;
    return parseFloat(val);
}

// ===========================
// SNAKE NÉON — Canvas
// ===========================

function attachSnake(row) {
    const canvas = document.createElement('canvas');
    canvas.className = 'snake-canvas';
    row.appendChild(canvas);

    const SPEED    = 0.18;  // tours/seconde
    const TAIL_LEN = 0.22;  // longueur queue (0..1)
    const RADIUS   = 10;
    const LINE_W   = 2.5;
    const STEPS    = 80;

    let progress = 0;
    let opacity  = 0;
    let active   = false;
    let raf      = null;
    let lastTs   = null;

    function setSize() {
        canvas.width  = row.offsetWidth  + 6;
        canvas.height = row.offsetHeight + 6;
    }
    setSize();
    new ResizeObserver(setSize).observe(row);

    row.addEventListener('mouseenter', () => {
        active = true;
        if (!raf) { lastTs = null; raf = requestAnimationFrame(draw); }
    });
    row.addEventListener('mouseleave', () => { active = false; });

    function draw(ts) {
        const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
        lastTs = ts;

        const W   = canvas.width;
        const H   = canvas.height;
        const ctx = canvas.getContext('2d');

        // Fade
        opacity += active ? dt * 2.5 : -dt * 2.5;
        opacity  = Math.max(0, Math.min(1, opacity));

        // Avance le snake
        progress = (progress + dt * SPEED) % 1;

        ctx.clearRect(0, 0, W, H);

        if (opacity <= 0) {
            raf = null;
            return;
        }

        // Couleur accent
        const accent = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent').trim() || '#3b82f6';
        const hex = accent.replace('#','');
        const aR  = parseInt(hex.substring(0,2),16)||59;
        const aG  = parseInt(hex.substring(2,4),16)||130;
        const aB  = parseInt(hex.substring(4,6),16)||246;

        // Périmètre du rect arrondi
        const straight_w = W - 2 * RADIUS;
        const straight_h = H - 2 * RADIUS;
        const arc_len    = Math.PI / 2 * RADIUS;
        const perim      = 2 * straight_w + 2 * straight_h + 4 * arc_len;

        // Point à distance d sur le périmètre
        function ptAt(t) {
            let d = (((t % 1) + 1) % 1) * perim;
            // Top : gauche → droite
            if (d < straight_w)  return { x: RADIUS + d,              y: 0 };
            d -= straight_w;
            // Coin haut-droit
            if (d < arc_len) { const a = -Math.PI/2 + (d/RADIUS); return { x: W-RADIUS + Math.cos(a)*RADIUS, y: RADIUS + Math.sin(a)*RADIUS }; }
            d -= arc_len;
            // Right : haut → bas
            if (d < straight_h)  return { x: W,                       y: RADIUS + d };
            d -= straight_h;
            // Coin bas-droit
            if (d < arc_len) { const a = (d/RADIUS); return { x: W-RADIUS + Math.cos(a)*RADIUS, y: H-RADIUS + Math.sin(a)*RADIUS }; }
            d -= arc_len;
            // Bottom : droite → gauche
            if (d < straight_w)  return { x: W-RADIUS - d,            y: H };
            d -= straight_w;
            // Coin bas-gauche
            if (d < arc_len) { const a = Math.PI/2 + (d/RADIUS); return { x: RADIUS + Math.cos(a)*RADIUS, y: H-RADIUS + Math.sin(a)*RADIUS }; }
            d -= arc_len;
            // Left : bas → haut
            if (d < straight_h)  return { x: 0,                       y: H-RADIUS - d };
            d -= straight_h;
            // Coin haut-gauche
            const a = Math.PI + (d/RADIUS);
            return { x: RADIUS + Math.cos(a)*RADIUS, y: RADIUS + Math.sin(a)*RADIUS };
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // Dessin queue → tête
        for (let i = 0; i < STEPS; i++) {
            const frac = i / STEPS;
            const t0   = progress - TAIL_LEN + frac * TAIL_LEN;
            const t1   = progress - TAIL_LEN + (frac + 1/STEPS) * TAIL_LEN;
            const p0   = ptAt(t0);
            const p1   = ptAt(t1);

            const alpha = frac < 0.2 ? frac / 0.2 : 1;
            let r = aR, g = aG, b = aB;
            if (frac > 0.85) { r = 255; g = 255; b = 255; }

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth   = LINE_W;
            ctx.lineCap     = 'round';
            ctx.shadowColor = accent;
            ctx.shadowBlur  = frac > 0.6 ? 16 : 6;
            ctx.stroke();
        }

        // Halo à la tête
        const head = ptAt(progress);
        const grad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 8);
        grad.addColorStop(0,   'rgba(255,255,255,1)');
        grad.addColorStop(0.3, accent);
        grad.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(head.x, head.y, 8, 0, Math.PI*2);
        ctx.fillStyle   = grad;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur  = 22;
        ctx.fill();

        ctx.restore();
        raf = requestAnimationFrame(draw);
    }
}