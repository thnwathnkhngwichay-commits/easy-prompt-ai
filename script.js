// Supabase Configuration
// ใส่ URL และ Anon Key ของคุณที่นี่ (หากปล่อยว่างไว้ ระบบจะใช้ข้อมูลนิทานแบบออฟไลน์ใน data.js เป็น Fallback โดยอัตโนมัติ)
const SUPABASE_URL = "https://gdumoliwfdqumpvfaucp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hxVdHJ9G22UJK1FDpn647A_gdy6Q-GB";
let supabaseClient = null;

if (typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
    }
}

let generatedSections = [];

// มาตรฐานโปรเจกต์ Phase C — คงที่ทุกการสร้างคลิป
const PROJECT_STANDARD = {
    aspectRatio: "9:16",
    duration: 60,
    sceneCount: 10,
    style: "Realistic / Photorealistic / Cinematic",
    platform: "TikTok / YouTube Shorts / Facebook Reels"
};

// ฟังก์ชันเข้าถึง sessionStorage อย่างปลอดภัยเพื่อป้องกันเบราว์เซอร์บล็อค local file (file://)
function getSessionValue(key) {
    try {
        return sessionStorage.getItem(key);
    } catch (e) {
        console.warn("sessionStorage is not accessible, using fallback:", e);
        return window.sessionFallback ? window.sessionFallback[key] : null;
    }
}

function setSessionValue(key, value) {
    try {
        sessionStorage.setItem(key, value);
    } catch (e) {
        console.warn("sessionStorage is not accessible, using fallback:", e);
        if (!window.sessionFallback) window.sessionFallback = {};
        window.sessionFallback[key] = value;
    }
}

function removeSessionValue(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (e) {
        console.warn("sessionStorage is not accessible, using fallback:", e);
        if (window.sessionFallback) delete window.sessionFallback[key];
    }
}

async function initializeStories() {
    if (!supabaseClient) {
        console.log("Supabase URL หรือ Anon Key ไม่ได้กำหนดค่า หรือโหลดไลบรารีไม่สำเร็จ ใช้ข้อมูลนิทานแบบ Local Fallback จาก data.js");
        return;
    }

    try {
        console.log("กำลังดึงข้อมูลนิทานจาก Supabase...");
        const { data, error } = await supabaseClient
            .from("stories")
            .select("slug, label, source")
            .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            const mappedStories = data.map((story) => ({
                id: story.slug,
                label: story.label,
                source: story.source
            }));

            // เพิ่มตัวเลือก Custom ท้ายสุดเสมอ
            mappedStories.push({
                id: "custom",
                label: "✍️ กำหนดเรื่องเอง (Custom)...",
                source: ""
            });

            EASY_PROMPT_DATA.stories = mappedStories;
            console.log("โหลดข้อมูลนิทานจาก Supabase สำเร็จ:", EASY_PROMPT_DATA.stories);
        } else {
            console.warn("ไม่พบข้อมูลนิทานในตาราง Supabase ใช้ข้อมูลนิทานสำรอง");
        }
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลจาก Supabase:", err);
        console.log("ระบบสลับไปใช้ข้อมูลนิทานสำรองจาก data.js อัตโนมัติ");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initializeStories();
        setupSelectOptions();
        setupDefaultValues();
        setupEventListeners();
        await checkSupabaseSession();
    } catch (error) {
        console.error("Error during initialization:", error);
    }
});

function setupSelectOptions() {
    fillSelect("storySelect", EASY_PROMPT_DATA.stories);
    fillSelect("targetSelect", EASY_PROMPT_DATA.targets);
    fillSelect("visualStyleSelect", EASY_PROMPT_DATA.visualStyles);
    fillSelect("durationSelect", EASY_PROMPT_DATA.clipDurations);
    fillSelect("sceneCountSelect", EASY_PROMPT_DATA.sceneCounts);
    fillSelect("toneSelect", EASY_PROMPT_DATA.storyTones);
    fillSelect("voiceSelect", EASY_PROMPT_DATA.voiceTypes);
    fillSelect("languageLevelSelect", EASY_PROMPT_DATA.languageLevels);
}

function fillSelect(selectId, items) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = "";

    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.label;
        select.appendChild(option);
    });
}

function setupDefaultValues() {
    document.getElementById("creatorName").value =
        EASY_PROMPT_DATA.defaultCredit.creator;

    document.getElementById("institutionName").value =
        EASY_PROMPT_DATA.defaultCredit.institution;

    document.getElementById("warningText").textContent =
        EASY_PROMPT_DATA.warningText;

    setSelectValue("durationSelect", "60");
    setSelectValue("sceneCountSelect", "10");

    // ตั้งค่าเริ่มต้นให้นิทานตัวเลือกแรก
    if (EASY_PROMPT_DATA.stories && EASY_PROMPT_DATA.stories.length > 0) {
        const defaultStory = EASY_PROMPT_DATA.stories[0];
        setSelectValue("storySelect", defaultStory.id);
        document.getElementById("storySource").value = defaultStory.source;
        document.getElementById("storyTitle").value = defaultStory.label;
        document.getElementById("storyTitleGroup").classList.add("hidden");
    }
}

function setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);

    if (select) {
        select.value = value;
    }
}

function setupEventListeners() {
    document
        .getElementById("storySelect")
        .addEventListener("change", handleStoryChange);

    document
        .getElementById("toggleAdvancedBtn")
        .addEventListener("click", toggleAdvancedOptions);

    document
        .getElementById("generateBtn")
        .addEventListener("click", generateProject);

    document
        .getElementById("copyAllBtn")
        .addEventListener("click", copyAllResults);

    document
        .getElementById("downloadBtn")
        .addEventListener("click", downloadTextFile);

    document
        .getElementById("saveProjectBtn")
        .addEventListener("click", saveProjectToBrowser);

    document
        .getElementById("clearBtn")
        .addEventListener("click", clearForm);

    // ดักฟังการคลิกเมนูลัดฝั่งขวา
    document.querySelectorAll(".preview-item-btn").forEach((btn) => {
        btn.addEventListener("click", handlePreviewClick);
    });

    // ---- Supabase Auth event listeners ----
    // Tab switcher
    document.getElementById("tabLoginBtn").addEventListener("click", () => switchAuthTab("login"));
    document.getElementById("tabRegisterBtn").addEventListener("click", () => switchAuthTab("register"));

    // Login form
    document.getElementById("loginForm").addEventListener("submit", handleLoginSubmit);

    // Register form
    document.getElementById("registerForm").addEventListener("submit", handleRegisterSubmit);

    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);

    // Setup Showcase Thumbnail Switcher
    setupShowcasePlaylist();
}

/**
 * จัดการสลับวิดีโอตัวอย่างใน Showcase Section และระบบขยาย/ย่อวิดีโอ (Expand / Shrink Showcase)
 */
