export const SITE_URL = (process.env.SITE_URL || 'https://penielhardwares.com').replace(/\/+$/, '');

export function absoluteUrl(pathOrUrl = '/', siteUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const baseUrl = siteUrl || SITE_URL;
  return new URL(pathOrUrl, `${baseUrl}/`).toString();
}

export function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function cdata(value = '') {
  return `<![CDATA[${String(value).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function formatMerchantPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price.toFixed(2) : '';
}

export function generateOrganizationSchema(siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Peniel Hardwares',
    alternateName: 'Peniel Hardware - Quality Materials',
    url: siteUrl || 'https://penielhardwares.com', // Use passed site URL or default
    logo: 'https://res.cloudinary.com/dthi2vgiz/image/upload/v1778067898/favicon_zncfgk.ico',
    description: 'Your one-stop shop for quality hardware, tools, plumbing, electrical, and building materials.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '60/1, Rajakkamangalam Rd, opp. SBI Bank Building',
      addressLocality: 'East Ramanputhoor, Ramanputhoor Junction',
      addressRegion: 'Nagercoil',
      postalCode: '629002',
      addressCountry: 'IN'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+919488614888', // Using actual phone from contact page
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: 'en'
    },
    email: 'penielhardwares@gmail.com', // Adding email from contact page
    areaServed: 'IN',
    legalName: 'Peniel Hardwares', // Adding legal name
    memberOf: [], // Can add trade associations if applicable
    sameAs: [
      // Add social media links if available
      // 'https://www.facebook.com/penielhardwares',
      // 'https://www.instagram.com/penielhardwares',
      // 'https://www.youtube.com/penielhardwares'
    ]
  };
}

export function generateBreadcrumbSchema(breadcrumbItems, siteUrl) {
  if (!breadcrumbItems || !Array.isArray(breadcrumbItems) || breadcrumbItems.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${siteUrl}${item.url}` : undefined
    })).filter(item => item.item) // Filter out items without URLs
  };
}

// Export a function to generate local business schema with actual details
export function generateLocalBusinessSchema(siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Peniel Hardwares',
    image: 'https://res.cloudinary.com/dthi2vgiz/image/upload/v1778067898/favicon_zncfgk.ico',
    '@id': `${siteUrl}#contact`,
    url: `${siteUrl}/contact`,
    telephone: '+919488614888', // Actual phone from contact page
    email: 'penielhardwares@gmail.com', // Actual email from contact page
    address: {
      '@type': 'PostalAddress',
      streetAddress: '60/1, Rajakkamangalam Rd, opp. SBI Bank Building',
      addressLocality: 'East Ramanputhoor, Ramanputhoor Junction',
      addressRegion: 'Nagercoil',
      postalCode: '629002',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      // Using approximate coordinates for Nagercoil
      latitude: 8.1846,
      longitude: 77.4134
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '20:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: 'Closed',
        closes: 'Closed'
      }
    ],
    areaServed: 'IN',
    availableLanguage: ['English', 'Tamil'],
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'UPI'],
    priceRange: '$$',
    description: 'Your one-stop shop for quality hardware, tools, plumbing, electrical, and building materials.'
  };
}
