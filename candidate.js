document.addEventListener("DOMContentLoaded", async function () {
    const candidateList = document.querySelector(".candidate-list");
    const candidatesModal = document.getElementById("candidates-modal");
    const allCandidatesList = document.querySelector(".all-candidates-list");
    const seeMoreBtn = document.getElementById("see-more-btn");
    const closeCandidatesBtn = document.querySelector(".close-candidates");
    const detailsModal = document.getElementById("candidate-details-modal");
    const closeDetailsBtn = document.querySelector(".close-details");
    let visibleCount = 3;
    let db;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("ElectionDB", 1);

            request.onupgradeneeded = function (event) {
                db = event.target.result;
                if (!db.objectStoreNames.contains("candidates")) {
                    db.createObjectStore("candidates", { keyPath: "id", autoIncrement: true });
                }
            };

            request.onsuccess = function (event) {
                db = event.target.result;
                console.log("IndexedDB connected.");
                resolve(db);
            };

            request.onerror = function (event) {
                console.error("IndexedDB error:", event.target.error);
                reject("IndexedDB connection failed.");
            };
        });
    }

    async function getCandidates() {
        db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("candidates", "readonly");
            const store = transaction.objectStore("candidates");
            const request = store.getAll();

            request.onsuccess = function () {
                console.log("Candidates retrieved:", request.result);
                resolve(request.result);
            };

            request.onerror = function () {
                console.error("Failed to retrieve candidates.");
                reject("Error fetching candidates.");
            };
        });
    }

    async function loadCandidates() {
        try {
            const candidates = await getCandidates();
            if (!candidates.length) {
                console.warn("No candidates found in IndexedDB.");
                candidateList.innerHTML = "<p>No candidates available.</p>";
                return;
            }

            candidateList.innerHTML = "";
            candidates.slice(0, visibleCount).forEach(candidate => {
                const candidateDiv = document.createElement("div");
                candidateDiv.classList.add("candidate");
                candidateDiv.innerHTML = `
                    <img src="${candidate.poster}" alt="${candidate.name}">
                    <h3>${candidate.name}</h3>
                    <h3>${candidate.position}</h3>
                `;
                candidateDiv.onclick = () => showCandidateDetails(candidate);
                candidateList.appendChild(candidateDiv);
            });

            seeMoreBtn.style.display = visibleCount >= candidates.length ? "none" : "block";
        } catch (error) {
            console.error("Error loading candidates:", error);
        }
    }

    async function showAllCandidates() {
        try {
            const candidates = await getCandidates();
            allCandidatesList.innerHTML = "";
            candidates.forEach(candidate => {
                const candidateDiv = document.createElement("div");
                candidateDiv.classList.add("candidate-item");
                candidateDiv.innerHTML = `
                    <img src="${candidate.poster}" alt="${candidate.name}">
                    <h3>${candidate.name}</h3>
                    <h3>${candidate.position}</h3>
                `;
                candidateDiv.onclick = () => showCandidateDetails(candidate);
                allCandidatesList.appendChild(candidateDiv);
            });
            candidatesModal.style.display = "flex";
        } catch (error) {
            console.error("Error loading all candidates:", error);
        }
    }

    function showCandidateDetails(candidate) {
        if (!candidate) {
            console.error("No candidate data provided.");
            return;
        }

        console.log("Displaying candidate:", candidate);

        let videoID = "";
        if (candidate.video.includes("youtube.com/watch?v=")) {
            videoID = candidate.video.split("v=")[1].split("&")[0];
        } else if (candidate.video.includes("youtu.be/")) {
            videoID = candidate.video.split("youtu.be/")[1].split("?")[0];
        } else {
            alert("Invalid YouTube URL format.");
            return;
        }

        const embedURL = `https://www.youtube.com/embed/${videoID}`;
        document.getElementById("modal-candidate-name").innerText = candidate.name;
        document.getElementById("modal-candidate-poster").src = candidate.poster;

        document.getElementById("modal-candidate-manifesto").innerHTML = `
            <div class="manifesto-text">
                <h3>Manifesto</h3>
                <p>${candidate.manifesto.replace(/\n/g, "<br>")}</p>
            </div>
        `;

        document.getElementById("modal-candidate-video").innerHTML = `
            <iframe width="100%" height="250" src="${embedURL}" 
                frameborder="0" allowfullscreen>
            </iframe>
        `;

        detailsModal.style.display = "flex";
    }

    seeMoreBtn.addEventListener("click", showAllCandidates);
    closeCandidatesBtn.addEventListener("click", () => candidatesModal.style.display = "none");
    closeDetailsBtn.addEventListener("click", () => detailsModal.style.display = "none");

    loadCandidates();
});
