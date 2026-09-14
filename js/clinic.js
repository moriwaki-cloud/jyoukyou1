(() => {
  "use strict";

  const formEl = document.getElementById("own-clinic-form");
  const screenEl = document.getElementById("screen-own-clinic");
  const introEl = document.getElementById("own-clinic-intro");
  const nameInput = document.getElementById("clinic-name");
  const dentistInput = document.getElementById("clinic-dentist");
  const addressInput = document.getElementById("clinic-address");
  const phoneInput = document.getElementById("clinic-phone");
  const errorEl = document.getElementById("own-clinic-form-error");
  const cancelBtn = document.getElementById("own-clinic-cancel-btn");

  let mode = "setup"; // 'setup' | 'edit'

  // mode: 'setup'（初回起動時。キャンセル不可、保存後は治療内容選択画面へ）
  //       'edit'（設定メニューから。キャンセル可、保存後は前の画面へ戻る）
  function openForm(newMode) {
    mode = newMode;
    errorEl.classList.add("hidden");

    if (mode === "setup") {
      screenEl.dataset.title = "自院情報の初期設定";
      introEl.textContent = "初回設定として、照会用紙に印字する自院情報を入力してください。";
      cancelBtn.classList.add("hidden");
      formEl.reset();
    } else {
      const clinic = Storage.getOwnClinic();
      screenEl.dataset.title = "自院情報の編集";
      introEl.textContent = "";
      cancelBtn.classList.remove("hidden");
      nameInput.value = clinic ? clinic.clinicName : "";
      dentistInput.value = clinic ? clinic.dentistName : "";
      addressInput.value = clinic ? clinic.address : "";
      phoneInput.value = clinic ? clinic.phone : "";
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const data = {
      clinicName: nameInput.value,
      dentistName: dentistInput.value,
      address: addressInput.value,
      phone: phoneInput.value,
    };

    if (!data.clinicName.trim()) {
      errorEl.classList.remove("hidden");
      nameInput.focus();
      return;
    }
    errorEl.classList.add("hidden");
    Storage.saveOwnClinic(data);

    if (mode === "setup") {
      Nav.resetTo("screen-treatment");
    } else {
      Nav.back();
    }
  }

  formEl.addEventListener("submit", handleSubmit);
  cancelBtn.addEventListener("click", () => Nav.back());

  window.Clinic = { openForm };
})();
