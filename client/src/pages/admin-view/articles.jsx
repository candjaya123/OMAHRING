import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Trash, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Plus, 
  Info, 
  Layout, 
  Image as ImageIcon, 
  Settings2, 
  BookOpen,
  Eye,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';

import {
  addArticle,
  deleteArticle,
  editArticle,
  fetchAllArticles,
} from '@/store/admin/article-slice';
import ProductImageUpload from '@/components/admin-view/image-upload';
import RichTextEditor from '@/components/admin-view/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const initialArticleData = {
  title: '',
  content: '',
  excerpt: '',
  category: 'General',
  image: '',
  status: 'draft',
};

function AdminArticles() {
  const [openCreateArticleDialog, setOpenCreateArticleDialog] = useState(false);
  const [formData, setFormData] = useState(initialArticleData);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [media, setMedia] = useState({ images: [], video: null });
  const [imageLoadingState, setImageLoadingState] = useState(false);

  const { articleList, isLoading } = useSelector((state) => state.adminArticle);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const steps = [
    { id: 1, label: 'Konten Utama', icon: <BookOpen className="w-4 h-4" /> },
    { id: 2, label: 'Media & Pengaturan', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  function onSubmit(event) {
    event.preventDefault();

    const finalData = {
      ...formData,
      image: media.images[0] || formData.image,
      author_id: user?.id,
    };

    if (currentEditedId !== null) {
      dispatch(editArticle({ id: currentEditedId, formData: finalData })).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllArticles());
          resetForm();
        }
      });
    } else {
      dispatch(addArticle(finalData)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllArticles());
          resetForm();
          toast({ title: 'Berhasil!', description: 'Artikel baru telah diterbitkan.' });
        }
      });
    }
  }

  function resetForm() {
    setOpenCreateArticleDialog(false);
    setFormData(initialArticleData);
    setCurrentEditedId(null);
    setCurrentStep(1);
    setMedia({ images: [], video: null });
  }

  function handleDelete(id) {
    dispatch(deleteArticle(id)).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchAllArticles());
        toast({ title: 'Dihapus', description: 'Artikel telah dihapus.' });
      }
    });
  }

  useEffect(() => {
    dispatch(fetchAllArticles());
  }, [dispatch]);

  // Hitung Skor Kualitas Artikel (Simple logic)
  const calculateScore = () => {
    let score = 0;
    if (formData.title.length > 10) score += 30;
    if (formData.content.length > 100) score += 40;
    if (media.images.length > 0 || formData.image) score += 30;
    return score;
  };

  const articleScore = calculateScore();

  return (
    <Fragment>
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Artikel</h1>
          <p className="text-sm text-gray-500 mt-1">Edukasi pelanggan Anda dengan konten berkualitas.</p>
        </div>
        <Button 
          onClick={() => setOpenCreateArticleDialog(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-6 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex gap-2"
        >
          <Plus className="w-5 h-5" /> Tulis Artikel Baru
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {articleList && articleList.length > 0
          ? articleList.map((article) => (
              <div key={article.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="relative aspect-video overflow-hidden">
                  <img src={article.image || 'https://placehold.co/600x400?text=No+Image'} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={article.title} />
                  <Badge className={`absolute top-3 left-3 ${article.status === 'published' ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                    {article.status === 'published' ? 'Terbit' : 'Draft'}
                  </Badge>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-gray-800 line-clamp-2 min-h-[3rem]">{article.title}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{article.category}</span>
                    <span>{new Date(article.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <Separator />
                  <div className="flex gap-2 pt-1">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-lg border-gray-200 hover:bg-orange-50 hover:text-orange-600"
                      onClick={() => {
                        setCurrentEditedId(article.id);
                        setFormData(article);
                        setMedia({ images: article.image ? [article.image] : [], video: null });
                        setOpenCreateArticleDialog(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="rounded-lg bg-red-50 hover:bg-red-500 hover:text-white text-red-500 border-none shadow-none"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          : null}
      </div>

      <Dialog open={openCreateArticleDialog} onOpenChange={resetForm}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-[#F8F9FB]">
          <div className="flex h-full w-full">
            
            {/* COLUMN 1: VERTICAL STEPPER (LEFT) */}
            <div className="w-[280px] bg-white border-r border-gray-100 p-8 flex flex-col justify-between">
              <div>
                <div className="mb-10 text-left">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-100">
                    <BookOpen className="text-white w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Studio Artikel</h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Buat cerita yang menginspirasi.</p>
                </div>

                <div className="space-y-4">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                        currentStep === step.id 
                        ? 'bg-orange-500 text-white shadow-xl shadow-orange-100 translate-x-1' 
                        : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${currentStep === step.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {step.icon}
                      </div>
                      <span className="font-bold text-sm">{step.label}</span>
                      {currentStep > step.id && <CheckCircle2 className="w-4 h-4 ml-auto text-green-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                 <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Kualitas Artikel</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${articleScore}%` }}></div>
                    </div>
                    <p className="text-[10px] text-orange-400 mt-2 font-medium">Skor saat ini: {articleScore}/100</p>
                 </div>
                 <Button onClick={resetForm} variant="ghost" className="w-full text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                    Batalkan Draft
                 </Button>
              </div>
            </div>

            {/* COLUMN 2: FORM CONTENT (CENTER) */}
            <form onSubmit={onSubmit} className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-sm p-10">
               <div className="max-w-3xl mx-auto space-y-8 pb-20">
                  
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Judul & Kategori</Label>
                            <Input 
                                placeholder="Masukkan Judul Artikel..." 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="text-2xl font-bold h-16 border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-gray-200"
                            />
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Kategori</Label>
                                    <Input 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        className="bg-white border-gray-100 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Status</Label>
                                    <select 
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                        className="w-full h-10 bg-white border border-gray-100 rounded-xl px-3 text-sm"
                                    >
                                        <option value="draft">Draft (Simpan Internal)</option>
                                        <option value="published">Published (Tampil di Publik)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Konten Artikel</Label>
                            <RichTextEditor 
                              value={formData.content} 
                              onChange={(val) => setFormData({...formData, content: val})} 
                              label=""
                            />
                        </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-orange-500" />
                                <h3 className="font-bold text-gray-800">Media Utama</h3>
                            </div>
                            <ProductImageUpload 
                                media={media}
                                setMedia={setMedia}
                                imageLoadingState={imageLoadingState}
                                setImageLoadingState={setImageLoadingState}
                            />
                            <p className="text-xs text-gray-400">Gunakan gambar landscape (16:9) untuk hasil terbaik.</p>
                        </div>

                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Ringkasan (Excerpt)</Label>
                            <textarea 
                                value={formData.excerpt}
                                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                                placeholder="Tulis ringkasan singkat artikel..."
                                className="w-full min-h-[120px] p-4 bg-gray-50 border-gray-100 rounded-2xl text-sm focus:ring-orange-500 outline-none"
                            />
                        </div>
                    </div>
                  )}
               </div>

               {/* MODAL FOOTER ACTIONS */}
               <div className="fixed bottom-10 left-[320px] right-10 flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-2xl z-50">
                   <div className="flex items-center gap-2 px-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Auto-save aktif</span>
                   </div>
                   <div className="flex gap-3">
                        {currentStep > 1 && (
                            <Button 
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                variant="outline" 
                                className="rounded-2xl px-8 h-14 font-bold text-gray-500 border-gray-200"
                            >
                                <ChevronLeft className="w-5 h-5 mr-2" /> Kembali
                            </Button>
                        )}
                        {currentStep < 2 ? (
                            <Button 
                                type="button"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-10 h-14 font-bold shadow-xl shadow-gray-200"
                            >
                                Lanjut <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        ) : (
                            <Button 
                                type="submit"
                                disabled={isLoading}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-12 h-14 font-bold shadow-xl shadow-orange-200 flex gap-2"
                            >
                                <Save className="w-5 h-5" /> {currentEditedId !== null ? 'Update Artikel' : 'Publikasikan Sekarang'}
                            </Button>
                        )}
                   </div>
               </div>
            </form>

            {/* COLUMN 3: PREVIEW (RIGHT) */}
            <div className="w-[450px] bg-[#F8F9FB] border-l border-gray-100 p-8 overflow-y-auto">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Live Preview</h3>
                  <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-400"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                     <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
               </div>

               <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border-[8px] border-gray-900 aspect-[9/19] scale-95 origin-top mx-auto">
                   <div className="p-4 bg-gray-900 h-6"></div>
                   <div className="h-full overflow-y-auto pb-20">
                      <img src={media.images[0] || 'https://placehold.co/600x400?text=Header'} className="w-full aspect-video object-cover" alt="Preview Header" />
                      <div className="p-6 space-y-4">
                         <Badge className="bg-orange-100 text-orange-600 border-none">{formData.category}</Badge>
                         <h1 className="text-2xl font-bold leading-tight text-gray-800">{formData.title || 'Judul Menarik Disini'}</h1>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                            <div>
                               <p className="text-[10px] font-bold text-gray-800">{user?.userName}</p>
                               <p className="text-[8px] text-gray-400">Editor • 2 min read</p>
                            </div>
                         </div>
                         <Separator />
                         <div className="article-preview-content space-y-3 text-sm text-gray-600 mt-4 leading-relaxed line-clamp-6 bg-gray-50 p-4 rounded-2xl italic border border-gray-100">
                            {formData.excerpt || 'Ringkasan artikel Anda akan muncul di sini...'}
                         </div>
                         <div 
                           dangerouslySetInnerHTML={{ __html: formData.content }} 
                           className="text-xs text-gray-500 space-y-2 opacity-50"
                         />
                      </div>
                   </div>
               </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

export default AdminArticles;
