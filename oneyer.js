(function() {
  // Ceník pro privátní registraci
  const CENIK_PRIVATNI_REG = {
    czk: "149",
    euro: "7.95"
  };

  navigator.clipboard.readText().then(txt => {
    let domain, ticketId, recoveryPrice, currency, privacy;
    try {
      const data = JSON.parse(txt);
      domain = data.domain || null;
      ticketId = data.ticketId || null;
      recoveryPrice = data.recoveryPrice || null;
      currency = (data.currency || "").toLowerCase();
      privacy = data.privacy || null;
    } catch {
      alert("Data ve schránce nejsou ve správném formátu!");
      return;
    }

    // === Ověření měny objednávky ===
    // Najdi první pole s měnou v objednávce
    let objednavkaMena = null;
    const currencySpan = document.querySelector('.orderItem .currency');
    if (currencySpan) {
      objednavkaMena = currencySpan.textContent.trim().toLowerCase();
    }

    // Ověření podporovaných měn
    if (objednavkaMena !== "czk" && objednavkaMena !== "eur") {
      alert("Pro " + objednavkaMena.toUpperCase() + " nemá tento program podporu!");
      return;
    }

    // Porovnání měny z objednávky a ze schránky
    if (currency !== objednavkaMena) {
      alert("Pozor: měna objednávky je " + objednavkaMena.toUpperCase() + ", ale ve Freshdesku bylo zvoleno " + currency.toUpperCase() + "!");
      return;
    }

    console.log("Načtená data ze schránky:");
    console.log("Název domény:", domain);
    console.log("ID ticketu:", ticketId);
    console.log("Cena za obnovu:", recoveryPrice);
    console.log("Měna:", currency);
    console.log("Skrytá registrace:", privacy);

    // Vyplnění políček pro všechny položky kromě privátní registrace
    function vyplnVseBezPrivatePrice() {
      // Doména
      document.querySelectorAll('input[name^="items"][name$="[data]"]').forEach(e => {
        e.value = domain;
        e.dispatchEvent(new Event("input", { bubbles: true }));
      });
      // Jednotky
      document.querySelectorAll('input[name^="items"][name$="[units]"]').forEach(e => {
        e.value = "1";
        e.dispatchEvent(new Event("input", { bubbles: true }));
      });
      // Ticket
      var f = document.querySelector('input[name="relatedTicket"],input[id*="ticket"],input[name*="ticket"]');
      if (f) {
        f.value = ticketId;
        f.dispatchEvent(new Event("input", { bubbles: true }));
      }
      // Cena za obnovu pouze v položce "Obnova domény"
      document.querySelectorAll('.orderItem').forEach(orderItem => {
        const select = orderItem.querySelector('select.orderItemType');
        if (select && select.value === "ManualDomainQuarantineRecoveryItem") {
          const priceInput = orderItem.querySelector('input[name^="items"][name$="[price]"]');
          if (priceInput && recoveryPrice !== null) {
            priceInput.value = recoveryPrice;
            priceInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      });
    }

    if (privacy === "true") {
      const btn = document.querySelector("#addOrderItem");
      if (!btn) {
        alert("Tlačítko Přidat položku nebylo nalezeno!");
        return;
      }
      const oldCount = document.querySelectorAll(".orderItem").length;
      btn.click();

      const observer = new MutationObserver(() => {
        const items = document.querySelectorAll(".orderItem");
        if (items.length > oldCount) {
          observer.disconnect();
          const lastItem = items[items.length - 1];
          const select = lastItem.querySelector("select.orderItemType");
          if (!select) {
            alert("Select pro typ položky nebyl nalezen.");
            return;
          }
          select.value = "ManualPrivateRegistrationItem";
          select.dispatchEvent(new Event("change", { bubbles: true }));

          // Počkej, až bude input pro doménu a cenu dostupný
          const detailObserver = new MutationObserver(() => {
            const domainInput = lastItem.querySelector('input[name^="items"][name$="[data]"]');
            const priceInput = lastItem.querySelector('input[name^="items"][name$="[price]"]');
            if (domainInput && priceInput) {
              detailObserver.disconnect();

              // Nejprve vyplň doménu a jednotky pro tuto položku
              domainInput.value = domain;
              domainInput.dispatchEvent(new Event("input", { bubbles: true }));
              const unitsInput = lastItem.querySelector('input[name^="items"][name$="[units]"]');
              if (unitsInput) {
                unitsInput.value = "1";
                unitsInput.dispatchEvent(new Event("input", { bubbles: true }));
              }

              // Nastav cenu za privátní registraci podle měny
              let cena = CENIK_PRIVATNI_REG.czk;
              if (currency && (currency === "euro" || currency === "eur")) {
                cena = CENIK_PRIVATNI_REG.euro.replace(",", ".");
              }
              priceInput.value = cena;
              priceInput.dispatchEvent(new Event("input", { bubbles: true }));
              console.log("Nastavena cena za privátní registraci:", cena);

              // Ostatní pole (např. ticket, ceny za obnovu) vyplň globálně
              vyplnVseBezPrivatePrice();

              console.log("✅ Přidána položka: Privátní registrace domény a vyplněna všechna pole včetně ceny za privátní registraci.");
            }
          });
          detailObserver.observe(lastItem, { childList: true, subtree: true });
        }
      });
      const container = document.querySelector(".orderItem")?.parentNode || document.body;
      observer.observe(container, { childList: true, subtree: true });
    } else {
      vyplnVseBezPrivatePrice();
      console.log("Privátní registrace není aktivní, vyplněna pouze pole.");
    }

    // Vyplnění pole pro poznámku (instrukce)
    let instrukceText = "";
    if (privacy === "true") {
      instrukceText = "Ahoj, prosím o obnovu domény " + domain + " o 1 rok včetně skryté registrace. Díky";
    } else {
      instrukceText = "Ahoj, prosím o obnovu domény " + domain + " o 1 rok. Díky";
    }
    var instrukce = document.querySelector('textarea#orderDesc, textarea[name="desc"]');
    if (instrukce) {
      instrukce.value = instrukceText;
      instrukce.dispatchEvent(new Event("input", { bubbles: true }));
      console.log("Vyplněna poznámka:", instrukceText);
    }
  }).catch(() => {
    alert("Nepodařilo se načíst data ze schránky.");
  });
})();
