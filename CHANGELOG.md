# CHANGELOG.md

## ประวัติการแก้ไขโปรเจกต์ Easy Prompt AI

### [2026-07-19]
- **เริ่มต้น**: สร้างระบบโครงสร้างพื้นฐานของ Easy Prompt AI
  - เพิ่มหน้าเว็บ `index.html` เพื่อใช้รับค่าและแสดงผลลัพธ์
  - ออกแบบสไตล์เว็บด้วย `style.css` ให้ดูสงบ อบอุ่น และใช้งานง่ายในโทนพุทธศิลป์
  - กำหนดข้อมูลและตัวเลือกของระบบใน `data.js`
  - พัฒนาระบบประมวลผลและการจัดรูปแบบ Prompt ใน `script.js`
- **การจัดการกฎการทำงาน**:
  - เพิ่มไฟล์กติกา AI `AI_RULES.md`
  - เพิ่มไฟล์สถานะโครงการ `PROJECT_STATUS.md`
  - เพิ่มไฟล์บันทึกประวัติการแก้ไข `CHANGELOG.md`

### [2026-08-11] Phase 2A: Supabase Jataka Stories Integration
- **การเชื่อมต่อ Supabase**:
  - กำหนดค่า `SUPABASE_URL` และ `SUPABASE_ANON_KEY` ใน `script.js` สำหรับ Supabase Project `easy-prompt-ai`
  - ฟังก์ชัน `initializeStories()` ดึงข้อมูลนิทานชาดกจากตาราง `public.stories` (`slug`, `label`, `source`) สำเร็จ
- **การคงระบบ Offline Fallback**:
  - หากไม่ได้ตั้งค่า Key หรือระบบเน็ตเวิร์กไม่พร้อมใช้งาน ระบบจะสลับไปใช้ `data.js` โดยอัตโนมัติ
