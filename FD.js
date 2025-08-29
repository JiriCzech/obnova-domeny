// ========================================
// Bookmarklet pro automatizaci objednávky domény
// ========================================
// Tento skript vytváří modální formulář pro nastavení parametrů objednávky domény,
// ukládá data do localStorage a generuje předpřipravenou odpověď do textového pole.
// Je určen pro použití jako bookmarklet v prohlížeči.

const CONFIG_DATA = {
  // ========================================
  // SYSTÉMOVÉ TEXTY (pro UI, alerty, popisky)
  // ========================================
  SYSTEM_TEXTS: {
    formTitle: "Nastavení objednávky",
    domainLabel: "Doména:",
    currencyLabel: "Měna:",
    repeatCheckbox: "Opakované obnovení",
    privacyCheckbox: "Skrytá registrace",
    packageCheckbox: "Vypršel balíček",
    com42Checkbox: "Více jak 42 dnů v karanténě (jen .com/.net/.org/.info)",
    okButton: "OK",
    cancelButton: "Zrušit",
    invalidDomainAlert: "Nesprávně zadaná doména!",
    unsupportedTldAlert: (tld) => `Pro doménu typu ${tld} není podpora!`,
    ticketIdErrorAlert: "Nepodařilo se získat ticket ID z URL!",
    replyFieldNotFoundAlert: "Pole reply nebylo nalezeno!"
  },

  // ========================================
  // TEXTY PRO ODPOVĚĎ UŽIVATELI
  // ========================================
  REPLY_TEXTS: {
    replyGreeting: "Dobrý den,",
    replyThanks: "děkuji Vám za zprávu.",
    replyDomainExpired: (domain) => `Vaše doména ${domain} exspirovala a nyní je v tzv. karanténě. Doménu mohou z karantény obnovit naši technici na základě uhrazené objednávky, kterou Vám níže zasílám.`,
    replyLink1Year: "Odkaz k obnově a prodloužení domény o 1 rok.",
    replyLink2Years: "Odkaz k obnově a prodloužení domény o 2 roky.",
    replyPrivacyIncluded: "V rámci objednávek je zahrnuta i služba anonymní registrace, kterou máte na doméně aktivní.",
    replyBillingInfo: 'Fakturační údaje lze vyplnit po kliknutí na "Nákup na firmu". Jakmile obdržíme vaši platbu, budu Vás dále kontaktovat.',
    replyPackageInfo: "Využívání vlastní domény pro projekt Webnode je součástí prémiových balíčků. Dříve aktivní balíček XXXXXX si můžete objednat zde.",
    replyQuestions: "V případě jakýchkoli dalších dotazů se na mě neváhejte obrátit.",
    replyClosing: "Přeji Vám hezký den."
  },

  // ========================================
  // KONFIGURACE: Ceny a poplatky
  // ========================================
  PRICES: {
    cz: {
      CZK: (repeat) => repeat
        ? { price: 300, text: "Jelikož se ve Vašem případě jedná o opakované obnovení domény, je potřeba také uhradit poplatek 300 Kč." }
        : { price: 0, text: "První obnova domény z karantény je zdarma. Nyní stačí uhradit pouze prodloužení registrace domény." },
      EUR: (repeat) => repeat
        ? { price: 13, text: "Jelikož se ve Vašem případě jedná o opakované obnovení domény, je potřeba také uhradit poplatek 13 €." }
        : { price: 0, text: "První obnova domény z karantény je zdarma. Nyní stačí uhradit pouze prodloužení registrace domény." }
    },
    sk: {
      CZK: (repeat) => repeat
        ? { price: 615, text: "Jelikož se ve Vašem případě jedná o opakované obnovení domény, je potřeba také uhradit poplatek 615 Kč." }
        : { price: 0, text: "První obnova domény z karantény je zdarma. Nyní stačí uhradit pouze prodloužení registrace domény." },
      EUR: (repeat) => repeat
        ? { price: 24.95, text: "Jelikož se ve Vašem případě jedná o opakované obnovení domény, je potřeba také uhradit poplatek 24,95 €." }
        : { price: 0, text: "První obnova domény z karantény je zdarma. Nyní stačí uhradit pouze prodloužení registrace domény." }
    },
    eu: {
      CZK: () => ({ price: 999, text: "V rámci EU domény je také potřeba uhradit poplatek za obnovení a to 999 Kč." }),
      EUR: () => ({ price: 34.95, text: "V rámci EU domény je také potřeba uhradit poplatek za obnovení a to 34,95 €." })
    },
    com_net_org_info: {
      CZK: (repeat, com42) => {
        if (repeat || com42) return { price: 2100, text: repeat ? "Jelikož se ve Vašem případě jedná o opakované obnovení domény, je potřeba také uhradit poplatek 2100 Kč." : "Jelikož je vaše doména více jak 42 dnů v karanténě je také potřeba uhradit poplatek za obnovení a to 2100 Kč." };
        return { price: 239, text: "V rámci [TLD] domény je také potřeba uhradit poplatek za obnovení a to 239 Kč." };
      },
      EUR: (repeat, com42) => {
        if (repeat || com42) return { price: 86, text: repeat ? "Jelikož se ve Vašem případě jedná o opakované obnovení domény, je potřeba také uhradit poplatek 86 €." : "Jelikož je vaše doména více jak 42 dnů v karanténě je také potřeba uhradit poplatek za obnovení a to 86 €." };
        return { price: 8.35, text: "V rámci [TLD] domény je také potřeba uhradit poplatek za obnovení a to 8,35 €." };
      }
    }
  }
};

