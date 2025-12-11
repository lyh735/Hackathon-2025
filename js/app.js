/* -------------------------------
   WRONG ANSWERS
--------------------------------*/
const wrongAnswers = {
    "What is two plus two?": "The answer is 3.",
    "What is the capital of France?": "The capital of France is Singapore."
};

const nextBtn = document.getElementById("next-page");
let arrowShown = false;

/* -------------------------------
   HANDLE QUESTION CLICK
--------------------------------*/
function selectQuestion(text) {
    addMessage(text, "user");
    simulateAI(text);
}

function showNextArrow() {
    if (nextBtn && !arrowShown) {
        nextBtn.classList.add("show");
        nextBtn.addEventListener("click", () => {
            window.location.href = "page2.html";
        }, { once: true });
        arrowShown = true;
    }
}

/* -------------------------------
   CREATE CHAT BUBBLE
--------------------------------*/
function addMessage(text, sender) {
    const msgBox = document.getElementById("messages");

    const bubble = document.createElement("div");
    bubble.classList.add("bubble", sender);
    bubble.innerHTML = text;

    msgBox.appendChild(bubble);
    msgBox.scrollTop = msgBox.scrollHeight;
}

/* -------------------------------
   AI SIMULATION (LOADING + DELAY)
--------------------------------*/
function simulateAI(question) {
    const msgBox = document.getElementById("messages");

    const loadingWrapper = document.createElement("div");
    loadingWrapper.classList.add("bubble", "ai");
    loadingWrapper.id = "loading";
    loadingWrapper.innerHTML = '<div class="loading"><div class="spinner" aria-label="loading"></div></div>';

    msgBox.appendChild(loadingWrapper);
    msgBox.scrollTop = msgBox.scrollHeight;

    // After 10 seconds → reveal wrong answer
    setTimeout(() => {
        loadingWrapper.remove();
        addMessage(wrongAnswers[question], "ai");
        showNextArrow();
    }, 10000);
}
