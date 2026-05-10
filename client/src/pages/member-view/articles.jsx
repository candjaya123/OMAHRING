import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Trash, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Plus, 
  BookOpen,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

import {
  addArticle,
  deleteArticle,
  editArticle,
  fetchMemberArticles,
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

function MemberArticles() {
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
    };

    if (currentEditedId !== null) {
      dispatch(editArticle({ id: currentEditedId, formData: finalData })).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchMemberArticles());
          resetForm();
          toast({ title: 'Berhasil!', description: 'Artikel telah diperbarui.' });
        }
      });
    } else {
      dispatch(addArticle(finalData)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchMemberArticles());
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
    if (window.confirm('Hapus artikel ini?')) {
      dispatch(deleteArticle(id)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchMemberArticles());
          toast({ title: 'Dihapus', description: 'Artikel telah dihapus.' });
        }
      });
    }
  }

  useEffect(() => {
    dispatch(fetchMemberArticles());
  }, [dispatch]);

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
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Karya Artikel Saya</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Bagikan wawasan dan edukasi seputar dunia burung.</p>
        </div>
        <Button 
          onClick={() => setOpenCreateArticleDialog(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-6 rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex gap-2 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" /> Tulis Artikel Baru
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-10">
        {articleList && articleList.length > 0 ? (
          articleList.map((article) => (
            <div key={article._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col">
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={article.image || 'https://placehold.co/600x400?text=No+Image'} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  alt={article.title} 
                />
                <Badge className={`absolute top-3 left-3 ${article.status === 'published' ? 'bg-green-500' : 'bg-gray-500'} text-white border-none`}>
                  {article.status === 'published' ? 'Terbit' : 'Draft'}
                </Badge>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-800 line-clamp-2 min-h-[3rem] mb-3 leading-tight">{article.title}</h3>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                  <span>{article.category}</span>
                  <span>{new Date(article.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-lg border-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 font-bold"
                    onClick={() => {
                      setCurrentEditedId(article._id);
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
                    onClick={() => handleDelete(article._id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-gray-300" />
             </div>
             <h3 className="font-bold text-gray-800 mb-1">Belum Ada Artikel</h3>
             <p className="text-sm text-gray-400 max-w-xs">Anda belum pernah menulis artikel. Mulailah berbagi pengetahuan Anda hari ini!</p>
             <Button 
                onClick={() => setOpenCreateArticleDialog(true)}
                variant="link"
                className="text-orange-600 font-bold mt-4"
             >
                Tulis Artikel Pertama Saya
             </Button>
          </div>
        )}
      </div>

      <Dialog open={openCreateArticleDialog} onOpenChange={resetForm}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-[#F8F9FB]">
          <div className="flex h-full w-full">
            
            {/* COLUMN 1: VERTICAL STEPPER (LEFT) */}
            <div className="hidden lg:flex w-[280px] bg-white border-r border-gray-100 p-8 flex-col justify-between">
              <div>
                <div className="mb-10 text-left">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-100">
                    <BookOpen className="text-white w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Studio Member</h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Edukasikan komunitas Anda.</p>
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
            <form onSubmit={onSubmit} className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-sm p-6 lg:p-10">
               <div className="max-w-3xl mx-auto space-y-8 pb-32">
                  
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Judul & Kategori</Label>
                            <Input 
                                placeholder="Tulis Judul Artikel yang Menarik..." 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="text-2xl font-bold h-16 border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-gray-200 bg-transparent"
                            />
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="w-full h-10 bg-white border border-gray-100 rounded-xl px-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        <option value="draft">Draft (Hanya Anda)</option>
                                        <option value="published">Published (Publik)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Isi Cerita / Konten</Label>
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[300px]">
                                <RichTextEditor 
                                  value={formData.content} 
                                  onChange={(val) => setFormData({...formData, content: val})} 
                                  label=""
                                />
                            </div>
                        </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-orange-500" />
                                <h3 className="font-bold text-gray-800">Media Utama (Cover)</h3>
                            </div>
                            <ProductImageUpload 
                                media={media}
                                setMedia={setMedia}
                                imageLoadingState={imageLoadingState}
                                setImageLoadingState={setImageLoadingState}
                            />
                            <p className="text-[10px] text-gray-400 font-medium">Disarankan rasio 16:9 agar tampilan feed artikel terlihat rapi.</p>
                        </div>

                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Ringkasan Pendek (Excerpt)</Label>
                            <textarea 
                                value={formData.excerpt}
                                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                                placeholder="Berikan gambaran singkat isi artikel Anda agar orang tertarik membaca..."
                                className="w-full min-h-[120px] p-4 bg-gray-50 border-gray-100 rounded-2xl text-sm focus:ring-orange-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                  )}
               </div>

               {/* MODAL FOOTER ACTIONS */}
               <div className="fixed bottom-6 left-6 right-6 lg:left-[320px] lg:right-10 flex justify-between items-center bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-2xl z-50">
                   <div className="hidden sm:flex items-center gap-2 px-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sistem Siap</span>
                   </div>
                   <div className="flex gap-3 w-full sm:w-auto">
                        {currentStep > 1 && (
                            <Button 
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                variant="outline" 
                                className="rounded-2xl px-6 h-12 md:h-14 font-bold text-gray-500 border-gray-200"
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" /> Kembali
                            </Button>
                        )}
                        {currentStep < 2 ? (
                            <Button 
                                type="button"
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-10 h-12 md:h-14 font-bold shadow-xl shadow-gray-200 w-full sm:w-auto"
                            >
                                Lanjut <ChevronRight className="w-5 h-5 ml-1" />
                            </Button>
                        ) : (
                            <Button 
                                type="submit"
                                disabled={isLoading}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-12 h-12 md:h-14 font-bold shadow-xl shadow-orange-200 flex gap-2 w-full sm:w-auto"
                            >
                                <Save className="w-5 h-5" /> {currentEditedId !== null ? 'Perbarui' : 'Publikasikan'}
                            </Button>
                        )}
                   </div>
               </div>
            </form>
         </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

export default MemberArticles;
