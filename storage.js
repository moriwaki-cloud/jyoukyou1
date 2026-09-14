(() => {
  "use strict";

  const INSTITUTIONS_KEY = "joukyo_institutions_v1";
  const OWN_CLINIC_KEY = "joukyo_own_clinic_v1";

  function generateId() {
    if (window.crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error("localStorage read error:", key, err);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("localStorage write error:", key, err);
    }
  }

  function getInstitutions() {
    return readJSON(INSTITUTIONS_KEY, []);
  }

  function saveInstitutions(list) {
    writeJSON(INSTITUTIONS_KEY, list);
  }

  function getInstitution(id) {
    return getInstitutions().find((item) => item.id === id) || null;
  }

  function addInstitution(data) {
    const list = getInstitutions();
    const item = {
      id: generateId(),
      name: (data.name || "").trim(),
      department: (data.department || "").trim(),
      doctorName: (data.doctorName || "").trim(),
      address: (data.address || "").trim(),
      phone: (data.phone || "").trim(),
    };
    list.push(item);
    saveInstitutions(list);
    return item;
  }

  function updateInstitution(id, data) {
    const list = getInstitutions();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    list[idx] = {
      id,
      name: (data.name || "").trim(),
      department: (data.department || "").trim(),
      doctorName: (data.doctorName || "").trim(),
      address: (data.address || "").trim(),
      phone: (data.phone || "").trim(),
    };
    saveInstitutions(list);
    return list[idx];
  }

  function deleteInstitution(id) {
    const list = getInstitutions().filter((item) => item.id !== id);
    saveInstitutions(list);
  }

  function getOwnClinic() {
    return readJSON(OWN_CLINIC_KEY, null);
  }

  function saveOwnClinic(data) {
    const clinic = {
      clinicName: (data.clinicName || "").trim(),
      dentistName: (data.dentistName || "").trim(),
      address: (data.address || "").trim(),
      phone: (data.phone || "").trim(),
    };
    writeJSON(OWN_CLINIC_KEY, clinic);
    return clinic;
  }

  window.Storage = {
    getInstitutions,
    getInstitution,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    getOwnClinic,
    saveOwnClinic,
  };
})();
