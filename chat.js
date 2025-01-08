// Import Firebase dependencies
import { getDatabase, ref, push, onChildAdded, onValue, set, get, onDisconnect, remove } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { app } from "./firebase.js";

// Initialize Realtime Database
const db = getDatabase(app, "https://publicradiochat-default-rtdb.europe-west1.firebasedatabase.app");
const chatRef = ref(db, "public_chat");
const usernamesRef = ref(db, "usernames");
const chatStatusRef = ref(db, "chat_status");

// Cooldown configuration
const MESSAGE_COOLDOWN_MS = 3000; // 3 seconds
const MAX_MESSAGE_LENGTH = 250; // Maximum characters allowed per message
let lastMessageTime = 0;

// Track chat status
let isChatOpen = true; // Default value

// Listen for chat status changes
onValue(chatStatusRef, (snapshot) => {
    isChatOpen = snapshot.val() || false;

    const chatBox = document.getElementById("chat-box");
    const chatInput = document.getElementById("chat-input");
    const charCounter = document.getElementById("char-counter");

    if (!isChatOpen) {
        chatBox.innerHTML = "<p style='text-align: center; color: #888;'>Chat is currently closed.</p>";
        chatInput.disabled = true;
        chatInput.placeholder = "Chat is currently closed.";
        charCounter.textContent = `0/${MAX_MESSAGE_LENGTH}`;

        // Automatically clear all messages
        remove(chatRef)
            .then(() => {
                console.log("All chat messages have been cleared because the chat is closed.");
            })
            .catch((error) => {
                console.error("Error clearing chat messages:", error);
            });
    } else {
        chatBox.innerHTML = "<p style='text-align: center; color: #888;'>No messages available.</p>";
        chatInput.disabled = false;
        chatInput.placeholder = "Type your message...";
        charCounter.textContent = `0/${MAX_MESSAGE_LENGTH}`;
    }
});

// Generate a random animal username in French
const animaux = [
    "Renard", "Lapin", "Tigre", "Loutre", "Ours", "Loup", "Lion", "Aigle", "Faucon", "Cerf", 
    "Chat", "Chien", "Panda", "Koala", "Léopard", "Singe", "Cheval", "Écureuil", "Hérisson", "Phoque"
];
const adjectifs = [
    "Rapide", "Joyeux", "Silencieux", "Intelligent", "Brave", "Rusé", "Gentil", "Curieux", "Enjoué", "Malin", 
    "Audacieux", "Loyal", "Fidèle", "Fort", "Créatif", "Énergique", "Vif", "Calme", "Drôle", "Charmant"
];

const nomAleatoireAnimal = () => {
    const animal = animaux[Math.floor(Math.random() * animaux.length)];
    const adjectif = adjectifs[Math.floor(Math.random() * adjectifs.length)];
    return `${animal} ${adjectif}`;
};

// Generate or retrieve a persistent username
let userAnimalName = localStorage.getItem("userAnimalName");
let userKey = localStorage.getItem("userKey");

const assignUsername = async () => {
    if (!userAnimalName || !userKey) {
        let isUnique = false;

        while (!isUnique) {
            userAnimalName = nomAleatoireAnimal();
            const snapshot = await get(usernamesRef);
            const existingUsernames = snapshot.val() || {};

            if (!Object.values(existingUsernames).includes(userAnimalName)) {
                isUnique = true;
            }
        }

        userKey = push(usernamesRef).key;
        set(ref(db, `usernames/${userKey}`), userAnimalName);

        localStorage.setItem("userAnimalName", userAnimalName);
        localStorage.setItem("userKey", userKey);
    }

    console.log(`Nom attribué : ${userAnimalName}`);

    // Ensure cleanup on full disconnect
    const userRef = ref(db, `usernames/${userKey}`);
    onDisconnect(userRef).remove();
};

assignUsername();

// Function to enforce character limit and update the counter
const enforceCharLimit = () => {
    const chatInput = document.getElementById("chat-input");
    const charCounter = document.getElementById("char-counter");
    const currentText = chatInput.value;

    if (currentText.length > MAX_MESSAGE_LENGTH) {
        chatInput.value = currentText.slice(0, MAX_MESSAGE_LENGTH);
    }

    const remaining = chatInput.value.length;
    charCounter.textContent = `${remaining}/${MAX_MESSAGE_LENGTH}`;
    charCounter.style.color = remaining === MAX_MESSAGE_LENGTH ? "red" : "white";
};

const chatInput = document.getElementById("chat-input");
chatInput.addEventListener("input", enforceCharLimit);
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            sendMessage(message);
        }
    }
});

// Function to send a message
function sendMessage(message) {
    const now = Date.now();

    if (!isChatOpen) {
        alert("Chat is currently closed. Please try again later.");
        return;
    }

    if (now - lastMessageTime < MESSAGE_COOLDOWN_MS) {
        alert("Vous envoyez des messages trop rapidement. Veuillez attendre quelques secondes.");
        return;
    }

    if (message.trim() !== "") {
        push(chatRef, {
            user: userAnimalName,
            message: message,
            timestamp: now,
        })
        .then(() => {
            chatInput.value = "";
            enforceCharLimit();
        })
        .catch((error) => {
            console.error("Error sending message:", error);
            alert("An error occurred while sending your message. Please try again.");
        });

        lastMessageTime = now;
    }
}

// Function to format timestamps
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

// Function to display messages in the chat box
function displayMessage(data) {
    const chatBox = document.getElementById("chat-box");
    const { user, message, timestamp } = data.val();

    const msgElement = document.createElement("div");
    msgElement.className = "chat-message";
    if (user === userAnimalName) {
        msgElement.classList.add("user-message");
    }
    msgElement.innerHTML = `
        <span class="timestamp">${formatTimestamp(timestamp)}</span>
        <span class="chat-username">${user}:</span>
        <span class="chat-content">${message}</span>
    `;

    // Append the new message to the bottom
    chatBox.append(msgElement);

    // Automatically scroll to the bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Listen for changes in the chat messages
onValue(chatRef, (snapshot) => {
    const chatBox = document.getElementById("chat-box");

    if (!isChatOpen) {
        chatBox.innerHTML = "<p style='text-align: center; color: #888;'>Chat is currently closed.</p>";
        return;
    }

    chatBox.innerHTML = ""; // Clear chat box content

    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            displayMessage(childSnapshot);
        });
    } else if (isChatOpen) {
        chatBox.innerHTML = "<p style='text-align: center; color: #888;'>No messages available.</p>";
    }
});

export { sendMessage };