const SYSTEM_TEXTS = CONFIG_DATA.SYSTEM_TEXTS;
const REPLY_TEXTS = CONFIG_DATA.REPLY_TEXTS;
const PRICES = CONFIG_DATA.PRICES;

// Podporované TLD (top-level domains)
const SUPPORTED_TLDS = ["cz", "sk", "eu", "com", "net", "org", "info"];

// ========================================
// Funkce: Normalizace domény
// ========================================
function normalizeDomain(input) {
  input = input.trim().toLowerCase();
  input = input.replace(/^https?:\/\//, '');
  input = input.replace(/^www\./, '');
  input = input.replace(/\/.*$/, '');
  return input;
}

// ========================================
// Funkce: Vytvoření a přidání formuláře do DOM
// ========================================
function createForm() {
  const html = `
    <div id="autoForm" style="
      position:fixed;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      background:#fff;
      border:none;
      padding:32px 28px 24px 28px;
      z-index:999999;
      font-family:'Segoe UI',Arial,sans-serif;
      max-width:420px;
      border-radius:18px;
      box-shadow:0 12px 40px 0 rgba(30,40,60,0.22), 0 1.5px 6px 0 rgba(0,0,0,0.08);
      user-select:none;
      min-width:320px;
      ">
      <div id="fd-help" title="Nápověda" style="
        position:absolute;
        top:18px;
        right:18px;
        cursor:pointer;
        border-radius:50%;
        background:linear-gradient(135deg,#eaf6ff 60%,#d0eaff 100%);
        box-shadow:0 1.5px 6px 0 rgba(0,120,212,0.10);
        transition:transform 0.2s,box-shadow 0.2s;
        width:38px;height:38px;display:flex;align-items:center;justify-content:center;
      ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#0078d4" style="display:block;">
          <circle cx="12" cy="12" r="12" fill="#eaf6ff"/>
          <text x="12" y="17" text-anchor="middle" font-size="16" font-family="Arial" fill="#0078d4" font-weight="bold">?</text>
        </svg>
      </div>
      <h3 style="margin:0 0 18px 0;font-size:1.35em;font-weight:600;color:#1a2340;letter-spacing:0.01em;">${SYSTEM_TEXTS.formTitle}</h3>
      <label style="font-weight:500;color:#2a3550;">${SYSTEM_TEXTS.domainLabel}<br>
        <input type="text" id="fd-domain" style="width:100%;padding:8px 10px;border:1.5px solid #c8d2e0;border-radius:7px;font-size:1em;margin-top:2px;">
      </label><br><br>
      <label style="font-weight:500;color:#2a3550;">${SYSTEM_TEXTS.currencyLabel}<br>
        <select id="fd-currency" style="width:100%;padding:8px 10px;border:1.5px solid #c8d2e0;border-radius:7px;font-size:1em;margin-top:2px;">
          <option value="CZK">CZK</option>
          <option value="EUR">EUR</option>
        </select>
      </label><br><br>
      <label style="display:block;margin-bottom:4px;"><input type="checkbox" id="fd-repeat"> ${SYSTEM_TEXTS.repeatCheckbox}</label>
      <label style="display:block;margin-bottom:4px;"><input type="checkbox" id="fd-privacy"> ${SYSTEM_TEXTS.privacyCheckbox}</label>
      <label style="display:block;margin-bottom:4px;"><input type="checkbox" id="fd-package"> ${SYSTEM_TEXTS.packageCheckbox}</label>
      <label style="display:block;margin-bottom:12px;"><input type="checkbox" id="fd-com42" disabled style="opacity:0.5;"> ${SYSTEM_TEXTS.com42Checkbox}</label>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <button id="fd-ok" style="
          flex:1;
          background:#0078d4;
          color:#fff;
          border:none;
          border-radius:7px;
          padding:10px 0;
          font-size:1em;
          font-weight:600;
          cursor:pointer;
          box-shadow:0 2px 8px 0 rgba(0,120,212,0.10);
          transition:background 0.18s,box-shadow 0.18s;
        ">${SYSTEM_TEXTS.okButton}</button>
        <button id="fd-cancel" style="
          flex:1;
          background:#eaf0fa;
          color:#1a2340;
          border:none;
          border-radius:7px;
          padding:10px 0;
          font-size:1em;
          font-weight:600;
          cursor:pointer;
          transition:background 0.18s;
        ">${SYSTEM_TEXTS.cancelButton}</button>
      </div>
    </div>
  `;

  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  // Drag & Drop (beze změny)
  const autoForm = wrap.querySelector("#autoForm");
  let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
  autoForm.addEventListener("mousedown", function(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "BUTTON" || e.target.closest("#fd-help")) return;
    isDragging = true;
    dragOffsetX = e.clientX - autoForm.getBoundingClientRect().left;
    dragOffsetY = e.clientY - autoForm.getBoundingClientRect().top;
    document.body.style.userSelect = "none";
  });
  document.addEventListener("mousemove", function(e) {
    if (isDragging) {
      autoForm.style.left = "unset";
      autoForm.style.top = "unset";
      autoForm.style.right = "unset";
      autoForm.style.bottom = "unset";
      autoForm.style.transform = "";
      autoForm.style.position = "fixed";
      autoForm.style.margin = "0";
      autoForm.style.left = (e.clientX - dragOffsetX) + "px";
      autoForm.style.top = (e.clientY - dragOffsetY) + "px";
    }
  });
  document.addEventListener("mouseup", function() {
    isDragging = false;
    document.body.style.userSelect = "";
  });

  // Help Icon Animation & Click (beze změny)
  const help = wrap.querySelector("#fd-help");
  help.addEventListener("mouseenter", function() {
    help.style.transform = "scale(1.18) rotate(-8deg)";
    help.style.boxShadow = "0 4px 16px 0 rgba(0,120,212,0.18)";
  });
  help.addEventListener("mouseleave", function() {
    help.style.transform = "scale(1) rotate(0deg)";
    help.style.boxShadow = "0 1.5px 6px 0 rgba(0,120,212,0.10)";
  });
  help.addEventListener("click", function(e) {
    window.open("https://webnodecz.atlassian.net/wiki/spaces/CZ/pages/36963846/Cena+obnovy+dom+n+pro+CZ+SK+u+ivatele", "_blank");
    e.stopPropagation();
  });

  // Dynamická kontrola vstupu domény (beze změny)
  const domainInput = wrap.querySelector("#fd-domain");
  const repeatCheckbox = wrap.querySelector("#fd-repeat");
  const com42Checkbox = wrap.querySelector("#fd-com42");
  function updateOptions() {
    const val = (domainInput.value || "").trim().toLowerCase();
    const tld = val.split(".").pop();
    if (tld === "eu") {
      repeatCheckbox.checked = false;
      repeatCheckbox.disabled = true;
      repeatCheckbox.parentElement.style.opacity = "0.5";
    } else {
      repeatCheckbox.disabled = false;
      repeatCheckbox.parentElement.style.opacity = "1";
    }
    if (["com", "net", "org", "info"].includes(tld)) {
      com42Checkbox.disabled = false;
      com42Checkbox.parentElement.style.opacity = "1";
    } else {
      com42Checkbox.checked = false;
      com42Checkbox.disabled = true;
      com42Checkbox.parentElement.style.opacity = "0.5";
    }
  }
  domainInput.addEventListener("input", updateOptions);
  updateOptions();

  return wrap;
}