function setupShowcasePlaylist() {
    const mainVideo = document.getElementById("mainShowcaseVideo");
    const videoTitle = document.getElementById("showcaseVideoTitle");
    const videoSub = document.getElementById("showcaseVideoSub");
    const cards = document.querySelectorAll(".showcase-thumb-card");
    const mainContainer = document.getElementById("showcaseMainContainer");
    const expandBtn = document.getElementById("showcaseExpandBtn");
    const expandFloatingBtn = document.getElementById("showcaseExpandFloatingBtn");
    const closeBtn = document.getElementById("showcaseCloseBtn");
    const modalBackdrop = document.getElementById("showcaseModalBackdrop");
    const expandBtnText = document.getElementById("showcaseExpandBtnText");

    if (!mainVideo || cards.length === 0) return;

    // Switch video when clicking thumbnail cards
    cards.forEach((card) => {
        card.addEventListener("click", () => {
            const src = card.getAttribute("data-src");
            const title = card.getAttribute("data-title");
            const sub = card.getAttribute("data-sub");

            if (src && mainVideo.getAttribute("src") !== src) {
                mainVideo.src = src;
                mainVideo.load();
                mainVideo.play().catch((err) => {
                    console.log("Browser autoplay policy prevented auto-play:", err);
                });
            }

            if (title && videoTitle) videoTitle.textContent = title;
            if (sub && videoSub) videoSub.textContent = sub;

            cards.forEach((c) => c.classList.remove("active"));
            card.classList.add("active");
        });
    });

    // Toggle icons for expand/shrink
    const expandIconSvg = `<svg class="expand-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
    const shrinkIconSvg = `<svg class="expand-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="10" y1="14" x2="3" y2="21"></line></svg>`;

    function updateExpandBtnUI(isExpanded) {
        if (!expandBtn) return;
        const iconEl = expandBtn.querySelector(".expand-icon");
        if (isExpanded) {
            if (iconEl) iconEl.outerHTML = shrinkIconSvg;
            if (expandBtnText) expandBtnText.textContent = "ย่อขนาดวิดีโอ";
            expandBtn.title = "ย่อขนาดวิดีโอ";
            expandBtn.setAttribute("aria-label", "ย่อขนาดวิดีโอ");
        } else {
            if (iconEl) iconEl.outerHTML = expandIconSvg;
            if (expandBtnText) expandBtnText.textContent = "ขยายวิดีโอ";
            expandBtn.title = "ขยายวิดีโอ";
            expandBtn.setAttribute("aria-label", "ขยายวิดีโอ");
        }
    }

    function expandVideo() {
        if (!mainContainer) return;
        mainContainer.classList.add("is-expanded");
        if (modalBackdrop) modalBackdrop.classList.add("active");
        updateExpandBtnUI(true);
        document.body.style.overflow = "hidden";
    }

    function shrinkVideo() {
        if (!mainContainer) return;
        mainContainer.classList.remove("is-expanded");
        if (modalBackdrop) modalBackdrop.classList.remove("active");
        updateExpandBtnUI(false);
        document.body.style.overflow = "";
    }

    function toggleExpand() {
        if (mainContainer && mainContainer.classList.contains("is-expanded")) {
            shrinkVideo();
        } else {
            expandVideo();
        }
    }

    if (expandBtn) expandBtn.addEventListener("click", toggleExpand);
    if (expandFloatingBtn) expandFloatingBtn.addEventListener("click", expandVideo);
    if (closeBtn) closeBtn.addEventListener("click", shrinkVideo);
    if (modalBackdrop) modalBackdrop.addEventListener("click", shrinkVideo);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && mainContainer && mainContainer.classList.contains("is-expanded")) {
            shrinkVideo();
        }
    });
}

// =============================================
// ---- Supabase Auth Functions ----
// =============================================

/**
 * ตรวจสอบ Supabase Auth Session เมื่อเปิดเว็บ
 * ถ้ามี Session ที่ยังใช้งานได้ → ซ่อน Modal ทันที
 * ถ้าไม่มี → แสดง Modal ให้ Login/Register
 */
async function checkSupabaseSession() {
    const authModal = document.getElementById("authModal");
    const logoutBtn = document.getElementById("logoutBtn");
    const userEmailDisplay = document.getElementById("userEmailDisplay");

    if (!supabaseClient) {
        // Supabase ไม่พร้อม: แสดง Modal ไว้ก่อนแต่ให้แสดงข้อความแจ้ง
        console.warn("Supabase client ไม่พร้อมใช้งาน ไม่สามารถตรวจสอบ Session ได้");
        showAuthModal();
        return;
    }

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("เกิดข้อผิดพลาดในการดึง Session:", error);
            showAuthModal();
            return;
        }

        if (session && session.user) {
            // มี Session จริง → ซ่อน Modal แสดง Email และปุ่ม Logout
            hideAuthModal(session.user.email);
        } else {
            // ไม่มี Session → แสดง Modal
            showAuthModal();
        }

        // ฟัง Auth State Changes (Login/Logout จากแท็บอื่น)
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session && session.user) {
                hideAuthModal(session.user.email);
            } else {
                showAuthModal();
            }
        });

    } catch (err) {
        console.error("checkSupabaseSession error:", err);
        showAuthModal();
    }
}

/** แสดง Auth Modal */
function showAuthModal() {
    const authModal = document.getElementById("authModal");
    const logoutBtn = document.getElementById("logoutBtn");
    const userEmailDisplay = document.getElementById("userEmailDisplay");

    if (authModal) authModal.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (userEmailDisplay) userEmailDisplay.classList.add("hidden");
}

/** ซ่อน Auth Modal เมื่อ Login สำเร็จ */
function hideAuthModal(email) {
    const authModal = document.getElementById("authModal");
    const logoutBtn = document.getElementById("logoutBtn");
    const userEmailDisplay = document.getElementById("userEmailDisplay");

    if (authModal) authModal.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (userEmailDisplay && email) {
        userEmailDisplay.textContent = email;
        userEmailDisplay.classList.remove("hidden");
    }
}

/** สลับ Tab ระหว่าง Login และ Register */
function switchAuthTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabRegisterBtn = document.getElementById("tabRegisterBtn");

    // Reset ข้อความ error/success ทุกครั้งที่เปลี่ยน Tab
    clearAuthMessages();

    if (tab === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        tabLoginBtn.classList.add("auth-tab-active");
        tabRegisterBtn.classList.remove("auth-tab-active");
    } else {
        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        tabRegisterBtn.classList.add("auth-tab-active");
        tabLoginBtn.classList.remove("auth-tab-active");
    }
}

/** ล้างข้อความ Error/Success ทั้งหมดใน Auth Modal */
function clearAuthMessages() {
    const ids = ["loginErrorMsg", "registerErrorMsg", "registerSuccessMsg"];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = "";
            el.classList.add("hidden");
        }
    });
}

/** แปลข้อความ Error จาก Supabase เป็นภาษาไทย */
function translateSupabaseError(errorMessage) {
    if (!errorMessage) return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
    const msg = errorMessage.toLowerCase();
    if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
        return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    }
    if (msg.includes("user already registered") || msg.includes("already registered")) {
        return "อีเมลนี้ถูกลงทะเบียนไว้แล้ว";
    }
    if (msg.includes("email not confirmed")) {
        return "กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ";
    }
    if (msg.includes("password should be at least") || msg.includes("weak_password")) {
        return "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    }
    if (msg.includes("unable to validate email") || msg.includes("invalid email")) {
        return "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (msg.includes("network") || msg.includes("fetch")) {
        return "ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาลองใหม่";
    }
    if (msg.includes("too many requests") || msg.includes("over_email_send_rate_limit")) {
        return "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
    }
    return `เกิดข้อผิดพลาด: ${errorMessage}`;
}

