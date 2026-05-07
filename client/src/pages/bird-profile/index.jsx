import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getBirdDetails } from '@/store/shop/bird-slice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Trophy, Bird as BirdIcon, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const BirdProfile = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { birdDetails, isLoading } = useSelector((state) => state.shopBird);

  useEffect(() => {
    if (id) {
      dispatch(getBirdDetails(id));
    }
  }, [id, dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!birdDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-500">Data burung tidak ditemukan.</p>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const phone = birdDetails.whatsapp_contact || birdDetails.users?.phone_number;
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="rounded-3xl shadow-xl overflow-hidden border-none bg-white">
          <div className="h-48 bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
            <BirdIcon className="h-24 w-24 text-white/50" />
          </div>
          
          <CardContent className="p-8 -mt-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <Badge className="mb-2 bg-orange-100 text-orange-600 hover:bg-orange-100 border-none px-3 py-1 uppercase font-bold text-[10px] tracking-widest">
                    Official Omahring Profile
                  </Badge>
                  <h1 className="text-4xl font-serif font-bold text-gray-900">{birdDetails.name}</h1>
                  <p className="text-gray-500 text-lg flex items-center gap-2 mt-1">
                    <BirdIcon className="h-4 w-4" /> {birdDetails.species}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <QRCodeSVG value={window.location.href} size={100} />
                  <p className="text-[10px] text-center mt-2 text-gray-400 font-bold uppercase">Identity QR</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" /> Informasi Pemilik
                  </h3>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-bold text-gray-900 text-xl">{birdDetails.users?.userName || 'Pemilik Omahring'}</p>
                    <p className="text-gray-500 mb-4">{birdDetails.users?.phone_number || 'Kontak tidak tersedia'}</p>
                    <Button 
                      onClick={handleWhatsApp}
                      className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-6 flex gap-2 font-bold"
                    >
                      <Phone className="h-5 w-5" /> Hubungi via WhatsApp
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Riwayat Lomba
                </h3>
                <div className="space-y-4">
                  {birdDetails.competition_history && birdDetails.competition_history.length > 0 ? (
                    birdDetails.competition_history.map((history, index) => (
                      <div key={index} className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4">
                        <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center text-white shrink-0">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{history.event}</p>
                          <p className="text-sm text-orange-600 font-bold">{history.rank}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-gray-400 italic">Belum ada riwayat lomba.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          <div className="p-8 bg-gray-900 text-center">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Powered by</p>
            <h2 className="text-white text-2xl font-serif font-bold tracking-tighter">Omahring</h2>
            <p className="text-gray-400 text-sm mt-1">Jadikan kebanggaan burung juara anda</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BirdProfile;
