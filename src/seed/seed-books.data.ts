export interface SeedChapterEntry {
  title: string;
  contentText: string;
}

export interface SeedBookEntry {
  slug: string;
  title: string;
  authorName: string;
  description: string;
  categoryNames: string[];
  chapters: SeedChapterEntry[];
}

/** Initial Arabic catalog aligned with ERD collections. */
export const SEED_CATALOG: SeedBookEntry[] = [
  {
    slug: 'al-ayyam',
    title: 'الأيام',
    authorName: 'طه حسين',
    description:
      'رواية سيرة ذاتية خالدة كتبها عميد الأدب العربي طه حسين، يصف فيها طفولته في قرية مصرية ورحلته في طلب العلم.',
    categoryNames: ['روايات'],
    chapters: [
      {
        title: 'الفصل الأول - الصبي الصغير',
        contentText:
          'كان لا يزال طفلاً حين فقد بصره، وكان ذلك المرض الذي أصابه في صباه الباكر قدراً كتبه الله عليه، فقبله بصدر رحب وقلب راضٍ.\n\nكان يجلس في فناء الدار وهو يستمع إلى أصوات أهله وجيرانه، يميّز كل صوت ويعرف صاحبه.',
      },
      {
        title: 'الفصل الثاني - رحلة إلى القاهرة',
        contentText:
          'لمّا بلغ الثالثة عشرة من عمره، قرر أبوه أن يُرسله إلى القاهرة ليتعلم في الأزهر الشريف.',
      },
    ],
  },
  {
    slug: 'alf-layla-wa-layla',
    title: 'ألف ليلة وليلة',
    authorName: 'مجهول - تراث عربي',
    description: 'أشهر مجموعة حكايات في التراث العربي والعالمي.',
    categoryNames: ['قصص وحكايات'],
    chapters: [
      {
        title: 'حكاية التاجر والجني',
        contentText:
          'حُكي أن تاجراً من التجار كان كثير المال، فخرج يوماً إلى بعض البلاد لأجل مهم عنده.',
      },
    ],
  },
  {
    slug: 'rihlat-ibn-battuta',
    title: 'رحلة ابن بطوطة',
    authorName: 'ابن بطوطة',
    description: 'تحفة النظار في غرائب الأمصار وعجائب الأسفار.',
    categoryNames: ['رحلات'],
    chapters: [
      {
        title: 'الخروج من طنجة',
        contentText: 'خرجت من طنجة موطني وأهلي قاصداً الحج إلى بيت الله الحرام.',
      },
    ],
  },
  {
    slug: 'al-muqaddima',
    title: 'المقدمة',
    authorName: 'ابن خلدون',
    description: 'مقدمة ابن خلدون — تأسيس علم الاجتماع وفلسفة التاريخ.',
    categoryNames: ['تاريخ وفلسفة'],
    chapters: [
      {
        title: 'في فضل علم التاريخ',
        contentText: 'اعلم أن فن التاريخ فن عزيز المذهب جم الفوائد شريف الغاية.',
      },
    ],
  },
  {
    slug: 'zqaq-al-madaq',
    title: 'زقاق المدق',
    authorName: 'نجيب محفوظ',
    description: 'رواية تصوّر الحياة في حارة مصرية قديمة في قلب القاهرة.',
    categoryNames: ['روايات'],
    chapters: [
      {
        title: 'الفصل الأول - الحارة تستيقظ',
        contentText: 'امتدت الحارة طولاً بين شارعَي المسكي وسوق الذهب.',
      },
    ],
  },
  {
    slug: 'kalila-wa-dimna',
    title: 'كليلة ودمنة',
    authorName: 'ابن المقفع',
    description: 'كنز الحكمة العربية — قصص رمزية تتكلم فيها الحيوانات.',
    categoryNames: ['أدب وحكم'],
    chapters: [
      {
        title: 'باب الأسد والثور',
        contentText: 'زعموا أن أسداً كان ينزل في أجمة فيها ماء ومرعى.',
      },
    ],
  },
  {
    slug: 'mawsim-al-hijra',
    title: 'موسم الهجرة إلى الشمال',
    authorName: 'الطيب صالح',
    description: 'من أبرز الروايات العربية في القرن العشرين.',
    categoryNames: ['روايات'],
    chapters: [
      {
        title: 'العودة إلى القرية',
        contentText: 'عدت إلى أهلي بعد سنوات طويلة قضيتها في الدراسة في الخارج.',
      },
    ],
  },
  {
    slug: 'mutanabbi-selected',
    title: 'شعر المتنبي المختار',
    authorName: 'أبو الطيب المتنبي',
    description: 'مختارات من أروع ما قاله شاعر العرب الأكبر.',
    categoryNames: ['شعر'],
    chapters: [
      {
        title: 'من قصيدة «لا تعدم من رزق الله»',
        contentText:
          'على قدر أهل العزم تأتي العزائم\nوتأتي على قدر الكرام المكارم',
      },
    ],
  },
];
