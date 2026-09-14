(() => {
  "use strict";

  // 治療内容 → 用紙上のチェック欄マッピング。
  // 対応するチェック項目が用紙にない治療内容は、それぞれの「その他」欄に記載する。
  const TREATMENT_MAP = {
    "う蝕": { disease: "う蝕", plan: "う蝕処置" },
    "歯周病": { disease: "歯周病", plan: null },
    "抜歯": { disease: null, plan: "抜歯" },
    "インプラント": { disease: null, plan: null },
    "麻酔使用": { disease: null, plan: null },
    "根管治療": { disease: null, plan: null },
    "切開排膿": { disease: null, plan: null },
  };

  function buildChecks(selectedTreatments) {
    const disease = new Set();
    const plan = new Set();
    const diseaseOther = [];
    const planOther = [];

    selectedTreatments.forEach((name) => {
      const map = TREATMENT_MAP[name] || {};
      if (map.disease) {
        disease.add(map.disease);
      } else {
        diseaseOther.push(name);
      }
      if (map.plan) {
        plan.add(map.plan);
      } else {
        planOther.push(name);
      }
    });

    return {
      disease,
      plan,
      diseaseOtherText: diseaseOther.join("、"),
      planOtherText: planOther.join("、"),
    };
  }

  function calcAge(birthDateStr, refDate) {
    if (!birthDateStr) return null;
    const b = new Date(birthDateStr);
    if (Number.isNaN(b.getTime())) return null;
    let age = refDate.getFullYear() - b.getFullYear();
    const m = refDate.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < b.getDate())) age--;
    return age >= 0 ? age : null;
  }

  function formatDateParts(dateObj) {
    return { y: dateObj.getFullYear(), m: dateObj.getMonth() + 1, d: dateObj.getDate() };
  }

  function setChecked(el, isChecked) {
    el.textContent = isChecked ? "☑" : "☐";
  }

  function render() {
    const state = window.AppState;
    const institution = Storage.getInstitution(state.selectedInstitutionId) || {};
    const clinic = Storage.getOwnClinic() || {};
    const today = new Date();
    const todayParts = formatDateParts(today);

    document.getElementById("paper-date").textContent = `${todayParts.y}年　${todayParts.m}月　${todayParts.d}日`;

    document.getElementById("paper-dest-name").textContent = institution.name || "";
    document.getElementById("paper-dest-doctor").textContent = institution.doctorName || "";
    document.getElementById("paper-dest-dept").textContent = institution.department || "";

    document.getElementById("paper-origin-name").textContent = clinic.clinicName || "";
    document.getElementById("paper-origin-dentist").textContent = clinic.dentistName || "";
    document.getElementById("paper-origin-address").textContent = clinic.address || "";
    document.getElementById("paper-origin-phone").textContent = clinic.phone || "";

    document.getElementById("paper-patient-name").textContent = state.patientName || "";
    document.getElementById("paper-patient-address").textContent = state.patientAddress || "";
    document.getElementById("paper-patient-phone").textContent = state.patientPhone || "";

    document.getElementById("paper-gender-male").classList.toggle("selected", state.patientGender === "male");
    document.getElementById("paper-gender-female").classList.toggle("selected", state.patientGender === "female");

    const birthEl = document.getElementById("paper-patient-birth");
    if (state.patientBirthDate) {
      const b = new Date(state.patientBirthDate);
      if (!Number.isNaN(b.getTime())) {
        const bp = formatDateParts(b);
        const age = calcAge(state.patientBirthDate, today);
        birthEl.textContent = `${bp.y}年　${bp.m}月　${bp.d}日　（　${age !== null ? age : ""}歳　）`;
      } else {
        birthEl.textContent = "";
      }
    } else {
      birthEl.textContent = "";
    }

    const checks = buildChecks(state.selectedTreatments || []);
    setChecked(document.getElementById("chk-disease-caries"), checks.disease.has("う蝕"));
    setChecked(document.getElementById("chk-disease-perio"), checks.disease.has("歯周病"));
    setChecked(document.getElementById("chk-disease-other"), checks.diseaseOtherText.length > 0);
    document.getElementById("paper-disease-other-text").textContent = checks.diseaseOtherText;

    setChecked(document.getElementById("chk-plan-caries"), checks.plan.has("う蝕処置"));
    setChecked(document.getElementById("chk-plan-extraction"), checks.plan.has("抜歯"));
    setChecked(document.getElementById("chk-plan-perio-surgery"), checks.plan.has("歯周外科"));
    setChecked(document.getElementById("chk-plan-other"), checks.planOtherText.length > 0);
    document.getElementById("paper-plan-other-text").textContent = checks.planOtherText;

    document.getElementById("paper-prescription").textContent = "";
    document.getElementById("paper-request").textContent = state.generatedText || "";
    document.getElementById("paper-remarks").textContent = "";

    fitPaperToViewport();
  }

  function fitPaperToViewport() {
    const wrapper = document.getElementById("paper-viewport");
    const sheet = document.getElementById("paper-sheet");
    if (!wrapper || !sheet) return;
    sheet.style.transform = "none";
    const naturalWidth = sheet.offsetWidth;
    const naturalHeight = sheet.offsetHeight;
    const available = wrapper.clientWidth;
    const scale = naturalWidth > 0 ? Math.min(1, available / naturalWidth) : 1;
    sheet.style.transform = `scale(${scale})`;
    wrapper.style.height = `${naturalHeight * scale}px`;
  }

  function buildFilename() {
    const state = window.AppState;
    const institution = Storage.getInstitution(state.selectedInstitutionId) || {};
    const sanitize = (s) => (s || "").replace(/[\\/:*?"<>|]/g, "");
    return `診療情報連携共有照会_${sanitize(institution.name) || "照会先"}_${sanitize(state.patientName) || "患者"}.pdf`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function canShareFile(file) {
    return (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    );
  }

  async function sharePdf() {
    const sheet = document.getElementById("paper-sheet");
    const btn = document.getElementById("share-pdf-btn");
    const errorEl = document.getElementById("final-preview-error");

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    errorEl.classList.add("hidden");

    // スマホでは、用紙プレビューが縦に長くスクロールした状態でボタンを押すことが多い。
    // html2canvasは既定でビューポート幅・スクロール位置を基準にキャプチャするため、
    // そのままだとA4サイズの用紙が画面幅やスクロール位置に応じてズレて切り取られる。
    // 用紙自身の実寸（scale解除後の幅・高さ）をキャプチャ用の仮想ウィンドウとして固定し、
    // スクロール位置も明示的に0にすることで、端末やスクロール状態に依存しないようにする。
    sheet.style.transform = "none";
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const sheetWidth = sheet.offsetWidth;
    const sheetHeight = sheet.offsetHeight;

    const filename = buildFilename();
    btn.disabled = true;
    btn.textContent = "PDFを作成中...";

    const opt = {
      margin: 0,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: sheetWidth,
        windowHeight: sheetHeight,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: "avoid-all" },
    };

    try {
      const blob = await window.html2pdf().set(opt).from(sheet).outputPdf("blob");

      const file = new File([blob], filename, { type: "application/pdf" });

      if (canShareFile(file)) {
        btn.textContent = "共有中...";
        try {
          await navigator.share({
            files: [file],
            title: "診療情報連携共有に係る照会",
            text: "診療情報連携共有に係る照会（PDF）",
          });
        } catch (shareErr) {
          if (shareErr && shareErr.name !== "AbortError") {
            console.error(shareErr);
            downloadBlob(blob, filename);
          }
        }
      } else {
        downloadBlob(blob, filename);
      }
    } catch (err) {
      console.error(err);
      errorEl.textContent = "PDFの作成に失敗しました。通信環境をご確認のうえ、もう一度お試しください。";
      errorEl.classList.remove("hidden");
    } finally {
      fitPaperToViewport();
      btn.disabled = false;
      updateShareButtonLabel();
    }
  }

  function updateShareButtonLabel() {
    const btn = document.getElementById("share-pdf-btn");
    if (!btn) return;
    const supportsShare = typeof navigator.share === "function";
    btn.textContent = supportsShare ? "PDFを共有・印刷する" : "PDFをダウンロードする";
  }

  document.getElementById("share-pdf-btn").addEventListener("click", sharePdf);
  updateShareButtonLabel();

  window.addEventListener("resize", () => {
    if (Nav.getCurrent() === "screen-final-preview") fitPaperToViewport();
  });

  document.addEventListener("screenchange", () => {
    if (Nav.getCurrent() === "screen-final-preview") render();
  });

  window.FinalPreview = { render, buildChecks, calcAge };
})();
