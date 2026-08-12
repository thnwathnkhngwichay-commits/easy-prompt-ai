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
        checkLoginStatus();
        await initializeStories();
        setupSelectOptions();
        setupDefaultValues();
        setupEventListeners();
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

    // ดักฟังการส่งแบบฟอร์มล็อกอินและปุ่มล็อกเอาต์
    document
        .getElementById("loginForm")
        .addEventListener("submit", handleLoginSubmit);

    document
        .getElementById("loginSubmitBtn")
        .addEventListener("click", handleLoginSubmit);

    document
        .getElementById("logoutBtn")
        .addEventListener("click", handleLogout);
}

function checkLoginStatus() {
    const isLoggedIn = getSessionValue("easyPromptLoggedIn");
    const loginModal = document.getElementById("loginModal");
    const logoutBtn = document.getElementById("logoutBtn");

    if (isLoggedIn === "true") {
        loginModal.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
    } else {
        loginModal.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
        document.getElementById("usernameInput").value = "";
        document.getElementById("passwordInput").value = "";
        document.getElementById("loginErrorMsg").classList.add("hidden");
    }
}

function handleLoginSubmit(event) {
    if (event) {
        event.preventDefault();
    }

    // หากเข้าสู่ระบบเรียบร้อยแล้ว ให้ข้ามการประมวลผลซ้ำป้องกันการเบิ้ลสองรอบจาก Submit/Click คู่กัน
    if (getSessionValue("easyPromptLoggedIn") === "true") {
        return;
    }

    const usernameInput = document.getElementById("usernameInput");
    const passwordInput = document.getElementById("passwordInput");
    const errorMsg = document.getElementById("loginErrorMsg");

    if (!usernameInput || !passwordInput || !errorMsg) {
        console.error("Critical login elements are missing from the DOM");
        return;
    }

    const usernameVal = usernameInput.value.trim();
    const passwordVal = passwordInput.value.trim();

    console.log("Submitting login form with inputs:", {
        username: usernameVal,
        password: passwordVal,
        matchExpected: (usernameVal === "admin" && passwordVal === "1234")
    });

    if (usernameVal === "admin" && passwordVal === "1234") {
        console.log("Mock login verification successful!");
        setSessionValue("easyPromptLoggedIn", "true");
        setSessionValue("easyPromptUser", "admin");
        checkLoginStatus();
    } else {
        console.warn("Mock login verification failed: incorrect credentials");
        errorMsg.classList.remove("hidden");
    }
}

function handleLogout() {
    const confirmLogout = confirm("ต้องการออกจากระบบใช่หรือไม่?");
    if (!confirmLogout) return;

    removeSessionValue("easyPromptLoggedIn");
    removeSessionValue("easyPromptUser");
    checkLoginStatus();
    
    // เคลียร์ค่ากลับเป็นเริ่มต้น
    document.getElementById("storyTitle").value = "";
    document.getElementById("storySource").value = "";
    setupDefaultValues();
    
    generatedSections = [];
    document.getElementById("resultContainer").innerHTML = "";
    document.getElementById("results").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        { title: "ชื่อเรื่องคลิป", content: title },
        { title: "เรื่องย่อ", content: summary },
        { title: "สคริปต์เสียงบรรยาย", content: narration },
        { title: "แผนฉาก", content: scenePlan },
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
12. Prompt สำหรับสร้างเสียงบรรยายใน Google AI Studio`;
}

function renderResults(sections) {
    const container = document.getElementById("resultContainer");
    container.innerHTML = "";

    const mainDisplayTitles = [
        "สคริปต์เสียงบรรยาย",
        "แผนฉาก",
        "Master Prompt สำหรับ ChatGPT / Gemini"
    ];

    sections.forEach((section, index) => {
        if (!mainDisplayTitles.includes(section.title)) return;

        const card = document.createElement("article");
        card.className = "result-card";

        // ตั้ง ID ให้กับการ์ดแต่ละใบเพื่อใช้อ้างอิงการเลื่อนหน้าจอ
        if (section.title === "สคริปต์เสียงบรรยาย") {
            card.id = "narration-card";
        } else if (section.title === "แผนฉาก") {
            card.id = "scene-card";
        } else if (section.title === "Master Prompt สำหรับ ChatGPT / Gemini") {
            card.id = "master-card";
        }

        const title = document.createElement("h3");
        title.textContent = section.title;

        const pre = document.createElement("pre");
        pre.textContent = section.content;

        const button = document.createElement("button");
        button.className = "copy-section-btn";
        button.textContent = "คัดลอกส่วนนี้";
        button.addEventListener("click", (event) => copyText(section.content, event.currentTarget));

        card.appendChild(title);
        card.appendChild(pre);
        card.appendChild(button);

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