// ========================================
// Funkce: Výpočet ceny obnovení
// ========================================
function calculateRecoveryPrice(tld, curr, repeat, com42) {
  let priceObj;
  if (tld === "cz") {
    priceObj = PRICES.cz[curr]?.(repeat) || { price: 0, text: "" };
  } else if (tld === "sk") {
    priceObj = PRICES.sk[curr]?.(repeat) || { price: 0, text: "" };
  } else if (tld === "eu") {
    priceObj = PRICES.eu[curr]?.() || { price: 0, text: "" };
  } else if (["com", "net", "org", "info"].includes(tld)) {
    priceObj = PRICES.com_net_org_info[curr]?.(repeat, com42) || { price: 0, text: "" };
    priceObj.text = priceObj.text.replace("[TLD]", tld);
  } else {
    priceObj = { price: 0, text: "" };
  }
  return { recoveryPrice: priceObj.price, priceText: priceObj.text };
}

// ========================================
// Funkce: Generování odpovědi
// ========================================
function generateReply(domain, priceText, privacy, pkg) {
  let reply = `${REPLY_TEXTS.replyGreeting}\n\n${REPLY_TEXTS.replyThanks}\n\n${REPLY_TEXTS.replyDomainExpired(domain)}\n\n${priceText}\n\n${REPLY_TEXTS.replyLink1Year}\n${REPLY_TEXTS.replyLink2Years}\n\n`;
  if (privacy) reply += `${REPLY_TEXTS.replyPrivacyIncluded}\n\n`;
  reply += `${REPLY_TEXTS.replyBillingInfo}\n\n`;
  if (pkg) reply += `${REPLY_TEXTS.replyPackageInfo}\n\n`;
  reply += `${REPLY_TEXTS.replyQuestions}\n\n${REPLY_TEXTS.replyClosing}\n\n`;

  let replyField = document.querySelector('div.fr-element.fr-view[contenteditable="true"]');
  if (replyField) {
    replyField.innerHTML = reply.replace(/\n/g, "<br>") + replyField.innerHTML;
  } else {
    // Pokus o otevření pole Reply kliknutím na tlačítko
    const replyBtn = document.querySelector('button[data-test-email-action="reply"]') || document.querySelector('button[data-test-id="reply-button"]');
    if (replyBtn) {
      replyBtn.click();
      const interval = setInterval(() => {
        replyField = document.querySelector('div.fr-element.fr-view[contenteditable="true"]');
        if (replyField) {
          clearInterval(interval);
          replyField.innerHTML = reply.replace(/\n/g, "<br>") + replyField.innerHTML;
          console.log("Pole reply bylo otevřeno a text vložen.");
        }
      }, 200);
    } else {
      alert(SYSTEM_TEXTS.replyFieldNotFoundAlert);
    }
  }
}

