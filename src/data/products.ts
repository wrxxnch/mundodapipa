import { Product } from '../types';

import pipaRaiaImg from '../assets/images/pipa_raia_product_1785771023453.jpg';
import linhaCorrenteImg from '../assets/images/linha_corrente_product_1785771036343.jpg';

export const SHOPEE_STORE_URL = 'https://shopee.com.br/mundo_da_pipa';
export const WHATSAPP_NUMBER = '5531999998888';

export const PRODUCTS: Product[] = [
  {
    id: 'raia-40x40',
    name: 'Pipa Raia 40x40 cm (Pacote c/ 10 un)',
    category: 'pipas',
    price: 12.50,
    originalPrice: 15.00,
    image: pipaRaiaImg,
    description: 'Raia tradicional de bambu com papel de seda colorido de alta gramatura. Ótimo equilíbrio e rápida no ar.',
    specs: ['Tamanho: 40x40 cm', 'Vareta central: Bambu selecionado', 'Vareta cruzado: Bambu 1.8mm', 'Pacote com 10 unidades com estampas sortidas'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Mais Vendido',
    rating: 4.9,
    salesCount: 1420
  },
  {
    id: 'linha-10-corrente',
    name: 'Linha 10 Corrente 100% Algodão (500 Jardas)',
    category: 'linhas',
    price: 15.00,
    originalPrice: 18.00,
    image: linhaCorrenteImg,
    description: 'Linha 10 clássica 100% algodão de alta resistência. Acabamento suave e ideal para todas as idades.',
    specs: ['Metragem: 500 jardas (~457m)', 'Composição: 100% Algodão', 'Marca: Corrente / Mundo da Pipa', 'Resistente a nós e atrito'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Original',
    rating: 5.0,
    salesCount: 3100
  },
  {
    id: 'pipa-combate-60',
    name: 'Pipa Combate Liso & Estampado 60cm (Pacote c/ 10 un)',
    category: 'pipas',
    price: 24.90,
    originalPrice: 29.90,
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    description: 'Pipa de combate formato clássico 60cm. Estrutura em bambu e fibra de vidro para respostas ultra rápidas.',
    specs: ['Tamanho: 60 cm', 'Estrutura: Bambu 50cm + Fibra 2.0mm', 'Corte e corte-estampado artesanal', 'Ótimo manuseio em ventos médios e fortes'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Profissional',
    rating: 4.8,
    salesCount: 890
  },
  {
    id: 'carretilha-madeira-25',
    name: 'Carretilha de Madeira Artesanal 25cm c/ Rolamento',
    category: 'varetas',
    price: 38.00,
    originalPrice: 45.00,
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
    description: 'Carretilha reforçada de madeira maciça envernizada com duplo rolamento para recolhimento suave e rápido.',
    specs: ['Diâmetro: 25 cm', 'Maciça com acabamento em verniz náutico', 'Duplo rolamento blindado', 'Capacidade para até 3000 jardas'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Artesanal',
    rating: 4.9,
    salesCount: 650
  },
  {
    id: 'kit-iniciante',
    name: 'Kit Completo Iniciante (10 Raias + Linha + Rabiola)',
    category: 'kits',
    price: 45.00,
    originalPrice: 55.00,
    image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=600&q=80',
    description: 'O kit ideal para diversão em família! Acompanha 10 raias prontas, tubo de linha 100% algodão e rabiola de fita.',
    specs: ['10 Raias 40x40cm estampadas', '1 Tubo de Linha 10 (200 metros)', '50 metros de rabiola de fita pronta', 'Ideal para iniciantes e crianças'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Super Kit',
    rating: 5.0,
    salesCount: 2150
  },
  {
    id: 'rabiola-fita-100m',
    name: 'Rabiola de Fita de Plástico Leve (Rolo 100 Metros)',
    category: 'rabiolas',
    price: 8.50,
    originalPrice: 10.00,
    image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&q=80',
    description: 'Rabiola pronta em fita de plástico leve pré-espaçada. Estabilidade perfeita para pipas e raias de todos os tamanhos.',
    specs: ['Comprimento: 100 metros', 'Fita de polietileno de alta flutuação', 'Linha de sustentação reforçada', 'Pronta para uso'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Prático',
    rating: 4.7,
    salesCount: 1800
  },
  {
    id: 'varetas-bambu-50',
    name: 'Varetas de Bambu Selecionado 50cm (Pacote c/ 50 un)',
    category: 'varetas',
    price: 18.00,
    originalPrice: 22.00,
    image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
    description: 'Varetas de bambu tratado e lixado para fabricação própria de pipas. Curvatura uniforme e flexibilidade ideal.',
    specs: ['Tamanho: 50 cm', 'Espessura: 2.0mm a 2.2mm', 'Tratadas contra umidade', 'Pacote com 50 unidades'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Material Premium',
    rating: 4.9,
    salesCount: 520
  },
  {
    id: 'kit-festival-master',
    name: 'Kit Festival Mestre das Pipas (50 Pipas + Linha 1000y + Rabiola)',
    category: 'kits',
    price: 89.90,
    originalPrice: 110.00,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    description: 'Kit profissional para festivais e fins de semana inteiros de diversão. Maior economia e variedade de modelos!',
    specs: ['30 Raias 40x40cm + 20 Pipas 60cm', '1 Carretilha com 1000 jardas de Linha 10', '200 metros de rabiola pronta', 'Frete grátis via Shopee'],
    inStock: true,
    shopeeUrl: SHOPEE_STORE_URL,
    badge: 'Oferta Especial',
    rating: 5.0,
    salesCount: 940
  }
];
