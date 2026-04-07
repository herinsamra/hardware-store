import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const productsDirectory = path.join(process.cwd(), 'src/content/products');

export async function fetchAllProducts() {
  if (!fs.existsSync(productsDirectory)) {
    console.warn('Products directory not found, returning empty array');
    return [];
  }
  const files = fs.readdirSync(productsDirectory);
  const products = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(productsDirectory, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      const mainImage = data.images?.[0]?.image || '';
      return {
        id: file.replace('.md', ''),
        name: data.name,
        price: data.price,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        subSubcategory: data.subSubcategory,
        sku: data.sku,
        stock: data.stock,
        brand: data.brand,
        image: mainImage,
        thumbnail: mainImage.replace('/upload/', '/upload/c_fill,w_200,h_200/')
      };
    });
  return products;
}

export async function fetchProductById(id) {
  const filePath = path.join(productsDirectory, `${id}.md`);
  if (!fs.existsSync(filePath)) return null;
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContents);
  const mainImage = data.images?.[0]?.image || '';
  return {
    id,
    name: data.name,
    price: data.price,
    description: data.description,
    category: data.category,
    subcategory: data.subcategory,
    subSubcategory: data.subSubcategory,
    sku: data.sku,
    stock: data.stock,
    brand: data.brand,
    image: mainImage,
    thumbnail: mainImage.replace('/upload/', '/upload/c_fill,w_200,h_200/'),
    images: data.images || []
  };
}