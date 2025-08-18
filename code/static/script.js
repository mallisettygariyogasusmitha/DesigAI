document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("send-btn");
  const userInput = document.getElementById("user-input");
  const preview = document.getElementById("prototype-preview");
  const deviceFrame = document.getElementById("device-frame");
  const historyList = document.getElementById("chat-history");

  const colorBtn = document.getElementById("color-palettes-btn");
  const typoBtn = document.getElementById("typography-btn");
  const uxBtn = document.getElementById("ux-templates-btn");
  const genBtn = document.getElementById("generate-proto-btn");
  const downloadBtn = document.getElementById("download-btn");
  const deviceSelect = document.getElementById("device-select");

  let state = {
    siteTitle: "",
    theme: { primary: "#2563eb", accent: "#0f172a", bg: "#ffffff" },
    typography: { heading: "Poppins", body: "Inter" },
    sections: null,
    layout: "cards" // Options: 'cards' | 'gallery' | 'list'
  };

  // -------- Helpers ----------
  const applyTheme = (theme) => {
    document.documentElement.style.setProperty("--primary", theme.primary || "#2563eb");
    document.documentElement.style.setProperty("--accent", theme.accent || "#0f172a");
    document.documentElement.style.setProperty("--bg", theme.bg || "#ffffff");
    document.body.style.transition = "background 0.4s ease";
    document.body.style.background = theme.bg;
  };

  const loadGoogleFonts = (heading, body) => {
    const make = (n) => n.replace(/\s+/g, "+") + ":wght@400;600;700";
    const href = `https://fonts.googleapis.com/css2?family=${make(heading)}&family=${make(body)}&display=swap`;
    let link = document.getElementById("dynamic-fonts");
    if (!link) {
      link = document.createElement("link");
      link.id = "dynamic-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
    document.documentElement.style.setProperty("--font-heading", `'${heading}', system-ui, sans-serif`);
    document.documentElement.style.setProperty("--font-body", `'${body}', system-ui, sans-serif`);
  };

  const addHistory = (text) => {
    const li = document.createElement("li");
    li.textContent = text;
    li.style.opacity = 0;
    historyList.prepend(li);
    setTimeout(() => (li.style.opacity = 1), 50);
  };

  const navHTML = (title, sections) => {
    const keys = Object.keys(sections);
    // Always move "home" section to first
    keys.sort((a, b) => (a.toLowerCase() === "home" ? -1 : b.toLowerCase() === "home" ? 1 : 0));

    const links = keys
      .map((k, i) => `<a href="#" data-page="${k}" class="${i === 0 ? "active" : ""}">${sections[k].title}</a>`)
      .join("");

    return `
      <header class="ui-header fade-in">
        <h1 class="ui-title">${title}</h1>
        <nav class="ui-nav">${links}</nav>
      </header>
      <section id="ui-content" class="ui-content fade-in"></section>
    `;
  };

  const sectionHTML = (sec) => {
    // Special design for "Contact Us"
    if (sec.title.toLowerCase() === "contact us") {
      return `
        <h2 class="sec-title">${sec.title}</h2>
        <p class="sec-desc" style="font-size: 1.3rem; line-height: 1.8; margin-bottom: 20px;">
          ${sec.description || "Feel free to reach out to us anytime. We're here to help!"}
        </p>
        <div class="contact-icons fade-in">
          <a href="#" class="contact-icon" style="color:#E4405F;"><i class="fab fa-instagram"></i></a>
          <a href="#" class="contact-icon" style="color:#0A66C2;"><i class="fab fa-linkedin"></i></a>
          <a href="#" class="contact-icon" style="color:#1877F2;"><i class="fab fa-facebook"></i></a>
          <a href="#" class="contact-icon" style="color:#DB4437;"><i class="fab fa-google"></i></a>
        </div>
      `;
    }

    // Normal section
    const textBlock = `
      <h2 class="sec-title">${sec.title}</h2>
      <p class="sec-desc">${sec.description}</p>
      <div class="extra-text fade-in">
        <p>${sec.extra || "Explore amazing content curated for your needs."}</p>
      </div>
    `;

    if (!sec.images || sec.images.length === 0) {
      return textBlock;
    }

    if (state.layout === "gallery") {
      return `
        ${textBlock}
        <div class="img-grid fade-in">
          ${sec.images.map((u) => `<figure class="img-card"><img src="${u}" alt=""></figure>`).join("")}
        </div>
      `;
    }

    if (state.layout === "list") {
      return `
        ${textBlock}
        ${sec.images
          .map(
            (u, i) => `
          <article class="img-card fade-in">
            <div class="card-title">Item ${i + 1}</div>
            <p class="card-text">Detailed description of the item for better user understanding.</p>
            <img src="${u}" alt="">
          </article>
        `
          )
          .join("")}
      `;
    }

    return `
      ${textBlock}
      <div class="img-grid fade-in">
        ${sec.images
          .map(
            (u, i) => `
          <figure class="img-card fade-in">
            <img src="${u}" alt="">
            <figcaption class="card-title">Sample ${i + 1}</figcaption>
            <p class="card-text">Detailed explanation about Sample ${i + 1} for better engagement.</p>
          </figure>`
          )
          .join("")}
      </div>
    `;
  };

  const renderShell = () => {
    preview.innerHTML = navHTML(state.siteTitle || "Your Site", state.sections);
    preview.querySelectorAll(".ui-nav a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        preview.querySelectorAll(".ui-nav a").forEach((x) => x.classList.remove("active"));
        a.classList.add("active");
        renderPage(a.dataset.page);
      });
    });
  };

  const renderPage = (key) => {
    if (!state.sections) return;
    const sec = state.sections[key];
    const content = preview.querySelector("#ui-content");
    content.style.opacity = 0;
    setTimeout(() => {
      content.innerHTML = sectionHTML(sec);
      content.style.opacity = 1;
      animateCards();
      animateIcons();
    }, 200);
  };

  const animateCards = () => {
    document.querySelectorAll(".img-card").forEach((card, i) => {
      card.style.opacity = 0;
      card.style.transform = "translateY(20px)";
      setTimeout(() => {
        card.style.transition = "all 0.5s ease";
        card.style.opacity = 1;
        card.style.transform = "translateY(0)";
      }, i * 100);
    });
  };

  const animateIcons = () => {
    document.querySelectorAll(".contact-icon").forEach((icon, i) => {
      icon.style.fontSize = "40px"; // Increased icon size
      icon.style.margin = "0 15px"; // Adds horizontal space between icons
      icon.style.opacity = 0;
      icon.style.transform = "scale(0.8)";
      setTimeout(() => {
        icon.style.transition = "all 0.4s ease";
        icon.style.opacity = 1;
        icon.style.transform = "scale(1)";
      }, i * 150);
    });
  };

  // -------- Actions ----------
  sendBtn.addEventListener("click", async () => {
    const prompt = userInput.value.trim();
    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }

    addHistory(`User: ${prompt}`);
    preview.innerHTML = `<div class="placeholder fade-in">Generating design…</div>`;

    try {
      const r = await fetch("/generate_prototype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await r.json();

      if (!data.sections) {
        throw new Error("Invalid response: Missing sections");
      }

      state.siteTitle = data.siteTitle || "My Website";
      state.theme = data.theme || state.theme;
      state.typography = data.typography || state.typography;
      state.sections = data.sections;

      applyTheme(state.theme);
      loadGoogleFonts(state.typography.heading, state.typography.body);

      renderShell();
      renderPage(Object.keys(state.sections)[0]);
    } catch (err) {
      console.error(err);
      preview.innerHTML = `<div class="placeholder" style="color:#b91c1c">Error generating design.</div>`;
    }
  });

  // Device Preview Toggle
  deviceSelect.addEventListener("change", () => {
    deviceFrame.classList.remove("device-laptop", "device-tablet", "device-mobile");
    const map = { laptop: "device-laptop", tablet: "device-tablet", mobile: "device-mobile" };
    deviceFrame.classList.add(map[deviceSelect.value] || "device-laptop");
  });

  // Color Palette Switch
  colorBtn.addEventListener("click", () => {
    const hues = ["#2563eb", "#22c55e", "#ef4444", "#f59e0b", "#a855f7", "#06b6d4", "#ea580c", "#0ea5e9"];
    state.theme.primary = hues[Math.floor(Math.random() * hues.length)];
    applyTheme(state.theme);
  });

  // Typography Switch
  typoBtn.addEventListener("click", () => {
    const combos = [
      { heading: "Poppins", body: "Inter" },
      { heading: "Montserrat", body: "Open Sans" },
      { heading: "Playfair Display", body: "Work Sans" },
      { heading: "Raleway", body: "Nunito Sans" },
      { heading: "Lora", body: "Rubik" }
    ];
    const pick = combos[Math.floor(Math.random() * combos.length)];
    state.typography = pick;
    loadGoogleFonts(pick.heading, pick.body);
  });

  // UX Layout Switch
  uxBtn.addEventListener("click", () => {
    const order = ["cards", "gallery", "list"];
    const i = order.indexOf(state.layout);
    state.layout = order[(i + 1) % order.length];
    const active = preview.querySelector(".ui-nav a.active")?.dataset.page || Object.keys(state.sections)[0];
    renderPage(active);
  });

  // Regenerate Prototype
  genBtn.addEventListener("click", () => {
    if (!state.sections) return;
    renderShell();
    renderPage(Object.keys(state.sections)[0]);
  });

  // Download Prototype as Image
  downloadBtn.addEventListener("click", async () => {
    const node = document.getElementById("prototype-preview");
    const canvas = await html2canvas(node, { backgroundColor: null, scale: 2 });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "prototype.png";
    a.click();
  });
});
