import fs from 'fs';

// قواميس كلمات لتوليد أسماء منتجات وتفاصيل واقعية
const adjectives = ['برو', 'بلس', 'الترا', 'ماكس', 'المطور', 'الفاخر', 'الذكي', 'الكلاسيكي', 'المريح', 'الاحترافي', 'اللاسلكي', 'السريع', 'المقاوم للماء', 'العصري', 'المحمول'];
const brands = ['Trilogy', 'Apex', 'Nova', 'Titan', 'Aura', 'Pulse', 'Vertex', 'Echo', 'Horizon', 'Zenith'];

const categoriesData = [
  {
    catId: 1, // إلكترونيات
    items: ['سماعات رأس', 'ساعة ذكية', 'لوحة مفاتيح ميكانيكية', 'فأرة ألعاب', 'شاحن متنقل', 'كاميرا مراقبة', 'مكبر صوت بلوتوث', 'شاشة ألعاب', 'ميكروفون بودكاست', 'كابل شحن سريع', 'حامل لابتوب ألمنيوم', 'محول USB-C متعدد المنافذ'],
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d'
    ]
  },
  {
    catId: 2, // أزياء وملابس
    items: ['تيشيرت قطني', 'حذاء رياضي للجري', 'سترة شتوية هودي', 'بنطال جينز مرن', 'حذاء كلاسيكي جلدي', 'قميص كتان', 'سترة صوفية', 'شورت تدريب', 'قبعة رياضية', 'معطف طويل مقاوم للرياح'],
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4'
    ]
  },
  {
    catId: 3, // إكسسوارات ومنزل
    items: ['نظارة شمسية كلاسيكية', 'حقيبة ظهر للابتوب', 'محفظة جلدية مع حماية RFID', 'زجاجة ماء حرارية', 'مصباح مكتب ذكي', 'وسادة طبية ميموري فوم', 'شمعة صويا معطرة', 'كوب قهوة حراري', 'منظم أدوات مكتبي', 'ماكينة قهوة بالتنقيط'],
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
      'https://images.unsplash.com/photo-1627123424574-724758594e93',
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c'
    ]
  }
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

console.log('⏳ جاري إنشاء ملف SQL يحتوي على 2000 منتج...');

let sqlContent = `-- تفريغ أو إدخال 2000 منتج جديد
INSERT INTO products (name, price, stock_quantity, category_id, description, image_url, youtube_url) VALUES\n`;

const totalRecords = 2000;
const rows = [];

for (let i = 1; i <= totalRecords; i++) {
  const cat = getRandom(categoriesData);
  const baseItem = getRandom(cat.items);
  const brand = getRandom(brands);
  const adj = getRandom(adjectives);

  const name = `${baseItem} ${brand} ${adj} - إصدار #${i}`;
  const price = (Math.random() * (450 - 15) + 15).toFixed(2);
  const stock = Math.floor(Math.random() * 85) + 5; // مخزون واقعي بين 5 و 90
  const desc = `منتج ${baseItem} عالي الجودة من علامة ${brand} يتميز بتصميم ${adj} ومواد تصنيع متينة تلبي أعلى المعايير.`;
  const baseImg = getRandom(cat.images);
  const imgUrl = `${baseImg}?w=800&auto=format&fit=crop&q=80&sig=${i}`; // رابط صورة فريد لكي لا تتشابه في الكاش

  // تجهيز سطر SQL
  rows.push(`('${name.replace(/'/g, "''")}', ${price}, ${stock}, ${cat.catId}, '${desc.replace(/'/g, "''")}', '${imgUrl}', NULL)`);
}

sqlContent += rows.join(',\n') + ';\n';

fs.writeFileSync('insert_2000_products.sql', sqlContent, 'utf-8');
console.log('✅ تم بنجاح إنشاء الملف: insert_2000_products.sql (يحتوي على 2000 منتج)');