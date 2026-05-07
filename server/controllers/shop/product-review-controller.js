const supabase = require("../../config/supabase");

const addProductReview = async (req, res) => {
  try {
    const { productId, userId, userName, reviewMessage, reviewValue } =
      req.body;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .contains('cartItems', [{ productId }])
      .maybeSingle();

    if (orderError || !order) {
      return res.status(403).json({
        success: false,
        message: "You need to purchase product to review it.",
      });
    }

    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product!",
      });
    }

    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        userName,
        reviewMessage,
        reviewValue,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('reviewValue')
      .eq('product_id', productId);

    if (reviewsError) throw reviewsError;

    const totalReviewsLength = reviews.length;
    const averageReview =
      reviews.reduce((sum, reviewItem) => sum + Number(reviewItem.reviewValue), 0) /
      totalReviewsLength;

    await supabase
      .from('products')
      .update({ averageReview })
      .eq('id', productId);

    res.status(201).json({
      success: true,
      data: { ...newReview, _id: newReview.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId);

    if (error) throw error;
    
    res.status(200).json({
      success: true,
      data: reviews.map(r => ({ ...r, _id: r.id })),
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = { addProductReview, getProductReviews };
