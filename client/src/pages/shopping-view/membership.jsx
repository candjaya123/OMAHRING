import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, PartyPopper } from "lucide-react";

// Di aplikasi nyata, Anda akan menggunakan Redux thunks di sini
// const dispatch = useDispatch();
// dispatch(checkEmailExists(email));

// Fungsi mock untuk simulasi interaksi backend
const mockApi = {
  checkEmail: async (email) => {
    console.log(`Mengecek email: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === "sudahada@example.com") {
      return { exists: true, message: "Email sudah terdaftar." };
    }
    return { exists: false };
  },
  upgradeToMember: async (email) => {
    console.log(`Mengubah peran untuk ${email} menjadi member.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: "Selamat! Akun Anda berhasil di-upgrade menjadi member." };
  },
  registerAsMember: async (userData) => {
    console.log("Mendaftarkan member baru:", userData);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, message: "Selamat datang! Akun member Anda berhasil dibuat." };
  },
};


function MembershipPage() {
  const [step, setStep] = useState('check'); // 'check', 'register', 'success'
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { toast } = useToast();

  const handleEmailCheck = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await mockApi.checkEmail(email);
      if (result.exists) {
        // Jika user ada, langsung upgrade
        const upgradeResult = await mockApi.upgradeToMember(email);
        if (upgradeResult.success) {
          setSuccessMessage(upgradeResult.message);
          setStep('success');
        }
      } else {
        // Jika user tidak ada, tampilkan form registrasi
        setStep('register');
      }
    } catch (error) {
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await mockApi.registerAsMember({ email, ...formData });
      if (result.success) {
        setSuccessMessage(result.message);
        setStep('success');
      }
    } catch (error) {
      toast({ title: "Gagal mendaftar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Daftar Member</CardTitle>
          <CardDescription>Dapatkan keuntungan eksklusif dengan menjadi member kami.</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'check' && (
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <div>
                <Label htmlFor="email">Alamat Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                {isLoading ? 'Memeriksa...' : 'Lanjutkan'}
              </Button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <Label htmlFor="email">Alamat Email</Label>
                <Input id="email" type="email" value={email} disabled className="mt-1 bg-gray-100" />
              </div>
              <div>
                <Label htmlFor="userName">Nama Lengkap</Label>
                <Input id="userName" name="userName" value={formData.userName} onChange={handleInputChange} placeholder="Masukkan nama Anda" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Buat password baru" required className="mt-1" />
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
                {isLoading ? 'Mendaftarkan...' : 'Daftar Sebagai Member'}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center p-4">
              <PartyPopper className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-xl font-semibold">Berhasil!</h3>
              <p className="mt-2 text-gray-600">{successMessage}</p>
              <Button onClick={() => window.location.reload()} className="mt-6 w-full">
                Selesai
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MembershipPage;