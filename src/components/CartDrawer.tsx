import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ExternalLink, MessageCircle, Truck, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { SHOPEE_STORE_URL, WHATSAPP_NUMBER } from '../data/products';
import { ShippingCalculator, ShippingOption } from './ShippingCalculator';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingAddress, setShippingAddress] = useState<{ cep: string; address: string } | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const grandTotal = subtotal + shippingCost;

  const handleSelectShipping = (option: ShippingOption, info: { cep: string; address: string }) => {
    setSelectedShipping(option);
    setShippingAddress(info);
  };

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    let message = `*MUNDO DA PIPA - NOVO PEDIDO DO SITE*\n`;
    message += `-----------------------------------\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   Qtd: ${item.quantity} x R$ ${item.product.price.toFixed(2).replace('.', ',')} = R$ ${(item.product.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
    });
    message += `-----------------------------------\n`;
    message += `*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;

    if (selectedShipping && shippingAddress) {
      message += `*Opção de Envio:* ${selectedShipping.name} (${selectedShipping.carrier})\n`;
      message += `*Valor Frete:* R$ ${selectedShipping.price.toFixed(2).replace('.', ',')}\n`;
      message += `*Prazo Estimado:* ${selectedShipping.time}\n`;
      message += `*Endereço de Entrega:* CEP ${shippingAddress.cep} - ${shippingAddress.address}\n`;
    } else {
      message += `*Frete:* A calcular para meu CEP\n`;
    }

    message += `-----------------------------------\n`;
    message += `*TOTAL DO PEDIDO:* R$ ${grandTotal.toFixed(2).replace('.', ',')}\n\n`;
    message += `Gostaria de finalizar meu pedido e combinar a entrega!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Cart Header */}
          <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
              <div>
                <h2 className="font-serif font-black text-lg">Seu Carrinho</h2>
                <p className="text-xs text-slate-400">
                  {items.length} {items.length === 1 ? 'item selecionado' : 'itens selecionados'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Seu carrinho está vazio</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                  Adicione raias, linhas 10, carretilhas ou rabiolas para finalizar seu pedido!
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 bg-slate-900 text-amber-400 hover:bg-slate-800 font-bold text-xs px-6 py-3 rounded-xl shadow transition-all"
                >
                  Explorar Produtos
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 items-center"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-xs font-black text-slate-900 mt-1 font-serif">
                      R$ {item.product.price.toFixed(2).replace('.', ',')}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white p-0.5 text-xs font-bold">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 text-slate-700 rounded"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 text-slate-700 rounded"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Shipping Calculator */}
              <ShippingCalculator onSelectOption={handleSelectShipping} compact />

              <div className="space-y-1.5 text-sm bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal dos Produtos:</span>
                  <span className="font-bold text-slate-900">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Frete ({selectedShipping ? selectedShipping.carrier : 'Não informado'}):</span>
                  {selectedShipping ? (
                    <span className="font-extrabold text-slate-900">
                      R$ {selectedShipping.price.toFixed(2).replace('.', ',')}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold">Informe seu CEP acima</span>
                  )}
                </div>

                <div className="flex justify-between font-black text-slate-900 text-lg pt-2 border-t border-slate-100 font-serif">
                  <span>Total Final:</span>
                  <span className="text-orange-600">
                    R$ {grandTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Checkout buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pedir via WhatsApp (com Frete)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={SHOPEE_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <span>Comprar na Loja Shopee</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400">
                <button
                  onClick={onClearCart}
                  className="hover:text-slate-600 underline"
                >
                  Esvaziar carrinho
                </button>
                <span className="flex items-center gap-1 text-slate-500">
                  <Truck className="w-3 h-3 text-emerald-600" /> Compra rápida e garantida
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
