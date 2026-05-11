import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../../utils/axios';

const initialState = {
  isLoading: false,
  productList: [],
  currentProduct: null,
  error: null,
  imageUploadLoading: false,
};

export const uploadProductImage = createAsyncThunk(
  '/products/uploadImage',
  async (imageFile, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('my_file', imageFile);

      const response = await api.post('/products/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Upload failed' });
    }
  }
);

export const addNewProduct = createAsyncThunk(
  '/products/addnewproduct',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/products', formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Add product failed' });
    }
  }
);

export const fetchAllProducts = createAsyncThunk(
  '/products/fetchAllProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Fetch products failed' });
    }
  }
);

export const fetchProductById = createAsyncThunk(
  '/products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Fetch products failed' });
    }
  }
);

export const editProduct = createAsyncThunk(
  '/products/editProduct',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Edit product failed' });
    }
  }
);

export const deleteProduct = createAsyncThunk(
  '/products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Delete product failed' });
    }
  }
);

const adminProductsSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadProductImage.pending, (state) => {
        state.imageUploadLoading = true;
        state.error = null;
      })
      .addCase(uploadProductImage.fulfilled, (state) => {
        state.imageUploadLoading = false;
      })
      .addCase(uploadProductImage.rejected, (state, action) => {
        state.imageUploadLoading = false;
        state.error = action.payload?.message || 'Upload image failed';
      })

      .addCase(fetchAllProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data || [];
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch products';
      })

      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload.data || null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch product';
        state.currentProduct = null;
      })

      .addCase(addNewProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addNewProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.success && action.payload?.data) {
          state.productList.unshift(action.payload.data);
        }
      })
      .addCase(addNewProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to add product';
      })

      .addCase(editProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.data) {
          const index = state.productList.findIndex(
            (product) => product.id === action.payload.data.id
          );
          if (index !== -1) {
            state.productList[index] = action.payload.data;
          }
        }
      })
      .addCase(editProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to edit product';
      })

      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        // 🔹 Hapus produk dari list menggunakan meta.arg (ID yang dikirim)
        if (action.meta?.arg) {
          state.productList = state.productList.filter(
            (product) => product.id !== action.meta.arg
          );
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to delete product';
      });
  },
});

export const { clearError, clearCurrentProduct } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;
