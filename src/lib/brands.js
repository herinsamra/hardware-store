export const brandRows = [
  [
    { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtC3bk82uvXDNIHUxUC8kpMYidmhapxVJqOA&s', name: 'Havells' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761135748/legrand-logo-png_seeklogo-83164_zn0ruu.png', name: 'Legrand' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761143030/crompton_xb5lbx.png', name: 'Crompton' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761137573/luminous_kup8tq.png', name: 'Luminous' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761144313/vguard_m4id3e.jpg', name: 'V-Guard' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761133916/electrical-inventaa_ph7gba.webp', name: 'Inventaa' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761144456/philips_dubah9.png', name: 'Philips' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761137371/hifi_gcjo2z.png', name: 'Hifi' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761394226/images_r72daq.png', name: 'Anchor' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761137434/arcline_s2wdwf.png', name: 'Arcline' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761394128/panasonic_nwkqrk.avif', name: 'Panasonic' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761137128/opple_strvq2.png', name: 'Opple' },
  ],
  [
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761138902/jaguar_ihsext.webp', name: 'Jaquar' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761138115/parryware_wecckh.jpg', name: 'Parryware' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761394495/5dc1b452b461a_l5xo0t.png', name: 'Waterman' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761394363/images_vnibkf.jpg', name: 'Essco' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761138826/jass_ih2qut.png', name: 'Jass' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761143254/weber_namzks.webp', name: 'Weber' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761138488/watertec_ls3eid.png', name: 'Watertec' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761139022/pupa_imdjzl.png', name: 'Pupa' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761143186/atomberg_ugnp7j.jpg', name: 'Atomberg' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761394798/images_1_ro4beh.png', name: 'CRI' },
  ],
  [
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761133916/finolex-logo-png_seeklogo-428098_jlcook.png', name: 'Finolex' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761137128/supreme_rqid8t.jpg', name: 'Supreme' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761138276/ashirvad_dezfr5.png', name: 'Ashirvad' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761143118/indigo_umwraw.png', name: 'Indigo' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761134221/asianpaint_jaymcv.jpg', name: 'Asian Paints' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761142914/drfixit_cqxohx.png', name: 'Dr. Fixit' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761133917/godrej-logo-godrej-icon-free-free-vector_k3qznd.jpg', name: 'Godrej' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761394798/images_1_ro4beh.png', name: 'CRI Pumps' },
  ],
  [
    { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtC3bk82uvXDNIHUxUC8kpMYidmhapxVJqOA&s', name: 'Yama Locks' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761135748/legrand-logo-png_seeklogo-83164_zn0ruu.png', name: 'Prince' },
    { url: 'https://res.cloudinary.com/dvvpabney/image/upload/v1761143030/crompton_xb5lbx.png', name: 'Lisha' },
  ],
];

const brandAliases = {
  hi_fi: 'hifi',
  jaquar_and_essco: 'jaquar',
  jaquar_essco: 'jaquar',
  asian: 'asianpaints',
};

export function normalizeBrandKey(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return brandAliases[normalized] || normalized.replace(/_/g, '');
}

const brandIndex = new Map();

for (const brand of brandRows.flat()) {
  const key = normalizeBrandKey(brand.name);
  if (!brandIndex.has(key)) {
    brandIndex.set(key, brand);
  }
}

export function getBrandAsset(brandName) {
  return brandIndex.get(normalizeBrandKey(brandName));
}
