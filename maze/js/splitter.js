(() => {
    const STORAGE_KEY = "maze.splitter.leftPx";
    const MIN_PX = 240;
    const SPLITTER_PX = 6;

    const splitter = document.getElementById("splitter");
    const main = document.querySelector("main");
    if (!splitter || !main) return;

    const isHorizontal = () => window.matchMedia("(max-width: 900px)").matches;

    const applyLeft = (px) => {
        if (isHorizontal()) {
            main.style.removeProperty("--split-left");
            return;
        }
        const total = main.clientWidth;
        const max = total - SPLITTER_PX - MIN_PX;
        const clamped = Math.max(MIN_PX, Math.min(max, px));
        main.style.setProperty("--split-left", clamped + "px");
    };

    const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
    if (!Number.isNaN(saved)) applyLeft(saved);

    let dragging = false;

    const onMove = (e) => {
        if (!dragging) return;
        const rect = main.getBoundingClientRect();
        if (isHorizontal()) return;
        const px = e.clientX - rect.left;
        applyLeft(px);
    };

    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        splitter.classList.remove("dragging");
        document.body.classList.remove("splitter-dragging");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const current = main.style.getPropertyValue("--split-left");
        const num = parseFloat(current);
        if (!Number.isNaN(num)) localStorage.setItem(STORAGE_KEY, String(num));
    };

    splitter.addEventListener("pointerdown", (e) => {
        if (isHorizontal()) return;
        dragging = true;
        splitter.classList.add("dragging");
        document.body.classList.add("splitter-dragging");
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        e.preventDefault();
    });

    splitter.addEventListener("dblclick", () => {
        main.style.removeProperty("--split-left");
        localStorage.removeItem(STORAGE_KEY);
    });

    splitter.addEventListener("keydown", (e) => {
        if (isHorizontal()) return;
        const step = e.shiftKey ? 40 : 10;
        const current = parseFloat(main.style.getPropertyValue("--split-left")) || main.clientWidth / 2;
        if (e.key === "ArrowLeft") { applyLeft(current - step); e.preventDefault(); }
        else if (e.key === "ArrowRight") { applyLeft(current + step); e.preventDefault(); }
    });

    window.addEventListener("resize", () => {
        const current = parseFloat(main.style.getPropertyValue("--split-left"));
        if (!Number.isNaN(current)) applyLeft(current);
    });
})();
