const EASY_PROMPT_DATA = {
    appName: "Easy Prompt AI",
    appSubtitle: "เครื่องมือช่วยสร้างคลิปธรรมะ 1 นาทีด้วย AI",
    appDescription:
        "เปลี่ยนนิทานชาดกหรือเรื่องเล่าธรรมะ ให้กลายเป็นสคริปต์ 1 นาที แผน 10 ฉาก Prompt ภาพ Prompt วิดีโอ และ Master Prompt สำหรับใช้กับ ChatGPT หรือ Gemini",

    defaultCredit: {
        creator: "พระธนวัฒน์ สุวฑฺฒโน",
        institution: "ศูนย์พุทธศาสตร์ศึกษา DCI"
    },

    warningText:
        "หมายเหตุ: เนื้อหาที่สร้างโดย AI ควรตรวจสอบความถูกต้องกับครูบาอาจารย์ เอกสารต้นฉบับ หรือแหล่งอ้างอิงที่น่าเชื่อถือก่อนนำไปเผยแพร่",

    stories: [
        {
            id: "mahajanaka",
            label: "พระมหาชนก (วิริยบารมี)",
            source: "พระมหาชนกเดินทางค้าขายทางเรือแต่เกิดเรือล่มกลางมหาสมุทร ทรงว่ายน้ำด้วยความเพียรพยายามไม่ท้อถอยเป็นเวลา 7 วัน 7 คืน จนกระทั่งนางมณีเมขลาเห็นความเพียรจึงมาช่วยอุ้มเหาะไปส่งยังเมืองมิถิลา"
        },
        {
            id: "suwannasama",
            label: "สุวรรณสาม (เมตตาบารมี)",
            source: "สุวรรณสามดาบสผู้กตัญญูเลี้ยงดูบิดามารดาตาบอดในป่า ทรงแผ่เมตตาจนสัตว์ป่ารักใคร่ วันหนึ่งถูกพระราชาปิลยักษ์ยิงด้วยศรอาบยาพิษเพราะเข้าใจผิด แต่ด้วยกตัญญูและเมตตาทำให้พิษร้ายเสื่อมลงและฟื้นกลับคืนมา"
        },
        {
            id: "temiya",
            label: "เตมียราช (เนกขัมมบารมี)",
            source: "พระเตมียแสร้งทำเป็นใบ้และพิการเพื่อหลีกเลี่ยงการขึ้นครองราชย์อันเป็นเหตุให้ต้องทำบาปตัดสินโทษคนอื่น จนกระทั่งถูกนำไปฝังแต่ทรงแสดงกำลังและออกผนวชเป็นฤาษีได้สำเร็จ"
        },
        {
            id: "vannupatha",
            label: "วรรณุปถชาดก (ความเพียรพยายาม)",
            source: "พ่อค้าและบริวารเดินทางข้ามทะเลทรายจนน้ำหมด เกือบเอาชีวิตไม่รอด แต่ด้วยความเพียรพยายามไม่ย่อท้อของหัวหน้าพ่อค้าที่สั่งให้ขุดดินหาน้ำลึกลงไปจนเจอต่อน้ำหินใต้ดิน ทำให้ทุกคนรอดชีวิตมาได้"
        },
        {
            id: "custom",
            label: "✍️ กำหนดเรื่องเอง (Custom)...",
            source: ""
        }
    ],

    targets: [
        {
            id: "teen",
            label: "วัยรุ่น / นักเรียน / นักศึกษา",
            tone: "ภาษากระชับ เข้าใจง่าย มีพลัง ดึงดูดตั้งแต่ต้น"
        },
        {
            id: "general",
            label: "ประชาชนทั่วไป",
            tone: "สุภาพ อบอุ่น เข้าใจง่าย ใช้ได้กับทุกวัย"
        },
        {
            id: "monk_novice",
            label: "พระภิกษุสามเณร",
            tone: "เน้นการฝึกตน ศีล สมาธิ ปัญญา และข้อคิดเชิงธรรม"
        },
        {
            id: "children",
            label: "เด็กประถม / มัธยมต้น",
            tone: "เล่าเหมือนนิทาน เข้าใจง่าย มีภาพชัด และข้อคิดตรงไปตรงมา"
        },
        {
            id: "worker",
            label: "คนทำงาน",
            tone: "เชื่อมโยงกับชีวิตจริง ความเครียด หน้าที่ และการตัดสินใจ"
        }
    ],

    visualStyles: [
        {
            id: "cinematic_realistic",
            label: "สมจริงแบบภาพยนตร์ พุทธศิลป์จริงจัง",
            thai:
                "ภาพสมจริงแบบภาพยนตร์ แสงทองอบอุ่น บรรยากาศสงบ น่าเลื่อมใส รายละเอียดพุทธศิลป์ชัดเจน",
            english:
                "cinematic realistic Buddhist art, warm golden light, peaceful sacred atmosphere, highly detailed, reverent visual style, realistic human expressions"
        },
        {
            id: "ancient_india",
            label: "อินเดียโบราณแบบพุทธประวัติ",
            thai:
                "ฉากอินเดียโบราณ เครื่องแต่งกายย้อนยุค เมืองเก่า ป่าไม้ อาศรม และบรรยากาศพุทธกาล",
            english:
                "ancient Indian Buddhist historical setting, authentic period clothing, old city, forest hermitage, cinematic historical realism"
        },
        {
            id: "thai_buddhist",
            label: "ไทยพุทธ อบอุ่น สงบ",
            thai:
                "บรรยากาศวัดไทย แสงเช้าอ่อน ๆ สีทองขาว น้ำตาล สงบ อบอุ่น เหมาะกับสื่อธรรมะ",
            english:
                "warm Thai Buddhist temple atmosphere, soft morning light, gold and cream tones, calm and peaceful composition"
        },
        {
            id: "semi_painting",
            label: "กึ่งสมจริง กึ่งภาพวาด",
            thai:
                "ภาพกึ่งสมจริงกึ่งภาพวาด รายละเอียดงดงาม อบอุ่น ดูเป็นงานศิลป์สำหรับเล่าเรื่องธรรมะ",
            english:
                "semi-realistic digital painting, warm Buddhist storytelling mood, painterly details, cinematic composition"
        },
        {
            id: "documentary",
            label: "สารคดีสมจริง",
            thai:
                "ภาพสมจริงแบบสารคดี แสงธรรมชาติ องค์ประกอบเรียบง่าย น่าเชื่อถือ ไม่ปรุงแต่งมาก",
            english:
                "realistic documentary style, natural lighting, authentic environment, believable human emotion, clean visual storytelling"
        }
    ],

    storyTones: [
        {
            id: "dramatic",
            label: "ดราม่า มีอารมณ์ มีจุดพีค",
            description: "เล่าแบบภาพยนตร์ มีปัญหา ความขัดแย้ง จุดเปลี่ยน และข้อคิดท้ายเรื่อง"
        },
        {
            id: "warm",
            label: "อบอุ่น ให้กำลังใจ",
            description: "เล่าอย่างนุ่มนวล เห็นใจตัวละคร และจบด้วยพลังบวก"
        },
        {
            id: "peaceful",
            label: "สงบ ลึกซึ้ง",
            description: "เล่าแบบนิ่ง สงบ ใช้ถ้อยคำเรียบง่ายแต่กินใจ"
        },
        {
            id: "powerful",
            label: "เข้มขลัง น่าเลื่อมใส",
            description: "เล่าให้รู้สึกศรัทธา หนักแน่น และมีพลังทางธรรม"
        }
    ],

    clipDurations: [
        { id: "30", label: "30 วินาที" },
        { id: "60", label: "60 วินาที" },
        { id: "90", label: "90 วินาที" }
    ],

    sceneCounts: [
        { id: "6", label: "6 ฉาก" },
        { id: "10", label: "10 ฉาก" },
        { id: "12", label: "12 ฉาก" }
    ],

    voiceTypes: [
        { id: "warm_male", label: "เสียงชาย อบอุ่น สุภาพ" },
        { id: "calm_female", label: "เสียงหญิง สงบ นุ่มนวล" },
        { id: "monk_style", label: "เสียงพระ สุขุม น่าเลื่อมใส" },
        { id: "documentary", label: "เสียงสารคดี น่าเชื่อถือ" }
    ],

    languageLevels: [
        { id: "easy", label: "ง่ายมาก" },
        { id: "middle", label: "ระดับกลาง" },
        { id: "academic", label: "กึ่งวิชาการ" }
    ],

    outputSections: [
        "ชื่อเรื่องคลิป",
        "เรื่องย่อ",
        "สคริปต์เสียงบรรยาย 1 นาที",
        "แผน 10 ฉาก",
        "Prompt ภาพภาษาไทย",
        "Prompt ภาพภาษาอังกฤษ",
        "Prompt วิดีโอ Google Flow ภาษาไทย",
        "Prompt วิดีโอ Google Flow ภาษาอังกฤษ",
        "คำขึ้นจอ / Subtitle",
        "ข้อคิดท้ายเรื่อง",
        "เครดิตท้ายคลิป",
        "Prompt เสียงบรรยายสำหรับ Google AI Studio",
        "Master Prompt สำหรับ ChatGPT / Gemini"
    ]
};