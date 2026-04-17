/* Get references to DOM elements */
const workerUrl = "https://openai-api-key.tjhower2004.workers.dev/";
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateBtn");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;
//* CONVERSATION STATE *//
/* Load product data from JSON file */
let selectedProducts = [];
let messages = [
  {
    role: "system",
    content: `
You are a professional beauty assistant for L'Oréal.

Your role is to:
- Build personalized routines for skincare, haircare, makeup, and fragrance
- Use selected products when provided
- Keep responses clear, structured, and practical

Rules:
- Only discuss beauty-related topics
- Organize routines into Morning / Evening
- Be concise and helpful
`,
  },
];

//* PRODUCT MANAGEMENT *//
/* Load products */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}
/* Display products */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.id === product.id);

      return `
      <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
      </div>
    `;
    })
    .join("");

  attachProductClickHandlers(products);
}
/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const filtered = products.filter((p) => p.category === e.target.value);
  displayProducts(filtered);
});
/* Handle product card clicks to toggle selection */
function attachProductClickHandlers(products) {
  const cards = document.querySelectorAll(".product-card");

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const product = products.find((p) => p.id == id);

      const exists = selectedProducts.some((p) => p.id == id);
      if (exists) {
        // REMOVE
        selectedProducts = selectedProducts.filter((p) => p.id != id);
      } else {
        // ADD
        selectedProducts.push(product);
      }
      // Update UI
      card.classList.toggle("selected");
      updateSelectedProductsUI();
    });
  });
}
/* Render selected products list */
function updateSelectedProductsUI() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = "<p>No products selected</p>";
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product" data-id="${product.id}">
        <span>${product.name}</span>
        <button class="remove-btn">✕</button>
      </div>
    `,
    )
    .join("");

  attachRemoveHandlers();
}
/* Remove from selected list */
function attachRemoveHandlers() {
  const buttons = document.querySelectorAll(".remove-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const parent = btn.closest(".selected-product");
      const id = parent.dataset.id;
      // remove from state
      selectedProducts = selectedProducts.filter((p) => p.id != id);
      // update UI
      updateSelectedProductsUI();
      // un-highlight corresponding card
      const card = document.querySelector(`.product-card[data-id="${id}"]`);
      if (card) card.classList.remove("selected");
    });
  });
}

//* GENERATE ROUTINE BUTTON *//
generateBtn.addEventListener("click", () => {
  if (!selectedProducts.length) {
    addMessage("Please select products first.", "bot");
    return;
  }

  const prompt = `
Create a personalized beauty routine using these products:

${selectedProducts.map((p) => `- ${p.name}`).join("\n")}

Requirements:
- Morning and Evening routine
- Step-by-step instructions
- Keep it concise
`;

  sendToChat(prompt);
});
const MAX_MESSAGES = 20;

//* CHATBOX UI HELPERS *//
function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = content;
}

function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  messageDiv.textContent = content;

  // start hidden
  messageDiv.style.opacity = "0";

  chatWindow.appendChild(messageDiv);

  // trigger animation
  messageDiv.offsetHeight;
  messageDiv.style.opacity = "";
  messageDiv.classList.add("animate");

  // scroll to bottom after append
  scrollToBottom(true);
  function scrollToBottom(force = false) {
    const threshold = 120;

    const isNearBottom =
      chatWindow.scrollHeight - chatWindow.scrollTop <=
      chatWindow.clientHeight + threshold;

    if (force || isNearBottom) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }
}
/* typing dots */
function createTypingIndicator() {
  const div = document.createElement("div");
  div.classList.add("message", "bot");

  div.innerHTML = `
    <div class="typing">
      <span></span><span></span><span></span>
    </div>
  `;

  return div;
}
/* typewriter effect */
function typeWriter(element, text, speed = 18) {
  let i = 0;
  element.textContent = "";

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;

      //scroll during typing
      scrollToBottom();

      setTimeout(type, speed);
    }
  }

  type();
}

/* scroll effect */

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  const max = 300;
  const opacity = Math.min(scrollY / max, 1);

  document.body.style.setProperty("--scroll-dark", opacity);
});

//* INITIAL MESSAGE *//
addMessage(
  "👋 Hello! Ask me about L’Oréal products or generate a routine!",
  "bot",
);

//* FORM SUBMIT HANDLER *//
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const userInput = userInput.value.trim();
  if (!userInput) return;

  /* show user message */
  addMessage(userInput, "user");
  /* store message */
  messages.push({
    role: "user",
    content: userInput,
  });
  /* trim history */
  if (messages.length > MAX_MESSAGES) {
    messages = [messages[0], ...messages.slice(-MAX_MESSAGES)];
  }
  userInput.value = "";
});

/* typing indicator */
const loadingMsg = createTypingIndicator();
chatWindow.appendChild(loadingMsg);
scrollToBottom(true);

try {
  const res = await fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Raw response:", text);
    throw new Error("Invalid JSON");
  }

  chatWindow.removeChild(loadingMsg);

  if (!data.chooices || !data.choices[0]) {
    console.error("Bad response:", data);
    throw new Error("Invalid API structure");
  }

  const botReply = data.choices[0].message.content;

  /* create bot message container */
  const botDiv = document.createElement("div");
  botDiv.classList.add("message", "bot");

  chatWindow.appendChild(botDiv);
  /* animate in */
  botDiv.style.opacity = "0";
  botDiv.offsetHeight;
  botDiv.style.opacity = "";
  botDiv.classList.add("animate");

  scrollToBottom(true);

  /* typewriter */
  typeWriter(botDiv, botReply);

  /* store reply */
  messages.push({
    role: "assistant",
    content: botReply,
  });
} catch (err) {
  chatWindow.removeChild(loadingMsg);

  addMessage("⚠️ Sorry, soomething went wrong. Please try again", "bot");
  console.error(err);
}
