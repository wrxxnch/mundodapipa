import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ExternalLink, 
  MessageCircle, 
  Truck, 
  ArrowRight, 
  Cloud, 
  Tag, 
  Check, 
  AlertCircle, 
  Percent 
} from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { SHOPEE_STORE_URL, WHATSAPP_NUMBER } from '../data/products';
import { ShippingCalculator, ShippingOption } from './ShippingCalculator';
import { UserProfile, subscribeToCoupons } from '../lib/firebase';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  user?: UserProfile | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  user
}) => {
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingAddress, setShippingAddress] = useState<{ cep: string; address: string } | null>(null);

  // Coupons state
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [inputCouponCode, setInputCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Real-time coupons synchronization
  useEffect(() => {
    const unsub = subscribeToCoupons((coupons) => {
      setAvailableCoupons(coupons);
      // Re-verify currently applied coupon if list updates
      if (appliedCoupon) {
        const matching = coupons.find(
          (c) => c.code.toUpperCase() === appliedCoupon.code.toUpperCase() && c.active
        );
        if (matching) {
          setAppliedCoupon(matching);
        } else {
          setAppliedCoupon(null);
          setCouponError('O cupom aplicado não está mais ativo.');
        }
      }
    });
    return () => unsub();
  }, [appliedCoupon]);

  if (!isOpen) return null;

  // Subtotal of all products in cart
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Calculate discount for eligible items
  let eligibleSubtotal = 0;
  let discountAmount = 0;
  const eligibleItemIds = new Set<string>();

  if (appliedCoupon && appliedCoupon.active) {
    items.forEach((item) => {
      const isEligible = appliedCoupon.appliesToAll || 
        (appliedCoupon.applicableProductIds && appliedCoupon.applicableProductIds.includes(item.product.id));

      if (isEligible) {
        eligibleItemIds.add(item.product.id);
        const itemTotal = item.product.price * item.quantity;
        eligibleSubtotal += itemTotal;
        discountAmount += itemTotal * (appliedCoupon.discountPercent / 100);
      }
    });
  }

  // Ensure discount does not exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = inputCouponCode.trim().toUpperCase();

    if (!cleanCode) {
      setCouponError('Digite um código de cupom.');
      setCouponSuccess(null);
      return;
    }

    const foundCoupon = availableCoupons.find(
      (c) => c.code.toUpperCase() === cleanCode && c.active
    );

    if (!foundCoupon) {
      setCouponError(`Cupom "${cleanCode}" inválido, inexistente ou desativado.`);
      setCouponSuccess(null);
      return;
    }

    // Check if any cart item qualifies
    const hasEligibleItems = foundCoupon.appliesToAll || 
      items.some((item) => foundCoupon.applicableProductIds?.includes(item.product.id));

    if (!hasEligibleItems) {
      setAppliedCoupon(foundCoupon);
      setCouponError(`Cupom "${foundCoupon.code}" válido, mas nenhum produto no seu carrinho participa desta promoção.`);
      setCouponSuccess(null);
      return;
    }

    setAppliedCoupon(foundCoupon);
    setCouponError(null);
    setCouponSuccess(`Cupom "${foundCoupon.code}" aplicado! Desconto de ${foundCoupon.discountPercent}% concedido.`);
    setInputCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponSuccess(null);
    setInputCouponCode('');
  };

  const handleSelectShipping = (option: ShippingOption, info: { cep: string; address: string }) => {
    setSelectedShipping(option);
    setShippingAddress(info);
  };

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;

    let message = `*MUNDO DA PIPA - NOVO PEDIDO DO SITE*\n`;
    message += `-----------------------------------\n`;
    items.forEach((item, index) => {
      const isEligible = appliedCoupon && eligibleItemIds.has(item.product.id);
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   Qtd: ${item.quantity} x R$ ${item.product.price.toFixed(2).replace('.', ',')} = R$ ${(item.product.price * item.quantity).toFixed(2).replace('.', ',')}`;
      if (isEligible) {
        message += ` (com ${appliedCoupon?.discountPercent}% OFF)`;
      }
      message += `\n`;
    });
    message += `-----------------------------------\n`;
    message += `*Subtotal:* R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;

    if (appliedCoupon && discountAmount > 0) {
      message += `*Cupom Promocional:* ${appliedCoupon.code} (${appliedCoupon.discountPercent}% OFF)\n`;
      message += `*Desconto Concedido:* - R$ ${discountAmount.toFixed(2).replace('.', ',')}\n`;
    }

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
    message += `Gostaria de finalizar meu pedido e combinar o pagamento e entrega!`;

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
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-black text-lg">Seu Carrinho</h2>
                  {user && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      Carrinho Salvo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {items.length} {items.length === 1 ? 'item selecionado' : 'itens selecionados'}
                  {user && ` • Conectado como ${user.name}`}
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
              items.map((item) => {
                const isDiscounted = appliedCoupon && eligibleItemIds.has(item.product.id);
                const itemBasePrice = item.product.price;
                const itemFinalPrice = isDiscounted 
                  ? itemBasePrice * (1 - appliedCoupon.discountPercent / 100) 
                  : itemBasePrice;

                return (
                  <div
                    key={item.product.id}
                    className={`flex gap-3 p-3 rounded-2xl border transition-all items-center ${
                      isDiscounted 
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        {isDiscounted && (
                          <span className="shrink-0 text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded">
                            {appliedCoupon?.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-baseline gap-1.5 font-serif">
                        {isDiscounted ? (
                          <>
                            <span className="text-xs font-black text-emerald-700 font-serif">
                              R$ {itemFinalPrice.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              R$ {itemBasePrice.toFixed(2).replace('.', ',')}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-black text-slate-900 font-serif">
                            R$ {itemBasePrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

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
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-4 max-h-[62vh] overflow-y-auto">
              
              {/* Promotional Coupon Input Box */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-orange-600" />
                    <span>Cupom Promocional</span>
                  </span>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-red-600 hover:underline font-bold"
                    >
                      Remover cupom
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Digite o código do cupom"
                        value={inputCouponCode}
                        onChange={(e) => {
                          setInputCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                          setCouponError(null);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-sm uppercase tracking-wide transition-colors shrink-0"
                    >
                      Aplicar
                    </button>
                  </form>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs font-mono">
                        %
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-emerald-950">
                            {appliedCoupon.code}
                          </span>
                          <span className="bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded">
                            {appliedCoupon.discountPercent}% OFF
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700">
                          {appliedCoupon.appliesToAll 
                            ? 'Válido para todo o catálogo' 
                            : `Válido para ${eligibleItemIds.size} ${eligibleItemIds.size === 1 ? 'item elegível' : 'itens elegíveis'}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg"
                      title="Remover cupom"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Feedback Messages */}
                {couponSuccess && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{couponSuccess}</span>
                  </p>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* Shipping Calculator */}
              <ShippingCalculator onSelectOption={handleSelectShipping} compact />

              {/* Summary */}
              <div className="space-y-1.5 text-sm bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal dos Produtos:</span>
                  <span className="font-bold text-slate-900">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 text-xs font-bold animate-fadeIn">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span>Desconto ({appliedCoupon.code} - {appliedCoupon.discountPercent}%):</span>
                    </span>
                    <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

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
                  <span>Pedir via WhatsApp (com Desconto & Frete)</span>
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
