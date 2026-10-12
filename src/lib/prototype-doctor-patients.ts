import type { DoctorPatient } from "@/components/app/doctor-connected";

// Exact 9 patients from "Doctor Dashboard — Patient Overview.png" (Page 1)
const PROTOTYPE_PAGE_1: Array<Omit<DoctorPatient, "patient_id">> = [
  {
    hn: "HN-001",
    full_name: "นาย สมชาย ใจดี",
    sex: "ชาย",
    birthDate: "1964-05-12",
    age: 62,
    phone: "0812345678",
    sessionCount: 21,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นาง สมหญิง ใจบุญ",
    sex: "หญิง",
    birthDate: "1972-08-20",
    age: 54,
    phone: "0823456789",
    sessionCount: 5,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นางสาว มิตรภาพ ลาภลอย",
    sex: "หญิง",
    birthDate: "2002-03-14",
    age: 24,
    phone: "0834567890",
    sessionCount: 26,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นาย วิศวะ เอนจี",
    sex: "ชาย",
    birthDate: "1984-11-05",
    age: 42,
    phone: "0845678901",
    sessionCount: 29,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นาย ปรีดี ปี่ชวด",
    sex: "ชาย",
    birthDate: "1970-02-18",
    age: 56,
    phone: "0856789012",
    sessionCount: 19,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นาง พรไพริน หอมนวล",
    sex: "หญิง",
    birthDate: "1993-07-22",
    age: 33,
    phone: "0867890123",
    sessionCount: 9,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นางสาว พินิจ เปรมปรี",
    sex: "หญิง",
    birthDate: "2005-09-30",
    age: 21,
    phone: "0878901234",
    sessionCount: 8,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นาย เมธี หีบหงษ์",
    sex: "ชาย",
    birthDate: "1997-12-10",
    age: 29,
    phone: "0889012345",
    sessionCount: 10,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
  {
    hn: "HN-001",
    full_name: "นาย พิชิต จิตสะอาด",
    sex: "ชาย",
    birthDate: "1989-04-03",
    age: 37,
    phone: "0890123456",
    sessionCount: 2,
    lastUpdated: "2026-09-14T08:00:00.000Z",
  },
];

// Seeded sample patients for Pages 2 to 10 (81 records = 90 total / 10 pages)
const SAMPLE_PATIENTS_REST: Array<Omit<DoctorPatient, "patient_id">> = [
  // Page 2
  { hn: "HN-002", full_name: "นาย กิตติชัย วงศ์สุวรรณ", sex: "ชาย", birthDate: "1968-01-15", age: 58, phone: "0811122334", sessionCount: 15, lastUpdated: "2026-09-13T09:00:00.000Z" },
  { hn: "HN-002", full_name: "นาง สุภาวดี บุญรอด", sex: "หญิง", birthDate: "1959-06-25", age: 67, phone: "0822233445", sessionCount: 12, lastUpdated: "2026-09-13T09:00:00.000Z" },
  { hn: "HN-002", full_name: "นาย อนันต์ รัตนชัย", sex: "ชาย", birthDate: "1981-10-12", age: 45, phone: "0833344556", sessionCount: 7, lastUpdated: "2026-09-13T08:30:00.000Z" },
  { hn: "HN-002", full_name: "นางสาว พิมพา แสนสุข", sex: "หญิง", birthDate: "1995-04-18", age: 31, phone: "0844455667", sessionCount: 22, lastUpdated: "2026-09-12T14:00:00.000Z" },
  { hn: "HN-002", full_name: "นาย ชาญวิทย์ เกียรติดำรง", sex: "ชาย", birthDate: "1975-09-02", age: 51, phone: "0855566778", sessionCount: 18, lastUpdated: "2026-09-12T11:00:00.000Z" },
  { hn: "HN-002", full_name: "นาง รัตนาภรณ์ พัฒนศิลป์", sex: "หญิง", birthDate: "1986-03-29", age: 40, phone: "0866677889", sessionCount: 4, lastUpdated: "2026-09-12T10:15:00.000Z" },
  { hn: "HN-002", full_name: "นาย ธีรศักดิ์ สว่างเนตร", sex: "ชาย", birthDate: "1998-12-04", age: 28, phone: "0877788990", sessionCount: 11, lastUpdated: "2026-09-11T16:00:00.000Z" },
  { hn: "HN-002", full_name: "นาง วารุณี ประเสริฐยิ่ง", sex: "หญิง", birthDate: "1963-07-14", age: 63, phone: "0888899001", sessionCount: 16, lastUpdated: "2026-09-11T15:20:00.000Z" },
  { hn: "HN-002", full_name: "นาย สิทธิชัย ชัยชนะ", sex: "ชาย", birthDate: "1990-05-20", age: 36, phone: "0899900112", sessionCount: 3, lastUpdated: "2026-09-11T09:40:00.000Z" },

  // Page 3
  { hn: "HN-003", full_name: "นาย ธวัชชัย มั่งมี", sex: "ชาย", birthDate: "1965-02-11", age: 61, phone: "0812311223", sessionCount: 25, lastUpdated: "2026-09-10T10:00:00.000Z" },
  { hn: "HN-003", full_name: "นาง อัจฉรา สินธุเดช", sex: "หญิง", birthDate: "1973-11-19", age: 53, phone: "0823422334", sessionCount: 8, lastUpdated: "2026-09-10T09:30:00.000Z" },
  { hn: "HN-003", full_name: "นาย ภัทรพล เจริญผล", sex: "ชาย", birthDate: "2000-08-08", age: 26, phone: "0834533445", sessionCount: 14, lastUpdated: "2026-09-09T14:10:00.000Z" },
  { hn: "HN-003", full_name: "นางสาว ชนิสรา ว่องไว", sex: "หญิง", birthDate: "1994-06-17", age: 32, phone: "0845644556", sessionCount: 20, lastUpdated: "2026-09-09T11:20:00.000Z" },
  { hn: "HN-003", full_name: "นาย เกรียงไกร ชาญกล้า", sex: "ชาย", birthDate: "1971-04-23", age: 55, phone: "0856755667", sessionCount: 17, lastUpdated: "2026-09-08T16:00:00.000Z" },
  { hn: "HN-003", full_name: "นาง อุไรวรรณ ชื่นใจ", sex: "หญิง", birthDate: "1982-12-05", age: 44, phone: "0867866778", sessionCount: 6, lastUpdated: "2026-09-08T13:40:00.000Z" },
  { hn: "HN-003", full_name: "นาย อนุรักษ์ สงบดี", sex: "ชาย", birthDate: "1999-01-30", age: 27, phone: "0878977889", sessionCount: 9, lastUpdated: "2026-09-07T15:00:00.000Z" },
  { hn: "HN-003", full_name: "นางสาว นฤมล งามตา", sex: "หญิง", birthDate: "2003-09-12", age: 23, phone: "0889088990", sessionCount: 13, lastUpdated: "2026-09-07T10:10:00.000Z" },
  { hn: "HN-003", full_name: "นาย ทินกร ส่องแสง", sex: "ชาย", birthDate: "1988-03-27", age: 38, phone: "0890199001", sessionCount: 1, lastUpdated: "2026-09-06T11:00:00.000Z" },

  // Page 4
  { hn: "HN-004", full_name: "นาย ประยูร สมบูรณ์", sex: "ชาย", birthDate: "1960-05-10", age: 66, phone: "0812411223", sessionCount: 30, lastUpdated: "2026-09-06T09:00:00.000Z" },
  { hn: "HN-004", full_name: "นาง สุดาพร รักษ์ดี", sex: "หญิง", birthDate: "1976-07-28", age: 50, phone: "0823522334", sessionCount: 10, lastUpdated: "2026-09-05T14:30:00.000Z" },
  { hn: "HN-004", full_name: "นาย วรวิทย์ คิดดี", sex: "ชาย", birthDate: "1985-10-15", age: 41, phone: "0834633445", sessionCount: 19, lastUpdated: "2026-09-05T11:15:00.000Z" },
  { hn: "HN-004", full_name: "นางสาว ปรียา รื่นรมย์", sex: "หญิง", birthDate: "2001-02-20", age: 25, phone: "0845744556", sessionCount: 5, lastUpdated: "2026-09-04T16:20:00.000Z" },
  { hn: "HN-004", full_name: "นาย ประเสริฐ เกิดสุข", sex: "ชาย", birthDate: "1967-12-08", age: 59, phone: "0856855667", sessionCount: 23, lastUpdated: "2026-09-04T10:45:00.000Z" },
  { hn: "HN-004", full_name: "นาง วรรณา พึ่งบุญ", sex: "หญิง", birthDate: "1978-08-03", age: 48, phone: "0867966778", sessionCount: 14, lastUpdated: "2026-09-03T15:10:00.000Z" },
  { hn: "HN-004", full_name: "นาย ธนาคาร รวยรื่น", sex: "ชาย", birthDate: "1996-03-14", age: 30, phone: "0878077889", sessionCount: 8, lastUpdated: "2026-09-03T09:30:00.000Z" },
  { hn: "HN-004", full_name: "นาง นภัสสร เด่นดวง", sex: "หญิง", birthDate: "1987-11-25", age: 39, phone: "0889188990", sessionCount: 12, lastUpdated: "2026-09-02T13:40:00.000Z" },
  { hn: "HN-004", full_name: "นาย พงษ์ศักดิ์ กล้าหาญ", sex: "ชาย", birthDate: "1974-06-19", age: 52, phone: "0890299001", sessionCount: 4, lastUpdated: "2026-09-02T10:00:00.000Z" },

  // Page 5
  { hn: "HN-005", full_name: "นาย บดินทร์ เดชา", sex: "ชาย", birthDate: "1962-09-17", age: 64, phone: "0812511223", sessionCount: 28, lastUpdated: "2026-09-01T14:00:00.000Z" },
  { hn: "HN-005", full_name: "นาง ดารารัตน์ วิจิตร", sex: "หญิง", birthDate: "1979-01-09", age: 47, phone: "0823622334", sessionCount: 11, lastUpdated: "2026-09-01T11:20:00.000Z" },
  { hn: "HN-005", full_name: "นาย ศุภชัย มงคล", sex: "ชาย", birthDate: "1991-04-12", age: 35, phone: "0834733445", sessionCount: 16, lastUpdated: "2026-08-31T15:30:00.000Z" },
  { hn: "HN-005", full_name: "นางสาว อรทัย สดใส", sex: "หญิง", birthDate: "2004-10-06", age: 22, phone: "0845844556", sessionCount: 7, lastUpdated: "2026-08-31T09:50:00.000Z" },
  { hn: "HN-005", full_name: "นาย ยรรยง ยิ่งยง", sex: "ชาย", birthDate: "1969-07-21", age: 57, phone: "0856955667", sessionCount: 21, lastUpdated: "2026-08-30T16:15:00.000Z" },
  { hn: "HN-005", full_name: "นาง ปานทิพย์ ยิ้มละไม", sex: "หญิง", birthDate: "1983-05-30", age: 43, phone: "0867066778", sessionCount: 15, lastUpdated: "2026-08-30T10:40:00.000Z" },
  { hn: "HN-005", full_name: "นาย โสภณ ทรงคุณ", sex: "ชาย", birthDate: "1994-12-18", age: 32, phone: "0878177889", sessionCount: 9, lastUpdated: "2026-08-29T14:00:00.000Z" },
  { hn: "HN-005", full_name: "นาง สุพรรณี งามล้วน", sex: "หญิง", birthDate: "1971-08-14", age: 55, phone: "0889288990", sessionCount: 13, lastUpdated: "2026-08-29T11:30:00.000Z" },
  { hn: "HN-005", full_name: "นาย คมสันต์ คมคาย", sex: "ชาย", birthDate: "1988-02-03", age: 38, phone: "0890399001", sessionCount: 2, lastUpdated: "2026-08-28T09:10:00.000Z" },

  // Page 6
  { hn: "HN-006", full_name: "นาย บุญเลิศ เกิดลาภ", sex: "ชาย", birthDate: "1961-03-24", age: 65, phone: "0812611223", sessionCount: 24, lastUpdated: "2026-08-28T08:45:00.000Z" },
  { hn: "HN-006", full_name: "นาง มณฑา ดอกไม้", sex: "หญิง", birthDate: "1977-10-11", age: 49, phone: "0823722334", sessionCount: 6, lastUpdated: "2026-08-27T15:20:00.000Z" },
  { hn: "HN-006", full_name: "นาย ชาคริต คิดการไกล", sex: "ชาย", birthDate: "1992-06-07", age: 34, phone: "0834833445", sessionCount: 18, lastUpdated: "2026-08-27T11:00:00.000Z" },
  { hn: "HN-006", full_name: "นางสาว ปรียานุช ผุดผ่อง", sex: "หญิง", birthDate: "2000-11-29", age: 26, phone: "0845944556", sessionCount: 10, lastUpdated: "2026-08-26T14:40:00.000Z" },
  { hn: "HN-006", full_name: "นาย สถาพร ยั่งยืน", sex: "ชาย", birthDate: "1966-08-16", age: 60, phone: "0856055667", sessionCount: 27, lastUpdated: "2026-08-26T10:15:00.000Z" },
  { hn: "HN-006", full_name: "นาง สร้อยเพชร น้ำเอก", sex: "หญิง", birthDate: "1980-04-05", age: 46, phone: "0867166778", sessionCount: 12, lastUpdated: "2026-08-25T16:00:00.000Z" },
  { hn: "HN-006", full_name: "นาย ปองพล คนดี", sex: "ชาย", birthDate: "1997-09-22", age: 29, phone: "0878277889", sessionCount: 8, lastUpdated: "2026-08-25T09:30:00.000Z" },
  { hn: "HN-006", full_name: "นาง รุ่งทิพย์ ทิพย์ธารา", sex: "หญิง", birthDate: "1972-12-01", age: 54, phone: "0889388990", sessionCount: 17, lastUpdated: "2026-08-24T13:50:00.000Z" },
  { hn: "HN-006", full_name: "นาย นครินทร์ ปิ่นทอง", sex: "ชาย", birthDate: "1989-07-13", age: 37, phone: "0890499001", sessionCount: 5, lastUpdated: "2026-08-24T10:20:00.000Z" },

  // Page 7
  { hn: "HN-007", full_name: "นาย เชาวลิต ชัยประสิทธิ์", sex: "ชาย", birthDate: "1963-11-04", age: 63, phone: "0812711223", sessionCount: 22, lastUpdated: "2026-08-23T15:00:00.000Z" },
  { hn: "HN-007", full_name: "นาง กรรณิการ์ บุศรา", sex: "หญิง", birthDate: "1975-05-18", age: 51, phone: "0823822334", sessionCount: 9, lastUpdated: "2026-08-23T11:45:00.000Z" },
  { hn: "HN-007", full_name: "นาย ภาณุพงศ์ สดใส", sex: "ชาย", birthDate: "1993-01-25", age: 33, phone: "0834933445", sessionCount: 14, lastUpdated: "2026-08-22T14:10:00.000Z" },
  { hn: "HN-007", full_name: "นางสาว อมรรัตน์ แก้วมณี", sex: "หญิง", birthDate: "2002-08-09", age: 24, phone: "0845044556", sessionCount: 6, lastUpdated: "2026-08-22T09:00:00.000Z" },
  { hn: "HN-007", full_name: "นาย สันติภาพ สงบสุข", sex: "ชาย", birthDate: "1968-03-31", age: 58, phone: "0856155667", sessionCount: 26, lastUpdated: "2026-08-21T16:30:00.000Z" },
  { hn: "HN-007", full_name: "นาง ลัดดาวัลย์ สุวรรณ", sex: "หญิง", birthDate: "1984-10-14", age: 42, phone: "0867266778", sessionCount: 11, lastUpdated: "2026-08-21T10:50:00.000Z" },
  { hn: "HN-007", full_name: "นาย อรรถพล ชนะใจ", sex: "ชาย", birthDate: "1995-07-06", age: 31, phone: "0878377889", sessionCount: 7, lastUpdated: "2026-08-20T13:40:00.000Z" },
  { hn: "HN-007", full_name: "นาง จุฑามาศ ศรีสุข", sex: "หญิง", birthDate: "1974-02-27", age: 52, phone: "0889488990", sessionCount: 15, lastUpdated: "2026-08-20T09:15:00.000Z" },
  { hn: "HN-007", full_name: "นาย ปริญญา สุขเสมอ", sex: "ชาย", birthDate: "1990-12-16", age: 36, phone: "0890599001", sessionCount: 3, lastUpdated: "2026-08-19T15:20:00.000Z" },

  // Page 8
  { hn: "HN-008", full_name: "นาย วันชัย ชัยฤทธิ์", sex: "ชาย", birthDate: "1964-08-19", age: 62, phone: "0812811223", sessionCount: 20, lastUpdated: "2026-08-19T11:00:00.000Z" },
  { hn: "HN-008", full_name: "นาง เพ็ญศรี มีสุข", sex: "หญิง", birthDate: "1978-03-08", age: 48, phone: "0823922334", sessionCount: 8, lastUpdated: "2026-08-18T14:30:00.000Z" },
  { hn: "HN-008", full_name: "นาย เอกชัย ไพบูลย์", sex: "ชาย", birthDate: "1987-09-15", age: 39, phone: "0834033445", sessionCount: 13, lastUpdated: "2026-08-18T10:00:00.000Z" },
  { hn: "HN-008", full_name: "นางสาว ศิริพร พรประเสริฐ", sex: "หญิง", birthDate: "2001-05-23", age: 25, phone: "0845144556", sessionCount: 18, lastUpdated: "2026-08-17T16:10:00.000Z" },
  { hn: "HN-008", full_name: "นาย ชำนาญ ชำนาญคิด", sex: "ชาย", birthDate: "1970-11-12", age: 56, phone: "0856255667", sessionCount: 21, lastUpdated: "2026-08-17T09:40:00.000Z" },
  { hn: "HN-008", full_name: "นาง กอบกุล รุ่งเรือง", sex: "หญิง", birthDate: "1981-06-29", age: 45, phone: "0867366778", sessionCount: 10, lastUpdated: "2026-08-16T15:00:00.000Z" },
  { hn: "HN-008", full_name: "นาย ไชยา พัฒนา", sex: "ชาย", birthDate: "1998-04-01", age: 28, phone: "0878477889", sessionCount: 5, lastUpdated: "2026-08-16T11:25:00.000Z" },
  { hn: "HN-008", full_name: "นาง ทิพวรรณ ศิริกุล", sex: "หญิง", birthDate: "1973-01-17", age: 53, phone: "0889588990", sessionCount: 16, lastUpdated: "2026-08-15T13:45:00.000Z" },
  { hn: "HN-008", full_name: "นาย ธวัช สว่างวงศ์", sex: "ชาย", birthDate: "1991-10-09", age: 35, phone: "0890699001", sessionCount: 4, lastUpdated: "2026-08-15T09:10:00.000Z" },

  // Page 9
  { hn: "HN-009", full_name: "นาย บรรจง ใจสัตย์", sex: "ชาย", birthDate: "1965-07-26", age: 61, phone: "0812911223", sessionCount: 23, lastUpdated: "2026-08-14T14:20:00.000Z" },
  { hn: "HN-009", full_name: "นาง นภาลัย สายชล", sex: "หญิง", birthDate: "1976-12-14", age: 50, phone: "0823022334", sessionCount: 7, lastUpdated: "2026-08-14T10:00:00.000Z" },
  { hn: "HN-009", full_name: "นาย ณัฐพล คนขยัน", sex: "ชาย", birthDate: "1986-02-28", age: 40, phone: "0834133445", sessionCount: 15, lastUpdated: "2026-08-13T16:00:00.000Z" },
  { hn: "HN-009", full_name: "นางสาว พรรณี ศรีงาม", sex: "หญิง", birthDate: "2003-04-16", age: 23, phone: "0845244556", sessionCount: 9, lastUpdated: "2026-08-13T11:15:00.000Z" },
  { hn: "HN-009", full_name: "นาย วีระยุทธ ยุทธการ", sex: "ชาย", birthDate: "1969-09-05", age: 57, phone: "0856355667", sessionCount: 25, lastUpdated: "2026-08-12T15:30:00.000Z" },
  { hn: "HN-009", full_name: "นาง กัญญา มณีรัตน์", sex: "หญิง", birthDate: "1982-08-21", age: 44, phone: "0867466778", sessionCount: 12, lastUpdated: "2026-08-12T09:40:00.000Z" },
  { hn: "HN-009", full_name: "นาย ทรงศักดิ์ เจริญสุข", sex: "ชาย", birthDate: "1996-11-03", age: 30, phone: "0878577889", sessionCount: 6, lastUpdated: "2026-08-11T14:10:00.000Z" },
  { hn: "HN-009", full_name: "นาง ฉวีวรรณ ทองทา", sex: "หญิง", birthDate: "1970-06-18", age: 56, phone: "0889688990", sessionCount: 19, lastUpdated: "2026-08-11T10:30:00.000Z" },
  { hn: "HN-009", full_name: "นาย พงษ์เทพ ก้องเวหา", sex: "ชาย", birthDate: "1989-01-22", age: 37, phone: "0890799001", sessionCount: 2, lastUpdated: "2026-08-10T16:20:00.000Z" },

  // Page 10
  { hn: "HN-010", full_name: "นาย สำเริง สุขเกษม", sex: "ชาย", birthDate: "1962-04-13", age: 64, phone: "0813011223", sessionCount: 27, lastUpdated: "2026-08-10T09:00:00.000Z" },
  { hn: "HN-010", full_name: "นาง สมพร พรนิมิต", sex: "หญิง", birthDate: "1979-09-27", age: 47, phone: "0823122334", sessionCount: 10, lastUpdated: "2026-08-09T15:00:00.000Z" },
  { hn: "HN-010", full_name: "นาย เกียรติภูมิ ภูมิใจ", sex: "ชาย", birthDate: "1992-12-11", age: 34, phone: "0834233445", sessionCount: 17, lastUpdated: "2026-08-09T11:20:00.000Z" },
  { hn: "HN-010", full_name: "นางสาว มัลลิกา หอมฟุ้ง", sex: "หญิง", birthDate: "2004-07-04", age: 22, phone: "0845344556", sessionCount: 8, lastUpdated: "2026-08-08T14:45:00.000Z" },
  { hn: "HN-010", full_name: "นาย อดิสรณ์ ขจรไกล", sex: "ชาย", birthDate: "1967-05-19", age: 59, phone: "0856455667", sessionCount: 22, lastUpdated: "2026-08-08T10:10:00.000Z" },
  { hn: "HN-010", full_name: "นาง พยอม หอมหวาน", sex: "หญิง", birthDate: "1983-02-15", age: 43, phone: "0867566778", sessionCount: 13, lastUpdated: "2026-08-07T16:00:00.000Z" },
  { hn: "HN-010", full_name: "นาย ศุภฤกษ์ ฤกษ์งาม", sex: "ชาย", birthDate: "1997-08-30", age: 29, phone: "0878677889", sessionCount: 11, lastUpdated: "2026-08-07T09:30:00.000Z" },
  { hn: "HN-010", full_name: "นาง ยุพิน ถิ่นทอง", sex: "หญิง", birthDate: "1971-10-24", age: 55, phone: "0889788990", sessionCount: 18, lastUpdated: "2026-08-06T13:50:00.000Z" },
  { hn: "HN-010", full_name: "นาย ธนกร สมบัติ", sex: "ชาย", birthDate: "1990-03-06", age: 36, phone: "0890899001", sessionCount: 3, lastUpdated: "2026-08-06T10:15:00.000Z" },
];

export function getPrototypeDoctorPatients(realPatients: DoctorPatient[]): DoctorPatient[] {
  const defaultId = realPatients[0]?.patient_id ?? 4;

  const page1: DoctorPatient[] = PROTOTYPE_PAGE_1.map((p, idx) => {
    const real = realPatients[idx];
    return {
      ...p,
      patient_id: real?.patient_id ?? (realPatients.length > 0 ? realPatients[idx % realPatients.length].patient_id : defaultId),
      hn: real?.hn ?? p.hn,
    };
  });

  const rest: DoctorPatient[] = SAMPLE_PATIENTS_REST.map((p, idx) => ({
    ...p,
    patient_id: realPatients.length > 0 ? realPatients[idx % realPatients.length].patient_id : defaultId,
  }));

  return [...page1, ...rest];
}
