import { Plus, Trash, Settings2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useState, useEffect } from 'react';

function VariationManager({ variationOptions, setVariationOptions, variants, setVariants }) {
  const [batchValues, setBatchValues] = useState({ price: '', salePrice: '', totalStock: '' });

  const addOption = () => {
    if (variationOptions.length < 2) {
      setVariationOptions([...variationOptions, { name: '', options: [] }]);
    }
  };

  const removeOption = (index) => {
    const newOptions = variationOptions.filter((_, i) => i !== index);
    setVariationOptions(newOptions);
  };

  const updateOptionName = (index, name) => {
    const newOptions = [...variationOptions];
    newOptions[index].name = name;
    setVariationOptions(newOptions);
  };

  const handleOptionsKeyDown = (index, e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const value = e.target.value.trim();
      if (!variationOptions[index].options.includes(value)) {
        const newOptions = [...variationOptions];
        newOptions[index].options = [...newOptions[index].options, value];
        setVariationOptions(newOptions);
      }
      e.target.value = '';
    }
  };

  const removeOptionValue = (optIndex, valIndex) => {
    const newOptions = [...variationOptions];
    newOptions[optIndex].options = newOptions[optIndex].options.filter((_, i) => i !== valIndex);
    setVariationOptions(newOptions);
  };

  // Generate matrix combinations
  useEffect(() => {
    if (variationOptions.length === 0) {
      setVariants([]);
      return;
    }

    const generateCombinations = (depth, currentCombination) => {
      if (depth === variationOptions.length) {
        return [currentCombination];
      }

      let combinations = [];
      const currentOptions = variationOptions[depth].options;

      if (currentOptions.length === 0) {
        return generateCombinations(depth + 1, currentCombination);
      }

      for (let option of currentOptions) {
        combinations = [...combinations, ...generateCombinations(depth + 1, [...currentCombination, option])];
      }
      return combinations;
    };

    const combinations = generateCombinations(0, []);
    
    // Merge existing data if possible
    const newVariants = combinations.map((combo) => {
      const existing = variants.find((v) => JSON.stringify(v.combination) === JSON.stringify(combo));
      return existing || {
        combination: combo,
        price: 0,
        salePrice: 0,
        totalStock: 0,
        sku: '',
      };
    });

    setVariants(newVariants);
  }, [variationOptions]);

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = field === 'sku' ? value : Number(value);
    setVariants(newVariants);
  };

  const applyBatch = () => {
    const newVariants = variants.map((v) => ({
      ...v,
      price: batchValues.price !== '' ? Number(batchValues.price) : v.price,
      salePrice: batchValues.salePrice !== '' ? Number(batchValues.salePrice) : v.salePrice,
      totalStock: batchValues.totalStock !== '' ? Number(batchValues.totalStock) : v.totalStock,
    }));
    setVariants(newVariants);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Pengaturan Variasi</h3>
        {variationOptions.length < 2 && (
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-medium">
            <Plus className="w-4 h-4 mr-2" /> Tambah Tipe Variasi
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {variationOptions.map((opt, optIdx) => (
          <div key={optIdx} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-4 relative">
            <button
              onClick={() => removeOption(optIdx)}
              className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded"
            >
              <Trash className="w-4 h-4" />
            </button>
            <div className="grid gap-2">
              <Label className="text-gray-600 font-medium">Nama Variasi (misal: Warna, Ukuran)</Label>
              <Input
                value={opt.name}
                onChange={(e) => updateOptionName(optIdx, e.target.value)}
                placeholder="Masukkan nama variasi"
                className="bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-gray-600 font-medium">Pilihan Variasi (Tekan Enter untuk menambah)</Label>
              <Input
                placeholder="Tambah pilihan lalu tekan enter..."
                onKeyDown={(e) => handleOptionsKeyDown(optIdx, e)}
                className="bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {opt.options.map((val, valIdx) => (
                  <span
                    key={valIdx}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-md text-sm flex items-center gap-1 shadow-sm text-gray-700"
                  >
                    {val}
                    <button onClick={() => removeOptionValue(optIdx, valIdx)}>
                      <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {variants.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-gray-800">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-orange-500" /> Daftar Kombinasi (Batch Edit)
            </h4>
          </div>

          <div className="grid grid-cols-4 gap-2 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
            <Input
              type="number"
              placeholder="Harga"
              className="bg-white"
              value={batchValues.price}
              onChange={(e) => setBatchValues({ ...batchValues, price: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Diskon"
              className="bg-white"
              value={batchValues.salePrice}
              onChange={(e) => setBatchValues({ ...batchValues, salePrice: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Stok"
              className="bg-white"
              value={batchValues.totalStock}
              onChange={(e) => setBatchValues({ ...batchValues, totalStock: e.target.value })}
            />
            <Button type="button" size="sm" onClick={applyBatch} className="bg-orange-500 hover:bg-orange-600 text-white font-medium">Terapkan Massal</Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow>
                  <TableHead className="font-semibold text-gray-600">Varian</TableHead>
                  <TableHead className="w-32 font-semibold text-gray-600">Harga</TableHead>
                  <TableHead className="w-32 font-semibold text-gray-600">Harga Diskon</TableHead>
                  <TableHead className="w-24 font-semibold text-gray-600">Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, vIdx) => (
                  <TableRow key={vIdx} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="font-medium text-xs text-gray-700">
                      {variant.combination.join(' - ')}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 bg-white"
                        value={variant.price}
                        onChange={(e) => updateVariant(vIdx, 'price', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 bg-white"
                        value={variant.salePrice}
                        onChange={(e) => updateVariant(vIdx, 'salePrice', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="h-8 bg-white"
                        value={variant.totalStock}
                        onChange={(e) => updateVariant(vIdx, 'totalStock', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}


export default VariationManager;
