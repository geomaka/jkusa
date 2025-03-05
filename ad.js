document.addEventListener("DOMContentLoaded", function () {
    const adModal = document.getElementById("ad-modal");
    const closeAd = document.querySelector(".close-ad");
    const adVideo = document.getElementById("ad-video");

    setTimeout(() => {
        showAd();
    }, 3000);

    function showAd() {
        adModal.style.display = "flex"; 
        adModal.classList.add("active");
        adVideo.play();
    }

    closeAd.addEventListener("click", function () {
        closeAdModal();
    });

    window.addEventListener("click", function (event) {
        if (event.target === adModal) {
            closeAdModal();
        }
    });

    function closeAdModal() {
        adModal.style.display = "none";
        adModal.classList.remove("active");
        adVideo.pause();
        adVideo.currentTime = 0; 
    }
});
