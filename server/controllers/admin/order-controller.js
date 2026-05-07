const supabase = require('../../config/supabase');

const getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*');

    if (fetchError) throw fetchError;

    if (!orders || !orders.length) {
      return res.status(404).json({
        success: false,
        message: 'No orders found!',
      });
    }

    res.status(200).json({
      success: true,
      data: orders.map(o => ({ ...o, _id: o.id })),
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occured!',
    });
  }
};

const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found!',
      });
    }

    res.status(200).json({
      success: true,
      data: { ...order, _id: order.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occured!',
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found!',
      });
    }

    const updatePayload = { orderStatus };
    if (trackingNumber !== undefined) {
      updatePayload.trackingNumber = trackingNumber;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Order status is updated successfully!',
      data: { ...updatedOrder, _id: updatedOrder.id },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: 'Some error occured!',
    });
  }
};

module.exports = {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
};
