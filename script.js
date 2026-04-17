/* =========================
   DOM ELEMENTS
========================= */
const workerUrl = "https://openai-api-key.tjhower2004.workers.dev/";

const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateBtn");

/* =========================
   STATE
========================= */
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

const MAX_MESSAGES = 20;

/* =========================
   INIT UI
========================= */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

addMessage(
  "👋 Hello! Ask me about L’Oréal products or generate a routine!",
  "bot",
);

/* =========================
   SCROLL (OLD UX RESTORED)
========================= */
function scrollToBottom(force = false) {
  const threshold = 120;

  const isNearBottom =
    chatWindow.scrollHeight - chatWindow.scrollTop <=
    chatWindow.clientHeight + threshold;

  if (force || isNearBottom) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

/* =========================
   MESSAGE UI (OLD STYLE RESTORED)
========================= */
function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = content;

  // OLD STYLE FADE-IN
  messageDiv.style.opacity = "0";

  chatWindow.appendChild(messageDiv);

  messageDiv.offsetHeight;
  messageDiv.style.opacity = "1";
  messageDiv.classList.add("animate");

  scrollToBottom(true);
}

/* =========================
   TYPING INDICATOR
========================= */
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

/* =========================
   TYPEWRITER (OLD UX FEEL)
========================= */
function typeWriter(element, text, speed = 18) {
  let i = 0;
  element.textContent = "";

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i++);
      scrollToBottom();
      setTimeout(type, speed);
    }
  }

  type();
}

/* =========================
   PRODUCT FUNCTIONS
========================= */
async function loadProducts() {
  const res = await fetch("products.json");
  const data = await res.json();
  return data.products;
}

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

categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const filtered = products.filter((p) => p.category === e.target.value);
  displayProducts(filtered);
});

/* =========================
   PRODUCT SELECTION
========================= */
function attachProductClickHandlers(products) {
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const product = products.find((p) => p.id == id);

      const exists = selectedProducts.some((p) => p.id == id);

      if (exists) {
        selectedProducts = selectedProducts.filter((p) => p.id != id);
      } else {
        selectedProducts.push(product);
      }

      card.classList.toggle("selected");
      updateSelectedProductsUI();
    });
  });
}

function updateSelectedProductsUI() {
  if (!selectedProducts.length) {
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

function attachRemoveHandlers() {
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const id = btn.closest(".selected-product").dataset.id;

      selectedProducts = selectedProducts.filter((p) => p.id != id);
      updateSelectedProductsUI();

      const card = document.querySelector(`.product-card[data-id="${id}"]`);
      if (card) card.classList.remove("selected");
    });
  });
}

/* =========================
   CORE CHAT FUNCTION (UNIFIED PIPELINE)
========================= */
async function sendToChat(userText) {
  /* user message */
  addMessage(userText, "user");

  /* inject selected products */
  const selectedContext = selectedProducts.length
    ? `Selected products:\n${selectedProducts.map((p) => `- ${p.name}`).join("\n")}`
    : "No selected products.";

  messages[0].content = messages[0].content + "\n\n" + selectedContext;

  messages.push({ role: "user", content: userText });

  if (messages.length > MAX_MESSAGES) {
    messages = [messages[0], ...messages.slice(-MAX_MESSAGES)];
  }

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

    const data = await res.json();

    chatWindow.removeChild(loadingMsg);

    if (!data.choices || !data.choices[0]) {
      throw new Error("Bad API response");
    }

    const botReply = data.choices[0].message.content;

    /* bot message (OLD UX STYLE) */
    const botDiv = document.createElement("div");
    botDiv.classList.add("message", "bot");

    botDiv.style.opacity = "0";
    chatWindow.appendChild(botDiv);

    botDiv.offsetHeight;
    botDiv.style.opacity = "1";
    botDiv.classList.add("animate");

    scrollToBottom(true);

    typeWriter(botDiv, botReply);

    messages.push({ role: "assistant", content: botReply });
  } catch (err) {
    chatWindow.removeChild(loadingMsg);
    addMessage("⚠️ Something went wrong.", "bot");
    console.error(err);
  }
}

/* =========================
   CHAT INPUT (USES SAME PIPELINE)
========================= */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  sendToChat(text);
});

/* =========================
   GENERATE ROUTINE BUTTON (SAME SYSTEM)
========================= */
generateBtn.addEventListener("click", () => {
  if (!selectedProducts.length) {
    addMessage("Please select products first.", "bot");
    return;
  }

  const prompt = `
Create a personalized beauty routine using:

${selectedProducts.map((p) => `- ${p.name}`).join("\n")}

Include:
- Morning + Evening steps
- Simple instructions
`;

  sendToChat(prompt);
});
