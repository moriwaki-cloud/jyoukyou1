(() => {
  "use strict";

  const SCREEN_IDS = [
    "screen-treatment",
    "screen-institution-select",
    "screen-institution-form",
    "screen-institution-manage",
    "screen-own-clinic",
    "screen-settings",
    "screen-confirm",
    "screen-final-preview",
  ];

  const backBtn = document.getElementById("nav-back-btn");
  const settingsBtn = document.getElementById("nav-settings-btn");
  const headerTitle = document.getElementById("header-title");
  const stepIndicator = document.getElementById("step-indicator");
  const stepItems = Array.from(document.querySelectorAll(".step-item"));
  const DEFAULT_TITLE = "診療情報連携共有料 照会用紙 文言作成";

  function registerScreens() {
    SCREEN_IDS.forEach((id) => Nav.register(id));
  }

  function initHeader() {
    backBtn.addEventListener("click", () => Nav.back());
    settingsBtn.addEventListener("click", () => Nav.show("screen-settings"));

    document.addEventListener("screenchange", () => {
      // screenchangeはNav.show内から入れ子で発火することがあるため、
      // イベントの detail ではなく Nav の現在値を都度読み直して同期する
      const currentId = Nav.getCurrent();
      const screenEl = document.getElementById(currentId);
      headerTitle.textContent = (screenEl && screenEl.dataset.title) || DEFAULT_TITLE;
      backBtn.classList.toggle("hidden", !Nav.canGoBack());
      settingsBtn.classList.toggle("hidden", !(screenEl && screenEl.dataset.showSettings === "true"));

      const currentStep = screenEl && screenEl.dataset.step ? Number(screenEl.dataset.step) : null;
      stepIndicator.classList.toggle("hidden", !currentStep);
      stepItems.forEach((item) => {
        const step = Number(item.dataset.step);
        item.classList.toggle("active", step === currentStep);
        item.classList.toggle("done", currentStep !== null && step < currentStep);
      });
    });
  }

  function initSettingsMenu() {
    document.getElementById("settings-manage-institution-btn").addEventListener("click", () => {
      Nav.show("screen-institution-manage");
    });
    document.getElementById("settings-edit-clinic-btn").addEventListener("click", () => {
      Clinic.openForm("edit");
      Nav.show("screen-own-clinic");
    });
  }

  function initPatientInfo() {
    const genderButtons = document.querySelectorAll(".gender-toggle-btn");
    genderButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        genderButtons.forEach((b) => b.classList.toggle("selected", b === btn));
      });
    });
  }

  function getSelectedGender() {
    const selected = document.querySelector(".gender-toggle-btn.selected");
    return selected ? selected.dataset.gender : "";
  }

  function resetPatientInfoForm() {
    document.getElementById("patient-name").value = "";
    document.getElementById("patient-birthdate").value = "";
    document.getElementById("patient-address").value = "";
    document.getElementById("patient-phone").value = "";
    document.querySelectorAll(".gender-toggle-btn").forEach((b) => b.classList.remove("selected"));
    document.getElementById("patient-name-error").classList.add("hidden");
    document.getElementById("treatment-next-error").classList.add("hidden");
  }

  // 患者情報・治療内容・選択医療機関のみをリセットする（医療機関マスター・自院マスターは対象外）
  function startNewReferral() {
    window.AppState.selectedTreatments = [];
    window.AppState.generatedText = "";
    window.AppState.selectedInstitutionId = null;
    window.AppState.patientName = "";
    window.AppState.patientGender = "";
    window.AppState.patientBirthDate = "";
    window.AppState.patientAddress = "";
    window.AppState.patientPhone = "";
    Treatment.reset();
    resetPatientInfoForm();
    Nav.resetTo("screen-treatment");
  }

  function initTreatmentToInstitution() {
    const nameInput = document.getElementById("patient-name");
    const nameError = document.getElementById("patient-name-error");
    const nextError = document.getElementById("treatment-next-error");

    nameInput.addEventListener("input", () => {
      if (nameInput.value.trim()) nameError.classList.add("hidden");
    });

    document.getElementById("to-institution-btn").addEventListener("click", () => {
      nameError.classList.add("hidden");
      nextError.classList.add("hidden");

      const patientName = nameInput.value.trim();
      if (!patientName) {
        nameError.classList.remove("hidden");
        nameInput.focus();
        return;
      }

      const selection = Treatment.getSelection();
      if (selection.treatments.length === 0) {
        nextError.textContent = "治療内容を1つ以上選択してください。";
        nextError.classList.remove("hidden");
        return;
      }
      if (!selection.text.trim()) {
        nextError.textContent = "「文言を生成」を押して文言を作成してください。";
        nextError.classList.remove("hidden");
        return;
      }

      window.AppState.patientName = patientName;
      window.AppState.patientGender = getSelectedGender();
      window.AppState.patientBirthDate = document.getElementById("patient-birthdate").value;
      window.AppState.patientAddress = document.getElementById("patient-address").value.trim();
      window.AppState.patientPhone = document.getElementById("patient-phone").value.trim();

      window.AppState.selectedTreatments = selection.treatments;
      window.AppState.generatedText = selection.text;
      Nav.show("screen-institution-select");
    });
  }

  function renderInfoCard(el, rows) {
    el.innerHTML = "";
    const visibleRows = rows.filter((r) => r.value);
    if (visibleRows.length === 0) {
      const p = document.createElement("p");
      p.className = "app-note";
      p.textContent = "情報が登録されていません。";
      el.appendChild(p);
      return;
    }
    visibleRows.forEach((r) => {
      const row = document.createElement("div");
      row.className = "info-row";

      const label = document.createElement("span");
      label.className = "info-label";
      label.textContent = r.label;

      const value = document.createElement("span");
      value.className = "info-value";
      value.textContent = r.value;

      row.appendChild(label);
      row.appendChild(value);
      el.appendChild(row);
    });
  }

  function initConfirmScreen() {
    const changeBtn = document.getElementById("change-institution-btn");
    const restartBtn = document.getElementById("restart-btn");
    const toFinalPreviewBtn = document.getElementById("to-final-preview-btn");
    const textarea = document.getElementById("confirm-textarea");
    const institutionInfoEl = document.getElementById("confirm-institution-info");
    const clinicInfoEl = document.getElementById("confirm-clinic-info");

    function render() {
      const institution = Storage.getInstitution(window.AppState.selectedInstitutionId);
      renderInfoCard(institutionInfoEl, [
        { label: "医療機関名", value: institution ? institution.name : "" },
        { label: "担当科", value: institution ? institution.department : "" },
        { label: "担当医名", value: institution ? institution.doctorName : "" },
        { label: "住所", value: institution ? institution.address : "" },
        { label: "電話番号", value: institution ? institution.phone : "" },
      ]);

      const clinic = Storage.getOwnClinic();
      renderInfoCard(clinicInfoEl, [
        { label: "医療機関名", value: clinic ? clinic.clinicName : "" },
        { label: "歯科医師", value: clinic ? clinic.dentistName : "" },
        { label: "所在地", value: clinic ? clinic.address : "" },
        { label: "電話番号", value: clinic ? clinic.phone : "" },
      ]);

      textarea.value = window.AppState.generatedText;
    }

    textarea.addEventListener("input", () => {
      window.AppState.generatedText = textarea.value;
    });

    changeBtn.addEventListener("click", () => Nav.back());

    toFinalPreviewBtn.addEventListener("click", () => {
      Nav.show("screen-final-preview");
    });

    restartBtn.addEventListener("click", startNewReferral);

    document.addEventListener("screenchange", () => {
      if (Nav.getCurrent() === "screen-confirm") render();
    });
  }

  function init() {
    window.AppState = {
      selectedTreatments: [],
      generatedText: "",
      selectedInstitutionId: null,
      patientName: "",
      patientGender: "",
      patientBirthDate: "",
      patientAddress: "",
      patientPhone: "",
    };

    registerScreens();
    initHeader();
    initSettingsMenu();
    initPatientInfo();
    initTreatmentToInstitution();
    initConfirmScreen();
    document.getElementById("new-referral-btn").addEventListener("click", startNewReferral);

    if (!Storage.getOwnClinic()) {
      Clinic.openForm("setup");
      Nav.show("screen-own-clinic", { push: false });
    } else {
      Nav.show("screen-treatment", { push: false });
    }
  }

  init();
})();
