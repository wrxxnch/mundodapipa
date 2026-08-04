import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Calculator, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Car, 
  Navigation, 
  Edit3, 
  Check, 
  RotateCcw,
  Building2,
  Compass
} from 'lucide-react';

export interface ShippingOption {
  id: 'pac' | 'sedex' | 'uber';
  name: string;
  carrier: 'Correios' | 'Uber Flash';
  badge?: string;
  price: number;
  time: string;
  description: string;
  icon: 'truck' | 'car' | 'fast';
}

interface ShippingCalculatorProps {
  onSelectOption?: (option: ShippingOption, cepInfo: { cep: string; address: string }) => void;
  selectedOptionId?: string;
  compact?: boolean;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  onSelectOption,
  selectedOptionId,
  compact = false
}) => {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Address details state
  const [addressInfo, setAddressInfo] = useState<{ 
    cep: string; 
    logradouro: string; 
    bairro: string; 
    cityState: string; 
    uf: string; 
    fullFormatted: string; 
  } | null>(null);

  // Number & complement input by user
  const [numberAndComp, setNumberAndComp] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(selectedOptionId || null);

  const formatCep = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length > 5) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(e.target.value));
    setError(null);
  };

  const applyShippingOptionsForState = (
    stateUf: string, 
    cepCode: string, 
    fullAddr: string
  ) => {
    const isLocalRegion = ['SP', 'MG', 'RJ', 'ES'].includes(stateUf);

    const computedOptions: ShippingOption[] = [
      {
        id: 'uber',
        name: 'Uber Flash / Entrega Direta',
        carrier: 'Uber Flash',
        badge: 'Entrega Mais Rápida',
        price: isLocalRegion ? 14.90 : 24.90,
        time: 'Em até 2 horas (mesmo dia)',
        description: 'Entrega por motorista ou entregador parceiro Uber',
        icon: 'car'
      },
      {
        id: 'sedex',
        name: 'Correios SEDEX',
        carrier: 'Correios',
        badge: 'Expresso',
        price: isLocalRegion ? 22.50 : 34.90,
        time: '1 a 3 dias úteis',
        description: 'Entrega expressa com rastreamento oficial Correios',
        icon: 'fast'
      },
      {
        id: 'pac',
        name: 'Correios PAC',
        carrier: 'Correios',
        badge: 'Econômico',
        price: isLocalRegion ? 14.50 : 21.00,
        time: '4 a 8 dias úteis',
        description: 'Envio padrão econômico para todo o Brasil',
        icon: 'truck'
      }
    ];

    setOptions(computedOptions);
    const initialOpt = computedOptions[0];
    setSelectedId(initialOpt.id);
    if (onSelectOption) {
      onSelectOption(initialOpt, {
        cep: cepCode,
        address: fullAddr
      });
    }
  };

  const fetchCepDetails = async (cleanCep: string) => {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await res.json();

    if (data.erro) {
      throw new Error('CEP não encontrado no cadastro oficial.');
    }

    const logradouro = data.logradouro || '';
    const bairro = data.bairro || '';
    const cityState = `${data.localidade} - ${data.uf}`;
    const formattedAddr = `${logradouro ? logradouro + ', ' : ''}${bairro ? bairro + ' - ' : ''}${cityState}`;

    const info = {
      cep: data.cep || cleanCep,
      logradouro,
      bairro,
      cityState,
      uf: data.uf,
      fullFormatted: formattedAddr
    };

    setAddressInfo(info);
    setCep(info.cep);
    applyShippingOptionsForState(data.uf, info.cep, formattedAddr);
  };

  const calculateShippingByCep = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      setError('Por favor, informe um CEP válido com 8 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetchCepDetails(cleanCep);
      setIsEditingAddress(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar CEP. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Get user geolocation and reverse geocode
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador.');
      return;
    }

    setGeoLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Query OpenStreetMap Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();

          if (!data || !data.address) {
            throw new Error('Não foi possível identificar seu endereço pela localização.');
          }

          const addr = data.address;
          let rawPostcode = addr.postcode || '';
          let cleanPostcode = rawPostcode.replace(/\D/g, '');

          // If OSM returns a postcode, verify with ViaCEP
          if (cleanPostcode.length >= 8) {
            cleanPostcode = cleanPostcode.slice(0, 8);
            try {
              await fetchCepDetails(cleanPostcode);
              setGeoLoading(false);
              return;
            } catch {
              // Fallback to OSM details if ViaCEP misses specific sub-postcode
            }
          }

          // Fallback parsing from Nominatim directly
          const logradouro = addr.road || addr.pedestrian || addr.street || '';
          const bairro = addr.suburb || addr.neighbourhood || addr.quarter || '';
          const city = addr.city || addr.town || addr.village || addr.municipality || 'Sua Cidade';
          const stateCode = (addr['ISO3166-2-lvl4'] || '').replace('BR-', '') || 'SP';
          const cityState = `${city} - ${stateCode}`;
          const formattedCep = cleanPostcode.length === 8 
            ? `${cleanPostcode.slice(0,5)}-${cleanPostcode.slice(5)}`
            : '00000-000';

          const fullAddr = `${logradouro ? logradouro + ', ' : ''}${bairro ? bairro + ' - ' : ''}${cityState}`;

          const info = {
            cep: formattedCep,
            logradouro,
            bairro,
            cityState,
            uf: stateCode,
            fullFormatted: fullAddr
          };

          setAddressInfo(info);
          setCep(formattedCep);
          applyShippingOptionsForState(stateCode, formattedCep, fullAddr);

        } catch (err: any) {
          setError('Não foi possível localizar o CEP automaticamente. Digite o CEP manualmente.');
        } finally {
          setGeoLoading(false);
        }
      },
      (geoErr) => {
        setGeoLoading(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError('Permissão de localização negada. Por favor, digite o CEP manualmente.');
        } else {
          setError('Não foi possível obter sua localização. Tente digitar o CEP.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleUpdateFullAddress = () => {
    if (!addressInfo) return;

    let updatedFull = addressInfo.fullFormatted;
    if (numberAndComp.trim()) {
      updatedFull = `${addressInfo.logradouro ? addressInfo.logradouro + ', ' : ''}Nº ${numberAndComp.trim()} ${addressInfo.bairro ? '- ' + addressInfo.bairro + ' - ' : ''}${addressInfo.cityState}`;
    }

    if (selectedId) {
      const currentOpt = options.find((o) => o.id === selectedId);
      if (currentOpt && onSelectOption) {
        onSelectOption(currentOpt, {
          cep: addressInfo.cep,
          address: updatedFull
        });
      }
    }
  };

  const handleSelectOption = (opt: ShippingOption) => {
    setSelectedId(opt.id);
    if (onSelectOption && addressInfo) {
      let finalAddr = addressInfo.fullFormatted;
      if (numberAndComp.trim()) {
        finalAddr = `${addressInfo.logradouro ? addressInfo.logradouro + ', ' : ''}Nº ${numberAndComp.trim()} ${addressInfo.bairro ? '- ' + addressInfo.bairro + ' - ' : ''}${addressInfo.cityState}`;
      }
      onSelectOption(opt, {
        cep: addressInfo.cep,
        address: finalAddr
      });
    }
  };

  const resetAddressSearch = () => {
    setAddressInfo(null);
    setOptions([]);
    setCep('');
    setNumberAndComp('');
    setError(null);
    setIsEditingAddress(false);
  };

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-2xl p-4 ${compact ? 'text-xs' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 font-black text-slate-900 uppercase text-xs tracking-wider">
          <Truck className="w-4 h-4 text-orange-600" />
          <span>Calcular Frete (Correios & Uber)</span>
        </div>
        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-extrabold">
          Correios / Uber
        </span>
      </div>

      {/* Primary CEP Input Form or Location finder */}
      {!addressInfo || isEditingAddress ? (
        <div className="space-y-2">
          <form onSubmit={calculateShippingByCep} className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cep}
                onChange={handleInputChange}
                placeholder="00000-000"
                maxLength={9}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || geoLoading || cep.replace(/\D/g, '').length !== 8}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin text-xs">🌀</span>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span>Calcular</span>
                </>
              )}
            </button>
          </form>

          {/* Location button: "Não sei meu frete / Buscar por localização" */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={geoLoading || loading}
              className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 hover:underline transition-all bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200/60"
            >
              {geoLoading ? (
                <>
                  <Compass className="w-3.5 h-3.5 animate-spin text-orange-600" />
                  <span>Buscando sua Localização GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-orange-600" />
                  <span>Não sei meu CEP? Usar minha localização atual GPS</span>
                </>
              )}
            </button>

            {isEditingAddress && (
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-bold"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : null}

      {error && (
        <div className="mt-2 text-[11px] text-red-600 font-bold flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Address Confirmation & Customization */}
      {addressInfo && !isEditingAddress && (
        <div className="mt-3 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 leading-tight">
                    {addressInfo.cityState}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-snug">
                    {addressInfo.logradouro ? `${addressInfo.logradouro}` : 'Endereço identificado'} 
                    {addressInfo.bairro ? ` - ${addressInfo.bairro}` : ''}
                  </p>
                  <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    CEP: {addressInfo.cep}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 shrink-0 transition-colors"
                title="Alterar CEP ou endereço"
              >
                <Edit3 className="w-3 h-3 text-slate-500" />
                <span>Alterar</span>
              </button>
            </div>

            {/* Confirm house number / complement */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Número da Casa / Apto / Complemento (Para Entrega):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={numberAndComp}
                  onChange={(e) => setNumberAndComp(e.target.value)}
                  onBlur={handleUpdateFullAddress}
                  placeholder="Ex: Nº 120, Bloco B / Apto 402"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                A confirmação do número garante a entrega exata via Uber Flash ou Correios.
              </p>
            </div>
          </div>

          {/* Delivery Services Options */}
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
              Opções de Entrega Disponíveis:
            </p>

            {options.map((opt) => {
              const isSelected = selectedId === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-orange-50/90 border-orange-500 shadow-sm ring-1 ring-orange-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl mt-0.5 ${opt.id === 'uber' ? 'bg-slate-900 text-amber-400' : 'bg-blue-50 text-blue-600'}`}>
                      {opt.id === 'uber' ? <Car className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{opt.name}</span>
                        {opt.badge && (
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                            opt.id === 'uber' ? 'bg-black text-amber-400' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{opt.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs text-slate-900">
                      R$ {opt.price.toFixed(2).replace('.', ',')}
                    </span>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-[10px] text-orange-600 font-extrabold justify-end mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Selecionado
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
