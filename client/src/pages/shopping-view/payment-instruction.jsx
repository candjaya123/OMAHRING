import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails } from '@/store/shop/order-slice';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle2, QrCode, Building, Upload, ArrowRight, AlertCircle, Phone } from 'lucide-react';
import useToast from '@/hooks/useToast';
import { formatPrice } from '@/utils/currencyFormatters';
import api from '@/utils/axios';

function PaymentInstructionPage() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { orderDetails, isLoading } = useSelector((state) => state.shopOrder);
  const [proofFile, setProofFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (orderId) {
      dispatch(getOrderDetails({ id: orderId }));
    }
  }, [orderId, dispatch]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.toastSuccess('Copied', `${type} disalin ke clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('proof', proofFile);
      
      const response = await api.post(`/orders/${orderId}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.toastSuccess('Sukses', 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.');
        dispatch(getOrderDetails({ id: orderId }));
      }
    } catch (error) {
      toast.toastError('Error', error.response?.data?.message || 'Gagal mengunggah bukti');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse text-orange-500 font-bold">Memuat Instruksi...</div>;
  if (!orderDetails) return <div className="p-20 text-center">Pesanan tidak ditemukan</div>;

  const instructions = orderDetails.payment_instructions || {};
  const isAwaitingProof = orderDetails.payment_status === 'unpaid' || orderDetails.payment_status === 'pending';

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Instruksi Pembayaran</h1>
        <p className="text-gray-500 font-medium">Selesaikan pembayaran Anda untuk memproses pesanan.</p>
        <div className="mt-4 flex justify-center gap-3">
           <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              Order ID: #{orderDetails.id?.substring(0, 8)}
           </Badge>
           <Badge className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${orderDetails.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`}>
              {orderDetails.payment_status}
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* QRIS Section */}
          {instructions.qrisUrl && (
            <Card className="border-none shadow-xl shadow-orange-100 overflow-hidden rounded-3xl">
              <CardHeader className="bg-orange-500 text-white p-6">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <QrCode className="w-6 h-6" /> Bayar pakai QRIS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-white p-4 rounded-3xl shadow-inner border-4 border-orange-50 mb-4">
                  <img src={instructions.qrisUrl} alt="QRIS" className="w-64 h-64 object-contain" />
                </div>
                <p className="text-xs text-gray-400 font-medium text-center max-w-xs">
                  Scan kode QR di atas menggunakan aplikasi m-banking atau e-wallet (GoPay, OVO, ShopeePay, Dana, dll).
                </p>
              </CardContent>
            </Card>
          )}

          {/* Bank Accounts */}
          {instructions.bankAccounts?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 px-2">
                <Building className="w-5 h-5 text-orange-500" /> Transfer Bank Manual
              </h3>
              {instructions.bankAccounts.map((bank, i) => (
                <Card key={i} className="rounded-2xl border-gray-100 hover:border-orange-200 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{bank.bank_name}</p>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{bank.account_number}</h4>
                        <p className="text-sm text-gray-500 font-medium">a.n {bank.account_holder}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCopy(bank.account_number, bank.bank_name)}
                        className="text-orange-500 hover:bg-orange-50"
                      >
                        {copied === bank.bank_name ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border-none shadow-xl shadow-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-900 text-white p-6">
               <CardTitle className="text-lg font-bold">Ringkasan Tagihan</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900">{formatPrice(orderDetails.total_amount - (instructions.uniqueCode || 0))}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Kode Unik</span>
                  <span className="font-bold text-orange-500">+{instructions.uniqueCode || 0}</span>
               </div>
               <Separator />
               <div className="flex justify-between items-center py-2">
                  <span className="text-gray-900 font-extrabold">Total Bayar</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-orange-600">
                      {formatPrice(instructions.totalWithUniqueCode || orderDetails.total_amount)}
                    </span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => handleCopy(instructions.totalWithUniqueCode || orderDetails.total_amount, 'Total')}
                      className="text-[10px] p-0 h-auto font-bold block"
                    >
                      Salin Nominal
                    </Button>
                  </div>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                     PENTING: Mohon transfer tepat sampai 3 digit terakhir (kode unik) agar sistem dapat memverifikasi pesanan Anda secara otomatis.
                  </p>
               </div>
            </CardContent>
          </Card>

          {/* Proof Upload */}
          <Card className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50">
             <CardContent className="p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Upload className="w-5 h-5 text-orange-500" /> Unggah Bukti Bayar
                </h3>
                
                {orderDetails.proof_image_url ? (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-2xl overflow-hidden border border-gray-200">
                      <img src={orderDetails.proof_image_url} className="w-full h-full object-cover" alt="Proof" />
                    </div>
                    <p className="text-center text-xs font-bold text-green-600 flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Bukti Berhasil Diunggah
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <label className="block w-full cursor-pointer">
                        <div className="w-full h-32 rounded-2xl bg-white border border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-orange-50/50 transition-colors">
                           <Upload className="w-6 h-6 text-gray-400" />
                           <span className="text-xs text-gray-500 font-bold">{proofFile ? proofFile.name : 'Pilih Foto / Screenshot'}</span>
                        </div>
                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                     </label>
                     <Button 
                       className="w-full bg-orange-500 hover:bg-orange-600 h-12 rounded-xl font-bold" 
                       disabled={!proofFile || isUploading}
                       onClick={handleSubmitProof}
                     >
                        {isUploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                     </Button>
                  </div>
                )}
             </CardContent>
          </Card>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/shop/account')} 
            className="w-full text-gray-400 hover:text-orange-600"
          >
             Lihat Status Pesanan Saya <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
               <Phone className="w-6 h-6" />
            </div>
            <div>
               <h4 className="font-bold text-gray-900">Butuh Bantuan?</h4>
               <p className="text-sm text-gray-500 font-medium">Hubungi admin kami jika ada kendala pembayaran.</p>
            </div>
         </div>
         <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 font-bold flex gap-2">
            Chat WhatsApp Admin
         </Button>
      </div>
    </div>
  );
}

export default PaymentInstructionPage;