/** ตั้งสถานะปุ่ม Submit ระหว่างกำลังโหลด */
function setAuthButtonLoading(buttonId, isLoading, defaultText) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "กำลังดำเนินการ..." : defaultText;
}

/**
 * จัดการ Login ด้วย Supabase Auth (Email + Password)
 */
async function handleLoginSubmit(event) {
    event.preventDefault();

    if (!supabaseClient) {
        showAuthError("loginErrorMsg", "ไม่สามารถเชื่อมต่อ Supabase ได้ในขณะนี้");
        return;
    }

    const email = document.getElementById("loginEmailInput").value.trim();
    const password = document.getElementById("loginPasswordInput").value;

    if (!email || !password) {
        showAuthError("loginErrorMsg", "กรุณากรอกอีเมลและรหัสผ่านให้ครบ");
        return;
    }

    setAuthButtonLoading("loginSubmitBtn", true, "เข้าสู่ระบบ");
    clearAuthMessages();

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            showAuthError("loginErrorMsg", translateSupabaseError(error.message));
            return;
        }

        if (data && data.user) {
            // Login สำเร็จ: ซ่อน Modal และรีเซ็ต Form
            hideAuthModal(data.user.email);
            document.getElementById("loginEmailInput").value = "";
            document.getElementById("loginPasswordInput").value = "";
        }

    } catch (err) {
        console.error("handleLoginSubmit error:", err);
        showAuthError("loginErrorMsg", "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
    } finally {
        setAuthButtonLoading("loginSubmitBtn", false, "เข้าสู่ระบบ");
    }
}

/**
 * จัดการ Register ด้วย Supabase Auth (Email + Password)
 */
async function handleRegisterSubmit(event) {
    event.preventDefault();

    if (!supabaseClient) {
        showAuthError("registerErrorMsg", "ไม่สามารถเชื่อมต่อ Supabase ได้ในขณะนี้");
        return;
    }

    const email = document.getElementById("registerEmailInput").value.trim();
    const password = document.getElementById("registerPasswordInput").value;
    const confirmPassword = document.getElementById("registerPasswordConfirmInput").value;

    // Validation ฝั่ง Client
    if (!email || !password || !confirmPassword) {
        showAuthError("registerErrorMsg", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
        return;
    }

    if (password.length < 6) {
        showAuthError("registerErrorMsg", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
        return;
    }

    if (password !== confirmPassword) {
        showAuthError("registerErrorMsg", "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
    }

    setAuthButtonLoading("registerSubmitBtn", true, "สมัครสมาชิก");
    clearAuthMessages();

    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });

        if (error) {
            showAuthError("registerErrorMsg", translateSupabaseError(error.message));
            return;
        }

        // Supabase ส่ง Confirmation Email หรือ Login อัตโนมัติขึ้นอยู่กับการตั้งค่า
        if (data && data.user) {
            if (data.session) {
                // ไม่ต้องยืนยัน Email (Email Confirmations ปิดอยู่) → Login อัตโนมัติ
                hideAuthModal(data.user.email);
            } else {
                // ต้องยืนยัน Email ก่อน → แสดงข้อความแจ้ง
                showAuthSuccess(
                    "registerSuccessMsg",
                    "สมัครสมาชิกสำเร็จแล้ว! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ"
                );
                // ล้าง Form
                document.getElementById("registerEmailInput").value = "";
                document.getElementById("registerPasswordInput").value = "";
                document.getElementById("registerPasswordConfirmInput").value = "";
            }
        }

    } catch (err) {
        console.error("handleRegisterSubmit error:", err);
        showAuthError("registerErrorMsg", "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
    } finally {
        setAuthButtonLoading("registerSubmitBtn", false, "สมัครสมาชิก");
    }
}

/**
 * จัดการ Logout ด้วย Supabase Auth
 */
async function handleLogout() {
    const confirmLogout = confirm("ต้องการออกจากระบบใช่หรือไม่?");
    if (!confirmLogout) return;

    if (supabaseClient) {
        try {
            await supabaseClient.auth.signOut();
        } catch (err) {
            console.error("handleLogout error:", err);
        }
    }

    // รีเซ็ต UI
    showAuthModal();
    switchAuthTab("login");

    // รีเซ็ตข้อมูล Generator
    document.getElementById("storyTitle").value = "";
    document.getElementById("storySource").value = "";
    setupDefaultValues();

    generatedSections = [];
    document.getElementById("resultContainer").innerHTML = "";
    document.getElementById("results").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/** แสดงข้อความ Error ใน Auth Modal */
function showAuthError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.remove("hidden");
    }
}

/** แสดงข้อความ Success ใน Auth Modal */
function showAuthSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.remove("hidden");
    }
}

function handlePreviewClick(event) {
    const button = event.currentTarget;
    const targetId = button.getAttribute("data-target");

    const resultsSection = document.getElementById("results");
    const isGenerated = !resultsSection.classList.contains("hidden");

    if (!isGenerated) {
        alert("กรุณากดสร้างชุดงานคลิปธรรมะก่อน");
    } else {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

            // ไฮไลท์การ์ดด้วยเส้นขอบสีทองเด่นชั่วคราว
            targetElement.style.outline = "4px solid #c98a24";
            targetElement.style.outlineOffset = "4px";
            targetElement.style.transition = "outline 0.2s ease";

            setTimeout(() => {
                targetElement.style.outline = "none";
            }, 1500);
        }
    }
}

function handleStoryChange(event) {
    const selectedId = event.target.value;
    const story = getSelectedItem(EASY_PROMPT_DATA.stories, selectedId);

    if (!story) return;

    const titleGroup = document.getElementById("storyTitleGroup");
    const titleInput = document.getElementById("storyTitle");
    const sourceTextarea = document.getElementById("storySource");

    if (selectedId === "custom") {
        titleGroup.classList.remove("hidden");
        titleInput.value = "";
        sourceTextarea.value = "";
        titleInput.focus();
    } else {
        titleGroup.classList.add("hidden");
        titleInput.value = story.label;
        sourceTextarea.value = story.source;
    }
}

function toggleAdvancedOptions() {
    const box = document.getElementById("advancedOptions");
    box.classList.toggle("hidden");
}

function getSelectedItem(list, id) {
    return list.find((item) => item.id === id);
}

function getFormData() {
    const title = document.getElementById("storyTitle").value.trim();
    const source = document.getElementById("storySource").value.trim();

    const target = getSelectedItem(
        EASY_PROMPT_DATA.targets,
        document.getElementById("targetSelect").value
    );

    const visualStyle = getSelectedItem(
        EASY_PROMPT_DATA.visualStyles,
        document.getElementById("visualStyleSelect").value
    );

    const duration = getSelectedItem(
        EASY_PROMPT_DATA.clipDurations,
        document.getElementById("durationSelect").value
    );

    const sceneCount = getSelectedItem(
        EASY_PROMPT_DATA.sceneCounts,
        document.getElementById("sceneCountSelect").value
    );

    const tone = getSelectedItem(
        EASY_PROMPT_DATA.storyTones,
        document.getElementById("toneSelect").value
    );

    const voice = getSelectedItem(
        EASY_PROMPT_DATA.voiceTypes,
        document.getElementById("voiceSelect").value
    );

    const languageLevel = getSelectedItem(
        EASY_PROMPT_DATA.languageLevels,
        document.getElementById("languageLevelSelect").value
    );

    const creator = document.getElementById("creatorName").value.trim();
    const institution = document.getElementById("institutionName").value.trim();

    return {
        title,
        source,
        target,
        visualStyle,
        duration,
        sceneCount,
        tone,
        voice,
        languageLevel,
        creator,
        institution
    };
}

