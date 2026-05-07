import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { registerBird, getMemberBirds } from '@/store/shop/bird-slice';
import { submitContent } from '@/store/shop/content-slice';
import { Bird, Plus, FileText, Youtube, Trophy, QrCode, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const MemberDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { memberBirds, isLoading: birdLoading } = useSelector((state) => state.shopBird);
  const { toast } = useToast();

  const [birdForm, setBirdForm] = useState({
    name: '',
    species: '',
    whatsapp_contact: user?.phone_number || '',
    competition_history: []
  });

  const [contentForm, setContentForm] = useState({
    type: 'champion_bird',
    subcategory: 'Murai Batu',
    title: '',
    content_body: '',
    media_url: ''
  });

  useEffect(() => {
    if (user?.id) {
      dispatch(getMemberBirds(user.id));
    }
  }, [user?.id, dispatch]);

  const handleRegisterBird = (e) => {
    e.preventDefault();
    dispatch(registerBird({ ...birdForm, member_id: user.id })).then((data) => {
      if (data?.payload?.success) {
        toast({ title: "Berhasil", description: "Burung berhasil didaftarkan." });
        setBirdForm({ name: '', species: '', whatsapp_contact: user?.phone_number || '', competition_history: [] });
        dispatch(getMemberBirds(user.id));
      }
    });
  };

  const handleSubmitContent = (e) => {
    e.preventDefault();
    dispatch(submitContent({ ...contentForm, author_id: user.id })).then((data) => {
      if (data?.payload?.success) {
        toast({ title: "Berhasil", description: "Konten berhasil dikirim untuk persetujuan admin." });
        setContentForm({ type: 'champion_bird', subcategory: 'Murai Batu', title: '', content_body: '', media_url: '' });
      }
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">Member Dashboard</h1>
          <p className="text-gray-500">Selamat datang, {user?.userName}. Kelola burung dan konten anda di sini.</p>
        </div>
      </div>

      <Tabs defaultValue="my-birds" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-8 bg-gray-100 p-1 rounded-2xl">
          <TabsTrigger value="my-birds" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bird className="w-4 h-4 mr-2" /> Burung Saya
          </TabsTrigger>
          <TabsTrigger value="submit-content" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Kirim Konten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-birds">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Pendaftaran Burung */}
            <Card className="lg:col-span-1 rounded-3xl border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Plus className="w-6 h-6 text-orange-500" /> Daftar Burung Baru
                </CardTitle>
                <CardDescription>Masukkan data burung anda untuk mendapatkan QR Code identitas.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterBird} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Burung</Label>
                    <Input required value={birdForm.name} onChange={(e) => setBirdForm({...birdForm, name: e.target.value})} placeholder="Contoh: Si Hebat" />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Burung</Label>
                    <Input required value={birdForm.species} onChange={(e) => setBirdForm({...birdForm, species: e.target.value})} placeholder="Contoh: Murai Batu" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kontak WA (Clickable)</Label>
                    <Input value={birdForm.whatsapp_contact} onChange={(e) => setBirdForm({...birdForm, whatsapp_contact: e.target.value})} placeholder="628123456789" />
                  </div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-6 font-bold">
                    Daftarkan Burung
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Daftar Burung Terdaftar */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {birdLoading ? (
                  <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
                ) : memberBirds.length > 0 ? (
                  memberBirds.map((bird) => (
                    <Card key={bird.id} className="rounded-3xl border-none shadow-lg hover:shadow-xl transition-shadow bg-white overflow-hidden">
                      <CardHeader className="bg-orange-50 pb-8">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900">{bird.name}</CardTitle>
                            <CardDescription className="text-orange-600 font-medium">{bird.species}</CardDescription>
                          </div>
                          <div className="p-2 bg-white rounded-xl shadow-sm">
                            <QRCodeSVG value={`${window.location.origin}/birds/${bird.id}`} size={64} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                         <div className="flex flex-col gap-3">
                            <Button variant="outline" className="w-full rounded-xl border-gray-200" onClick={() => window.open(`/birds/${bird.id}`, '_blank')}>
                              <QrCode className="w-4 h-4 mr-2" /> Lihat Public Page
                            </Button>
                            <Button variant="ghost" className="w-full rounded-xl text-gray-400 text-xs">
                              Riwayat Lomba: {bird.competition_history?.length || 0} event
                            </Button>
                         </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Bird className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400">Belum ada burung yang didaftarkan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submit-content">
          <Card className="max-w-3xl mx-auto rounded-3xl border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-orange-500" /> Kirim Artikel atau Info YouTube
              </CardTitle>
              <CardDescription>Konten yang anda kirim akan ditinjau oleh admin sebelum ditampilkan di Omahring Edukasi.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitContent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tipe Konten</Label>
                    <Select value={contentForm.type} onValueChange={(val) => setContentForm({...contentForm, type: val})}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pilih Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="champion_bird">Informasi Burung Juara</SelectItem>
                        <SelectItem value="education">Edukasi / Tips</SelectItem>
                        <SelectItem value="youtube">Informasi YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subkategori (Jenis Burung)</Label>
                    <Input value={contentForm.subcategory} onChange={(e) => setContentForm({...contentForm, subcategory: e.target.value})} placeholder="Murai, Kenari, dll" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Judul Konten</Label>
                  <Input required value={contentForm.title} onChange={(e) => setContentForm({...contentForm, title: e.target.value})} placeholder="Masukkan judul yang menarik" />
                </div>

                <div className="space-y-2">
                  <Label>Isi Konten (Text / Link YouTube)</Label>
                  <Textarea required value={contentForm.content_body} onChange={(e) => setContentForm({...contentForm, content_body: e.target.value})} placeholder="Tulis artikel anda atau tempelkan link YouTube di sini" className="min-h-[200px] rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label>URL Media / Gambar (Optional)</Label>
                  <Input value={contentForm.media_url} onChange={(e) => setContentForm({...contentForm, media_url: e.target.value})} placeholder="Link gambar header artikel" />
                </div>

                <Button type="submit" className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-7 text-lg font-bold">
                  Kirim Konten Sekarang
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberDashboard;
