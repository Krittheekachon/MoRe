/**
 * Master catalog of 5 modules and 11 rehabilitation exercises.
 * Current clinical/AI readiness:
 * - Module 2: seated-leg-raise (นั่งเหยียดขาบนเก้าอี้) is READY and selectable.
 * - Remaining 10 exercises are disabled/pending future phase.
 */

export type MasterExercise = {
  code: string;
  moduleNumber: number;
  nameTh: string;
  nameEn: string;
  descriptionTh: string;
  cameraView: "ด้านหน้า" | "ด้านข้าง";
  supportsSide: boolean;
  defaultSets: number;
  defaultReps: number;
  isSelectable: boolean;
  badgeLabel?: string;
};

export type MasterModule = {
  moduleNumber: number;
  nameTh: string;
  descriptionTh: string;
  exercises: MasterExercise[];
};

export const MASTER_EXERCISE_MODULES: MasterModule[] = [
  {
    moduleNumber: 1,
    nameTh: "การควบคุมลำตัวและการทำงานของขาเบื้องต้น",
    descriptionTh: "ฟื้นฟูการควบคุมแกนกลางลำตัวและการเคลื่อนไหวข้อเท้าในท่านั่ง",
    exercises: [
      {
        code: "seated-trunk",
        moduleNumber: 1,
        nameTh: "บริหารลำตัวขณะนั่ง",
        nameEn: "Seated Trunk Exercise",
        descriptionTh: "เอียงลำตัวและควบคุมสมดุลแกนกลางขณะนั่งบนเก้าอี้",
        cameraView: "ด้านหน้า",
        supportsSide: false,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
      {
        code: "ankle-pump",
        moduleNumber: 1,
        nameTh: "กระดกข้อเท้า",
        nameEn: "Ankle Pumping Exercise",
        descriptionTh: "กระดกปลายเท้าขึ้น-ลงเพื่อกระตุ้นการไหลเวียนเลือดและการทำงานของข้อเท้า",
        cameraView: "ด้านข้าง",
        supportsSide: true,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
    ],
  },
  {
    moduleNumber: 2,
    nameTh: "การควบคุมลำตัวและการเคลื่อนไหวของขา",
    descriptionTh: "เสริมสร้างกล้ามเนื้อต้นขา ข้อเข่า และสะโพกเพื่อเตรียมพร้อมการยืน",
    exercises: [
      {
        code: "seated-leg-raise",
        moduleNumber: 2,
        nameTh: "ยกขาขณะนั่ง (นั่งเหยียดขา)",
        nameEn: "Seated Leg Raise",
        descriptionTh: "นั่งตัวตรงบนเก้าอี้ ยกและเหยียดเข่าตรงไปด้านหน้าค้างไว้ตามองศาเป้าหมาย",
        cameraView: "ด้านข้าง",
        supportsSide: true,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: true,
        badgeLabel: "AI กล้องพร้อมใช้งาน",
      },
      {
        code: "sit-to-stand",
        moduleNumber: 2,
        nameTh: "ลุกยืนจากท่านั่ง",
        nameEn: "Sit to Stand",
        descriptionTh: "ฝึกการถ่ายน้ำหนักและกำลังขาในการลุกขึ้นยืนจากเก้าอี้และนั่งลงอย่างช้าๆ",
        cameraView: "ด้านข้าง",
        supportsSide: false,
        defaultSets: 3,
        defaultReps: 8,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
      {
        code: "bridging",
        moduleNumber: 2,
        nameTh: "ยกสะโพก",
        nameEn: "Bridging Exercise",
        descriptionTh: "นอนหงายชันเข่าแล้วยกสะโพกลอยขึ้นเพื่อบริหารกล้ามเนื้อสะโพกและหลังส่วนล่าง",
        cameraView: "ด้านข้าง",
        supportsSide: false,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
    ],
  },
  {
    moduleNumber: 3,
    nameTh: "การยืนและการเริ่มเดิน",
    descriptionTh: "ฝึกการทรงตัวในท่ายืนและการก้าวเท้าเบื้องต้น",
    exercises: [
      {
        code: "standing-balance",
        moduleNumber: 3,
        nameTh: "ท่ายืนทรงตัว",
        nameEn: "Static Standing Balance",
        descriptionTh: "ยืนทรงตัวโดยมีที่เกาะพยุง รักษาระนาบสะโพกและไหล่ให้ตรง",
        cameraView: "ด้านหน้า",
        supportsSide: false,
        defaultSets: 3,
        defaultReps: 5,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
      {
        code: "marching-in-place",
        moduleNumber: 3,
        nameTh: "ก้าวขาอยู่กับที่",
        nameEn: "Marching in Place",
        descriptionTh: "ยกเข่าสูงสลับข้างในท่ายืนเพื่อเสริมการรับรู้ข้อต่อและความมั่นคง",
        cameraView: "ด้านหน้า",
        supportsSide: true,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
    ],
  },
  {
    moduleNumber: 4,
    nameTh: "การเดินและการทรงตัวขั้นสูง",
    descriptionTh: "พัฒนาการถ่ายเทน้ำหนักระหว่างก้าวเดินและการทรงตัวขณะเคลื่อนไหว",
    exercises: [
      {
        code: "weight-shifting",
        moduleNumber: 4,
        nameTh: "ยืนถ่ายน้ำหนัก",
        nameEn: "Weight Shifting",
        descriptionTh: "ถ่ายน้ำหนักตัวไปข้างหน้า-หลัง และซ้าย-ขวา เพื่อเพิ่มความมั่นคงของจุดศูนย์ถ่วง",
        cameraView: "ด้านหน้า",
        supportsSide: true,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
      {
        code: "forward-stepping",
        moduleNumber: 4,
        nameTh: "ก้าวขาไปข้างหน้า",
        nameEn: "Forward Stepping",
        descriptionTh: "ก้าวเท้าข้างที่มีอาการไปข้างหน้าและก้าวกลับอย่างมั่นคง",
        cameraView: "ด้านข้าง",
        supportsSide: true,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
    ],
  },
  {
    moduleNumber: 5,
    nameTh: "การเดินขั้นสูงและเคลื่อนไหวคล่องตัว",
    descriptionTh: "การฝึกเดินในสภาพแวดล้อมที่ท้าทายเพื่อเตรียมความพร้อมกลับสู่ชีวิตประจำวัน",
    exercises: [
      {
        code: "tandem-walking",
        moduleNumber: 5,
        nameTh: "เดินต่อส้นเท้า",
        nameEn: "Tandem Walking",
        descriptionTh: "เดินต่อเท้าเป็นเส้นตรง ส้นเท้าจรดปลายเท้าเพื่อฝึกการทรงตัวขั้นสูง",
        cameraView: "ด้านข้าง",
        supportsSide: false,
        defaultSets: 3,
        defaultReps: 10,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
      {
        code: "obstacle-stepping",
        moduleNumber: 5,
        nameTh: "ก้าวข้ามสิ่งกีดขวาง",
        nameEn: "Obstacle Stepping",
        descriptionTh: "ฝึกยกเท้าก้าวข้ามสิ่งกีดขวางความสูงต่ำเพื่อจำลองการเดินในบ้านและนอกบ้าน",
        cameraView: "ด้านข้าง",
        supportsSide: true,
        defaultSets: 3,
        defaultReps: 8,
        isSelectable: false,
        badgeLabel: "เร็วๆ นี้",
      },
    ],
  },
];

export function getAllMasterExercises(): MasterExercise[] {
  return MASTER_EXERCISE_MODULES.flatMap((mod) => mod.exercises);
}

export function getSelectableMasterExercises(): MasterExercise[] {
  return getAllMasterExercises().filter((ex) => ex.isSelectable);
}

export function getMasterExerciseByCode(code: string): MasterExercise | undefined {
  return getAllMasterExercises().find((ex) => ex.code === code);
}
