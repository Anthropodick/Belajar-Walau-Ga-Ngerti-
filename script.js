(function () {
  "use strict";

  // =====================================================================
  // KONFIGURASI — GANTI SESUAI KEBUTUHANMU
  // =====================================================================
  const CONFIG_URL = "https://raw.githubusercontent.com/Anthropodick/Belajar-Walau-Ga-Ngerti-/refs/heads/main/urls.json";
  const SCHOOL_LOGO_URL = "https://raw.githubusercontent.com/Anthropodick/Belajar-Walau-Ga-Ngerti-/refs/heads/main/logo_sekolah.png";
  const SCHOOL_NAME = "SMPN 1 TUNTANG";
  const EXAM_TITLE = "PENILAIAN SUMATIF HARIAN BERSAMA (PSHB) GANJIL TA 2026/2027";

  // =====================================================================
  // STATE
  // =====================================================================
  let examKeyHariIni = "";
  let examUrlUjian = "";
  let examDurationMinutes = 60;
  let configLoaded = false;
  let countdownInterval = null;
  let remainingSeconds = 0;

  // =====================================================================
  // ELEMENT REFS
  // =====================================================================
  const loginScreen = document.getElementById("loginScreen");
  const examScreen = document.getElementById("examScreen");
  const loginForm = document.getElementById("loginForm");
  const kodeInput = document.getElementById("kodeInput");
  const btnEnter = document.getElementById("btnEnter");
  const loginHint = document.getElementById("loginHint");

  const schoolLogo = document.getElementById("schoolLogo");
  const schoolNameEl = document.getElementById("schoolName");
  const examTitleEl = document.getElementById("examTitle");
  const examTimerEl = document.getElementById("examTimer");
  const examFrame = document.getElementById("examFrame");

  const btnExit = document.getElementById("btnExit");
  const btnHome = document.getElementById("btnHome");
  const btnBack = document.getElementById("btnBack");
  const btnRefresh = document.getElementById("btnRefresh");
  const btnForward = document.getElementById("btnForward");

  const statusClock = document.getElementById("statusClock");
  const statusBattery = document.getElementById("statusBattery");

  const timeUpOverlay = document.getElementById("timeUpOverlay");
  const btnOverlayExit = document.getElementById("btnOverlayExit");

  const exitConfirmOverlay = document.getElementById("exitConfirmOverlay");
  const btnExitCancel = document.getElementById("btnExitCancel");
  const btnExitConfirm = document.getElementById("btnExitConfirm");

  const toastEl = document.getElementById("toast");

  // =====================================================================
  // INIT
  // =====================================================================
  schoolNameEl.textContent = SCHOOL_NAME;
  examTitleEl.textContent = EXAM_TITLE;
  schoolLogo.src = SCHOOL_LOGO_URL;
  schoolLogo.onerror = function () {
    schoolLogo.style.visibility = "hidden";
  };

  fetchExamConfig();
  updateClock();
  setInterval(updateClock, 15000);
  setRandomBattery();

  // =====================================================================
  // FETCH CONFIG DARI GITHUB
  // =====================================================================
  function fetchExamConfig() {
    loginHint.textContent = "Memuat data ujian...";
    btnEnter.disabled = true;

    fetch(CONFIG_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        examKeyHariIni = String(data.key_hari_ini || "");
        examUrlUjian = String(data.url_ujian || "");
        examDurationMinutes = Number(data.durasi_menit || 60);
        configLoaded = true;
        loginHint.textContent = "Masukkan kode ujian yang diberikan guru/admin.";
        btnEnter.disabled = false;
      })
      .catch(function (err) {
        console.error(err);
        configLoaded = false;
        loginHint.textContent = "Gagal memuat data ujian. Cek internet, lalu muat ulang halaman.";
        btnEnter.disabled = false;
      });
  }

  // =====================================================================
  // LOGIN / VERIFIKASI KODE
  // =====================================================================
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!configLoaded) {
      showToast("Data ujian belum siap, tunggu sebentar lalu coba lagi.");
      return;
    }

    const kode = kodeInput.value.trim();

    if (!kode) {
      showToast("Kode ujian belum diisi.");
      return;
    }

    if (kode !== examKeyHariIni) {
      showToast("Kode ujian salah, coba lagi.");
      kodeInput.value = "";
      kodeInput.focus();
      return;
    }

    enterExam();
  });

  function enterExam() {
    loginScreen.hidden = true;
    examScreen.hidden = false;

    if (examUrlUjian) {
      examFrame.src = examUrlUjian;
    }

    requestFullscreenBestEffort();
    startCountdown(examDurationMinutes * 60);
  }

  // =====================================================================
  // TIMER
  // =====================================================================
  function startCountdown(totalSeconds) {
    clearInterval(countdownInterval);
    remainingSeconds = totalSeconds;
    renderTimer();

    countdownInterval = setInterval(function () {
      remainingSeconds -= 1;
      renderTimer();

      if (remainingSeconds <= 0) {
        clearInterval(countdownInterval);
        showTimeUp();
      }
    }, 1000);
  }

  function renderTimer() {
    const s = Math.max(remainingSeconds, 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    examTimerEl.textContent =
      String(h).padStart(2, "0") + ":" +
      String(m).padStart(2, "0") + ":" +
      String(sec).padStart(2, "0");

    examTimerEl.classList.remove("timer-warning", "timer-danger");
    if (s <= 60) {
      examTimerEl.classList.add("timer-danger");
    } else if (s <= 300) {
      examTimerEl.classList.add("timer-warning");
    }
  }

  function showTimeUp() {
    timeUpOverlay.hidden = false;
  }

  btnOverlayExit.addEventListener("click", function () {
    doExit();
  });

  // =====================================================================
  // TOMBOL FOOTER
  // =====================================================================
  btnHome.addEventListener("click", function () {
    if (examUrlUjian) examFrame.src = examUrlUjian;
  });

  btnBack.addEventListener("click", function () {
    showToast("Tidak bisa navigasi mundur di dalam konten ujian.");
  });

  btnForward.addEventListener("click", function () {
    showToast("Tidak bisa navigasi maju di dalam konten ujian.");
  });

  btnRefresh.addEventListener("click", function () {
    // eslint-disable-next-line no-self-assign
    examFrame.src = examFrame.src;
  });

  btnExit.addEventListener("click", function () {
    exitConfirmOverlay.hidden = false;
  });

  btnExitCancel.addEventListener("click", function () {
    exitConfirmOverlay.hidden = true;
  });

  btnExitConfirm.addEventListener("click", function () {
    exitConfirmOverlay.hidden = true;
    doExit();
  });

  function doExit() {
    clearInterval(countdownInterval);
    exitFullscreenBestEffort();

    // Browser modern umumnya TIDAK MENGIZINKAN tab menutup dirinya sendiri
    // kecuali tab itu dibuka lewat script. Kita coba, dan siapkan fallback.
    window.close();

    setTimeout(function () {
      document.body.innerHTML =
        '<div style="height:100dvh;display:flex;align-items:center;justify-content:center;' +
        'flex-direction:column;font-family:sans-serif;text-align:center;padding:24px;background:#16233F;color:#fff;">' +
        '<p style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Ujian telah berakhir</p>' +
        '<p style="font-size:0.85rem;color:#CFD6E4;">Kamu boleh menutup tab ini sekarang.</p>' +
        "</div>";
    }, 300);
  }

  // =====================================================================
  // FULLSCREEN (best effort, tidak wajib berhasil)
  // =====================================================================
  function requestFullscreenBestEffort() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) {
      try { req.call(el); } catch (e) { /* diabaikan, tidak fatal */ }
    }
  }

  function exitFullscreenBestEffort() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exit && document.fullscreenElement) {
      try { exit.call(document); } catch (e) { /* diabaikan */ }
    }
  }

  // =====================================================================
  // JAM (live, mengikuti waktu HP si pengguna)
  // =====================================================================
  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    statusClock.textContent = "\uD83D\uDD50 " + hh + ":" + mm;
  }

  // =====================================================================
  // BATERAI (SENGAJA DI-RANDOM 30-100%, BUKAN BACA BATERAI HP ASLI)
  // =====================================================================
  function setRandomBattery() {
    const pct = Math.floor(Math.random() * (100 - 30 + 1)) + 30;
    statusBattery.textContent = "\uD83D\uDD0B " + pct + "%";
  }

  // =====================================================================
  // TOAST
  // =====================================================================
  let toastTimeout = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toastEl.hidden = true;
    }, 2600);
  }
})();
