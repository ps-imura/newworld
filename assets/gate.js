/* AI運用指南書 — 簡易パスワードゲート
 *
 * 注意：これは「うっかり一般公開を防ぐ」程度の簡易保護です。
 * クライアント側で完結する以上、本気で覗こうとする人には突破されます。
 * 本書は機密情報を本文に含まない設計です。完全な機密保護が必要なら、
 * Firebase Authentication / Cloud Functions / Cloudflare Access などの
 * サーバーサイド認証を別途検討してください。
 *
 * パスワード変更時は STORED_HASH を新しい SHA-256 ハッシュに差し替えるだけでOK。
 *   shell:  echo -n "新しいパスワード" | shasum -a 256
 *   python: python3 -c "import hashlib;print(hashlib.sha256(b'新しいパスワード').hexdigest())"
 */
(function () {
  // 合言葉のSHA-256ハッシュ（平文：Hello,newworld_I'm_coming_b@ck_totally_nuts）
  const STORED_HASH =
    "5a5b52f3172a69f2d49e4c1cbc77857eaecd43407ff2116d0d646db079b1555b";
  const STORAGE_KEY = "guidebook-access-granted-v1";

  async function sha256(text) {
    const buffer = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  async function checkPassword(input) {
    const hash = await sha256(input);
    if (hash === STORED_HASH) {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch (e) {}
      return true;
    }
    return false;
  }

  function setupGateForm() {
    const form = document.getElementById("gate-form");
    if (!form) return;
    const input = form.querySelector("input[name='password']");
    const errorEl = document.getElementById("gate-error");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const value = input.value;
      const ok = await checkPassword(value);
      if (ok) {
        // ?back= があればそこへ、なければ index.html へ
        const params = new URLSearchParams(location.search);
        const back = params.get("back");
        if (back) {
          location.replace(decodeURIComponent(back));
        } else {
          location.replace("./index.html");
        }
      } else {
        if (errorEl) {
          errorEl.textContent = "合言葉が違います。もう一度入力してください。";
          errorEl.style.display = "block";
        }
        input.value = "";
        input.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupGateForm);
  } else {
    setupGateForm();
  }
})();
