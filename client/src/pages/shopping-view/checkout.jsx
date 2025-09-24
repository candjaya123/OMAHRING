import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MapPin, User, Phone, AlertCircle } from 'lucide-react';
import { createNewOrder } from '@/store/shop/order-slice';
import { fetchAllAddresses } from '@/store/shop/address-slice';
import img from '../../assets/account.jpg';

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.shopOrder);
  const { addressList, isLoading: addressLoading } = useSelector((state) => state.shopAddress);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // State untuk alamat
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [newAddressData, setNewAddressData] = useState({
    address: '',
    city: '',
    pincode: '',
    phone: '',
    notes: '',
  });

  // State untuk guest checkout
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [checkoutError, setCheckoutError] = useState('');

  // Clear previous error messages when component mounts
  useEffect(() => {
    // Clear any existing tokens from previous failed checkouts
    sessionStorage.removeItem('snapToken');
    sessionStorage.removeItem('currentOrderId');

    // Show error from navigation state if any
    if (location.state?.error) {
      setCheckoutError(location.state.error);
    }
  }, [location.state]);

  // Load addresses untuk user yang login
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAllAddresses(user.id));
    }
  }, [dispatch, user]);

  // Set default address jika ada
  useEffect(() => {
    if (addressList && addressList.length > 0 && !selectedAddressId) {
      const defaultAddress = addressList.find((addr) => addr.isDefault) || addressList[0];
      setSelectedAddressId(defaultAddress._id);
      setUseNewAddress(false); // Auto select existing address
    }
  }, [addressList, selectedAddressId]);

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddressData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error when user types
    if (errors[`new_${name}`]) {
      setErrors((prev) => ({ ...prev, [`new_${name}`]: '' }));
    }
  };

  const handleGuestInfoChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validatePhone = (phone) => {
    // Basic phone validation (Indonesian format)
    const phonePattern = /^(\+62|62|0)[\s-]?8[1-9]{1}\d{1}[\s-]?\d{4}[\s-]?\d{2,5}$/;
    return phonePattern.test(phone.replace(/[\s-]/g, ''));
  };

  const validateGuestInfo = () => {
    const newErrors = {};
    const { name, email, address, city, pincode, phone } = guestInfo;

    if (!name?.trim()) newErrors.name = 'Nama lengkap wajib diisi.';
    if (!email?.trim()) {
      newErrors.email = 'Email wajib diisi.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Format email tidak valid.';
    }
    if (!address?.trim()) newErrors.address = 'Alamat lengkap wajib diisi.';
    if (!city?.trim()) newErrors.city = 'Kota wajib diisi.';
    if (!pincode?.trim()) newErrors.pincode = 'Kode pos wajib diisi.';
    if (!phone?.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi.';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUserAddress = () => {
    if (useNewAddress) {
      const newErrors = {};
      const { address, city, pincode, phone } = newAddressData;

      if (!address?.trim()) newErrors.new_address = 'Alamat lengkap wajib diisi.';
      if (!city?.trim()) newErrors.new_city = 'Kota wajib diisi.';
      if (!pincode?.trim()) newErrors.new_pincode = 'Kode pos wajib diisi.';
      if (!phone?.trim()) {
        newErrors.new_phone = 'Nomor telepon wajib diisi.';
      } else if (!validatePhone(phone)) {
        newErrors.new_phone = 'Format nomor telepon tidak valid.';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return !!selectedAddressId;
  };

  const totalCartAmount = cartItems?.cartTotal || 0;

  const handleCheckout = async () => {
    setCheckoutError(''); // Clear previous errors

    if (!cartItems?._id) {
      toast({
        title: 'Keranjang tidak ditemukan.',
        description: 'Coba muat ulang halaman.',
        variant: 'destructive',
      });
      return;
    }

    if (!cartItems?.items?.length) {
      toast({
        title: 'Keranjang kosong',
        description: 'Tambahkan produk ke keranjang terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    // Validate forms
    if (!user) {
      if (!validateGuestInfo()) {
        toast({
          title: 'Data Belum Lengkap',
          description: 'Harap isi semua field yang diperlukan.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!validateUserAddress()) {
        toast({
          title: 'Alamat Belum Dipilih',
          description: 'Pilih alamat pengiriman atau isi alamat baru.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Prepare order data
    let addressInfo = {};
    let customerName = '';
    let email = '';

    if (!user) {
      addressInfo = {
        address: guestInfo.address,
        city: guestInfo.city,
        pincode: guestInfo.pincode,
        phone: guestInfo.phone,
        notes: guestInfo.notes,
      };
      customerName = guestInfo.name;
      email = guestInfo.email;
    } else {
      if (useNewAddress) {
        addressInfo = newAddressData;
      } else {
        const selectedAddress = addressList.find((addr) => addr._id === selectedAddressId);
        if (!selectedAddress) {
          toast({
            title: 'Alamat tidak valid',
            description: 'Alamat yang dipilih tidak ditemukan.',
            variant: 'destructive',
          });
          return;
        }
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
      userId: user?._id || `guest-${Date.now()}`,
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
      totalAmount: totalCartAmount,
      customerName,
      email,
    };

    try {
      const result = await dispatch(createNewOrder(orderData)).unwrap();

      if (result.token && result.orderId) {
        // Clear any existing tokens and save new ones
        sessionStorage.removeItem('snapToken');
        sessionStorage.removeItem('currentOrderId');
        sessionStorage.setItem('snapToken', result.token);
        sessionStorage.setItem('currentOrderId', result.orderId);

        toast({
          title: 'Pesanan berhasil dibuat',
          description: 'Anda akan diarahkan ke halaman pembayaran.',
        });

        // Navigate to payment page
        navigate(`/shop/payment-pending/${result.orderId}`, { replace: true });
      } else {
        throw new Error('Token pembayaran tidak diterima');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage =
        error.message || error.error || 'Terjadi kesalahan saat membuat pesanan.';

      // Handle specific error cases
      if (errorMessage.includes('sudah berjalan')) {
        // Extract order ID if available
        const orderIdMatch = errorMessage.match(/orderId:\s*([a-f0-9]+)/);
        if (orderIdMatch) {
          const existingOrderId = orderIdMatch[1];
          toast({
            title: 'Checkout Sedang Berjalan',
            description: 'Melanjutkan ke pembayaran yang sudah ada.',
          });
          navigate(`/shop/payment-pending/${existingOrderId}`, { replace: true });
          return;
        }
      }

      setCheckoutError(errorMessage);
      toast({
        title: 'Gagal Membuat Pesanan',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Check if cart is empty
  if (!cartItems?.items?.length) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Keranjang Kosong</h2>
        <p className="text-gray-600 mb-4">Tambahkan produk ke keranjang terlebih dahulu</p>
        <Button onClick={() => navigate('/shop/listing')}>Mulai Belanja</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="relative h-[200px] md:h-[300px] w-full overflow-hidden rounded-lg mb-8">
        <img src={img} className="h-full w-full object-cover object-center" alt="Checkout banner" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-5xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Address Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold">Alamat Pengiriman</h2>
          </div>

          {!user ? (
            // Guest Form
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-semibold">Informasi Pembeli</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Masukkan nama lengkap"
                      value={guestInfo.name}
                      onChange={handleGuestInfoChange}
                      required
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Masukkan email"
                      value={guestInfo.email}
                      onChange={handleGuestInfoChange}
                      required
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Alamat Lengkap *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Masukkan alamat lengkap"
                    value={guestInfo.address}
                    onChange={handleGuestInfoChange}
                    required
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Kota *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Masukkan kota"
                      value={guestInfo.city}
                      onChange={handleGuestInfoChange}
                      required
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="pincode">Kode Pos *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      placeholder="Masukkan kode pos"
                      value={guestInfo.pincode}
                      onChange={handleGuestInfoChange}
                      required
                      className={errors.pincode ? 'border-red-500' : ''}
                    />
                    {errors.pincode && (
                      <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Nomor Telepon *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="contoh: 08123456789"
                    value={guestInfo.phone}
                    onChange={handleGuestInfoChange}
                    required
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Catatan tambahan untuk pengiriman"
                    value={guestInfo.notes}
                    onChange={handleGuestInfoChange}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            // Logged in user - Address selection
            <div className="space-y-4">
              {addressLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Memuat alamat...</p>
                </div>
              ) : (
                <>
                  {/* Existing Addresses */}
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
                          {addressList.map((address) => (
                            <div
                              key={address._id}
                              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <RadioGroupItem
                                value={address._id}
                                id={address._id}
                                className="mt-1"
                              />
                              <Label htmlFor={address._id} className="flex-1 cursor-pointer">
                                <div className="font-medium">{address.address}</div>
                                <div className="text-sm text-gray-600">
                                  {address.city}, {address.pincode}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {address.phone}
                                </div>
                                {address.notes && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Note: {address.notes}
                                  </div>
                                )}
                              </Label>
                            </div>
                          ))}

                          {/* New Address Option */}
                          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                            <RadioGroupItem value="new" id="new" className="mt-1" />
                            <Label htmlFor="new" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 font-medium">
                                <Plus className="w-4 h-4" />
                                Gunakan alamat baru
                              </div>
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
                        <h3 className="text-lg font-semibold">
                          {addressList && addressList.length > 0 ? 'Alamat Baru' : 'Tambah Alamat'}
                        </h3>

                        <div>
                          <Label htmlFor="newAddress">Alamat Lengkap *</Label>
                          <Textarea
                            id="newAddress"
                            name="address"
                            placeholder="Masukkan alamat lengkap"
                            value={newAddressData.address}
                            onChange={handleNewAddressChange}
                            required
                            className={errors.new_address ? 'border-red-500' : ''}
                          />
                          {errors.new_address && (
                            <p className="text-red-500 text-sm mt-1">{errors.new_address}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="newCity">Kota *</Label>
                            <Input
                              id="newCity"
                              name="city"
                              placeholder="Masukkan kota"
                              value={newAddressData.city}
                              onChange={handleNewAddressChange}
                              required
                              className={errors.new_city ? 'border-red-500' : ''}
                            />
                            {errors.new_city && (
                              <p className="text-red-500 text-sm mt-1">{errors.new_city}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="newPincode">Kode Pos *</Label>
                            <Input
                              id="newPincode"
                              name="pincode"
                              placeholder="Masukkan kode pos"
                              value={newAddressData.pincode}
                              onChange={handleNewAddressChange}
                              required
                              className={errors.new_pincode ? 'border-red-500' : ''}
                            />
                            {errors.new_pincode && (
                              <p className="text-red-500 text-sm mt-1">{errors.new_pincode}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="newPhone">Nomor Telepon *</Label>
                          <Input
                            id="newPhone"
                            name="phone"
                            placeholder="contoh: 08123456789"
                            value={newAddressData.phone}
                            onChange={handleNewAddressChange}
                            required
                            className={errors.new_phone ? 'border-red-500' : ''}
                          />
                          {errors.new_phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.new_phone}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="newNotes">Catatan (Opsional)</Label>
                          <Textarea
                            id="newNotes"
                            name="notes"
                            placeholder="Catatan tambahan untuk pengiriman"
                            value={newAddressData.notes}
                            onChange={handleNewAddressChange}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Link to Address Management */}
                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => navigate('/shop/account')}
                      className="text-orange-500 hover:text-orange-600"
                    >
                      Kelola Alamat di Pengaturan Akun
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Ringkasan Pesanan</h2>

              <div className="space-y-3 mb-4">
                {cartItems?.items?.map((item) => (
                  <div
                    key={`${item.productId}-${item.variant.name}`}
                    className="flex justify-between text-sm py-2 border-b"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-gray-600">
                        {item.variant.name} x {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        Rp{' '}
                        {(
                          (item.variant.salePrice > 0
                            ? item.variant.salePrice
                            : item.variant.price) * item.quantity
                        ).toLocaleString('id-ID')}
                      </div>
                      {item.variant.salePrice > 0 && (
                        <div className="text-xs text-gray-500 line-through">
                          Rp {(item.variant.price * item.quantity).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-xl mb-6">
                <span>Total Pembayaran</span>
                <span className="text-orange-600">
                  Rp {totalCartAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6"
                disabled={isLoading || !cartItems?._id || cartItems.items.length === 0}
              >
                {isLoading ? 'Memproses...' : 'Bayar Sekarang'}
              </Button>

              <div className="text-center text-xs text-gray-500 mt-3">
                Dengan melanjutkan, Anda menyetujui syarat dan ketentuan
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