function generateProject() {
    const data = getFormData();

    if (!data.title) {
        alert("กรุณากรอกหัวข้อเรื่อง หรือชื่อนิทานชาดกก่อนครับ");
        return;
    }

    if (!data.source) {
        alert("กรุณากรอกเนื้อเรื่องย่อ หรือข้อมูลต้นฉบับก่อนครับ");
        return;
    }

    generatedSections = createResultSections(data);
    renderResults(generatedSections);

    document.getElementById("results").classList.remove("hidden");
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

function createResultSections(data) {
    const sceneTotal = Number(data.sceneCount.id);
    const durationTotal = Number(data.duration.id);
    const secondsPerScene = Math.round(durationTotal / sceneTotal);

    const scenePlan = createScenePlan(data, sceneTotal, secondsPerScene);
    const sceneData = createScenesData(data, sceneTotal, secondsPerScene);
    const characterSheet = createCharacterSheet(data);

    const title = `นิทานชาดก 1 นาที: ${data.title}`;

    const summary = `คลิปนี้เล่าเรื่อง "${data.title}" ในรูปแบบภาพยนตร์ธรรมะสั้น ๆ สำหรับกลุ่มเป้าหมาย "${data.target.label}" โดยยึดข้อมูลต้นฉบับที่ผู้ใช้กรอกเป็นหลัก และเรียบเรียงให้มีจุดเปิดเรื่อง ความขัดแย้ง จุดเปลี่ยน และข้อคิดท้ายเรื่องอย่างกระชับ`;

    const narration = createNarrationScript(data);
    const imagePromptThai = createImagePromptThai(data);
    const imagePromptEnglish = createImagePromptEnglish(data);
    const videoPromptThai = createVideoPromptThai(data);
    const videoPromptEnglish = createVideoPromptEnglish(data);
    const subtitle = createSubtitle(data);
    const moral = createMoral(data);
    const credit = createCredit(data);
    const voicePrompt = createVoicePrompt(data);
    const masterPrompt = createMasterPrompt(data);

    return [
        { title: "Character Sheet สำหรับสร้างวิดีโอ", content: characterSheet },
        { title: "ชื่อเรื่องคลิป", content: title },
        { title: "เรื่องย่อ", content: summary },
        { title: "สคริปต์เสียงบรรยาย", content: narration },
        { title: "แผนฉาก", content: scenePlan, type: "scene-plan", scenes: sceneData },
        { title: "Prompt ภาพภาษาไทย", content: imagePromptThai },
        { title: "Prompt ภาพภาษาอังกฤษ", content: imagePromptEnglish },
        { title: "Prompt วิดีโอ Google Flow ภาษาไทย", content: videoPromptThai },
        { title: "Prompt วิดีโอ Google Flow ภาษาอังกฤษ", content: videoPromptEnglish },
        { title: "คำขึ้นจอ / Subtitle", content: subtitle },
        { title: "ข้อคิดท้ายเรื่อง", content: moral },
        { title: "เครดิตท้ายคลิป", content: credit },
        { title: "Prompt เสียงบรรยาย Google AI Studio", content: voicePrompt },
        { title: "Master Prompt สำหรับ ChatGPT / Gemini", content: masterPrompt }
    ];
}

function createScenePlan(data, sceneTotal, secondsPerScene) {
    let scenes = "";

    for (let i = 1; i <= sceneTotal; i++) {
        const start = (i - 1) * secondsPerScene;
        const end = i === sceneTotal ? Number(data.duration.id) : i * secondsPerScene;

        scenes += `ฉากที่ ${i} (${start}-${end} วินาที)
ภาพ: ฉากเล่าเรื่องจาก "${data.title}" ตามลำดับเหตุการณ์ในต้นฉบับ
เสียงบรรยาย: ดำเนินเรื่องให้กระชับ มีอารมณ์ และเชื่อมโยงกับข้อคิดธรรมะ
คำขึ้นจอ: ประโยคสั้น ๆ ที่สื่อใจความสำคัญของฉากนี้
Prompt ภาพ: ใช้สไตล์ "${data.visualStyle.label}"
Prompt วิดีโอ: เคลื่อนไหวแบบภาพยนตร์ นุ่มนวล เหมาะกับคลิปธรรมะ

`;
    }

    return scenes.trim();
}

function createNarrationScript(data) {
    return `เปิดเรื่องด้วยคำถามหรือประโยคสะกิดใจเกี่ยวกับ "${data.title}"

จากนั้นเล่าเนื้อเรื่องจากข้อมูลต้นฉบับนี้:
"${data.source}"

ให้เรียบเรียงเป็นเสียงบรรยายความยาวประมาณ ${data.duration.label}
โทนการเล่า: ${data.tone.label}
กลุ่มเป้าหมาย: ${data.target.label}
ระดับภาษา: ${data.languageLevel.label}

แนวทาง:
- เปิดเรื่องให้ดึงดูดภายใน 3 วินาทีแรก
- เล่าเหตุการณ์สำคัญอย่างกระชับ
- มีจุดเปลี่ยนหรือจุดพีคช่วงกลางถึงท้าย
- ปิดท้ายด้วยข้อคิดธรรมะที่จำง่าย
- ห้ามเปลี่ยนแก่นเรื่องหรือหลักธรรมจากต้นฉบับ`;
}

function createImagePromptThai(data) {
    return `สร้างภาพประกอบนิทานชาดกเรื่อง "${data.title}"

ข้อมูลเรื่อง:
${data.source}

สไตล์ภาพ:
${data.visualStyle.thai}

แนวภาพ:
- ภาพสมจริง สวยงาม มีอารมณ์แบบภาพยนตร์
- เหมาะกับคลิปธรรมะ 1 นาที
- แสงอบอุ่น สงบ น่าเลื่อมใส
- ตัวละครมีสีหน้าและท่าทางสื่ออารมณ์
- องค์ประกอบภาพชัดเจน ใช้เล่าเรื่องได้
- หลีกเลี่ยงภาพที่ไม่เหมาะสมกับพระพุทธศาสนา

ให้สร้างภาพแยกตามฉากที่ระบบวางไว้`;
}

function createImagePromptEnglish(data) {
    return `Create cinematic visual scenes for a one-minute Buddhist Jataka story titled "${data.title}".

Story source:
${data.source}

Visual style:
${data.visualStyle.english}

Requirements:
- cinematic composition
- warm golden light
- peaceful and reverent Buddhist atmosphere
- realistic human emotions
- strong visual storytelling
- suitable for a 9:16 vertical short video
- detailed environment and expressive characters
- respectful Buddhist imagery
- no text, no watermark, no logo

Generate separate image prompts for each scene based on the story structure.`;
}

function createVideoPromptThai(data) {
    return `สร้างวิดีโอจากภาพประกอบนิทานชาดกเรื่อง "${data.title}"

รูปแบบวิดีโอ:
- คลิปแนวตั้ง 9:16
- ความยาวรวม ${data.duration.label}
- จำนวนฉาก ${data.sceneCount.label}
- โทนการเล่า ${data.tone.label}
- สไตล์ภาพ ${data.visualStyle.label}

แนวทางการเคลื่อนไหว:
- กล้องค่อย ๆ push-in อย่างนุ่มนวล
- มีแสงทองอบอุ่นและฝุ่นละอองลอยเบา ๆ
- ตัวละครเคลื่อนไหวเล็กน้อยอย่างเป็นธรรมชาติ
- ใช้จังหวะภาพยนตร์ มีอารมณ์ มีจุดพีค
- เหมาะกับการนำไปตัดต่อพร้อมเสียงบรรยาย

ห้ามทำให้เนื้อหาบิดเบือนจากนิทานต้นฉบับ`;
}

function createVideoPromptEnglish(data) {
    return `Create a cinematic 9:16 vertical video sequence for a one-minute Buddhist Jataka story titled "${data.title}".

Duration: ${data.duration.label}
Scene count: ${data.sceneCount.label}
Narrative tone: ${data.tone.label}
Visual style: ${data.visualStyle.english}
Target audience: ${data.target.label}

Video direction:
- slow cinematic push-in
- gentle camera movement
- warm golden lighting
- peaceful Buddhist atmosphere
- subtle floating dust particles
- natural character movement
- emotional storytelling
- clear beginning, conflict, turning point, and moral ending
- suitable for YouTube Shorts, Facebook Reels, and TikTok

Avoid horror, disrespectful religious imagery, distorted anatomy, unreadable text, watermark, logo, or exaggerated fantasy.`;
}

function createSubtitle(data) {
    return `คำขึ้นจอควรเป็นประโยคสั้น กระชับ และกินใจ

ตัวอย่างแนวทาง:
1. บางครั้ง...สิ่งที่เราเลือกฟัง อาจเปลี่ยนใจเราโดยไม่รู้ตัว
2. เมื่อใจอยู่ใกล้สิ่งใด ใจก็มักค่อย ๆ คล้อยตามสิ่งนั้น
3. นิทานชาดกเรื่องนี้ เตือนให้เราเห็นพลังของสิ่งแวดล้อม
4. คบกัลยาณมิตร ชีวิตย่อมมีทางสว่าง
5. ข้อคิด: จงเลือกสิ่งแวดล้อมที่พาใจไปสู่ความดี

ให้ปรับคำขึ้นจอตามเรื่อง "${data.title}" และกลุ่มเป้าหมาย "${data.target.label}"`;
}

function createMoral(data) {
    return `ข้อคิดท้ายเรื่องของ "${data.title}"

ให้สรุปเป็นข้อความสั้น ๆ ว่า:
- เรื่องนี้สอนอะไร
- ผู้ชมควรนำไปใช้ในชีวิตอย่างไร
- เชื่อมโยงกับหลักธรรมโดยไม่สั่งสอนแรงเกินไป
- จบด้วยประโยคที่จำง่ายและมีพลัง`;
}

function createCredit(data) {
    return `ผู้จัดทำ: ${data.creator || EASY_PROMPT_DATA.defaultCredit.creator}
สถาบัน: ${data.institution || EASY_PROMPT_DATA.defaultCredit.institution}

${EASY_PROMPT_DATA.warningText}`;
}

function createVoicePrompt(data) {
    return `สร้างเสียงบรรยายภาษาไทยสำหรับคลิปนิทานชาดกเรื่อง "${data.title}"

ลักษณะเสียง:
${data.voice.label}

แนวทางเสียง:
- อ่านชัดถ้อยชัดคำ
- น้ำเสียงสุภาพ น่าเชื่อถือ
- มีอารมณ์แบบภาพยนตร์ธรรมะ
- ไม่เร็วเกินไป
- เหมาะกับคลิปความยาว ${data.duration.label}
- เว้นจังหวะช่วงข้อคิดท้ายเรื่องให้ลึกซึ้ง

เนื้อหาที่ต้องใช้:
นำสคริปต์เสียงบรรยายที่สร้างจากเรื่องนี้ไปอ่านให้เป็นธรรมชาติ`;
}

function createMasterPrompt(data) {
    return `คุณคือผู้กำกับภาพยนตร์ธรรมะ นักเขียนบท และ Prompt Engineer ระดับมืออาชีพ

งานของคุณ:
สร้างชุดงานคลิปนิทานชาดก 1 นาทีแบบครบชุดจากข้อมูลด้านล่าง

หัวข้อเรื่อง:
${data.title}

ข้อมูลต้นฉบับ:
${data.source}

กลุ่มเป้าหมาย:
${data.target.label}
แนวทางภาษา:
${data.target.tone}

ความยาวคลิป:
${data.duration.label}

จำนวนฉาก:
${data.sceneCount.label}

โทนการเล่า:
${data.tone.label}
${data.tone.description}

สไตล์ภาพ:
${data.visualStyle.label}
คำอธิบายภาษาไทย:
${data.visualStyle.thai}
คำอธิบายภาษาอังกฤษ:
${data.visualStyle.english}

เสียงบรรยาย:
${data.voice.label}

ระดับภาษา:
${data.languageLevel.label}

เครดิต:
ผู้จัดทำ: ${data.creator}
สถาบัน: ${data.institution}

ข้อกำหนดสำคัญ:
1. ยึดข้อมูลต้นฉบับเป็นหลัก
2. เพิ่มความน่าสนใจแบบภาพยนตร์ได้
3. ห้ามเปลี่ยนแก่นเรื่องหรือหลักธรรม
4. ห้ามแต่งข้อมูลธรรมะเกินจากต้นฉบับจนผิดความหมาย
5. เนื้อหาต้องเหมาะสม เคารพพระพุทธศาสนา
6. เหมาะสำหรับ YouTube Shorts / Reels แนวตั้ง 9:16

กรุณาสร้างผลลัพธ์เป็นหัวข้อต่อไปนี้:
1. ชื่อเรื่องคลิป
2. เรื่องย่อ 1 ย่อหน้า
3. สคริปต์เสียงบรรยาย ${data.duration.label}
4. ตารางแบ่งฉากตามจำนวน ${data.sceneCount.label}
5. Prompt ภาพภาษาไทย แยกตามฉาก
6. Prompt ภาพภาษาอังกฤษ แยกตามฉาก
7. Prompt วิดีโอ Google Flow ภาษาไทย แยกตามฉาก
8. Prompt วิดีโอ Google Flow ภาษาอังกฤษ แยกตามฉาก
9. คำขึ้นจอ / Subtitle แต่ละช่วง
10. ข้อคิดท้ายเรื่อง
11. เครดิตท้ายคลิป
12. Prompt สำหรับสร้างเสียงบรรยายใน Google AI Studio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 มาตรฐานที่ต้องรักษาทุกฉาก (บังคับ):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Aspect Ratio: 9:16 (แนวตั้ง — ห้ามเปลี่ยน)
• ความยาวรวม: ${data.duration.label} (ประมาณ 60 วินาที)
• จำนวนฉาก: ${data.sceneCount.label}
• Visual Style: ${PROJECT_STANDARD.style}
• Character Consistency: รักษาหน้าตา/เสื้อผ้าตัวละครทุกฉาก (ใช้ Character Sheet)
• Continuity: สถานที่ เครื่องแต่งกาย และบรรยากาศต้องต่อเนื่องกันทุกฉาก
• ห้ามมีข้อความ, watermark, logo ในภาพ/วิดีโอ
• เหมาะสำหรับ Google Flow, Kling, RunwayML
• Platform: ${PROJECT_STANDARD.platform}

⛔ Negative Prompt (ใช้ทุกฉาก):
text, watermark, logo, subtitle, caption, blurry, distorted anatomy, cartoonish,
anime, 3D render, horror, violence, disrespectful religious imagery,
modern technology, landscape orientation, horizontal format`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase C: createCharacterSheet — สร้าง Character Sheet สำหรับใช้เป็น Character Reference
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function createCharacterSheet(data) {
    return `คุณคือ Character Designer ระดับมืออาชีพสำหรับภาพยนตร์พุทธศาสนา 9:16 Cinematic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 CHARACTER SHEET — "${data.title}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ข้อมูลเรื่อง:
${data.source}

กลุ่มเป้าหมาย : ${data.target.label}
สไตล์ภาพ    : ${data.visualStyle.label}
มาตรฐานการแสดงผล : ${PROJECT_STANDARD.aspectRatio} Vertical  •  ${PROJECT_STANDARD.style}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
กรุณาสร้าง CHARACTER SHEET สำหรับตัวละครหลัก 2-3 ตัว
ใช้โครงสร้างนี้สำหรับแต่ละตัวละคร เพื่อรักษา Character Consistency ทุกฉาก:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [ชื่อตัวละคร] — [บทบาท / ความสัมพันธ์ในเรื่อง]
   • Character Name     : [ระบุชื่อตัวละคร]
   • Age               : [อายุโดยประมาณ]
   • Gender            : [เพศ]
   • Face              : [รูปทรงหน้า, สีผิว, ลักษณะดวงตา, โครงคิ้ว, สีหน้าปกติ]
   • Hairstyle         : [ทรงผม, ความยาว, สีผม, การรวบ/เกล้าผม]
   • Clothing          : [ประเภทเสื้อผ้า, สีเสื้อผ้าหลัก, เนื้อผ้า, การนุ่งห่ม]
   • Accessories       : [เครื่องประดับ, สร้อย, เข็มขัด, หมวก, อุปกรณ์ประจำตัว]
   • Body/Personality  : [บุคลิกภาพ, ลักษณะรูปร่าง, ท่าทางประจำตัว]
   • Visual Identity   : [เอกลักษณ์ทางสายตาที่โดดเด่นจำง่าย]

📌 English Visual Prompt String (ใช้เป็น Character Reference Prompt ทุกฉาก):
"Realistic photorealistic cinematic portrait of [Character Name], [Age] year old [Gender], [Face details], [Hairstyle], wearing [Clothing], [Accessories]. ${data.visualStyle.english}, warm golden Buddhist light, 8k resolution, 9:16 aspect ratio, highly detailed, photorealistic skin texture, reverent atmosphere --no text, watermark, logo"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ข้อกำหนด Character Consistency ทุกฉาก:
• นำ Visual Identity เดียวกันนี้ไปใช้กับทุกฉากตั้งแร่ฉากที่ 1 ถึง 10
• ห้ามเปลี่ยนใบหน้า เสื้อผ้า สีเสื้อผ้า และอุปกรณ์ระหว่างฉาก
• เหมาะสำหรับนำไปสร้างภาพด้วย Midjourney, Flux, Google Flow, Imagen 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phase C: createScenesData — สร้างข้อมูลฉาก 10 ฉากแบบ Structured Detail
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function createScenesData(data, sceneTotal, secondsPerScene) {
    const storyStructure = [
        {
            part: "เปิดเรื่อง — แนะนำโลกของเรื่องและตัวละครหลัก",
            action: "ตัวละครหลักปรากฏตัวในบรรยากาศสงบของพุทธกาล เริ่มต้นเรื่องราว",
            camera: "Wide establishing shot, slow cinematic push-in 9:16",
            lighting: "Warm golden morning sun rays filtering through trees, soft mist",
            mood: "สงบ / น่าศรัทธา / จุดเริ่มต้น",
            dialogue: `(เสียงบรรยาย): "เปิดเรื่องราวของ ${data.title} ในแผ่นดินพุทธกาล..."`,
            sfx: "เสียงนกร้องยามเช้าเบา ๆ + เสียงกระดิ่งวัดกังวานแผ่วเบา"
        },
        {
            part: "ชีวิตปกติก่อนเกิดเหตุการณ์ — การดำเนินชีวิตและพื้นหลัง",
            action: "ตัวละครดำเนินชีวิตประจำวัน แสดงถึงจริยวัตรและความศรัทธา",
            camera: "Medium shot, gentle camera pan following character movement",
            lighting: "Bright natural daylight, warm amber color grade",
            mood: "อบอุ่น / ปกติสุข / สุขุม",
            dialogue: `(เสียงบรรยาย): "ผู้คนต่างดำเนินชีวิตด้วยความตั้งมั่นในความดี..."`,
            sfx: "เสียงสายลมพัดใบไม้พริ้วไหว + เสียงก้าวเดินนุ่มนวล"
        },
        {
            part: "เหตุการณ์เริ่มเกิด — ปัญหาหรือความท้าทายแรกปรากฏ",
            action: "เกิดเหตุการณ์ทดสอบใจ ตัวละครเผชิญกับเงื่อนไขหรือความขัดแย้ง",
            camera: "Close-up on character's eyes and facial expression, subtle push-in",
            lighting: "Side lighting creating mild dramatic shadow contrast",
            mood: "กังวล / กังขา / ตึงเครียดเล็กน้อย",
            dialogue: `(เสียงบรรยาย): "แต่แล้ว... บททดสอบสำคัญก็มาถึงโดยไม่ทันตั้งตัว"`,
            sfx: "เสียงดนตรีไทยเดิมคีย์ต่ำเพิ่มความตึงเครียด"
        },
        {
            part: "ตัวละครเผชิญอุปสรรค — ความพยายามครั้งแรก",
            action: "ตัวละครพยายามแก้ไขปัญหาด้วยจิตใจที่ไม่ยอมแพ้",
            camera: "Low angle medium shot, steady push-in to enhance determination",
            lighting: "Strong directional warm sunlight, sharp depth of field",
            mood: "มุ่งมั่น / พยายาม / เข้มแข็ง",
            dialogue: `(เสียงบรรยาย): "แม้ต้องพบความยากลำบาก แต่หัวใจก็ยังไม่ถอยกลับ"`,
            sfx: "เสียงลมหนุนหนักแน่น + เสียงจังหวะกลองนุ่มนวล"
        },
        {
            part: "จุดพีค — ความขัดแย้งถึงจุดสูงสุด (Climax)",
            action: "เหตุการณ์ถึงจุดวิกฤตสูงสุด ตัวละครต้องเผชิญหน้ากับความจริง",
            camera: "Dynamic medium close-up, high-tension camera angle",
            lighting: "High-contrast dramatic golden hour lighting with lens flare",
            mood: "ดราม่า / พีคสูงสุด / ตื่นเต้น",
            dialogue: `(เสียงบรรยาย): "ณ วินาทีที่ความขัดแย้งถึงขีดสุด การตัดสินใจครั้งใหญ่จึงเกิดขึ้น"`,
            sfx: "เสียงเพลงประกอบดราม่าทรงพลัง + เสียงเอฟเฟกต์บรรยากาศหนักแน่น"
        },
        {
            part: "จุดเปลี่ยน — การตัดสินใจหรือการค้นพบทางธรรม",
            action: "ตัวละครเกิดปัญญารู้แจ้ง เลือกเส้นทางแห่งธรรมและความถูกต้อง",
            camera: "Eye-level still camera shot, soft focus on radiant face",
            lighting: "Soft warm golden aura light emerging around character",
            mood: "ตื่นรู้ / ตัดสินใจเด็ดเดี่ยว / สว่างไสว",
            dialogue: `(เสียงบรรยาย): "ด้วยจิตใจที่แน่วแน่และปัญญา ความจริงแห่งธรรมก็สว่างไสว"`,
            sfx: "เสียงฆ้องหรือกังสดาลกังวานลึกซึ้ง"
        },
        {
            part: "ผลของการกระทำ — เหตุการณ์เริ่มคลี่คลายไปในทางที่ดี",
            action: "อุปสรรคทั้งปวงมลายไป ผลแห่งความดีและเมตตาปรากฏให้เห็น",
            camera: "Medium wide shot, slow tracking pull-back",
            lighting: "Golden sunlight spreading across the whole landscape",
            mood: "โล่งใจ / อบอุ่น / สงบสุข",
            dialogue: `(เสียงบรรยาย): "ผลแห่งความเพียรและคุณธรรม ย่อมนำความสงบกลับคืนมา"`,
            sfx: "เสียงน้ำไหลใสสะอาด + เสียงดนตรีบรรเลงนุ่มนวล"
        },
        {
            part: "บทเรียนปรากฏ — ตัวละครเติบโตและเปลี่ยนแปลงจิตใจ",
            action: "ผู้คนรอบข้างได้รับข้อคิดและความเลื่อมใสในคุณงามความดี",
            camera: "Close-up on hands or respectful smile, gentle focus shift",
            lighting: "Soft diffused golden hour sunset lighting",
            mood: "ซาบซึ้ง / ซาบซึ้งใจ / อบอุ่นใจ",
            dialogue: `(เสียงบรรยาย): "การเปลี่ยนแปลงที่ยิ่งใหญ่ เริ่มต้นขึ้นจากภายในจิตใจ"`,
            sfx: "เสียงขลุ่ยไทยบรรเลงแผ่วเบา อบอุ่น"
        },
        {
            part: "ข้อคิดธรรมะชัดเจน — สรุปหลักธรรมคำสอน",
            action: "ภาพสรุปเหตุการณ์งดงาม สื่อถึงปัญญาและสติในพระพุทธศาสนา",
            camera: "Wide serene shot, smooth upward crane shot / slow zoom out",
            lighting: "Ethereal sacred golden aura light, peaceful sky atmosphere",
            mood: "สงบ / ลึกซึ้ง / ปัญญา",
            dialogue: `(เสียงบรรยาย): "นิทานชาดกเรื่องนี้ สอนให้เรารู้ว่า... ${data.tone.label}"`,
            sfx: "เสียงระฆังพุทธศาสนาเสียงต่ำลึกซึ้ง"
        },
        {
            part: "ปิดเรื่อง — ภาพงดงามตราตรึง + ข้อคิดท้ายเรื่อง",
            action: "ภาพฉากสุดท้ายงดงามสงบ ค่อย ๆ จางลงสู่ข้อคิดและเครดิต",
            camera: "Slow aerial pull-back fade to black 9:16 vertical",
            lighting: "Soft golden sunset glow fading peacefully",
            mood: "สงบตราตรึงใจ / สมบูรณ์แบบ",
            dialogue: `(เสียงบรรยาย): "ขอความสงบและปัญญา จงบังเกิดแก่ทุกท่าน"`,
            sfx: "เสียงดนตรีจบกังวานสงบ อบอุ่นใจ"
        }
    ];

    const negativePrompt = "text, watermark, logo, subtitle, caption, blurry, out of focus, distorted anatomy, extra limbs, deformed face, cartoonish, anime, 3D render, horror, violence, dark, disrespectful religious imagery, modern technology, cars, phones, landscape orientation, horizontal format";

    const scenes = [];
    for (let i = 0; i < sceneTotal; i++) {
        const sceneNum = i + 1;
        const timeStart = i * secondsPerScene;
        const timeEnd = (i === sceneTotal - 1) ? Number(data.duration.id) : (i + 1) * secondsPerScene;
        const sceneDuration = timeEnd - timeStart;
        const s = storyStructure[i % storyStructure.length];

        const visualPrompt = [
            `Scene ${sceneNum}/${sceneTotal} — ${s.part}`,
            `Story: Buddhist Jataka "${data.title}"`,
            `Visual style: ${data.visualStyle.english}`,
            `Character Reference: Maintain exact visual identity from Character Sheet`,
            `Framing: ${s.camera}`,
            `Lighting: ${s.lighting}`,
            `Mood: ${s.mood}`,
            `Quality: Photorealistic, cinematic 8k, aspect ratio 9:16 vertical`,
            `Style: ${PROJECT_STANDARD.style}`,
            `No text, no watermark, no logo`
        ].join("\n");

        const videoPrompt = [
            `Scene ${sceneNum}/${sceneTotal} — ${sceneDuration}s 9:16 vertical video motion`,
            `Story beat: "${data.title}" — ${s.action}`,
            `Camera motion: ${s.camera}`,
            `Duration: ${sceneDuration} seconds`,
            `Lighting & Atmosphere: ${s.lighting}, ${s.mood}`,
            `Character: Consistent visual appearance from Character Sheet`,
            `Style: ${PROJECT_STANDARD.style}, smooth motion, high detail`,
            `Platform: ${PROJECT_STANDARD.platform}`,
            `No text overlay, no watermark, slow cinematic movement`
        ].join("\n");

        const fullText = [
            `═══════════════════════════════════════════════════`,
            `ฉากที่ ${sceneNum} / ${sceneTotal}  |  ช่วงเวลา: ${timeStart}–${timeEnd} วินาที  (ความยาว: ${sceneDuration}s)`,
            `═══════════════════════════════════════════════════`,
            `📖 บทในเรื่อง   : ${s.part}`,
            `🎬 เหตุการณ์    : ${s.action}`,
            `💭 อารมณ์ฉาก    : ${s.mood}`,
            `🗣️ เสียงบรรยาย  : ${s.dialogue}`,
            `🎵 Sound (SFX)  : ${s.sfx}`,
            `🎥 มุมกล้อง     : ${s.camera}`,
            `💡 แสงและสี     : ${s.lighting}`,
            ``,
            `─────────────────────────────────────────────────`,
            `🖼️  Visual Prompt (EN) — สำหรับ Image AI (Midjourney / Flux / Imagen):`,
            `─────────────────────────────────────────────────`,
            visualPrompt,
            ``,
            `─────────────────────────────────────────────────`,
            `🎬  Video Prompt (EN) — สำหรับ Video AI (Google Flow / Kling / Runway):`,
            `─────────────────────────────────────────────────`,
            videoPrompt,
            ``,
            `─────────────────────────────────────────────────`,
            `⛔  Negative Prompt:`,
            `─────────────────────────────────────────────────`,
            negativePrompt
        ].join("\n");

        scenes.push({
            sceneNum,
            timeStart,
            timeEnd,
            sceneDuration,
            part: s.part,
            action: s.action,
            mood: s.mood,
            dialogue: s.dialogue,
            sfx: s.sfx,
            camera: s.camera,
            lighting: s.lighting,
            fullText,
            visualPrompt,
            videoPrompt,
            negativePrompt
        });
    }
    return scenes;
}

function renderResults(sections) {
    const container = document.getElementById("resultContainer");
    container.innerHTML = "";

    const mainDisplayTitles = [
        "Character Sheet สำหรับสร้างวิดีโอ",
        "สคริปต์เสียงบรรยาย",
        "แผนฉาก",
        "Master Prompt สำหรับ ChatGPT / Gemini"
    ];

    sections.forEach((section) => {
        if (!mainDisplayTitles.includes(section.title)) return;

        const card = document.createElement("article");
        card.className = "result-card";

        if (section.title === "Character Sheet สำหรับสร้างวิดีโอ") {
            card.id = "character-card";
            card.classList.add("character-sheet-card");
        } else if (section.title === "สคริปต์เสียงบรรยาย") {
            card.id = "narration-card";
        } else if (section.title === "แผนฉาก") {
            card.id = "scene-card";
        } else if (section.title === "Master Prompt สำหรับ ChatGPT / Gemini") {
            card.id = "master-card";
        }

        const titleEl = document.createElement("h3");
        if (section.type === "scene-plan" && section.scenes) {
            titleEl.textContent = `แผนฉาก ${section.scenes.length} ฉาก — พร้อม Prompt ทุกฉาก (9:16 Realistic)`;
        } else {
            titleEl.textContent = section.title;
        }
        card.appendChild(titleEl);

        // ━━━ Scene Plan: render per-scene mini cards ━━━
        if (section.type === "scene-plan" && section.scenes && section.scenes.length > 0) {

            const copyAllBtn = document.createElement("button");
            copyAllBtn.className = "copy-section-btn";
            copyAllBtn.textContent = "📋 คัดลอกทุกฉาก";
            copyAllBtn.addEventListener("click", (e) => copyText(section.content, e.currentTarget));
            card.appendChild(copyAllBtn);

            section.scenes.forEach((scene) => {
                const sceneDiv = document.createElement("div");
                sceneDiv.className = "scene-mini-card";

                const sceneHeader = document.createElement("div");
                sceneHeader.className = "scene-mini-header";
                sceneHeader.textContent = `ฉากที่ ${scene.sceneNum}  |  ${scene.timeStart}–${scene.timeEnd} วินาที  (${scene.sceneDuration}s)`;

                const scenePre = document.createElement("pre");
                scenePre.className = "scene-mini-pre";
                scenePre.textContent = scene.fullText;

                const sceneActions = document.createElement("div");
                sceneActions.className = "scene-card-actions";

                const btnVisual = document.createElement("button");
                btnVisual.className = "copy-section-btn copy-visual-btn";
                btnVisual.textContent = "🖼️ Visual Prompt";
                btnVisual.addEventListener("click", (e) => copyText(scene.visualPrompt, e.currentTarget));

                const btnVideo = document.createElement("button");
                btnVideo.className = "copy-section-btn copy-video-btn";
                btnVideo.textContent = "🎬 Video Prompt";
                btnVideo.addEventListener("click", (e) => copyText(scene.videoPrompt, e.currentTarget));

                const btnAll = document.createElement("button");
                btnAll.className = "copy-section-btn";
                btnAll.textContent = "📋 คัดลอกฉากนี้ทั้งหมด";
                btnAll.addEventListener("click", (e) => copyText(scene.fullText, e.currentTarget));

                sceneActions.appendChild(btnVisual);
                sceneActions.appendChild(btnVideo);
                sceneActions.appendChild(btnAll);

                sceneDiv.appendChild(sceneHeader);
                sceneDiv.appendChild(scenePre);
                sceneDiv.appendChild(sceneActions);
                card.appendChild(sceneDiv);
            });

        } else {
            // ━━━ Normal text rendering ━━━
            const pre = document.createElement("pre");
            pre.textContent = section.content;
            card.appendChild(pre);

            const button = document.createElement("button");
            button.className = "copy-section-btn";
            button.textContent = "คัดลอกส่วนนี้";
            button.addEventListener("click", (event) => copyText(section.content, event.currentTarget));
            card.appendChild(button);
        }

        container.appendChild(card);
    });
}

function copyText(text, btnElement) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
        console.error("Clipboard API is not supported or not accessible.");
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        if (btnElement) {
            if (btnElement._copyTimeout) {
                clearTimeout(btnElement._copyTimeout);
            }
            if (!btnElement._originalText) {
                btnElement._originalText = btnElement.textContent;
            }

            btnElement.textContent = "✓ คัดลอกแล้ว!";
            btnElement.classList.add("copy-success");

            btnElement._copyTimeout = setTimeout(() => {
                btnElement.textContent = btnElement._originalText;
                btnElement.classList.remove("copy-success");
                delete btnElement._originalText;
                delete btnElement._copyTimeout;
            }, 2000);
        }
    }).catch((err) => {
        console.error("Failed to copy text: ", err);
    });
}

function copyAllResults(event) {
    if (generatedSections.length === 0) {
        alert("ยังไม่มีผลลัพธ์ให้คัดลอกครับ");
        return;
    }

    const allText = generatedSections
        .map((section) => `# ${section.title}\n${section.content}`)
        .join("\n\n------------------------------\n\n");

    const btn = event && event.currentTarget ? event.currentTarget : document.getElementById("copyAllBtn");
    copyText(allText, btn);
}

function downloadTextFile() {
    if (generatedSections.length === 0) {
        alert("ยังไม่มีผลลัพธ์ให้ดาวน์โหลดครับ");
        return;
    }

    const allText = generatedSections
        .map((section) => `# ${section.title}\n${section.content}`)
        .join("\n\n------------------------------\n\n");

    const blob = new Blob([allText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "easy-prompt-ai-result.txt";
    link.click();

    URL.revokeObjectURL(url);
}

function saveProjectToBrowser() {
    const formData = getFormData();

    localStorage.setItem("easyPromptAIProject", JSON.stringify({
        formData,
        generatedSections,
        savedAt: new Date().toISOString()
    }));

    alert("บันทึกโปรเจกต์ไว้ในเครื่องเรียบร้อยแล้วครับ");
}

function clearForm() {
    const confirmClear = confirm("ต้องการล้างข้อมูลทั้งหมดใช่ไหมครับ?");
    if (!confirmClear) return;

    document.getElementById("storyTitle").value = "";
    document.getElementById("storySource").value = "";

    setupDefaultValues();

    generatedSections = [];
    document.getElementById("resultContainer").innerHTML = "";
    document.getElementById("results").classList.add("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}