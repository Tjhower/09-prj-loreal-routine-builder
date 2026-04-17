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
const generateBtn = document.getElementById("generateRoutine");

const productModal = document.getElementById("productModal");
const modalClose = document.getElementById("modalClose");

const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalBrand = document.getElementById("modalBrand");
const modalDescription = document.getElementById("modalDescription");

//* Language Togggle *//
function setDirection(lang) {
  const isRTL = ["ar", "he", "fa", "ur"].includes(lang);

  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

/* =========================
   STATE
========================= */
const baseSystemPrompt = `
You are a professional beauty assistant for L'Oréal.

Your role is to:
- Build personalized routines for skincare, haircare, makeup, and fragrance
- Use selected products when provided
- Keep responses clear, structured, and practical

Rules:
- Only discuss beauty-related topics
- Organize routines into Morning / Evening
- Be concise and helpful
`;

let selectedProducts = [];
let messages = [
  {
    role: "system",
    content: baseSystemPrompt,
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
  MODAL FUNCTIONS
========================= */
// OPEN
function openProductModal(product) {
  modalImage.src = product.image;
  modalTitle.textContent = product.name;
  modalBrand.textContent = product.brand;
  modalDescription.textContent = product.description;

  productModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// CLOSE
function closeProductModal() {
  productModal.classList.remove("active");
  document.body.style.overflow = "";
}

// X button
modalClose.addEventListener("click", closeProductModal);

// backdrop click
productModal.addEventListener("click", (e) => {
  if (e.target === productModal) {
    closeProductModal();
  }
});

// escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && productModal.classList.contains("active")) {
    closeProductModal();
  }
});
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
        
        <!-- INFO ICON -->
        <button class="info-icon" aria-label="View product details">
          <i class="fa-solid fa-circle-info"></i>
        </button>

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
    card.addEventListener("click", (e) => {
      const id = card.dataset.id;
      const product = products.find((p) => p.id == id);

      // If info icon clicked → OPEN MODAL ONLY
      if (e.target.closest(".info-icon")) {
        openProductModal(product);
        return;
      }

      // Otherwise → SELECT PRODUCT
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

function buildSystemMessage() {
  const selectedContext = selectedProducts.length
    ? `Selected products:\n${selectedProducts.map((p) => `- ${p.name}`).join("\n")}`
    : "No selected products.";

  return {
    role: "system",
    content: baseSystemPrompt + "\n\n" + selectedContext,
  };
}
/* =========================
   CORE CHAT FUNCTION (UNIFIED PIPELINE)
========================= */
async function sendToChat(userText) {
  addMessage(userText, "user");

  const loadingMsg = createTypingIndicator();
  chatWindow.appendChild(loadingMsg);
  scrollToBottom(true);

  const systemMessage = buildSystemMessage();

  const conversationMessages = [
    systemMessage,
    ...messages.filter((m) => m.role !== "system"),
    { role: "user", content: userText },
  ];

  try {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationMessages }),
    });

    const data = await res.json();

    chatWindow.removeChild(loadingMsg);

    if (!data.choices?.[0]) {
      throw new Error("Bad API response");
    }

    const botReply = data.choices[0].message.content;

    const botDiv = document.createElement("div");
    botDiv.classList.add("message", "bot");

    botDiv.style.opacity = "0";
    chatWindow.appendChild(botDiv);

    botDiv.offsetHeight;
    botDiv.style.opacity = "1";
    botDiv.classList.add("animate");

    typeWriter(botDiv, botReply);

    messages.push({ role: "assistant", content: botReply });

    scrollToBottom(true);
    return true;
  } catch (err) {
    chatWindow.removeChild(loadingMsg);
    addMessage("⚠️ Something went wrong.", "bot");
    console.error(err);
    throw err;
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
   GENERATE ROUTINE BUTTON
========================= */
generateBtn.addEventListener("click", async () => {
  if (!selectedProducts.length) {
    addMessage("Please select products first.", "bot");
    return;
  }

  const btnContent = generateBtn.querySelector(".btn-content");
  const btnLoader = generateBtn.querySelector(".btn-loader");

  // START loading
  generateBtn.disabled = true;
  generateBtn.classList.add("loading");
  btnContent.classList.add("hidden");
  btnLoader.classList.remove("hidden");

  const prompt = `
Create a personalized beauty routine using:

${selectedProducts.map((p) => `- ${p.name}`).join("\n")}

Include:
- Morning + Evening steps
- Simple instructions
`;

  try {
    await sendToChat(prompt);
  } catch (err) {
    console.error("Generate routine failed:", err);
  } finally {
    // RESET BUTTON
    generateBtn.disabled = false;
    generateBtn.classList.remove("loading");
    btnContent.classList.remove("hidden");
    btnLoader.classList.add("hidden");

    // STEP 1: scroll chatBOX (not chatWindow)
    const chatbox = document.querySelector(".chatbox");

    chatbox.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // STEP 2: trigger glow AFTER scroll begins
    setTimeout(() => {
      triggerChatGlow();
    }, 500);
  }
});
// generated routine glow
function triggerChatGlow() {
  const chatbox = document.querySelector(".chatbox");

  // restart animation cleanly
  chatbox.classList.remove("glow-highlight");

  // force reflow so animation can restart
  void chatbox.offsetWidth;

  chatbox.classList.add("glow-highlight");

  // remove class after animation ends
  setTimeout(() => {
    chatbox.classList.remove("glow-highlight");
  }, 1200);
}

//* Toggle RTL switch *//
const langSwitch = document.getElementById("rtlToggle");

let isRTL = false;

langSwitch.addEventListener("click", () => {
  isRTL = !isRTL;

  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = isRTL ? "ar" : "en";

  langSwitch.classList.toggle("active-ar", isRTL);
  langSwitch.classList.toggle("active-en", !isRTL);

  refreshLayoutAfterDirectionChange();
});

function refreshLayoutAfterDirectionChange() {
  setTimeout(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 100);
}
