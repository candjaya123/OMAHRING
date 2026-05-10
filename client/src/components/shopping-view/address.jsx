import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDispatch, useSelector } from 'react-redux';
import {
  addNewAddress,
  deleteAddress,
  editaAddress,
  fetchAllAddresses,
} from '@/store/shop/address-slice';
import AddressCard from './address-card';
import { useToast } from '../ui/use-toast';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

function Address({ setCurrentSelectedAddress, selectedId }) {
  const [formData, setFormData] = useState({
    address: '',
    province: '',
    city: '',
    phone: '',
    pincode: '',
    notes: '',
  });
  const [currentEditedId, setCurrentEditedId] = useState(null);
  
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { addressList } = useSelector((state) => state.shopAddress);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchAllAddresses(user?.id));
    fetchProvinces();
  }, [dispatch, user]);

  const fetchProvinces = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URI}/shop/shipping/provinces`);
      const data = await res.json();
      if (data.success) {
        setProvinces(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCities = async (provinceId) => {
    if (!provinceId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URI}/shop/shipping/cities/${provinceId}`);
      const data = await res.json();
      if (data.success) {
        setCities(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = (e) => {
    const provId = e.target.value;
    const selectedProv = provinces.find(p => p.province_id === provId);
    setFormData(prev => ({ 
      ...prev, 
      province: selectedProv ? `${provId}::${selectedProv.province}` : "",
      city: ""
    }));
    fetchCities(provId);
  };

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    const selectedCity = cities.find(c => c.city_id === cityId);
    setFormData(prev => ({
      ...prev,
      city: selectedCity ? `${cityId}::${selectedCity.type} ${selectedCity.city_name}` : ""
    }));
  };

  function handleManageAddress(event) {
    event.preventDefault();

    if (addressList.length >= 3 && currentEditedId === null) {
      setFormData({ address: '', province: '', city: '', phone: '', pincode: '', notes: '' });
      toast({ title: 'You can add max 3 addresses', variant: 'destructive' });
      return;
    }

    const submitData = {
      ...formData,
      city: `${formData.city}||${formData.province}` 
    };

    currentEditedId !== null
      ? dispatch(editaAddress({ userId: user?.id, addressId: currentEditedId, formData: submitData }))
          .then((data) => {
          if (data?.payload?.success) {
            dispatch(fetchAllAddresses(user?.id));
            setCurrentEditedId(null);
            setFormData({ address: '', province: '', city: '', phone: '', pincode: '', notes: '' });
            toast({ title: 'Address updated successfully' });
          }
        })
      : dispatch(addNewAddress({ ...submitData, userId: user?.id }))
          .then((data) => {
          if (data?.payload?.success) {
            dispatch(fetchAllAddresses(user?.id));
            setFormData({ address: '', province: '', city: '', phone: '', pincode: '', notes: '' });
            toast({ title: 'Address added successfully' });
          }
        });
  }

  function handleDeleteAddress(getCurrentAddress) {
    dispatch(deleteAddress({ userId: user?.id, addressId: getCurrentAddress._id })).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchAllAddresses(user?.id));
        toast({ title: 'Address deleted successfully' });
      }
    });
  }

  function handleEditAddress(getCurrentAddress) {
    setCurrentEditedId(getCurrentAddress?._id);
    const parsedCityProv = getCurrentAddress?.city?.split('||') || ["", ""];
    const cityVal = parsedCityProv[0] || "";
    const provVal = parsedCityProv[1] || "";
    
    setFormData({
      address: getCurrentAddress?.address,
      city: cityVal,
      province: provVal,
      phone: getCurrentAddress?.phone,
      pincode: getCurrentAddress?.pincode,
      notes: getCurrentAddress?.notes,
    });

    if (provVal) {
      const provId = provVal.split('::')[0];
      fetchCities(provId);
    }
  }

  function isFormValid() {
    return formData.address && formData.city && formData.province && formData.phone && formData.pincode;
  }

  return (
    <Card>
      <div className="mb-5 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {addressList && addressList.length > 0
          ? addressList.map((singleAddressItem) => {
              const parsed = singleAddressItem.city?.split('||') || [""];
              const cityLabel = parsed[0]?.split('::')[1] || singleAddressItem.city;
              const provLabel = parsed[1]?.split('::')[1] || "";
              
              const displayInfo = { ...singleAddressItem, city: `${cityLabel}${provLabel ? `, ${provLabel}` : ''}` };

              return (
                <AddressCard
                  key={singleAddressItem._id}
                  selectedId={selectedId}
                  handleDeleteAddress={handleDeleteAddress}
                  addressInfo={displayInfo}
                  originalInfo={singleAddressItem} // Ensure unmodified logic uses parsed object safely
                  handleEditAddress={() => handleEditAddress(singleAddressItem)}
                  setCurrentSelectedAddress={() => setCurrentSelectedAddress(singleAddressItem)} // Pass unmodified to parent
                />
              )
            })
          : null}
      </div>
      <CardHeader>
        <CardTitle>{currentEditedId !== null ? 'Edit Address' : 'Add New Address'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleManageAddress} className="space-y-4">
          <div>
            <Label>Address</Label>
            <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter your address" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Province</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                onChange={handleProvinceChange}
                value={formData.province.split('::')[0] || ""}
              >
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p.province_id} value={p.province_id}>{p.province}</option>)}
              </select>
            </div>
            <div>
              <Label>City</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                onChange={handleCityChange}
                value={formData.city.split('::')[0] || ""}
                disabled={!formData.province}
              >
                <option value="">Select City</option>
                {cities.map(c => <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pincode</Label>
              <Input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter your pincode" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter your phone number" />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input name="notes" value={formData.notes} onChange={handleChange} placeholder="Enter any additional notes" />
          </div>

          <Button type="submit" disabled={!isFormValid()} className="w-full">
            {currentEditedId !== null ? 'Edit' : 'Add'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default Address;
