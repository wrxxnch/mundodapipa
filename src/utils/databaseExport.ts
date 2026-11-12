import { Product, Coupon, CategoryItem, Post } from '../types';
import { CustomerReviewItem, StoryContent, CatalogSettings } from '../lib/firebase';

export interface DatabaseExportBundle {
  metadata: {
    exportedAt: string;
    version: string;
    appName: string;
    databaseId: string;
    projectId: string;
    totalRecords: number;
    exportedBy?: string;
  };
  collections: {
    products: Product[];
    categories: CategoryItem[];
    coupons: Coupon[];
    posts: Post[];
    reviews: CustomerReviewItem[];
    site_content: {
      about_history: StoryContent;
      catalog_settings: CatalogSettings;
      admin_users: { emails: string[]; updatedAt?: string };
    };
  };
}

/**
 * Triggers a browser download of a JSON file with formatted indentation.
 */
export function downloadJsonFile(data: unknown, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of a plain text / SQL file.
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes strings for safe SQL literals.
 */
function sqlEscape(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Generates ready-to-run SQL DDL & INSERT statements compatible with
 * SQLite, PostgreSQL, MySQL and generic SQL Query Editors.
 */
export function generateSqlScript(bundle: DatabaseExportBundle): string {
  const timestamp = bundle.metadata.exportedAt;
  const lines: string[] = [
    `-- ==========================================================`,
    `-- Mundo da Pipa - Exportação de Banco de Dados Completo`,
    `-- Gerado em: ${timestamp}`,
    `-- Database ID: ${bundle.metadata.databaseId}`,
    `-- Compatível com: SQLite, PostgreSQL, MySQL e Query Editors`,
    `-- ==========================================================`,
    ``,
    `BEGIN TRANSACTION;`,
    ``,
    `-- 1. TABELA DE PRODUTOS`,
    `CREATE TABLE IF NOT EXISTS products (`,
    `  id VARCHAR(128) PRIMARY KEY,`,
    `  name TEXT NOT NULL,`,
    `  category VARCHAR(64) NOT NULL,`,
    `  price DECIMAL(10, 2) NOT NULL,`,
    `  original_price DECIMAL(10, 2),`,
    `  image TEXT,`,
    `  images_json TEXT,`,
    `  video_url TEXT,`,
    `  description TEXT,`,
    `  specs_json TEXT,`,
    `  in_stock INTEGER DEFAULT 1,`,
    `  stock_quantity INTEGER,`,
    `  shopee_url TEXT,`,
    `  badge TEXT,`,
    `  rating DECIMAL(3, 1),`,
    `  sales_count INTEGER,`,
    `  created_at TEXT,`,
    `  updated_at TEXT`,
    `);`,
    ``
  ];

  // Insert products
  if (bundle.collections.products.length > 0) {
    bundle.collections.products.forEach((p) => {
      lines.push(
        `INSERT OR REPLACE INTO products (id, name, category, price, original_price, image, images_json, video_url, description, specs_json, in_stock, stock_quantity, shopee_url, badge, rating, sales_count, created_at, updated_at) VALUES (` +
        `${sqlEscape(p.id)}, ` +
        `${sqlEscape(p.name)}, ` +
        `${sqlEscape(p.category)}, ` +
        `${p.price || 0}, ` +
        `${p.originalPrice !== undefined ? p.originalPrice : 'NULL'}, ` +
        `${sqlEscape(p.image)}, ` +
        `${sqlEscape(p.images || [])}, ` +
        `${sqlEscape(p.videoUrl || null)}, ` +
        `${sqlEscape(p.description || '')}, ` +
        `${sqlEscape(p.specs || [])}, ` +
        `${p.inStock ? 1 : 0}, ` +
        `${p.stockQuantity !== undefined ? p.stockQuantity : 'NULL'}, ` +
        `${sqlEscape(p.shopeeUrl || '')}, ` +
        `${sqlEscape(p.badge || null)}, ` +
        `${p.rating || 5.0}, ` +
        `${p.salesCount || 'NULL'}, ` +
        `${sqlEscape(p.createdAt || timestamp)}, ` +
        `${sqlEscape(p.updatedAt || timestamp)}` +
        `);`
      );
    });
    lines.push(``);
  }

  // 2. Categories
  lines.push(
    `-- 2. TABELA DE CATEGORIAS`,
    `CREATE TABLE IF NOT EXISTS categories (`,
    `  id VARCHAR(64) PRIMARY KEY,`,
    `  label TEXT NOT NULL,`,
    `  icon VARCHAR(16),`,
    `  sort_order INTEGER DEFAULT 99,`,
    `  is_default INTEGER DEFAULT 0,`,
    `  created_at TEXT,`,
    `  updated_at TEXT`,
    `);`,
    ``
  );

  bundle.collections.categories.forEach((c) => {
    lines.push(
      `INSERT OR REPLACE INTO categories (id, label, icon, sort_order, is_default, created_at, updated_at) VALUES (` +
      `${sqlEscape(c.id)}, ` +
      `${sqlEscape(c.label)}, ` +
      `${sqlEscape(c.icon || '🏷️')}, ` +
      `${c.order || 99}, ` +
      `${c.isDefault ? 1 : 0}, ` +
      `${sqlEscape(c.createdAt || timestamp)}, ` +
      `${sqlEscape(c.updatedAt || timestamp)}` +
      `);`
    );
  });
  lines.push(``);

  // 3. Coupons
  lines.push(
    `-- 3. TABELA DE CUPONS PROMOCIONAIS`,
    `CREATE TABLE IF NOT EXISTS coupons (`,
    `  id VARCHAR(128) PRIMARY KEY,`,
    `  code VARCHAR(64) NOT NULL UNIQUE,`,
    `  discount_percent INTEGER NOT NULL,`,
    `  description TEXT,`,
    `  active INTEGER DEFAULT 1,`,
    `  show_on_site INTEGER DEFAULT 1,`,
    `  applies_to_all INTEGER DEFAULT 1,`,
    `  applicable_product_ids_json TEXT,`,
    `  created_at TEXT,`,
    `  updated_at TEXT`,
    `);`,
    ``
  );

  bundle.collections.coupons.forEach((cp) => {
    lines.push(
      `INSERT OR REPLACE INTO coupons (id, code, discount_percent, description, active, show_on_site, applies_to_all, applicable_product_ids_json, created_at, updated_at) VALUES (` +
      `${sqlEscape(cp.id)}, ` +
      `${sqlEscape(cp.code)}, ` +
      `${cp.discountPercent || 0}, ` +
      `${sqlEscape(cp.description || '')}, ` +
      `${cp.active ? 1 : 0}, ` +
      `${cp.showOnSite ? 1 : 0}, ` +
      `${cp.appliesToAll ? 1 : 0}, ` +
      `${sqlEscape(cp.applicableProductIds || [])}, ` +
      `${sqlEscape(cp.createdAt || timestamp)}, ` +
      `${sqlEscape(cp.updatedAt || timestamp)}` +
      `);`
    );
  });
  lines.push(``);

  // 4. Community Posts
  lines.push(
    `-- 4. TABELA DE POSTS DA COMUNIDADE`,
    `CREATE TABLE IF NOT EXISTS posts (`,
    `  id VARCHAR(128) PRIMARY KEY,`,
    `  title TEXT NOT NULL,`,
    `  content TEXT NOT NULL,`,
    `  author TEXT,`,
    `  author_id VARCHAR(128),`,
    `  image_url TEXT,`,
    `  video_url TEXT,`,
    `  created_at TEXT`,
    `);`,
    ``
  );

  bundle.collections.posts.forEach((pst) => {
    lines.push(
      `INSERT OR REPLACE INTO posts (id, title, content, author, author_id, image_url, video_url, created_at) VALUES (` +
      `${sqlEscape(pst.id)}, ` +
      `${sqlEscape(pst.title)}, ` +
      `${sqlEscape(pst.content)}, ` +
      `${sqlEscape(pst.author || 'Mundo da Pipa')}, ` +
      `${sqlEscape(pst.authorId || '')}, ` +
      `${sqlEscape(pst.imageUrl || '')}, ` +
      `${sqlEscape(pst.videoUrl || '')}, ` +
      `${sqlEscape(pst.createdAt || timestamp)}` +
      `);`
    );
  });
  lines.push(``);

  // 5. Customer Reviews
  lines.push(
    `-- 5. TABELA DE AVALIAÇÕES SHOPEE`,
    `CREATE TABLE IF NOT EXISTS customer_reviews (`,
    `  id VARCHAR(128) PRIMARY KEY,`,
    `  author TEXT NOT NULL,`,
    `  variation TEXT,`,
    `  rating INTEGER DEFAULT 5,`,
    `  review_date TEXT,`,
    `  comment TEXT,`,
    `  badges_json TEXT,`,
    `  seller_reply TEXT`,
    `);`,
    ``
  );

  bundle.collections.reviews.forEach((r) => {
    lines.push(
      `INSERT OR REPLACE INTO customer_reviews (id, author, variation, rating, review_date, comment, badges_json, seller_reply) VALUES (` +
      `${sqlEscape(r.id)}, ` +
      `${sqlEscape(r.author)}, ` +
      `${sqlEscape(r.variation || '')}, ` +
      `${r.rating || 5}, ` +
      `${sqlEscape(r.date || timestamp)}, ` +
      `${sqlEscape(r.comment || '')}, ` +
      `${sqlEscape(r.badges || [])}, ` +
      `${sqlEscape(r.sellerReply || null)}` +
      `);`
    );
  });
  lines.push(``);

  // 6. Administrators
  lines.push(
    `-- 6. TABELA DE ADMINISTRADORES`,
    `CREATE TABLE IF NOT EXISTS admin_users (`,
    `  email VARCHAR(128) PRIMARY KEY,`,
    `  role VARCHAR(32) DEFAULT 'admin',`,
    `  created_at TEXT`,
    `);`,
    ``
  );

  const adminEmails = bundle.collections.site_content.admin_users?.emails || [];
  adminEmails.forEach((email) => {
    lines.push(
      `INSERT OR REPLACE INTO admin_users (email, role, created_at) VALUES (` +
      `${sqlEscape(email)}, 'admin', ${sqlEscape(timestamp)}` +
      `);`
    );
  });
  lines.push(``);

  // Commit
  lines.push(
    `COMMIT;`,
    ``,
    `-- Fim do script de exportação do banco Mundo da Pipa`
  );

  return lines.join('\n');
}

/**
 * Generates sample Firestore CLI commands and Query Editor snippets.
 */
export function generateFirestoreQueries(databaseId: string, projectId: string): {
  gcloudExport: string;
  firestoreConsoleQueries: { title: string; description: string; snippet: string }[];
  nodejsSnippet: string;
} {
  return {
    gcloudExport: `# Exportar todas as coleções do Firestore para um bucket do Google Cloud Storage:
gcloud firestore export gs://backup-mundodapipa-$(date +%Y%m%d) \\
  --project=${projectId} \\
  --database=${databaseId}`,
    firestoreConsoleQueries: [
      {
        title: 'Produtos com Estoque Ativo',
        description: 'Filtra os produtos disponíveis para venda imediata',
        snippet: `// Executar no Firestore Query Editor ou Node.js Admin SDK:
const snapshot = await db.collection('products')
  .where('inStock', '==', true)
  .orderBy('price', 'asc')
  .get();

console.log('Total produtos em estoque:', snapshot.size);`
      },
      {
        title: 'Cupons Promocionais Visíveis',
        description: 'Exibe os cupons ativos que aparecem nas faixas do site e carrinho',
        snippet: `const snapshot = await db.collection('coupons')
  .where('active', '==', true)
  .where('showOnSite', '==', true)
  .get();

snapshot.forEach(doc => console.log(doc.id, '=>', doc.data().code, doc.data().discountPercent + '% OFF'));`
      },
      {
        title: 'Posts Recentes da Comunidade',
        description: 'Busca as postagens e tutoriais mais recentes ordenados pela data',
        snippet: `const snapshot = await db.collection('posts')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

snapshot.forEach(doc => console.log(doc.data().title, '-', doc.data().createdAt));`
      },
      {
        title: 'Listar Administradores Autorizados',
        description: 'Lê o documento central de privilégios de administradores',
        snippet: `const docSnap = await db.doc('site_content/admin_users').get();
if (docSnap.exists) {
  console.log('Admins autorizados:', docSnap.data().emails);
}`
      }
    ],
    nodejsSnippet: `// Script Node.js completo para ler ou exportar qualquer coleção:
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

initializeApp();
const db = getFirestore('${databaseId}');

async function exportAll() {
  const collections = ['products', 'categories', 'coupons', 'posts', 'reviews'];
  const fullBackup = {};

  for (const colName of collections) {
    const snap = await db.collection(colName).get();
    fullBackup[colName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  fs.writeFileSync('firestore_export.json', JSON.stringify(fullBackup, null, 2));
  console.log('Backup concluído com sucesso!');
}

exportAll();`
  };
}
