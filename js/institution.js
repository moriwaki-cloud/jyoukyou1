(() => {
  "use strict";

  const selectListEl = document.getElementById("institution-select-list");
  const addFromSelectBtn = document.getElementById("add-institution-from-select-btn");

  const manageListEl = document.getElementById("institution-manage-list");
  const manageEmptyEl = document.getElementById("institution-manage-empty");
  const addFromManageBtn = document.getElementById("add-institution-from-manage-btn");

  const formEl = document.getElementById("institution-form");
  const formScreenEl = document.getElementById("screen-institution-form");
  const nameInput = document.getElementById("inst-name");
  const departmentInput = document.getElementById("inst-department");
  const doctorInput = document.getElementById("inst-doctor");
  const addressInput = document.getElementById("inst-address");
  const phoneInput = document.getElementById("inst-phone");
  const formError = document.getElementById("institution-form-error");
  const formCancelBtn = document.getElementById("institution-form-cancel-btn");

  let formMode = "create"; // 'create' | 'edit'
  let editingId = null;
  let onSaveNavigate = null; // 保存後の遷移をカスタムしたい場合のみ指定。未指定ならNav.back()

  // mode: 'create' | 'edit'
  // editingId: 編集対象のID（editモードのみ）
  // onSaveNavigate: 保存成功後に呼ぶ関数。省略時はNav.back()で直前画面に戻る
  function openForm({ mode, editingId: id = null, onSaveNavigate: navFn = null }) {
    formMode = mode;
    editingId = id;
    onSaveNavigate = navFn;
    formError.classList.add("hidden");

    if (mode === "edit" && editingId) {
      const item = Storage.getInstitution(editingId);
      formScreenEl.dataset.title = "医療機関情報の編集";
      nameInput.value = item ? item.name : "";
      departmentInput.value = item ? item.department : "";
      doctorInput.value = item ? item.doctorName : "";
      addressInput.value = item ? item.address : "";
      phoneInput.value = item ? item.phone : "";
    } else {
      formScreenEl.dataset.title = "医療機関の新規登録";
      formEl.reset();
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const data = {
      name: nameInput.value,
      department: departmentInput.value,
      doctorName: doctorInput.value,
      address: addressInput.value,
      phone: phoneInput.value,
    };

    if (!data.name.trim()) {
      formError.classList.remove("hidden");
      nameInput.focus();
      return;
    }
    formError.classList.add("hidden");

    if (formMode === "edit" && editingId) {
      Storage.updateInstitution(editingId, data);
    } else {
      Storage.addInstitution(data);
    }

    if (onSaveNavigate) {
      onSaveNavigate();
    } else {
      Nav.back();
    }
  }

  formEl.addEventListener("submit", handleFormSubmit);
  formCancelBtn.addEventListener("click", () => Nav.back());

  function createInstitutionCard(item, mode) {
    if (mode === "select") {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "institution-card selectable";

      const main = document.createElement("div");
      main.className = "institution-card-main";

      const nameEl = document.createElement("p");
      nameEl.className = "institution-card-name";
      nameEl.textContent = item.name;
      main.appendChild(nameEl);

      const subParts = [item.department, item.doctorName].filter(Boolean);
      if (subParts.length) {
        const subEl = document.createElement("p");
        subEl.className = "institution-card-sub";
        subEl.textContent = subParts.join(" / ");
        main.appendChild(subEl);
      }

      card.appendChild(main);
      card.addEventListener("click", () => {
        window.AppState.selectedInstitutionId = item.id;
        Nav.show("screen-confirm");
      });
      return card;
    }

    // manage mode
    const card = document.createElement("div");
    card.className = "institution-card";

    const main = document.createElement("div");
    main.className = "institution-card-main";

    const nameEl = document.createElement("p");
    nameEl.className = "institution-card-name";
    nameEl.textContent = item.name;
    main.appendChild(nameEl);

    const subParts = [item.department, item.doctorName].filter(Boolean);
    if (subParts.length) {
      const subEl = document.createElement("p");
      subEl.className = "institution-card-sub";
      subEl.textContent = subParts.join(" / ");
      main.appendChild(subEl);
    }

    card.appendChild(main);

    const actions = document.createElement("div");
    actions.className = "institution-card-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () => {
      openForm({ mode: "edit", editingId: item.id });
      Nav.show("screen-institution-form");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger-btn";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => {
      if (confirm(`「${item.name}」を削除しますか？この操作は取り消せません。`)) {
        Storage.deleteInstitution(item.id);
        renderManageList();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    return card;
  }

  function renderSelectList() {
    const list = Storage.getInstitutions();
    if (list.length === 0) {
      // 登録0件の場合は選択画面の代わりに登録フォームを表示する
      openForm({
        mode: "create",
        onSaveNavigate: () => Nav.show("screen-institution-select", { push: false }),
      });
      Nav.show("screen-institution-form", { push: false });
      return;
    }
    selectListEl.innerHTML = "";
    list.forEach((item) => {
      selectListEl.appendChild(createInstitutionCard(item, "select"));
    });
  }

  function renderManageList() {
    const list = Storage.getInstitutions();
    manageListEl.innerHTML = "";
    if (list.length === 0) {
      manageEmptyEl.classList.remove("hidden");
      return;
    }
    manageEmptyEl.classList.add("hidden");
    list.forEach((item) => {
      manageListEl.appendChild(createInstitutionCard(item, "manage"));
    });
  }

  addFromSelectBtn.addEventListener("click", () => {
    openForm({ mode: "create" });
    Nav.show("screen-institution-form");
  });

  addFromManageBtn.addEventListener("click", () => {
    openForm({ mode: "create" });
    Nav.show("screen-institution-form");
  });

  document.addEventListener("screenchange", () => {
    // Nav.show が入れ子で呼ばれるケースがあるため、イベントの detail ではなく
    // Nav の現在値を都度読み直す（古い detail による誤描画を防ぐ）
    const currentId = Nav.getCurrent();
    if (currentId === "screen-institution-select") renderSelectList();
    if (currentId === "screen-institution-manage") renderManageList();
  });

  window.Institution = { openForm };
})();
