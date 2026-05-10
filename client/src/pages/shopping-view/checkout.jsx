import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MapPin, User, Phone, ShoppingCart, Truck, CreditCard } from 'lucide-react';
import { createNewOrder } from '@/store/shop/order-slice';
import { fetchAllAddresses } from '@/store/shop/address-slice';
import img from '../../assets/account.jpg';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatPrice } from '@/utils/currencyFormatters';
import useToast from '@/hooks/useToast';
import { useTranslation } from 'react-i18next';

function ShoppingCheckout() {
  const { t } = useTranslation();
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const { isLoading, orderDetails } = useSelector((state) => state.shopOrder);
  const { addressList, isLoading: addressLoading } = useSelector((state) => state.shopAddress);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaOptions, setAreaOptions] = useState([]);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [storeSettings, setStoreSettings] = useState({ storeServiceFee: 0, originAreaId: '' });

  const [newAddressData, setNewAddressData] = useState({
    address: '',
    area: '', 
    pincode: '',
    phone: '',
    notes: '',
  });

  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    address: '',
    area: '', 
    pincode: '',
    phone: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});

  // Shipping cost states
  const [selectedCourier, setSelectedCourier] = useState('jne');
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null); 
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Payment states
  const [paymentCategory, setPaymentCategory] = useState('');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAllAddresses(user.id));
    }
    fetchStoreSettings();
  }, [dispatch, user]);

  useEffect(() => {
    if (addressList && addressList.length > 0 && !selectedAddressId) {
      const defaultAddress = addressList.find((addr) => addr.isDefault) || addressList[0];
      setSelectedAddressId(defaultAddress._id);
      setUseNewAddress(false);
    }
  }, [addressList, selectedAddressId]);

  const fetchStoreSettings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URI}/admin/settings`);
      const result = await res.json();
      if (result.success && result.data) {
        setStoreSettings({ storeServiceFee: parseInt(result.data.storeServiceFee) || 0, originAreaId: result.data.originAreaId });
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleAreaSearch = async (e) => {
    const query = e.target.value;
    setAreaSearchQuery(query);
    
    if (query.length < 3) {
      setAreaOptions([]);
      setShowAreaDropdown(false);
      return;
    }
    
    setIsSearchingArea(true);
    setShowAreaDropdown(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URI}/shop/shipping/areas?input=${query}`);
      const data = await res.json();
      if (data.success) {
        setAreaOptions(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingArea(false);
    }
  };

  const handleSelectArea = (area, isGuest) => {
    const areaValue = `${area.id}||${area.name}`;
    if (isGuest) {
      setGuestInfo(prev => ({ ...prev, area: areaValue }));
    } else {
      setNewAddressData(prev => ({ ...prev, area: areaValue }));
    }
    setAreaSearchQuery(area.name);
    setShowAreaDropdown(false);
  };

  const handleGuestInfoChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddressData((prev) => ({ ...prev, [name]: value }));
  };

  // Automatically recalculate shipping when destination changes
  useEffect(() => {
    let destId = null;
    if (!user) {
      destId = guestInfo.area?.split('||')[0];
    } else {
      if (useNewAddress) {
        destId = newAddressData.area?.split('||')[0];
      } else if (selectedAddressId) {
        const addr = addressList.find(a => a._id === selectedAddressId);
        if (addr) {
          destId = addr.city?.split('||')[0];
        }
      }
    }

    if (destId && cartItems?.items?.length > 0 && storeSettings.originAreaId) {
      const totalWeight = cartItems.items.reduce((acc, item) => {
        return acc + (item.shipping?.weight || 1000) * item.quantity;
      }, 0);

      fetchShippingCost(destId, totalWeight, selectedCourier);
    } else {
      setShippingOptions([]);
      setSelectedShipping(null);
    }
  }, [guestInfo.area, newAddressData.area, selectedAddressId, useNewAddress, selectedCourier, user, cartItems, addressList, storeSettings.originAreaId]);

  const fetchShippingCost = async (destinationId, weight, courier) => {
    setIsCalculatingShipping(true);
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URI}/shop/shipping/cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destinationId, weight, courier })
      });
      const data = await res.json();
      if (data.success && data.data?.costs) {
        setShippingOptions(data.data.costs);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validateGuestInfo = () => {
    const newErrors = {};
    const { name, email, address, area, pincode, phone } = guestInfo;

    if (!name) newErrors.name = 'Nama lengkap wajib diisi.';
    if (!email) newErrors.email = 'Email wajib diisi.';
    if (!address) newErrors.address = 'Alamat lengkap wajib diisi.';
    if (!area) newErrors.area = 'Area tujuan wajib dipilih.';
    if (!pincode) newErrors.pincode = 'Kode pos wajib diisi.';
    if (!phone) newErrors.phone = 'Nomor telepon wajib diisi.';

    if (email && !validateEmail(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUserAddress = () => {
    if (useNewAddress) {
      const { address, area, pincode, phone } = newAddressData;
      return address && area && pincode && phone;
    }
    return selectedAddressId;
  };

  // Fees Calculations
  const totalCartAmount = cartItems?.cartTotal || 0;
  const shippingCostValue = selectedShipping?.cost?.[0]?.value || 0;
  const storeServiceFeeValue = storeSettings.storeServiceFee || 0;
  
  const baseTotal = totalCartAmount + shippingCostValue + storeServiceFeeValue;
  
  let midtransFeeValue = 0;
  if (paymentCategory === "bank_transfer") {
    midtransFeeValue = 4000;
  } else if (paymentCategory === "minimarket") {
    midtransFeeValue = 5000;
  } else if (paymentCategory === "qris") {
    midtransFeeValue = Math.round(baseTotal * 0.007);
  } else if (paymentCategory === "ewallet") {
    midtransFeeValue = Math.round(baseTotal * 0.02);
  } else if (paymentCategory === "credit_card") {
    midtransFeeValue = Math.round(baseTotal * 0.029) + 2000;
  }
  
  const grandTotal = baseTotal + midtransFeeValue;

  const handleCheckout = () => {
    if (!cartItems?._id) {
      toast.toastError('Gagal', 'Keranjang tidak ditemukan.');
      return;
    }

    if (!user) {
      if (!validateGuestInfo()) {
        toast.toastError('Data Belum Lengkap', 'Harap isi semua field alamat.');
        return;
      }
    } else {
      if (!validateUserAddress()) {
        toast.toastError('Data Belum Lengkap', 'Pilih alamat pengiriman atau isi alamat baru.');
        return;
      }
    }

    if (!selectedShipping) {
      toast.toastError('Layanan Pengiriman', 'Harap pilih layanan kurir terlebih dahulu.');
      return;
    }
    
    if (!paymentCategory) {
      toast.toastError('Metode Pembayaran', 'Harap pilih jenis metode pembayaran.');
      return;
    }

    let addressInfo = {};
    let customerName = '';
    let email = '';

    if (!user) {
      addressInfo = {
        address: guestInfo.address,
        city: guestInfo.area,
        pincode: guestInfo.pincode,
        phone: guestInfo.phone,
        notes: guestInfo.notes,
      };
      customerName = guestInfo.name;
      email = guestInfo.email;
    } else {
      if (useNewAddress) {
        addressInfo = {
          address: newAddressData.address,
          city: newAddressData.area,
          pincode: newAddressData.pincode,
          phone: newAddressData.phone,
          notes: newAddressData.notes,
        };
      } else {
        const selectedAddress = addressList.find((addr) => addr._id === selectedAddressId);
        addressInfo = {
          address: selectedAddress.address,
          city: selectedAddress.city,
          pincode: selectedAddress.pincode,
          phone: selectedAddress.phone,
          notes: selectedAddress.notes || '',
        };
      }
      customerName = user.userName;
      email = user.email;
    }

    const orderData = {
      userId: user?.id || localStorage.getItem('sessionId') || `guest-${Date.now()}`,
      cartId: cartItems._id,
      cartItems: cartItems.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        image: item.image,
        price: item.variant.salePrice > 0 ? item.variant.salePrice : item.variant.price,
        quantity: item.quantity,
        variantName: item.variant.name,
      })),
      addressInfo,
      totalAmount: grandTotal, 
      shippingCost: shippingCostValue,
      paymentCategory: paymentCategory,
      customerName,
      email,
    };

    dispatch(createNewOrder(orderData)).then((res) => {
      if (res.payload?.token) {
        toast.toastSuccess('Sukses', 'Pesanan berhasil dibuat.');
        window.location.href = `/shop/payment-pending/${res.payload.orderId}`;
      } else {
        toast.toastError('Gagal', res.payload || 'Terjadi kesalahan saat membuat pesanan.');
      }
    });
  };

  if (orderDetails?.paymentStatus === 'paid') {
    return <Navigate to="/shop/payment-success" replace />;
  }

  if (!cartItems?.items?.length) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('checkout.no_product')}</h2>
        <Button onClick={() => navigate('/shop/listing')}>{t('product.see_all')}</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="relative h-[200px] md:h-[300px] w-full overflow-hidden rounded-lg mb-8">
        <img src={img} className="h-full w-full object-cover object-center" alt="Checkout banner" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-5xl font-bold">{t('checkout.title')}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* L Kolom Kiri: Alamat, Kurir & Pembayaran */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold">{t('checkout.shipping_address')}</h2>
          </div>

          {!user ? (
            // Guest Form
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold">{t('auth.name')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t('auth.name')} *</Label>
                    <Input id="name" name="name" value={guestInfo.name} onChange={handleGuestInfoChange} required className={errors.name ? 'border-red-500' : ''} />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('auth.email')} *</Label>
                    <Input id="email" name="email" type="email" value={guestInfo.email} onChange={handleGuestInfoChange} required className={errors.email ? 'border-red-500' : ''} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">{t('checkout.shipping_address')} *</Label>
                  <Textarea id="address" name="address" value={guestInfo.address} onChange={handleGuestInfoChange} required className={errors.address ? 'border-red-500' : ''} />
                </div>

                <div className="relative">
                  <Label>Kecamatan / Kelurahan / Kode Pos *</Label>
                  <Input 
                    placeholder="Ketik minimal 3 huruf..." 
                    value={areaSearchQuery} 
                    onChange={handleAreaSearch}
                    onFocus={() => { if(areaOptions.length > 0) setShowAreaDropdown(true); }}
                    className={errors.area ? 'border-red-500' : ''}
                  />
                  {showAreaDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {isSearchingArea ? (
                        <div className="p-3 text-sm text-gray-500">Mencari...</div>
                      ) : areaOptions.length > 0 ? (
                        areaOptions.map(area => (
                          <div 
                            key={area.id} 
                            className="p-3 text-sm cursor-pointer hover:bg-orange-50 border-b last:border-0"
                            onClick={() => handleSelectArea(area, true)}
                          >
                            {area.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-gray-500">Tidak ditemukan</div>
                      )}
                    </div>
                  )}
                  {guestInfo.area && !showAreaDropdown && (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Area terpilih: {guestInfo.area.split('||')[1]}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t('auth.phone')} *</Label>
                    <Input id="phone" name="phone" value={guestInfo.phone} onChange={handleGuestInfoChange} required className={errors.phone ? 'border-red-500' : ''} />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Kode Pos *</Label>
                    <Input id="pincode" name="pincode" value={guestInfo.pincode} onChange={handleGuestInfoChange} required className={errors.pincode ? 'border-red-500' : ''} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea id="notes" name="notes" value={guestInfo.notes} onChange={handleGuestInfoChange} />
                </div>
              </CardContent>
            </Card>
          ) : (
            // Logged in user - Address selection
            <div className="space-y-4">
              {addressLoading ? (
                <div>Loading addresses...</div>
              ) : (
                <>
                  {addressList && addressList.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Pilih Alamat Tersimpan</h3>
                        <RadioGroup
                          value={useNewAddress ? 'new' : selectedAddressId}
                          onValueChange={(value) => {
                            if (value === 'new') {
                              setUseNewAddress(true);
                              setSelectedAddressId('');
                            } else {
                              setUseNewAddress(false);
                              setSelectedAddressId(value);
                            }
                          }}
                          className="space-y-3"
                        >
                          {addressList.map((address) => {
                            const parsed = address.city?.split('||') || [""];
                            const cityLabel = parsed[0]?.split('::')[1] || address.city;
                            const provLabel = parsed[1]?.split('::')[1] || "";
                            const displayCity = `${cityLabel}${provLabel ? `, ${provLabel}` : ''}`;

                            return (
                              <div key={address._id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <RadioGroupItem value={address._id} id={address._id} className="mt-1" />
                                <Label htmlFor={address._id} className="flex-1 cursor-pointer">
                                  <div className="font-medium">{address.address}</div>
                                  <div className="text-sm text-gray-600">{displayCity}, {address.pincode}</div>
                                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3" />{address.phone}
                                  </div>
                                </Label>
                              </div>
                            );
                          })}

                          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value="new" id="new" className="mt-1" />
                            <Label htmlFor="new" className="flex-1 cursor-pointer flex items-center gap-2 font-medium">
                              <Plus className="w-4 h-4" /> Gunakan alamat baru
                            </Label>
                          </div>
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  )}

                  {/* New Address Form */}
                  {(useNewAddress || !addressList || addressList.length === 0) && (
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Alamat Baru</h3>
                        <div>
                          <Label>Alamat Lengkap *</Label>
                          <Textarea name="address" value={newAddressData.address} onChange={handleNewAddressChange} required />
                        </div>
                        <div className="relative">
                          <Label>Kecamatan / Kelurahan / Kode Pos *</Label>
                          <Input 
                            placeholder="Ketik minimal 3 huruf..." 
                            value={areaSearchQuery} 
                            onChange={handleAreaSearch}
                            onFocus={() => { if(areaOptions.length > 0) setShowAreaDropdown(true); }}
                          />
                          {showAreaDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {isSearchingArea ? (
                                <div className="p-3 text-sm text-gray-500">Mencari...</div>
                              ) : areaOptions.length > 0 ? (
                                areaOptions.map(area => (
                                  <div 
                                    key={area.id} 
                                    className="p-3 text-sm cursor-pointer hover:bg-orange-50 border-b last:border-0"
                                    onClick={() => handleSelectArea(area, false)}
                                  >
                                    {area.name}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-sm text-gray-500">Tidak ditemukan</div>
                              )}
                            </div>
                          )}
                          {newAddressData.area && !showAreaDropdown && (
                            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Area terpilih: {newAddressData.area.split('||')[1]}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>{t('auth.phone')} *</Label>
                            <Input name="phone" value={newAddressData.phone} onChange={handleNewAddressChange} required />
                          </div>
                          <div>
                            <Label>Kode Pos *</Label>
                            <Input name="pincode" value={newAddressData.pincode} onChange={handleNewAddressChange} required />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Pengiriman (Kurir) Section */}
          <div className="pt-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold">Metode Pengiriman</h2>
                </div>
                
                <div className="mb-4">
                  <Label>Pilih Kurir Ekspedisi</Label>
                  <RadioGroup 
                    value={selectedCourier} 
                    onValueChange={(val) => { setSelectedCourier(val); setSelectedShipping(null); }}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="jne" id="jne" />
                      <Label htmlFor="jne" className="uppercase font-semibold">JNE</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pos" id="pos" />
                      <Label htmlFor="pos" className="uppercase font-semibold">POS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tiki" id="tiki" />
                      <Label htmlFor="tiki" className="uppercase font-semibold">TIKI</Label>
                    </div>
                  </RadioGroup>
                </div>

                {isCalculatingShipping ? (
                  <p className="text-sm text-gray-500 italic">Menghitung ongkos kirim...</p>
                ) : shippingOptions.length > 0 ? (
                  <div className="space-y-3">
                    <Label>Pilih Layanan</Label>
                    <RadioGroup 
                      value={selectedShipping?.service || ""}
                      onValueChange={(service) => {
                        const opt = shippingOptions.find(o => o.service === service);
                        if(opt) setSelectedShipping(opt);
                      }}
                      className="space-y-2"
                    >
                      {shippingOptions.map((opt) => (
                        <div key={opt.service} className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer ${selectedShipping?.service === opt.service ? 'border-orange-500 bg-orange-50' : ''}`}>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={opt.service} id={opt.service} />
                            <Label htmlFor={opt.service} className="flex flex-col cursor-pointer">
                              <span className="font-semibold text-gray-800">{opt.service} ({opt.description})</span>
                              <span className="text-xs text-gray-500">Estimasi tiba: {opt.cost[0]?.etd} hari</span>
                            </Label>
                          </div>
                          <div className="font-bold text-gray-900">
                            {formatPrice(opt.cost[0]?.value)}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    Silakan isi alamat tujuan dengan lengkap untuk melihat pilihan ongkos kirim.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Metode Pembayaran Section */}
          <div className="pt-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold">{t('checkout.payment_method')}</h2>
                </div>
                
                <RadioGroup 
                  value={paymentCategory} 
                  onValueChange={setPaymentCategory}
                  className="space-y-3 mt-4"
                >
                  <div className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer ${paymentCategory === 'bank_transfer' ? 'border-orange-500 bg-orange-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex flex-col cursor-pointer">
                        <span className="font-semibold text-gray-800">Transfer Bank (Virtual Account)</span>
                        <span className="text-xs text-gray-500">BCA, BNI, BRI, Mandiri, dll.</span>
                      </Label>
                    </div>
                    <div className="text-xs text-gray-500 font-medium whitespace-nowrap">+ Rp 4.000</div>
                  </div>

                  <div className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer ${paymentCategory === 'qris' ? 'border-orange-500 bg-orange-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="qris" id="qris" />
                      <Label htmlFor="qris" className="flex flex-col cursor-pointer">
                        <span className="font-semibold text-gray-800">QRIS</span>
                        <span className="text-xs text-gray-500">Scan QR Code dengan aplikasi apapun</span>
                      </Label>
                    </div>
                    <div className="text-xs text-gray-500 font-medium whitespace-nowrap">+ 0.7%</div>
                  </div>

                  <div className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer ${paymentCategory === 'ewallet' ? 'border-orange-500 bg-orange-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="ewallet" id="ewallet" />
                      <Label htmlFor="ewallet" className="flex flex-col cursor-pointer">
                        <span className="font-semibold text-gray-800">E-Wallet</span>
                        <span className="text-xs text-gray-500">GoPay, ShopeePay</span>
                      </Label>
                    </div>
                    <div className="text-xs text-gray-500 font-medium whitespace-nowrap">+ 2%</div>
                  </div>

                  <div className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer ${paymentCategory === 'minimarket' ? 'border-orange-500 bg-orange-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="minimarket" id="minimarket" />
                      <Label htmlFor="minimarket" className="flex flex-col cursor-pointer">
                        <span className="font-semibold text-gray-800">Gerai Minimarket</span>
                        <span className="text-xs text-gray-500">Indomaret, Alfamart</span>
                      </Label>
                    </div>
                    <div className="text-xs text-gray-500 font-medium whitespace-nowrap">+ Rp 5.000</div>
                  </div>

                  <div className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer ${paymentCategory === 'credit_card' ? 'border-orange-500 bg-orange-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card" className="flex flex-col cursor-pointer">
                        <span className="font-semibold text-gray-800">Kartu Kredit / Debit</span>
                        <span className="text-xs text-gray-500">Visa, MasterCard, JCB</span>
                      </Label>
                    </div>
                    <div className="text-xs text-gray-500 font-medium whitespace-nowrap">+ 2.9% + Rp 2.000</div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* R Kolom Kanan: Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">{t('checkout.order_summary')}</h2>

              <div className="space-y-3 mb-4">
                {cartItems?.items?.map((item) => (
                  <div key={`${item.productId}-${item.variant.name}`} className="flex justify-between text-sm py-2 border-b">
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-gray-600">{item.variant.name} x {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatPrice((item.variant.salePrice > 0 ? item.variant.salePrice : item.variant.price) * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 py-2 border-b text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal Produk</span>
                  <span className="font-medium">{formatPrice(totalCartAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ongkos Kirim {selectedCourier ? `(${selectedCourier.toUpperCase()})` : ""}</span>
                  <span className="font-medium">{shippingCostValue > 0 ? formatPrice(shippingCostValue) : "Rp 0"}</span>
                </div>
                {storeServiceFeeValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Layanan Toko</span>
                    <span className="font-medium">{formatPrice(storeServiceFeeValue)}</span>
                  </div>
                )}
                {midtransFeeValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Adm Pembayaran</span>
                    <span className="font-medium">{formatPrice(midtransFeeValue)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-bold text-xl my-4">
                <span>{t('checkout.total')}</span>
                <span className="text-orange-600">{formatPrice(grandTotal)}</span>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6 rounded-lg shadow-md transition-all"
                    disabled={isLoading || !selectedShipping || !paymentCategory}
                  >
                    {isLoading ? t('common.loading') : t('checkout.place_order')}
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md p-0 rounded-xl shadow-2xl border-0">
                  <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                      <ShoppingCart className="w-6 h-6 text-orange-500" />
                      Konfirmasi Pesanan Anda
                    </DialogTitle>
                    <DialogDescription className="pt-1 text-gray-500">
                      Harap periksa kembali detail pesanan Anda sebelum melanjutkan ke pembayaran.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="px-6 space-y-4">
                    <div className="flex justify-between items-center font-semibold text-lg py-4">
                      <span>{t('checkout.total')}</span>
                      <span className="text-orange-600">{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  <DialogFooter className="bg-gray-50 px-6 py-4 rounded-b-xl flex flex-col sm:flex-row sm:justify-end gap-3">
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full sm:w-auto">{t('common.cancel')}</Button>
                    </DialogClose>
                    <Button
                      onClick={handleCheckout}
                      className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? t('common.loading') : t('checkout.place_order')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
