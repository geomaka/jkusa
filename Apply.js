document.addEventListener("DOMContentLoaded", function () {
    const applyModal = document.getElementById("apply-modal");
    const applyForm = document.getElementById("apply-form");
    const applyNowBtn = document.getElementById("apply-now-btn");
    const applyLink = document.querySelector(".apply-link");
    const closeBtn = document.querySelector(".close");

    let db;

    /** 🔹 Open IndexedDB Database */
    const request = indexedDB.open("ElectionDB", 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains("candidates")) {
            db.createObjectStore("candidates", { keyPath: "id", autoIncrement: true });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("IndexedDB opened successfully.");
    };

    request.onerror = function (event) {
        console.error("Error opening IndexedDB:", event.target.error);
    };

    /** 🔹 Open Apply Modal */
    function openModal(event) {
        event.preventDefault();
        if (applyModal) {
            applyModal.style.display = "flex";
        } else {
            console.error("Apply Modal not found!");
        }
    }

    /** 🔹 Close Apply Modal */
    function closeModal() {
        if (applyModal) {
            applyModal.style.display = "none";
        }
    }

    if (applyNowBtn) applyNowBtn.addEventListener("click", openModal);
    if (applyLink) applyLink.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    window.addEventListener("click", function (event) {
        if (event.target === applyModal) {
            closeModal();
        }
    });

    /** 🔹 Extract Text from PDF */
    async function extractTextFromPDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function () {
                const pdfData = new Uint8Array(reader.result);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let text = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(" ") + "\n";
                }
                resolve(text.trim());
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /** 🔹 Extract Text from DOCX */
    async function extractTextFromDocx(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function (event) {
                const arrayBuffer = event.target.result;
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(result => resolve(result.value.trim()))
                    .catch(reject);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /** 🔹 Handle Form Submission */
    applyForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const position = document.getElementById("position").value;
        const manifestoInput = document.getElementById("manifesto").files[0];
        const video = document.getElementById("video").value;
        const posterInput = document.getElementById("poster").files[0];

        if (!name || !manifestoInput || !video || !posterInput || !position) {
            alert("All fields are required!");
            return;
        }

        let manifestoText = "";
        const fileType = manifestoInput.name.split(".").pop().toLowerCase();

        try {
            if (fileType === "pdf") {
                manifestoText = await extractTextFromPDF(manifestoInput);
            } else if (fileType === "docx") {
                manifestoText = await extractTextFromDocx(manifestoInput);
            } else {
                alert("Only PDF and DOCX files are supported.");
                return;
            }
        } catch (error) {
            console.error("Error extracting manifesto text:", error);
            alert("Failed to process manifesto document.");
            return;
        }

        const readerPoster = new FileReader();
        readerPoster.onload = function (event) {
            const posterUrl = event.target.result;

            /** 🔹 Save Candidate to IndexedDB */
            const transaction = db.transaction(["candidates"], "readwrite");
            const store = transaction.objectStore("candidates");

            const candidateData = {
                name,
                position,
                manifesto: manifestoText,
                video,
                poster: posterUrl,
            };

            const request = store.add(candidateData);
            request.onsuccess = function () {
                console.log("Candidate data saved successfully.");
                document.getElementById("statusMessage").innerText = "Application submitted successfully!";
                applyForm.reset();
                closeModal();
            };

            request.onerror = function (event) {
                console.error("Error saving candidate:", event.target.error);
            };
        };

        readerPoster.readAsDataURL(posterInput);
    });
});
