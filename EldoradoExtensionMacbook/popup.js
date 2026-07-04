document.getElementById("fillBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let text = document.getElementById("dataInput").value;

  if (!text.trim()) {
    alert("Vui lòng dán dữ liệu vào ô text!");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runEldoradoAutomation,
    args: [text],
  });

  window.close();
});

function runEldoradoAutomation(rawText) {
  // ==========================================
  // 1. TRÍCH XUẤT 3 THÀNH PHẦN (USERNAME, TITLE, BODY)
  // ==========================================
  function parseData(str) {
    let lines = str
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    if (lines.length < 3) {
      console.error(
        "Dữ liệu không đủ số dòng (cần ít nhất Username, Title và thông tin Body).",
      );
      return null;
    }

    let username = lines[0];
    let title = lines[1];
    let bodyRawText = lines.slice(2).join("\n");

    let data = {};
    for (let i = 2; i < lines.length; i++) {
      let line = lines[i];
      let index = line.indexOf(":");
      if (index !== -1) {
        let key = line.substring(0, index).trim();
        let val = line.substring(index + 1).trim();
        data[key] = val;
      }
    }

    return { username, title, bodyRawText, data };
  }

  const parsed = parseData(rawText);
  if (!parsed) return;

  // ==========================================
  // 2. CÔNG CỤ HỖ TRỢ AUTOMATION (WAIT & DELAY)
  // ==========================================
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitForElement = (selector, timeout = 8000) => {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  };

  // ==========================================
  // 3. BỘ MAPPER LOGIC VÀ TÍNH GIÁ
  // ==========================================
  function mapLevel(raw_level) {
    let lvl = parseInt(raw_level) || 0;
    if (lvl >= 80) return "Level 80";
    if (lvl >= 70) return "Level 70-79";
    if (lvl >= 60) return "Level 60-70";
    if (lvl >= 50) return "Level 50-60";
    if (lvl >= 40) return "Level 40-50";
    if (lvl >= 30) return "Level 30-40";
    if (lvl >= 20) return "Level 20-30";
    if (lvl >= 10) return "Level 10-20";
    return "Level 0-10";
  }

  function mapItems(raw_quantity) {
    return "Other";
  }

  function mapLegendaryPokemons(raw_quantity) {
    let qty = parseInt(raw_quantity) || 0;
    if (qty >= 200) return "200+";
    if (qty >= 150) return "150-199";
    if (qty >= 100) return "100-149";
    if (qty >= 75) return "75-99";
    if (qty >= 50) return "50-74";
    if (qty >= 25) return "25-49";
    return "0-24";
  }

  function mapMythicalPokemons(raw_quantity) {
    let qty = parseInt(raw_quantity) || 0;
    if (qty >= 50) return "50+";
    if (qty >= 20) return "20-49";
    if (qty >= 10) return "10-19";
    if (qty >= 5) return "5-9";
    return "0-4";
  }

  function mapStardust(amount) {
    let amt = parseInt(amount) || 0;
    if (amt >= 10000000) return "10M+";
    if (amt >= 7000000) return "7M-9.99M";
    if (amt >= 5000000) return "5M-6.99M";
    if (amt >= 1000000) return "1M-4.99M";
    if (amt >= 500000) return "500K-999K";
    return "0-499K";
  }

  function mapHundoPokemons(raw_quantity) {
    let qty = parseInt(raw_quantity) || 0;
    if (qty >= 200) return "200+";
    if (qty >= 150) return "150-199";
    if (qty >= 100) return "100-149";
    if (qty >= 75) return "75-99";
    if (qty >= 50) return "50-74";
    if (qty >= 25) return "25-49";
    return "0-24";
  }

  function mapTeam(team_name) {
    if (!team_name) return "Other";
    if (team_name.includes("Instinct")) return "Instinct";
    if (team_name.includes("Mystic")) return "Mystic";
    if (team_name.includes("Valor")) return "Valor";
    return "Other";
  }

  function mapPokeCoins(amount) {
    const amt = parseInt(amount, 10) || 0;
    if (amt >= 50000) return "50K+";
    if (amt >= 10000) return "10K-49.99K";
    if (amt >= 5000) return "5K-9.99K";
    if (amt >= 1000) return "1K-4.99K";
    return "0-999";
  }

  function mapOriginalEmail() {
    return "No";
  }

  function mapShinyPokemons(rawQuantity) {
    const qty = parseInt(rawQuantity, 10) || 0;
    if (qty >= 200) return "200+";
    if (qty >= 150) return "150-199";
    if (qty >= 100) return "100-149";
    if (qty >= 75) return "75-99";
    if (qty >= 50) return "50-74";
    if (qty >= 25) return "25-49";
    return "0-24";
  }

  function calculatePrice(titleText, parsedData) {
    let cleanStr = titleText
      .toLowerCase()
      .replace(/\u00A0/g, " ")
      .replace(/\n/g, " ")
      .replace(/,/g, " ");

    // 1. Tính Year Bonus
    let bBonus = 0;
    if (cleanStr.includes("account 2016") || cleanStr.includes("acc 2016"))
      bBonus = 0.5;
    else if (cleanStr.includes("account 2017") || cleanStr.includes("acc 2017"))
      bBonus = 0.4;
    else if (cleanStr.includes("account 2018") || cleanStr.includes("acc 2018"))
      bBonus = 0.3;
    else if (cleanStr.includes("account 2019") || cleanStr.includes("acc 2019"))
      bBonus = 0.2;

    // 2. Tính Level Bonus
    let cBonus = 0;
    let lvlMatch = cleanStr.match(/(?:level|lv)\s*(\d+)/);
    let lvlNum = lvlMatch ? parseInt(lvlMatch[1], 10) : 0;
    if (lvlNum > 0) {
      if (lvlNum < 30) cBonus = -0.2;
      else if (lvlNum >= 40 && lvlNum <= 48) cBonus = 0.1;
      else if (lvlNum === 49) cBonus = 0.3;
      else if (lvlNum === 50) cBonus = 1.0;
      else if (lvlNum === 51) cBonus = 1.1;
      else if (lvlNum >= 52 && lvlNum <= 58) cBonus = 1.5;
      else if (lvlNum === 59) cBonus = 1.7;
      else if (lvlNum === 60) cBonus = 2.0;
      else if (lvlNum === 61) cBonus = 2.1;
      else if (lvlNum >= 62 && lvlNum <= 68) cBonus = 2.5;
      else if (lvlNum === 69) cBonus = 2.7;
      else if (lvlNum >= 70) cBonus = 3.0;
    }

    // 3. Tính Pokemon Bonus
    let dBonus = 0;
    let pkmMatch = cleanStr.match(/(\d+)\s*(?:pokemon|pkm)/);
    let pkmNum = pkmMatch ? parseInt(pkmMatch[1], 10) : 0;
    if (pkmMatch) {
      if (pkmNum < 100) dBonus = -0.2;
      else if (pkmNum >= 250 && pkmNum < 400) dBonus = 0.1;
      else if (pkmNum >= 400) dBonus = 0.2;
    }

    // 4. Tính Bag Bonus
    let bagBonus = 0;
    let bagMatch =
      cleanStr.match(/bag items\s*(\d+)/) || cleanStr.match(/bag\s*(\d+)/);
    let bagNum = bagMatch ? parseInt(bagMatch[1], 10) : 0;
    let hasStardust = cleanStr.includes("stardust");
    if (bagMatch) {
      if (bagNum >= 800 && hasStardust) bagBonus = 0.2;
      else if (bagNum >= 800) bagBonus = 0.1;
      else if (bagNum >= 750 && hasStardust) bagBonus = 0.1;
    }

    // 5. Tính Ultra Beast / Mythical Bonus
    let ubMatch = cleanStr.match(/(\d+)\s*ultra beasts iv 100/);
    let vUb = ubMatch ? parseInt(ubMatch[1], 10) : 0;
    let mythMatch = cleanStr.match(/(\d+)\s*mythical iv 100/);
    let vMyth = mythMatch ? parseInt(mythMatch[1], 10) : 0;
    let ubMythBonus = (vUb + vMyth) * 0.2;

    // ==========================================
    // --- PHẦN FIX LỖI BASE PRICE TÍNH TOTAL ITEMS ---
    // ==========================================
    const getCount = (regex) => {
      let match = cleanStr.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Lấy chính xác từng loại Item với phủ định (lookahead) để tránh bắt chéo
    let shinyCount = getCount(/(\d+)\s*shiny(?!\s*legend)/);
    let legendCount = getCount(/(\d+)\s*legend(?!\s*iv)/);
    let iv100Count = getCount(/(\d+)\s*iv\s*100/);
    let shinyLegendCount = getCount(/(\d+)\s*shiny\s*legend/);
    let shadowLegendCount = getCount(/(\d+)\s*shadow\s*legend/);
    let legendIv100Count = getCount(/(\d+)\s*legend\s*iv\s*100/);

    // Tính Cột A (TỔNG ITEMS) giống hệt trong Sheet
    let totalItems =
      shinyCount +
      legendCount +
      iv100Count +
      shinyLegendCount +
      shadowLegendCount +
      legendIv100Count;

    // Ưu tiên dùng biến "Tổng Items" truyền vào (nếu có), không thì dùng số tự bóc tách được
    if (parsedData && parsedData["Tổng Items"]) {
      totalItems = parseInt(parsedData["Tổng Items"], 10) || totalItems;
    }

    // Tính basePrice dựa vào Total Items
    let basePrice = 3 + (totalItems - 5) * 0.1;

    // 6. Tính Tổng Cuối
    let total = basePrice + bBonus + cBonus + dBonus + bagBonus + ubMythBonus;
    return Number(Math.max(0, total).toFixed(2)).toString();
  }

  // ==========================================
  // 4. LUỒNG TỰ ĐỘNG CHUYỂN TRANG
  // ==========================================
  async function executeNavigationFlow() {
    const newOfferBtn = document.querySelector(
      'a[data-testid="order-page-create-new-offer-button-Nax2"]',
    );
    if (newOfferBtn) {
      newOfferBtn.click();
      await delay(500);
    }
    const accountCategory = await waitForElement(
      'a[href="/sell/offer/Account"]',
    );
    if (accountCategory) {
      accountCategory.click();
      await delay(500);
    }
    const combobox = await waitForElement(
      'eld-dropdown[formcontrolname="gameId"] div[role="combobox"]',
    );
    if (combobox) {
      combobox.click();
      await delay(500);
      const searchInput = document.querySelector("input.search-input");
      if (searchInput) {
        searchInput.value = "Pokemon Go";
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        await delay(500);
      }
      const options = Array.from(
        document.querySelectorAll("div.dropdown-option"),
      );
      const pogoOption = options.find((opt) =>
        opt.textContent.trim().includes("Pokemon Go"),
      );
      if (pogoOption) {
        pogoOption.click();
        await delay(800);
      }
    }
    const nextBtn = await waitForElement(
      "div.next-button a.button__primary:not(.button__disabled)",
    );
    if (nextBtn) {
      nextBtn.click();
    }
    const formReady = await waitForElement(
      'textarea[data-testid="offer-edit-page-description-textarea-6ZVk"]',
      10000,
    );
    return !!formReady;
  }

  // ==========================================
  // 5. LOGIC ĐIỀN FORM VÀ UI NỔI
  // ==========================================
  async function selectEldoradoDropdown(labelName, targetValue) {
    if (!targetValue) return;
    const allFields = Array.from(document.querySelectorAll("div.mb-1"));
    const fieldContainer = allFields.find((f) => {
      const span = f.querySelector("span");
      return span && span.textContent.trim() === labelName;
    });
    if (!fieldContainer) return;

    const parentElement = fieldContainer.parentElement;
    const combobox = parentElement
      ? parentElement.querySelector('div[role="combobox"]')
      : null;

    if (combobox) {
      combobox.click();
      await delay(400);
      const searchInput = parentElement.querySelector("input.search-input");
      if (searchInput) {
        searchInput.value = targetValue;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        await delay(300);
      }
      const options = Array.from(
        document.querySelectorAll("div.dropdown-option"),
      );
      const matchedOption = options.find(
        (opt) => opt.textContent.trim() === targetValue,
      );
      if (matchedOption) matchedOption.click();
      else combobox.click();
      await delay(300);
    }
  }

  async function autoCheckTerms() {
    const termsCheckboxes = ["Terms of Service", "Seller Rules"];
    for (const label of termsCheckboxes) {
      const checkbox = document.querySelector(`input[aria-label="${label}"]`);
      if (checkbox && !checkbox.checked) {
        checkbox.click();
        await delay(200);
      }
    }
  }

  // --- HÀM TẠO NÚT TRỢ LÝ NỔI TRÊN TRANG ---
  function injectHelperWidget(folderPath) {
    // Xóa cái cũ nếu có để tránh trùng lặp
    const oldWidget = document.getElementById("pogo-helper-widget");
    if (oldWidget) oldWidget.remove();

    const widget = document.createElement("div");
    widget.id = "pogo-helper-widget";
    widget.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 999999;
      background: #ffb600;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      font-family: 'Segoe UI', Tahoma, sans-serif;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      animation: slideIn 0.4s ease-out;
    `;

    // Thêm animation CSS trực tiếp
    const style = document.createElement("style");
    style.innerHTML = `@keyframes slideIn { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
    document.head.appendChild(style);

    const text = document.createElement("span");
    text.innerText = "Đã điền form xong! Bước cuối:";
    text.style.cssText = "color: #14131a; font-weight: 600; font-size: 14px;";

    const actionBtn = document.createElement("button");
    actionBtn.innerText = "📁 Mở Upload & Copy Đường Dẫn";
    actionBtn.style.cssText = `
      background: #14131a;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background 0.2s;
    `;

    actionBtn.onmouseover = () => (actionBtn.style.background = "#333");
    actionBtn.onmouseout = () => (actionBtn.style.background = "#14131a");

    // Xử lý sự kiện click (Vừa Copy Vừa Mở File Dialog)
    actionBtn.addEventListener("click", () => {
      // 1. Copy cực kỳ mạnh mẽ qua Input ẩn (Backup cho Clipboard API)
      const input = document.createElement("textarea");
      input.innerHTML = folderPath;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);

      // Thử dùng thêm Clipboard API nếu trình duyệt hỗ trợ tốt
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(folderPath)
          .catch((e) => console.log("Lỗi phụ clipboard:", e));
      }

      // 2. Click mở hộp thoại tải ảnh
      const uploadBtn = document.querySelector(
        'button[data-testid="offer-edit-image-upload-button-B07g"]',
      );
      if (uploadBtn) {
        uploadBtn.click();
      } else {
        // Fallback tìm input type file
        const fileInput = document.querySelector(
          'input[type="file"][accept*="image"]',
        );
        if (fileInput) fileInput.click();
      }

      // Đổi trạng thái hiển thị: CẬP NHẬT PHÍM TẮT CHO MAC
      actionBtn.innerText = "✅ Đã Copy! Bấm Cmd + Shift + G rồi Cmd + V";
      actionBtn.style.background = "#27ae60"; // Màu xanh lá

      // Tự hủy widget sau 8 giây (để bạn có thêm thời gian đọc phím tắt)
      setTimeout(() => {
        widget.style.opacity = "0";
        setTimeout(() => widget.remove(), 500);
      }, 8000);
    });

    widget.appendChild(text);
    widget.appendChild(actionBtn);
    document.body.appendChild(widget);
  }

  async function runAutoFillForm() {
    const rawData = parsed.data;

    // Dropdowns
    await selectEldoradoDropdown("Level", mapLevel(rawData["Level"]));
    await selectEldoradoDropdown("Team", mapTeam(rawData["Team"]));
    await selectEldoradoDropdown("Items", mapItems(rawData["Max Bag Items"]));
    await selectEldoradoDropdown(
      "Legendary Pokemons",
      mapLegendaryPokemons(rawData["Quantity Legend Pokemon"]),
    );
    await selectEldoradoDropdown(
      "Shiny Pokemons",
      mapShinyPokemons(rawData["Quantity Shiny"]),
    );
    await selectEldoradoDropdown(
      "Mythical Pokémons",
      mapMythicalPokemons(rawData["Quantity Mythical"]),
    );
    await selectEldoradoDropdown("Stardust", mapStardust(rawData["Stardust"]));
    await selectEldoradoDropdown(
      "Hundo Pokemons",
      mapHundoPokemons(rawData["Quantity IV 100% Pokemon"]),
    );
    await selectEldoradoDropdown(
      "PokeCoins",
      mapPokeCoins(rawData["Pokecoin"]),
    );
    await selectEldoradoDropdown("Original email", mapOriginalEmail());

    // Description
    const descTextarea = document.querySelector(
      'textarea[data-testid="offer-edit-page-description-textarea-6ZVk"]',
    );
    if (descTextarea) {
      descTextarea.value = parsed.bodyRawText;
      descTextarea.dispatchEvent(new Event("input", { bubbles: true }));
      descTextarea.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Account Details
    const accountDetailsTextarea = document.querySelector(
      'textarea[data-testid="offer-edit-account-0-textarea-rv79"]',
    );
    if (accountDetailsTextarea) {
      const accountInfoString = `- Login name  : ${parsed.username}\n- Password    : Teamtoi273@\n\n👋 Thanks for your purchase! For a successful and safe login, view the easy-to-follow guide flowchart here:\n🔗 photos.app.goo.gl/BC7qgPHydwH5Cint7`;
      accountDetailsTextarea.value = accountInfoString;
      accountDetailsTextarea.dispatchEvent(
        new Event("input", { bubbles: true }),
      );
      accountDetailsTextarea.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
    }

    // Price
    const priceInput = document.querySelector(
      'input[placeholder="Price"][aria-label="Numeric input field"]',
    );
    if (priceInput) {
      const calculatedPrice = calculatePrice(parsed.title, parsed.data);
      priceInput.value = calculatedPrice;
      priceInput.dispatchEvent(new Event("input", { bubbles: true }));
      priceInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    await autoCheckTerms();

    // ==========================================
    // CẬP NHẬT ĐƯỜNG DẪN CHO MACOS & GOOGLE DRIVE
    // ==========================================
    // Thay đổi [TEN_USER_MAC] và [EMAIL_CUA_BAN] thành thông tin thật trên máy của bạn
    // Hoặc sử dụng đường dẫn bạn lấy được từ tổ hợp phím Option + Cmd + C
    const basePath = `/Users/tano/Library/CloudStorage/GoogleDrive-trapkm10@gmail.com/Drive của tôi/PKM`;
    const folderPath = `${basePath}/${parsed.username}`;
    
    injectHelperWidget(folderPath);
  }

  // ==========================================
  // CHẠY CHƯƠNG TRÌNH
  // ==========================================
  (async () => {
    const isSuccess = await executeNavigationFlow();
    if (isSuccess) {
      await runAutoFillForm();
    }
  })();
}
