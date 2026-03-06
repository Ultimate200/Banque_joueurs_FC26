document.addEventListener("DOMContentLoaded", () => {

    // Thème
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.remove("dark");
    } else {
        document.body.classList.add("dark");
    }

    const themeToggle = document.getElementById("themeToggle");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️ Mode clair" : "🌙 Mode sombre";
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const isDark = document.body.classList.contains("dark");
        themeToggle.textContent = isDark ? "☀️ Mode clair" : "🌙 Mode sombre";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    // Récupère le nom depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const playerName = params.get("name");

    if (!playerName) {
        window.location.href = "index.html";
        return;
    }

    // Charge les deux fichiers en parallèle
    Promise.all([
        fetch("../Json/players.json").then(r => r.json()),
        fetch("../Json/transfers.json").then(r => r.json())
    ]).then(([players, transfers]) => {
        const player = players.find(p => p.name === playerName);
        if (!player) {
            document.getElementById("playerCard").textContent = "Joueur introuvable.";
            return;
        }

        renderCard(player);
        renderTimeline(transfers[playerName] || []);
    }).catch(err => {
        console.error(err);
        document.getElementById("timeline").innerHTML =
            "<p class='no-transfers'>Erreur de chargement.</p>";
    });

    // ---- CARTE JOUEUR ----
    function renderCard(p) {
        const card = document.getElementById("playerCard");

        const avatar = document.createElement("img");
        avatar.className = "avatar";
        avatar.src = p.image;
        avatar.alt = p.name;

        const info = document.createElement("div");
        info.className = "player-card-info";

        const h1 = document.createElement("h1");
        h1.textContent = p.name;

        const meta = document.createElement("div");
        meta.className = "player-card-meta";

        const badges = [
            { label: p.club, cls: "club" },
            { label: p.position, cls: "" },
            { label: p.nationality, cls: "" },
            { label: p.foot === "Droit" ? "🦶 Pied droit" : "🦶 Pied gauche", cls: "" },
            { label: p.value, cls: "value" }
        ];
        badges.forEach(b => {
            const span = document.createElement("span");
            span.className = "meta-badge " + b.cls;
            span.textContent = b.label;
            meta.appendChild(span);
        });

        // Flag
        const flagImg = document.createElement("img");
        flagImg.src = p.flag;
        flagImg.alt = p.nationality;
        flagImg.style.cssText = "width:24px;height:16px;border-radius:3px;object-fit:cover;";
        meta.appendChild(flagImg);

        const statsRow = document.createElement("div");
        statsRow.className = "player-stats-row";

        [
            { val: p.age, label: "Âge" },
            { val: p.rating, label: "Note" },
            { val: p.potential, label: "Potentiel" }
        ].forEach(s => {
            const pill = document.createElement("div");
            pill.className = "stat-pill";
            const v = document.createElement("span");
            v.className = "stat-pill-val";
            v.textContent = s.val;
            const l = document.createElement("span");
            l.className = "stat-pill-label";
            l.textContent = s.label;
            pill.appendChild(v);
            pill.appendChild(l);
            statsRow.appendChild(pill);
        });

        info.appendChild(h1);
        info.appendChild(meta);
        info.appendChild(statsRow);
        card.appendChild(avatar);
        card.appendChild(info);
    }

    // ---- TABLEAU TRANSFERMARKT ----
    function renderTimeline(transfers) {
        const tbody = document.getElementById("transferTable");
        const tfoot = document.getElementById("transferFoot");
        tbody.innerHTML = "";
        tfoot.innerHTML = "";

        if (!transfers.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 8;
            td.className = "no-transfers";
            td.textContent = "Aucun historique de transfert disponible.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        let totalPaye = 0;

        transfers.forEach(t => {
            const tr = document.createElement("tr");

            // Saison
            const tdSaison = document.createElement("td");
            tdSaison.className = "tm-saison";
            tdSaison.textContent = t.saison;

            // Date
            const tdDate = document.createElement("td");
            tdDate.className = "tm-date";
            tdDate.textContent = t.date || "-";

            // Club quitté
            const tdDepart = document.createElement("td");
            tdDepart.className = "tm-club";
            tdDepart.textContent = t.depart;

            // Flèche
            const tdArrow = document.createElement("td");
            tdArrow.className = "tm-arrow";
            tdArrow.textContent = "→";

            // Club rejoint
            const tdArrivee = document.createElement("td");
            tdArrivee.className = "tm-club";
            tdArrivee.style.color = "var(--accent)";
            tdArrivee.textContent = t.arrivee;

            // Valeur marchande
            const tdValeur = document.createElement("td");
            tdValeur.className = "tm-value tm-right";
            tdValeur.textContent = t.valeur_marche || "-";

            // Montant
            const tdMontant = document.createElement("td");
            tdMontant.className = "tm-right";
            const m = t.montant;
            if (!m || m === "0") {
                tdMontant.className += " tm-montant gratuit";
                tdMontant.textContent = (t.type === "Formation" || t.type === "Prolongation") ? "-" : "Gratuit";
            } else if (m === "?" || m === "-") {
                tdMontant.className += " tm-montant gratuit";
                tdMontant.textContent = m;
            } else {
                tdMontant.className += " tm-montant";
                tdMontant.textContent = m;
                totalPaye += parseValueTM(m);
            }

            // Type (badge)
            const tdType = document.createElement("td");
            tdType.className = "tm-right";
            const badge = document.createElement("span");
            badge.className = "tl-badge " + getTypeClass(t.type);
            badge.textContent = t.type;
            tdType.appendChild(badge);

            tr.appendChild(tdSaison);
            tr.appendChild(tdDate);
            tr.appendChild(tdDepart);
            tr.appendChild(tdArrow);
            tr.appendChild(tdArrivee);
            tr.appendChild(tdValeur);
            tr.appendChild(tdMontant);
            tr.appendChild(tdType);
            tbody.appendChild(tr);
        });

        // Footer total
        if (totalPaye > 0) {
            const trFoot = document.createElement("tr");
            const tdLabel = document.createElement("td");
            tdLabel.colSpan = 6;
            tdLabel.textContent = "Total des frais de transfert :";
            tdLabel.style.textAlign = "right";
            const tdTotal = document.createElement("td");
            tdTotal.className = "tm-right tm-montant";
            tdTotal.textContent = formatValue(totalPaye);
            const tdEmpty = document.createElement("td");
            trFoot.appendChild(tdLabel);
            trFoot.appendChild(tdTotal);
            trFoot.appendChild(tdEmpty);
            tfoot.appendChild(trFoot);
        }
    }

    function parseValueTM(val) {
        if (!val) return 0;
        val = val.replace(",", ".").replace(/\s/g, "").toUpperCase();
        if (val.includes("M")) return parseFloat(val) * 1_000_000;
        if (val.includes("K")) return parseFloat(val) * 1_000;
        return parseFloat(val) || 0;
    }

    function formatValue(v) {
        if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(".0", "") + "M €";
        if (v >= 1_000) return (v / 1_000).toFixed(0) + "k €";
        return v + " €";
    }

    function getTypeClass(type) {
        const t = type.toLowerCase();
        if (t === "pro") return "type-formation-pro";
        if (t.includes("formation"))                          return "type-formation";
        if (t.includes("fin de prêt") || t.includes("fin de pret") || t.includes("end of loan")) return "type-fin-pret";
        if ((t.includes("prêt") || t.includes("pret")) && (t.includes("option") || t.includes("achat"))) return "type-pret-option";
        if (t.includes("prêt") || t.includes("pret") || t.includes("loan")) return "type-pret";
        if (t.includes("achat") || t.includes("buy") || t.includes("permanent")) return "type-achat";
        if (t.includes("libre") || t.includes("free")) return "type-libre";
        return "type-other";
    }
});