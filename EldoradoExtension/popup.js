document.getElementById("fillBtn").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let text = document.getElementById("dataInput").value;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fillForm,
    args: [text],
  });
});

function fillForm(text) {
  // ==========================================
  // 1. BỘ MAPPER LOGIC (CHUYỂN TỪ PYTHON SANG JS)
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
    // let qty = parseInt(raw_quantity) || 0;
    // if (qty >= 500) return "500+";
    // if (qty >= 400) return "400-499";
    // if (qty >= 300) return "300-399";
    // if (qty >= 200) return "200-299";
    // if (qty >= 100) return "100-199";
    // return "0-99";
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
    const amt = parseInt(amount, 10);
    if (amt >= 50000) return "50K+";
    if (amt >= 10000) return "10K-49.99K";
    if (amt >= 5000) return "5K-9.99K";
    if (amt >= 1000) return "1K-4.99K";
    return "0-999";
  }

  function mapOriginalEmail(canChangeEmail) {
    // Nếu data của bạn là "Yes" thì chọn "Yes", còn lại mặc định là "No"
    return "No";
  }

  function mapShinyPokemons(rawQuantity) {
    const qty = parseInt(rawQuantity, 10);
    if (qty >= 200) return "200+";
    if (qty >= 150) return "150-199";
    if (qty >= 100) return "100-149";
    if (qty >= 75) return "75-99";
    if (qty >= 50) return "50-74";
    if (qty >= 25) return "25-49";
    return "0-24";
  }

  // ==========================================
  // 2. PARSE DATA TỪ TEXT BUFFER CỦA BẠN
  // ==========================================
  function parseData(str) {
    let lines = str.split("\n");
    let data = {};
    lines.forEach((line) => {
      let index = line.indexOf(":");
      if (index !== -1) {
        let key = line.substring(0, index).trim();
        let val = line.substring(index + 1).trim();
        data[key] = val;
      }
    });
    return data;
  }

  const rawData = parseData(text);

  // ==========================================
  // 3. LOGIC CLICK VÀ ĐIỀN DROPDOWN TRÊN WEB
  // ==========================================
  async function selectEldoradoDropdown(labelName, targetValue) {
    if (!targetValue) return;

    // Tìm tất cả các cụm div bọc trường trên Eldorado
    const allFields = Array.from(document.querySelectorAll("div.mb-1"));
    const fieldContainer = allFields.find((f) => {
      const span = f.querySelector("span");
      return span && span.textContent.trim() === labelName;
    });

    if (!fieldContainer) {
      console.log(`Không tìm thấy nhãn: ${labelName}`);
      return;
    }

    // Đi tìm thẻ dropdown combobox kế tiếp nhãn đó
    const parentElement = fieldContainer.parentElement;
    const combobox = parentElement
      ? parentElement.querySelector('div[role="combobox"]')
      : null;

    if (combobox) {
      combobox.click(); // Click mở dropdown lên
      await new Promise((r) => setTimeout(r, 400)); // Đợi render menu

      // Thử điền vào input search nếu có để lọc bớt option
      const searchInput = parentElement.querySelector("input.search-input");
      if (searchInput) {
        searchInput.value = targetValue;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 300));
      }

      // Tìm option có text trùng khớp để click quyết định
      const options = Array.from(
        document.querySelectorAll("div.dropdown-option"),
      );
      const matchedOption = options.find(
        (opt) => opt.textContent.trim() === targetValue,
      );

      if (matchedOption) {
        matchedOption.click();
      } else {
        console.log(
          `Không tìm thấy option [${targetValue}] cho [${labelName}]`,
        );
        // Nếu không tìm thấy, click lại combobox để đóng lại, tránh bị đè layout
        combobox.click();
      }
      await new Promise((r) => setTimeout(r, 300)); // Nghỉ một chút trước khi sang ô khác
    }
  }

  async function autoCheckTerms() {
    const termsCheckboxes = ["Terms of Service", "Seller Rules"];

    for (const label of termsCheckboxes) {
      // Tìm input có aria-label tương ứng
      const checkbox = document.querySelector(`input[aria-label="${label}"]`);

      // Nếu tồn tại và chưa được check thì click
      if (checkbox && !checkbox.checked) {
        checkbox.click();
        console.log(`Đã tick: ${label}`);
        await new Promise((r) => setTimeout(r, 200)); // Nghỉ một chút để tránh xung đột
      }
    }
  }

  // ==========================================
  // 4. THỰC THI CHẠY ĐIỀN TỰ ĐỘNG THEO THỨ TỰ
  // ==========================================
  async function runAutoFill() {
    // Lưu ý: Dùng rawData là biến đã được parse từ text dán vào

    // Các trường Dropdown chính
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

    const emailVal = mapOriginalEmail(rawData["Can be change email"]);
    await selectEldoradoDropdown("Original email", emailVal);

    // Description
    const descTextarea = document.querySelector(
      'textarea[data-testid="offer-edit-page-description-textarea-6ZVk"]',
    );
    if (descTextarea) {
      descTextarea.value = text;
      descTextarea.dispatchEvent(new Event("input", { bubbles: true }));
      descTextarea.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Check Terms
    await autoCheckTerms();

    console.log("Đã điền xong tất cả các trường!");
  }

  runAutoFill();
}