// ========================================
// Hlavní funkce: Spuštění bookmarkletu
// ========================================
(function() {
  const wrap = createForm();

  // Event: Zrušit - Odeber formulář
  document.getElementById("fd-cancel").onclick = function() {
    wrap.remove();
  };

  // Event: OK - Zpracuj data
  document.getElementById("fd-ok").onclick = function() {
    const raw = document.getElementById("fd-domain").value;
    const domain = normalizeDomain(raw);

    // Validace domény
    if (!/^[^.]+\.[a-z]{2,}$/.test(domain)) {
      alert(SYSTEM_TEXTS.invalidDomainAlert);
      return;
    }

    const tld = domain.split(".").pop();
    if (!SUPPORTED_TLDS.includes(tld)) {
      alert(SYSTEM_TEXTS.unsupportedTldAlert(tld));
      return;
    }

    const curr = document.getElementById("fd-currency").value || "CZK";
    const repeat = document.getElementById("fd-repeat").checked;
    const privacy = document.getElementById("fd-privacy").checked;
    const pkg = document.getElementById("fd-package").checked;
    const com42 = document.getElementById("fd-com42").checked;

    // Uložení do localStorage
    localStorage.setItem("autoOrderDomain", domain);
    localStorage.setItem("autoOrderTLD", tld);
    localStorage.setItem("autoOrderCurrency", curr);
    localStorage.setItem("autoOrderRepeat", repeat);
    localStorage.setItem("autoOrderPrivacy", privacy);
    localStorage.setItem("autoOrderPackage", pkg);
    localStorage.setItem("autoOrderCom42", com42);

    // Log hodnot uložených v localStorage
    console.log("Uloženo do localStorage:");
    console.log("autoOrderDomain:", localStorage.getItem("autoOrderDomain"));
    console.log("autoOrderTLD:", localStorage.getItem("autoOrderTLD"));
    console.log("autoOrderCurrency:", localStorage.getItem("autoOrderCurrency"));
    console.log("autoOrderRepeat:", localStorage.getItem("autoOrderRepeat"));
    console.log("autoOrderPrivacy:", localStorage.getItem("autoOrderPrivacy"));
    console.log("autoOrderPackage:", localStorage.getItem("autoOrderPackage"));
    console.log("autoOrderCom42:", localStorage.getItem("autoOrderCom42"));

    wrap.remove();

    // Získání ticket ID z URL
    const match = window.location.href.match(/tickets\/(\d+)/);
    if (!match) {
      alert(SYSTEM_TEXTS.ticketIdErrorAlert);
      return;
    }
    const ticket = match[1];
    localStorage.setItem("autoOrderTicket", ticket);

    // Výpočet ceny
    const { recoveryPrice, priceText } = calculateRecoveryPrice(tld, curr, repeat, com42);
    localStorage.setItem("autoOrderRecoveryPrice", String(recoveryPrice));

    // Debug výpis do konzole (pro vývojové účely)
    console.log("==== DEBUG START ====");
    console.log("Raw input:", raw);
    console.log("Normalized domain:", domain);
    console.log("TLD:", tld);
    console.log("Currency:", curr);
    console.log("Repeat:", repeat);
    console.log("Privacy:", privacy);
    console.log("Package:", pkg);
    console.log("Com42:", com42);
    console.log("TicketID:", ticket);
    console.log("RecoveryPrice:", recoveryPrice);
    console.log("PriceText:", priceText);
    console.log("==== DEBUG END ====");

    // Generování odpovědi
    generateReply(domain, priceText, privacy, pkg);

    // === Uložení vybraných dat z localStorage do schránky ===
    const dataToCopy = {
      domain: localStorage.getItem("autoOrderDomain"),
      ticketId: localStorage.getItem("autoOrderTicket"),
      recoveryPrice: localStorage.getItem("autoOrderRecoveryPrice"),
      currency: localStorage.getItem("autoOrderCurrency"),
      privacy: localStorage.getItem("autoOrderPrivacy")
    };
    navigator.clipboard.writeText(JSON.stringify(dataToCopy))
      .then(() => {
        // Příjemné nenápadné oznámení místo alertu
        const notif = document.createElement("div");
        notif.textContent = "✅ Data byla zkopírována do schránky, nyní můžeš vytvořit objednávky :)";
        notif.style.position = "fixed";
        notif.style.bottom = "30px";
        notif.style.right = "30px";
        notif.style.background = "#0078d4";
        notif.style.color = "#fff";
        notif.style.padding = "16px 24px";
        notif.style.borderRadius = "8px";
        notif.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
        notif.style.fontSize = "1.1em";
        notif.style.zIndex = "999999";
        notif.style.opacity = "0";
        notif.style.transition = "opacity 0.4s";
        document.body.appendChild(notif);
        setTimeout(() => { notif.style.opacity = "1"; }, 50);
        setTimeout(() => {
          notif.style.opacity = "0";
          setTimeout(() => notif.remove(), 400);
        }, 3500);
        console.log("Zkopírováno do schránky:", dataToCopy);
      })
      .catch(() => {
        alert("Nepodařilo se zapsat data do schránky.");
      });
  };
})();