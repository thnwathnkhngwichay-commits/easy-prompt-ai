const DHAMMA_DATA = {
    appName: "Easy Prompt AI",

    sampleTopics: [
        "ความเพียร",
        "ศีล 5",
        "ใจหยุด",
        "บุญ",
        "เมตตา",
        "สติ",
        "ความกตัญญู",
        "การให้อภัย",
        "อริยทรัพย์",
        "มรรคมีองค์ 8",
        "ความอดทน",
        "การปล่อยวาง",
        "สมาธิ",
        "ปัญญา",
        "กัลยาณมิตร"
    ],

    targets: [
        {
            id: "teen",
            label: "วัยรุ่น",
            description: "ใช้ภาษาทันสมัย เข้าใจง่าย กระแทกใจ แต่ไม่สั่งสอนแรง"
        },
        {
            id: "student",
            label: "นักเรียน / นักศึกษา",
            description: "ใช้ภาษาง่าย มีตัวอย่างใกล้ตัว เชื่อมกับการเรียนและชีวิตประจำวัน"
        },
        {
            id: "worker",
            label: "คนทำงาน",
            description: "เชื่อมโยงกับความเครียด หน้าที่ ความรับผิดชอบ และการใช้ชีวิต"
        },
        {
            id: "general",
            label: "ประชาชนทั่วไป",
            description: "สุภาพ เข้าใจง่าย ใช้ได้กับทุกวัย"
        },
        {
            id: "monk_novice",
            label: "พระภิกษุสามเณร",
            description: "เน้นการฝึกตน ศีล สมาธิ ปัญญา และการพัฒนาตนเอง"
        }
    ],

    promptTypes: [
        {
            id: "image",
            label: "Prompt สร้างภาพ"
        },
        {
            id: "video",
            label: "Prompt สร้างวิดีโอ"
        },
        {
            id: "post",
            label: "Prompt เขียนโพสต์"
        },
        {
            id: "song",
            label: "Prompt แต่งเพลง"
        }
    ],

    styles: [
        {
            id: "cinematic",
            label: "Cinematic Buddhist Art",
            value: "cinematic Buddhist art, warm golden light, peaceful atmosphere, realistic Thai Buddhist visual style"
        },
        {
            id: "thai_warm",
            label: "อบอุ่น สงบ แบบไทยพุทธ",
            value: "warm peaceful Thai Buddhist style, soft sunlight, temple atmosphere, calm and compassionate mood"
        },
        {
            id: "teen_modern",
            label: "ทันสมัย จับใจวัยรุ่น",
            value: "modern inspirational social media style, emotional storytelling, clean composition, youthful and hopeful mood"
        },
        {
            id: "documentary",
            label: "สมจริงแบบสารคดี",
            value: "realistic documentary style, natural lighting, authentic Thai temple environment, believable human emotion"
        },
        {
            id: "epic_history",
            label: "พุทธประวัติแบบภาพยนตร์",
            value: "epic historical Buddhist film style, ancient India atmosphere, cinematic lighting, grand and reverent composition"
        }
    ],

    negativePrompt: [
        "low quality",
        "blurry",
        "distorted face",
        "extra fingers",
        "bad anatomy",
        "watermark",
        "logo",
        "unreadable text",
        "oversaturated colors",
        "disrespectful religious imagery",
        "horror atmosphere"
    ]
}; 