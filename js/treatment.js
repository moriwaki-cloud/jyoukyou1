(() => {
  "use strict";

  const buttonsContainer = document.getElementById("treatment-buttons");
  const generateBtn = document.getElementById("generate-btn");
  const previewTextarea = document.getElementById("preview-textarea");

  let treatmentsData = {};
  let selectedOrder = []; // 選択された治療名を選択順に保持

  function loadTreatments() {
    return fetch("treatments.json")
      .then((res) => {
        if (!res.ok) throw new Error("treatments.json の読み込みに失敗しました");
        return res.json();
      })
      .then((data) => {
        treatmentsData = data;
        renderButtons(Object.keys(data));
      })
      .catch((err) => {
        console.error(err);
        buttonsContainer.textContent = "治療内容データの読み込みに失敗しました。";
      });
  }

  function renderButtons(names) {
    buttonsContainer.innerHTML = "";
    names.forEach((name) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "treatment-btn";
      btn.textContent = name;
      btn.dataset.name = name;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => toggleSelection(btn, name));
      buttonsContainer.appendChild(btn);
    });
  }

  function toggleSelection(btn, name) {
    const isSelected = btn.classList.toggle("selected");
    btn.setAttribute("aria-pressed", String(isSelected));

    if (isSelected) {
      selectedOrder.push(name);
    } else {
      selectedOrder = selectedOrder.filter((n) => n !== name);
    }
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function generateText() {
    if (selectedOrder.length === 0) {
      previewTextarea.value = "";
      previewTextarea.placeholder = "治療内容を1つ以上選択してください。";
      return;
    }

    const phrases = selectedOrder.map((name) => {
      const candidates = treatmentsData[name] || [];
      return pickRandom(candidates);
    });

    previewTextarea.value = phrases.join("\n\n");
  }

  generateBtn.addEventListener("click", generateText);

  loadTreatments();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
    });
  }

  // フェーズ2: 医療機関選択画面へ渡すための現在の選択状態を取得
  window.Treatment = {
    getSelection() {
      return {
        treatments: selectedOrder.slice(),
        text: previewTextarea.value,
      };
    },
    reset() {
      selectedOrder = [];
      buttonsContainer.querySelectorAll(".treatment-btn.selected").forEach((btn) => {
        btn.classList.remove("selected");
        btn.setAttribute("aria-pressed", "false");
      });
      previewTextarea.value = "";
      previewTextarea.placeholder = "治療内容を選択して「文言を生成」を押すと、ここに文言が表示されます。";
    },
  };
})();
