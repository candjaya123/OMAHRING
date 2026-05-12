import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchPageContent, bulkUpsertPageContent } from "@/store/admin/page-contents-slice";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import api from "@/utils/axios";

const PAGES = [
  { label: "Homepage", value: "homepage" },
  { label: "About Us", value: "about" },
  { label: "Contact Us", value: "contact" },
  { label: "Membership", value: "membership" }
];

const CONTENT_TYPES = [
  { label: "Text", value: "text" },
  { label: "Image", value: "image" },
  { label: "HTML", value: "html" }
];

function AdminPageContents() {
  const [selectedPage, setSelectedPage] = useState("homepage");
  const { currentPageContent, isLoading } = useSelector((state) => state.adminPageContents);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [formData, setFormData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchPageContent(selectedPage));
  }, [dispatch, selectedPage]);

  useEffect(() => {
    if (currentPageContent) {
      // Transform map to array for form editing
      const initialData = Object.keys(currentPageContent).map(key => ({
        section_key: key,
        ...currentPageContent[key]
      }));
      setFormData(initialData);
    }
  }, [currentPageContent]);

  const handleFieldChange = (index, field, value) => {
    const updatedData = [...formData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setFormData(updatedData);
  };

  const handleAddSection = () => {
    setFormData([...formData, { section_key: "", content_type: "text", content_value: "", is_active: true }]);
  };

  const handleRemoveSection = (index) => {
    const updatedData = formData.filter((_, i) => i !== index);
    setFormData(updatedData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out empty keys
      const cleanEntries = formData.filter(entry => entry.section_key.trim() !== "");
      const result = await dispatch(bulkUpsertPageContent({ pageSlug: selectedPage, entries: cleanEntries })).unwrap();
      
      if (result.success) {
        toast({ title: "Berhasil", description: "Konten halaman berhasil diperbarui." });
      }
    } catch (error) {
      toast({ title: "Gagal", description: error.message || "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (index, file) => {
    const data = new FormData();
    data.append("my_file", file);
    
    try {
      const response = await api.post("/page-contents/upload-image", data);
      if (response.data.success) {
        handleFieldChange(index, "content_value", response.data.data.url);
        toast({ title: "Image Uploaded", description: "Image URL updated." });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: "Error uploading image.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manajemen Konten Halaman</h1>
        <Button onClick={handleSave} disabled={isSaving || isLoading} className="flex items-center gap-2">
          {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Halaman</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Pilih Halaman" />
            </SelectTrigger>
            <SelectContent>
              {PAGES.map(page => (
                <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {formData.map((item, index) => (
          <Card key={index} className="relative group">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveSection(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3 space-y-2">
                <Label>Kunci Bagian (Unique ID)</Label>
                <Input 
                  value={item.section_key} 
                  onChange={(e) => handleFieldChange(index, "section_key", e.target.value)}
                  placeholder="e.g. hero_title"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Tipe Konten</Label>
                <Select value={item.content_type} onValueChange={(val) => handleFieldChange(index, "content_type", val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-7 space-y-2">
                <Label>Isi Konten</Label>
                {item.content_type === "image" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Input 
                        value={item.content_value} 
                        onChange={(e) => handleFieldChange(index, "content_value", e.target.value)}
                        placeholder="Image URL"
                      />
                      <Label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded-md flex items-center gap-2 border">
                        <ImageIcon className="w-4 h-4" />
                        Upload
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(index, e.target.files[0])} 
                        />
                      </Label>
                    </div>
                    {item.content_value && (
                      <div className="w-32 h-20 border rounded overflow-hidden">
                        <img src={item.content_value} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ) : item.content_type === "html" || item.content_value?.length > 50 ? (
                  <Textarea 
                    value={item.content_value} 
                    onChange={(e) => handleFieldChange(index, "content_value", e.target.value)}
                    rows={4}
                  />
                ) : (
                  <Input 
                    value={item.content_value} 
                    onChange={(e) => handleFieldChange(index, "content_value", e.target.value)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={handleAddSection} className="w-full border-dashed py-8 border-2">
          <Plus className="w-4 h-4 mr-2" /> Tambah Bagian Konten Baru
        </Button>
      </div>
    </div>
  );
}

export default AdminPageContents;
